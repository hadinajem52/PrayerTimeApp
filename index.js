import { registerRootComponent } from 'expo';
import notifee, { EventType } from '@notifee/react-native';
import {
  schedulePrayerNotificationsRaw,
  scheduleNightlyRefreshTrigger,
} from './hooks/useNotificationScheduler';
import { BG_STORAGE_KEYS } from './constants/notificationConfig';

import App from './App';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.TRIGGER) return;

  const { notification } = detail;
  if (notification?.data?.type !== 'refresh') return;

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

    // Load prayer data from the bundled asset (always available)
    let prayerTimes;
    try {
      const updatedRaw = await AsyncStorageBg.getItem('updatedPrayerTimes');
      prayerTimes = updatedRaw ? JSON.parse(updatedRaw) : require('./assets/prayer_times.json');
    } catch (_) {
      prayerTimes = require('./assets/prayer_times.json');
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
      7
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
