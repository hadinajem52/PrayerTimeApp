import { useState, useEffect, useCallback } from 'react';
import notifee, { TriggerType, AndroidImportance } from '@notifee/react-native';
import moment from 'moment-hijri';
import { usePrayerTimes } from '../components/PrayerTimesProvider';

const TRANSLATIONS = {
  en: {
    prayerTime: "Prayer Time",
    timeApproaching: "It's {time} time",
    prayerApproaching: "{prayer} prayer time",
    dailyRefresh: "Prayer Schedule Updated",
    dailyRefreshBody: "Your prayer notifications have been refreshed for today",
    fajr: "Morning Prayer",
    dhuhr: "Dhuhr Prayer",
    asr: "Asr Prayer",
    maghrib: "Maghrib Prayer",
    isha: "Isha Prayer",
    shuruq: "Sunrise",
    imsak: "Imsak",
    midnight: "Midnight"
  },
  ar: {
    prayerTime: "وقت الصلاة",
    timeApproaching: "حان وقت {time}",
    prayerApproaching: "حان وقت صلاة {prayer}",
    dailyRefresh: "تم تحديث جدول الصلاة",
    dailyRefreshBody: "تم تحديث إشعارات الصلاة الخاصة بك لهذا اليوم",
    fajr: "الصبح",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
    shuruq: "الشروق",
    imsak: "الإمساك",
    midnight: "منتصف الليل"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers – no hooks, safe to call from onBackgroundEvent
// ─────────────────────────────────────────────────────────────────────────────

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
 * @param {boolean}  usePrayerSound - Channel selection flag
 * @param {number}   days           - How many days to schedule (default 7)
 * @param {Date}     startDate      - Starting date (default today)
 * @returns {string[]} Array of scheduled notification IDs
 */
export async function schedulePrayerNotificationsRaw(
  locationData,
  enabledPrayers,
  language,
  usePrayerSound,
  days = 7,
  startDate = new Date()
) {
  if (!locationData || !enabledPrayers) return [];

  const channelId = usePrayerSound
    ? 'prayer-channel-sound-v2'
    : 'prayer-channel-default-v2';

  // Snapshot existing scheduled IDs upfront to skip duplicates
  const existing = await notifee.getTriggerNotifications();
  const existingIds = new Set(existing.map(n => String(n.notification.id)));

  const scheduledIds = [];
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

      const notifId = `prayer_${dateStr}_${prayer}`;
      if (existingIds.has(notifId)) continue;

      const prayerTime = parsePrayerTimeStatic(dayData[prayer], targetDate);
      if (prayerTime <= new Date()) continue; // skip past times

      const prayerName = translateNotification(language, prayer);
      const body = isPrayer(prayer)
        ? translateNotification(language, 'prayerApproaching', { prayer: prayerName })
        : translateNotification(language, 'timeApproaching', { time: prayerName });

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
        alarmManager: {
          allowWhileIdle: true,
          exact: true,
          alarmClock: true,
        },
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
        await notifee.createTriggerNotification(notification, trigger);
        scheduledIds.push(notifId);
        existingIds.add(notifId); // prevent intra-loop duplicates
        console.log(`[Notification] Scheduled ${prayer} on ${dateStr} → ${prayerTime.toLocaleTimeString()}`);
      } catch (err) {
        console.error(`[Notification] Failed to schedule ${prayer} on ${dateStr}:`, err);
      }
    }
  }

  console.log(`[Notification] Total scheduled: ${scheduledIds.length} over ${days} days`);
  return scheduledIds;
}

/**
 * Create (or recreate) the nightly midnight trigger that keeps the rolling
 * window alive.  This is a VISIBLE silent notification that wakes up the
 * background event handler so it can re-schedule.
 *
 * The notification carries data.type = 'refresh' so onBackgroundEvent knows
 * what to do with it.
 */
export async function scheduleNightlyRefreshTrigger() {
  // Always cancel and re-create so the timestamp stays current
  try {
    await notifee.cancelTriggerNotification('daily-refresh');
  } catch (_) { }

  const midnight = new Date();
  midnight.setHours(0, 1, 0, 0); // 00:01 AM so it fires just after midnight
  midnight.setDate(midnight.getDate() + 1);

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: midnight.getTime(),
    alarmManager: {
      allowWhileIdle: true,
      exact: true,
      alarmClock: true,
    },
  };

  // This notification will be invisible to the user (low importance, no sound,
  // no badge) but will wake the background service to run onBackgroundEvent.
  await notifee.createTriggerNotification(
    {
      id: 'daily-refresh',
      title: '', // empty — Android won't display it if importance is LOW
      body: '',
      data: { type: 'refresh' },
      android: {
        channelId: 'prayer-channel-default-v2',
        smallIcon: 'ic_launcher',
        importance: AndroidImportance.LOW,
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

export const useNotificationScheduler = (language, usePrayerSound = true) => {
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
      const standardizedId = `prayer_${moment(prayerTime).format('YYYYMMDD')}_${prayerKey}`;
      const existing = await notifee.getTriggerNotifications();
      if (existing.some(n => n.notification.id === standardizedId)) {
        return standardizedId;
      }
      if (prayerTime <= new Date()) return null;

      const prayerName = translateNotification(language, prayerKey);
      const isPrayer = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(prayerKey);
      const channelId = usePrayerSound ? 'prayer-channel-sound-v2' : 'prayer-channel-default-v2';

      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
        alarmManager: { allowWhileIdle: true, exact: true, alarmClock: true },
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
  }, [language, usePrayerSound]);

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

  const scheduleNotificationsForUpcomingPeriod = useCallback(async (location, enabledPrayers, days = 7) => {
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
        usePrayerSound,
        days
      );
      return ids;
    } catch (error) {
      console.error('[Notification] Error scheduling period notifications:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, [prayerTimes, language, usePrayerSound]);

  // ── Rolling scheduling (7 days + nightly refresh trigger) ────────────────

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

  // ── Daily refresh setup (kept for compatibility, delegates to above) ──────

  const setupDailyRefresh = useCallback(async (location, enabledPrayers) => {
    try {
      setIsOperationInProgress(true);
      // Schedule the day-after-tomorrow and beyond (today+tomorrow already covered)
      const locationData = prayerTimes?.[location];
      if (!locationData) return;
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      await schedulePrayerNotificationsRaw(
        locationData,
        enabledPrayers,
        language,
        usePrayerSound,
        5, // days 2-6 from today
        dayAfterTomorrow
      );
      await scheduleNightlyRefreshTrigger();
    } catch (error) {
      console.error('[Notification] Error in setupDailyRefresh:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, [prayerTimes, language, usePrayerSound]);

  // ── Test ──────────────────────────────────────────────────────────────────

  const triggerTestNotification = useCallback(async () => {
    try {
      setIsOperationInProgress(true);
      const channelId = usePrayerSound ? 'prayer-channel-sound-v2' : 'prayer-channel-default-v2';
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
  }, [usePrayerSound, language]);

  return {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    cancelLocalNotification,
    cancelAllNotifications,
    scheduleRollingNotifications,
    setupDailyRefresh,
    triggerTestNotification,
    isLoading,
    isOperationInProgress,
    isDataAvailable,
  };
};

export default useNotificationScheduler;