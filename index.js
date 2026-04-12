import { registerRootComponent } from 'expo';
import notifee, { EventType } from '@notifee/react-native';
import {
  schedulePrayerNotificationsRaw,
  scheduleNightlyRefreshTrigger,
  getPrayerTimesForDayStatic,
} from './hooks/useNotificationScheduler';
import {
  BG_PRAYER_TIMES_KEY,
  BG_STORAGE_KEYS,
  NOTIF_REFRESH_ID,
  NOTIF_ROLLING_WINDOW_DAYS,
} from './constants/notificationConfig';

import App from './App';

function hasPrayerDataCoverage(locationData, days = NOTIF_ROLLING_WINDOW_DAYS, startDate = new Date()) {
  if (!Array.isArray(locationData) || locationData.length === 0) return false;

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + i);

    if (!getPrayerTimesForDayStatic(locationData, targetDate)) {
      return false;
    }
  }

  return true;
}

async function loadLatestPrayerTimes(AsyncStorageBg) {
  const { NativeModules } = require('react-native');

  try {
    const updatedRaw = await NativeModules.UpdateModule?.getUpdatedPrayerTimes?.();
    if (updatedRaw) {
      await AsyncStorageBg.setItem(BG_PRAYER_TIMES_KEY, updatedRaw);
      return JSON.parse(updatedRaw);
    }
  } catch (error) {
    console.warn('[Background] Failed to read native prayer times file:', error);
  }

  try {
    const cachedRaw = await AsyncStorageBg.getItem(BG_PRAYER_TIMES_KEY);
    if (cachedRaw) {
      return JSON.parse(cachedRaw);
    }
  } catch (error) {
    console.warn('[Background] Failed to read cached prayer times:', error);
  }

  return require('./assets/prayer_times.json');
}

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.DELIVERED) return;

  const { notification } = detail;
  if (notification?.id !== NOTIF_REFRESH_ID && notification?.data?.type !== 'refresh') return;

  console.log('[Background] Daily refresh trigger received — rescheduling prayers');

  try {
    // Load settings from AsyncStorage (no React context in background)
    const AsyncStorageBg = require('@react-native-async-storage/async-storage').default;

    const [locationRaw, enabledPrayersRaw, languageRaw, useSoundRaw] = await Promise.all([
      AsyncStorageBg.getItem(BG_STORAGE_KEYS.SELECTED_LOCATION),
      AsyncStorageBg.getItem(BG_STORAGE_KEYS.ENABLED_PRAYERS),
      AsyncStorageBg.getItem(BG_STORAGE_KEYS.LANGUAGE),
      AsyncStorageBg.getItem(BG_STORAGE_KEYS.USE_PRAYER_SOUND),
    ]);

    const location = locationRaw || 'beirut';
    const language = languageRaw || 'en';
    const usePrayerSound = useSoundRaw !== 'false'; // default true
    const enabledPrayers = enabledPrayersRaw
      ? JSON.parse(enabledPrayersRaw)
      : { imsak: true, fajr: true, shuruq: true, dhuhr: true, asr: true, maghrib: true, isha: true, midnight: true };

    try {
      await notifee.cancelDisplayedNotification(notification.id);
    } catch (_) {
      // The refresh notification may already be gone.
    }

    let prayerTimes = await loadLatestPrayerTimes(AsyncStorageBg);

    if (!hasPrayerDataCoverage(prayerTimes?.[location])) {
      const { NativeModules } = require('react-native');

      try {
        const updateResult = await NativeModules.UpdateModule?.forceUpdateCheck?.();
        if (updateResult?.status === 'updated' || updateResult?.status === 'no_update') {
          prayerTimes = await loadLatestPrayerTimes(AsyncStorageBg);
        }
      } catch (error) {
        console.warn('[Background] Failed to refresh prayer times before scheduling:', error);
      }
    }

    const locationData = prayerTimes?.[location];
    if (!locationData) {
      console.warn('[Background] No prayer data for location:', location);
      return;
    }

    // Schedule the next 7 days; duplicates are skipped automatically
    const scheduled = await schedulePrayerNotificationsRaw(
      locationData,
      enabledPrayers,
      language,
      usePrayerSound,
      NOTIF_ROLLING_WINDOW_DAYS
    );
    console.log(`[Background] Rescheduled ${scheduled.length} notifications`);
  } catch (err) {
    console.error('[Background] Failed to reschedule prayers:', err);
  } finally {
    // Always recreate the nightly refresh trigger — even if scheduling threw,
    // so a transient error never permanently breaks the rolling window.
    await scheduleNightlyRefreshTrigger();
  }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
