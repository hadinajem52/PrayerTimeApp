import { useState, useEffect, useCallback } from 'react';
import notifee, { TriggerType, AndroidImportance, AndroidNotificationSetting } from '@notifee/react-native';
import moment from 'moment-hijri';
import { usePrayerTimes } from '../components/PrayerTimesProvider';
import { TRANSLATIONS } from '../constants/translations/notifications';
import {
  NOTIF_CHANNEL_BACKGROUND,
  NOTIF_REFRESH_ID,
  NOTIF_PRAYER_ID_PREFIX,
  NOTIF_ROLLING_WINDOW_DAYS,
} from '../constants/notificationConfig';
import {
  resolveNotificationChannel,
  ensureBackgroundChannel,
} from '../utils/notificationChannels';
import { readScheduleMeta, writeScheduleMeta } from '../utils/scheduledTriggerStore';

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers – no hooks, safe to call from onBackgroundEvent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pick the strongest alarm type the OS will actually let us use.
 *
 * From Android 14 (targetSdk 33+) SCHEDULE_EXACT_ALARM is denied by default, and
 * the user can revoke it at any time. When that happens every
 * createTriggerNotification call throws, and the old code only logged it - so
 * the app looked healthy while the user silently received nothing.
 *
 * Falling back to an inexact alarm means the adhan may land a few minutes late,
 * which is vastly better than never arriving. Settings still surfaces the
 * permission prompt so users can restore exact timing.
 */
export async function resolveAlarmType() {
  const EXACT = { allowWhileIdle: true, exact: true, alarmClock: true };
  const INEXACT = { allowWhileIdle: true, exact: false };
  try {
    const settings = await notifee.getNotificationSettings();
    if (settings?.android?.alarm === AndroidNotificationSetting.DISABLED) {
      console.warn('[Notification] Exact alarms not permitted - falling back to inexact');
      return INEXACT;
    }
  } catch (e) {
    console.warn('[Notification] Could not read alarm settings, assuming exact:', e);
  }
  return EXACT;
}

/**
 * Translate a notification key, with optional param interpolation.
 */
export function translateNotification(language, key, params = {}) {
  const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
  let text = translations[key] || key;
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

/**
 * Parse a "HH:MM" string into a full Date object anchored on `baseDate`.
 */
export function parsePrayerTimeStatic(timeStr, baseDate = new Date()) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Find prayer data for a specific date inside a location's array.
 */
export function getPrayerTimesForDayStatic(locationData, date = new Date()) {
  if (!locationData) return null;
  const targetDay = date.getDate();
  const targetMonth = date.getMonth() + 1;
  const targetYear = date.getFullYear();

  return locationData.find(day => {
    if (!day.date) return false;
    const parts = day.date.trim().split('/');
    if (parts.length !== 3) return false;
    return (
      parseInt(parts[0], 10) === targetDay &&
      parseInt(parts[1], 10) === targetMonth &&
      parseInt(parts[2], 10) === targetYear
    );
  }) || null;
}

/**
 * Core scheduling engine – schedules notifications for `days` days starting
 * from today (or from `startDate`).  Safe to call from anywhere including the
 * background event handler because it only relies on notifee + pure data.
 *
 * @param {object[]} locationData   - Array of daily prayer objects for a location
 * @param {object}   enabledPrayers - { fajr: true, dhuhr: false, … }
 * @param {string}   language       - 'en' | 'ar'
 * @param {object}   soundConfig    - { usePrayerSound, adhanVoice, adhanFullVersion }
 * @param {number}   days           - How many days to schedule (default 7)
 * @param {Date}     startDate      - Starting date (default today)
 * @returns {string[]} Array of scheduled notification IDs
 */
export async function schedulePrayerNotificationsRaw(
  locationData,
  enabledPrayers,
  language,
  soundConfig,
  days = NOTIF_ROLLING_WINDOW_DAYS,
  startDate = new Date()
) {
  if (!locationData || !enabledPrayers) return [];

  const channelId = await resolveNotificationChannel(soundConfig, language);
  const alarmType = await resolveAlarmType();

  // Snapshot what is already scheduled, keeping the details we need to tell a
  // still-correct entry from a stale one.
  //
  // The ids come from getTriggerNotificationIds() rather than
  // getTriggerNotifications(): the latter unparcels every stored notification
  // natively, which crashes the process on Android 16 for any row written under
  // an earlier platform. See utils/scheduledTriggerStore for the full story.
  const existingIds = (await notifee.getTriggerNotificationIds())
    .map(String)
    .filter(id => id.startsWith(NOTIF_PRAYER_ID_PREFIX));
  const meta = await readScheduleMeta();
  const existingById = new Map();
  for (const id of existingIds) {
    // No mirrored entry (first pass after upgrading to this version) counts as
    // changed, so it is rewritten once and picked up by the mirror below.
    if (meta[id]) existingById.set(id, meta[id]);
  }

  const desiredIds = new Set();
  const scheduledIds = [];
  // Rebuilt from scratch each pass so the mirror can never outlive what is
  // actually scheduled.
  const nextMeta = {};
  let rewritten = 0;
  const prayerKeys = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];
  const isPrayer = key => ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(key);

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + i);

    const dayData = getPrayerTimesForDayStatic(locationData, targetDate);
    if (!dayData) continue;

    const dateStr = moment(targetDate).format('YYYYMMDD');

    for (const prayer of prayerKeys) {
      if (!enabledPrayers[prayer] || !dayData[prayer]) continue;

      const notifId = `${NOTIF_PRAYER_ID_PREFIX}${dateStr}_${prayer}`;
      const prayerTime = parsePrayerTimeStatic(dayData[prayer], targetDate);
      if (prayerTime <= new Date()) continue; // skip past times

      desiredIds.add(notifId);

      // Only rewrite when something actually changed. Comparing the timestamp
      // is what lets corrected prayer data, a timezone change or a manual clock
      // change take effect - the old code skipped on id alone, so a scheduled
      // notification kept its original time forever.
      const current = existingById.get(notifId);
      const unchanged = current
        && current.timestamp === prayerTime.getTime()
        && current.channelId === channelId;
      if (unchanged) {
        scheduledIds.push(notifId);
        nextMeta[notifId] = current;
        continue;
      }

      const prayerName = translateNotification(language, prayer);
      const body = isPrayer(prayer)
        ? translateNotification(language, 'prayerApproaching', { prayer: prayerName })
        : translateNotification(language, 'timeApproaching', { time: prayerName });

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
        alarmManager: alarmType,
      };

      const notification = {
        id: notifId,
        title: translateNotification(language, 'prayerTime'),
        body,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
          importance: AndroidImportance.MAX,
          timestamp: prayerTime.getTime(),
          showTimestamp: true,
        },
      };

      try {
        // Same id replaces in place, so an existing notification is never
        // absent even for an instant.
        await notifee.createTriggerNotification(notification, trigger);
        scheduledIds.push(notifId);
        nextMeta[notifId] = { timestamp: prayerTime.getTime(), channelId };
        if (current) rewritten++;
      } catch (err) {
        console.error(`[Notification] Failed to schedule ${prayer} on ${dateStr}:`, err);
      }
    }
  }

  // Drop anything left over - past days, or prayers the user has since turned
  // off. Done last so there is no window where nothing is scheduled. Driven off
  // the ids notifee actually reports rather than the mirror, so a row the
  // mirror never knew about still gets pruned.
  let removed = 0;
  for (const id of existingIds) {
    if (desiredIds.has(id)) continue;
    try {
      await notifee.cancelTriggerNotification(id);
      removed++;
    } catch (_) { }
  }

  await writeScheduleMeta(nextMeta);

  console.log(
    `[Notification] ${scheduledIds.length} scheduled over ${days} days ` +
    `(${rewritten} rewritten, ${removed} removed, ${alarmType.exact ? 'exact' : 'INEXACT'} alarms)`
  );
  return scheduledIds;
}

/**
 * Create (or recreate) the nightly midnight trigger that keeps the rolling
 * window alive. This uses a dedicated low-priority channel so it can wake the
 * background handler without surfacing a user-facing prayer notification.
 *
 * The notification carries data.type = 'refresh' so onBackgroundEvent knows
 * what to do with it.
 */
export async function scheduleNightlyRefreshTrigger() {
  await ensureBackgroundChannel();

  // Always cancel and re-create so the timestamp stays current
  try {
    await notifee.cancelTriggerNotification(NOTIF_REFRESH_ID);
  } catch (_) { }

  const midnight = new Date();
  midnight.setHours(0, 1, 0, 0); // 00:01 AM so it fires just after midnight
  midnight.setDate(midnight.getDate() + 1);

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: midnight.getTime(),
    // The rolling window depends entirely on this firing, so it must survive a
    // revoked exact-alarm permission too.
    alarmManager: await resolveAlarmType(),
  };

  // This notification will be invisible to the user (MIN importance, no sound,
  // no badge) but will wake the background service to run onBackgroundEvent.
  await notifee.createTriggerNotification(
    {
      id: NOTIF_REFRESH_ID,
      title: '',
      body: '',
      data: { type: 'refresh' },
      android: {
        channelId: NOTIF_CHANNEL_BACKGROUND,
        smallIcon: 'ic_launcher',
        importance: AndroidImportance.MIN,
        silent: true,
        asForegroundService: false,
        pressAction: { id: 'default' },
      },
    },
    trigger
  );

  console.log('[Notification] Nightly refresh trigger scheduled for', midnight.toLocaleString());
}

// ─────────────────────────────────────────────────────────────────────────────
// React hook – wraps the pure helpers and exposes the same API as before
// ─────────────────────────────────────────────────────────────────────────────

export const useNotificationScheduler = (language, soundConfig = {}) => {
  const { usePrayerSound = true, adhanVoice, adhanFullVersion = false } = soundConfig;
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [isDataAvailable, setIsDataAvailable] = useState(false);

  const { prayerTimes, isLoading: prayerTimesLoading } = usePrayerTimes();

  useEffect(() => {
    if (prayerTimes && Object.keys(prayerTimes).length > 0 && !prayerTimesLoading) {
      setIsDataAvailable(true);
      setIsLoading(false);
    } else {
      setIsDataAvailable(false);
    }
  }, [prayerTimes, prayerTimesLoading]);

  // ── Single notification ───────────────────────────────────────────────────

  const scheduleLocalNotification = useCallback(async (id, prayerKey, prayerTime) => {
    try {
      setIsOperationInProgress(true);
      const standardizedId = `${NOTIF_PRAYER_ID_PREFIX}${moment(prayerTime).format('YYYYMMDD')}_${prayerKey}`;
      const existingIds = await notifee.getTriggerNotificationIds();
      if (existingIds.includes(standardizedId)) {
        return standardizedId;
      }
      if (prayerTime <= new Date()) return null;

      const prayerName = translateNotification(language, prayerKey);
      const isPrayer = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(prayerKey);
      const channelId = await resolveNotificationChannel(
        { usePrayerSound, adhanVoice, adhanFullVersion },
        language
      );

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
        alarmManager: await resolveAlarmType(),
      };

      await notifee.createTriggerNotification(
        {
          id: standardizedId,
          title: translateNotification(language, 'prayerTime'),
          body: isPrayer
            ? translateNotification(language, 'prayerApproaching', { prayer: prayerName })
            : translateNotification(language, 'timeApproaching', { time: prayerName }),
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
            importance: AndroidImportance.MAX,
            timestamp: prayerTime.getTime(),
            showTimestamp: true,
          },
        },
        trigger
      );
      return standardizedId;
    } catch (error) {
      console.error('[Notification] Error scheduling notification:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, [language, usePrayerSound, adhanVoice, adhanFullVersion]);

  // ── Cancel helpers ────────────────────────────────────────────────────────

  const cancelLocalNotification = useCallback(async (id) => {
    if (!id) return;
    try {
      setIsOperationInProgress(true);
      await notifee.cancelTriggerNotification(String(id));
    } catch (error) {
      console.error('[Notification] Error canceling notification:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, []);

  const cancelAllNotifications = useCallback(async (ids = []) => {
    try {
      setIsOperationInProgress(true);
      if (!ids || ids.length === 0) {
        await notifee.cancelAllNotifications();
      } else {
        for (const id of ids) {
          await notifee.cancelTriggerNotification(String(id));
        }
      }
    } catch (error) {
      console.error('[Notification] Error canceling notifications:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, []);

  // ── Period scheduling (uses hook-accessible prayerTimes) ─────────────────

  const scheduleNotificationsForUpcomingPeriod = useCallback(async (location, enabledPrayers, days = NOTIF_ROLLING_WINDOW_DAYS) => {
    try {
      setIsOperationInProgress(true);
      const locationData = prayerTimes?.[location];
      if (!locationData) {
        console.warn('[Notification] No data for location:', location);
        return [];
      }
      const ids = await schedulePrayerNotificationsRaw(
        locationData,
        enabledPrayers,
        language,
        { usePrayerSound, adhanVoice, adhanFullVersion },
        days
      );
      return ids;
    } catch (error) {
      console.error('[Notification] Error scheduling period notifications:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, [prayerTimes, language, usePrayerSound, adhanVoice, adhanFullVersion]);

  // ── Rolling scheduling (window + nightly refresh trigger) ─────────────────

  const scheduleRollingNotifications = useCallback(async (location, enabledPrayers) => {
    try {
      console.log('[Notification] Scheduling rolling notifications for', location);
      const ids = await scheduleNotificationsForUpcomingPeriod(location, enabledPrayers, 7);
      // Always (re)create the nightly refresh trigger so the window stays rolling
      await scheduleNightlyRefreshTrigger();
      return ids;
    } catch (error) {
      console.error('[Notification] Error scheduling rolling notifications:', error);
      throw error;
    }
  }, [scheduleNotificationsForUpcomingPeriod]);

  // ── Test ──────────────────────────────────────────────────────────────────

  const triggerTestNotification = useCallback(async () => {
    try {
      setIsOperationInProgress(true);
      const channelId = await resolveNotificationChannel(
        { usePrayerSound, adhanVoice, adhanFullVersion },
        language
      );
      await notifee.displayNotification({
        title: translateNotification(language, 'prayerTime'),
        body: translateNotification(language, 'prayerApproaching', {
          prayer: translateNotification(language, 'fajr'),
        }),
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
      });
    } catch (error) {
      console.error('[Notification] Error displaying test notification:', error);
    } finally {
      setIsOperationInProgress(false);
    }
  }, [usePrayerSound, adhanVoice, adhanFullVersion, language]);

  return {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    cancelLocalNotification,
    cancelAllNotifications,
    scheduleRollingNotifications,
    triggerTestNotification,
    isLoading,
    isOperationInProgress,
    isDataAvailable,
  };
};

export default useNotificationScheduler;
