import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import { NativeModules, Platform } from 'react-native';
import {
  NOTIF_CHANNEL_COUNTDOWN,
  NOTIF_COUNTDOWN_ID,
  NOTIF_COUNTDOWN_REFRESH_ID,
} from '../constants/notificationConfig';
import { COUNTDOWN_PRAYER_ORDER } from '../constants/prayerConfig';
import {
  getPrayerTimesForDayStatic,
  parsePrayerTimeStatic,
  translateNotification,
} from '../hooks/useNotificationScheduler';

/**
 * Persistent "next prayer" countdown in the notification shade.
 *
 * Android draws the countdown itself: giving the notification a future
 * `timestamp` plus a down-counting chronometer means the OS ticks the digits,
 * so nothing here runs once a second and it costs no battery. All this module
 * has to do is swap to the following prayer when one arrives, which it does by
 * scheduling a silent trigger at that exact moment (same pattern as the nightly
 * rolling-window refresh).
 *
 * Where it is drawn depends on the OS. Android 16 added promoted ongoing
 * notifications ("Live Updates"), which put a chip in the status bar next to the
 * clock - that path goes through the LiveCountdown native module, because
 * notifee exposes neither shortCriticalText nor FLAG_PROMOTED_ONGOING. On
 * Android 15 and below a third-party app cannot draw *text* in the status bar at
 * all, only an icon, so the digits stay in the shade and we post through notifee
 * exactly as before.
 *
 * Pure module (no hooks) so onBackgroundEvent can drive it too.
 */

const { LiveCountdown } = NativeModules;

/**
 * Cached because it cannot change without the app restarting, and this runs from
 * the background handler too. `null` means "not asked yet".
 */
let liveSupported = null;

async function isLiveCountdownSupported() {
  if (liveSupported !== null) return liveSupported;
  if (Platform.OS !== 'android' || !LiveCountdown) {
    liveSupported = false;
    return liveSupported;
  }
  try {
    liveSupported = await LiveCountdown.isSupported();
  } catch (error) {
    console.warn('[Countdown] LiveCountdown.isSupported failed:', error);
    liveSupported = false;
  }
  return liveSupported;
}

/**
 * What the status bar chip falls back to when it will not tick the chronometer
 * itself: the prayer's own clock time, which - unlike a remaining duration -
 * never goes stale, so nothing has to re-post this every minute.
 *
 * Deliberately short. Android gives the chip only a few characters.
 */
function shortChipText(date) {
  const hours = date.getHours() % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Next prayer from `now`, rolling over to tomorrow's first once today's have all
 * passed. Counts only actual prayers - imsak and midnight are skipped, so this
 * deliberately differs from getUpcomingPrayerKeyCallback in App.js, which walks
 * the full PRAYER_ORDER.
 */
export function computeNextPrayer(locationData, now = new Date()) {
  if (!locationData) return null;

  const today = getPrayerTimesForDayStatic(locationData, now);
  if (today) {
    for (const key of COUNTDOWN_PRAYER_ORDER) {
      if (!today[key]) continue;
      const time = parsePrayerTimeStatic(today[key], now);
      if (now < time) return { key, time };
    }
  }

  // Everything today is behind us - roll over to tomorrow.
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDay = getPrayerTimesForDayStatic(locationData, tomorrow);
  if (!nextDay) return null;

  for (const key of COUNTDOWN_PRAYER_ORDER) {
    if (!nextDay[key]) continue;
    return { key, time: parsePrayerTimeStatic(nextDay[key], tomorrow) };
  }
  return null;
}

async function ensureCountdownChannel() {
  await notifee.createChannel({
    id: NOTIF_CHANNEL_COUNTDOWN,
    name: 'Next Prayer Countdown',
    // MIN keeps it silent, badge-free and at the bottom of the shade - it is a
    // status readout, not an alert. The adhan notifications stay separate.
    importance: AndroidImportance.MIN,
    vibration: false,
    badge: false,
  });
}

/**
 * Post (or replace) the ongoing countdown, and arm the swap to the prayer after
 * it. Returns the prayer it is now counting down to, or null if there was no
 * data to work with.
 */
export async function showCountdownNotification(locationData, language = 'en', now = new Date()) {
  const next = computeNextPrayer(locationData, now);
  if (!next) {
    // Happens at the end of the month: today's prayers are done and next
    // month's data hasn't been downloaded yet. Leave the existing notification
    // in place, but still arm a retry - otherwise the chain that keeps this
    // feature alive stops dead until the app is next opened.
    console.warn('[Countdown] No upcoming prayer in the data - retrying later');
    await scheduleCountdownRefresh(null, now);
    return null;
  }

  const title = translateNotification(language, next.key);
  const body = translateNotification(language, 'countdownBody');

  // Android 16: post the promoted version so it also lands in the status bar.
  // Only fall back if the native side reports it did not post at all - a
  // notification that posted but was refused promotion is still the better of
  // the two, and re-posting through notifee would only duplicate it.
  if (await isLiveCountdownSupported()) {
    try {
      const outcome = await LiveCountdown.show({
        title,
        body,
        timestamp: next.time.getTime(),
        shortText: shortChipText(next.time),
      });
      if (outcome?.posted) {
        // Clear the notifee copy, which an older build (or a pre-upgrade run of
        // this one) may have left in the shade.
        try {
          await notifee.cancelDisplayedNotification(NOTIF_COUNTDOWN_ID);
        } catch (_) { }
        if (!outcome.promoted) {
          console.log(
            '[Countdown] Posted without a status bar chip',
            `(promotable=${outcome.promotable}, liveUpdatesAllowed=${outcome.canPost})`
          );
        }
        await scheduleCountdownRefresh(next.time, now);
        return next;
      }
      console.warn('[Countdown] Native countdown did not post - falling back to notifee');
    } catch (error) {
      console.warn('[Countdown] Native countdown failed - falling back to notifee:', error);
    }
  }

  await ensureCountdownChannel();

  await notifee.displayNotification({
    id: NOTIF_COUNTDOWN_ID,
    title,
    body,
    android: {
      channelId: NOTIF_CHANNEL_COUNTDOWN,
      smallIcon: 'notification_icon',
      // Ongoing so it can't be swiped away by accident; the user turns it off
      // in Settings instead.
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      importance: AndroidImportance.MIN,
      // The OS renders the live countdown from these three together.
      timestamp: next.time.getTime(),
      showTimestamp: true,
      showChronometer: true,
      chronometerDirection: 'down',
      pressAction: { id: 'default' },
    },
  });

  await scheduleCountdownRefresh(next.time, now);
  return next;
}

/**
 * Android drops displayed notifications on reboot, and notifee only restores
 * *trigger* notifications - so without this the countdown would stay gone until
 * the next prayer, up to six hours later. Capping the refresh interval means a
 * restored trigger re-posts it within the hour instead.
 *
 * Re-posting is idempotent (same id, same content, onlyAlertOnce), so a
 * keepalive firing mid-window is invisible. The trigger is inexact, so Android
 * batches it with whatever else it is already waking for.
 */
const COUNTDOWN_KEEPALIVE_MS = 60 * 60 * 1000;

/**
 * Silent trigger that moves the countdown on when a prayer arrives - or sooner,
 * to bring it back after a reboot. See COUNTDOWN_KEEPALIVE_MS.
 */
export async function scheduleCountdownRefresh(prayerTime, now = new Date()) {
  try {
    await notifee.cancelTriggerNotification(NOTIF_COUNTDOWN_REFRESH_ID);
  } catch (_) { }

  // A second past the prayer time, so computeNextPrayer sees it as passed.
  const atPrayer = prayerTime ? prayerTime.getTime() + 1000 : Infinity;
  const keepalive = now.getTime() + COUNTDOWN_KEEPALIVE_MS;
  const fireAt = Math.min(atPrayer, keepalive);
  if (fireAt <= now.getTime()) return;

  await ensureCountdownChannel();
  await notifee.createTriggerNotification(
    {
      id: NOTIF_COUNTDOWN_REFRESH_ID,
      title: '',
      body: '',
      data: { type: 'countdown-refresh' },
      android: {
        channelId: NOTIF_CHANNEL_COUNTDOWN,
        smallIcon: 'notification_icon',
        importance: AndroidImportance.MIN,
        silent: true,
        pressAction: { id: 'default' },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt,
      alarmManager: { allowWhileIdle: true, exact: false },
    }
  );
}

/** Remove the countdown and stop it coming back. */
export async function hideCountdownNotification() {
  // Unconditional: the module may exist even where promotion is unsupported,
  // and a chip left over from a previous run has to go regardless.
  if (LiveCountdown) {
    try {
      await LiveCountdown.hide();
    } catch (_) { }
  }
  try {
    await notifee.cancelTriggerNotification(NOTIF_COUNTDOWN_REFRESH_ID);
  } catch (_) { }
  try {
    await notifee.cancelDisplayedNotification(NOTIF_COUNTDOWN_REFRESH_ID);
  } catch (_) { }
  try {
    await notifee.cancelDisplayedNotification(NOTIF_COUNTDOWN_ID);
  } catch (_) { }
}
