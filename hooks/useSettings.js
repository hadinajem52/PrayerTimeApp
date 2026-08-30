import { useState, useEffect, useCallback } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BG_STORAGE_KEYS } from '../constants/notificationConfig';
import { DEFAULT_ADHAN_VOICE, DEFAULT_ADHAN_FULL } from '../constants/adhanConfig';

// Singleton pattern to ensure all components share the same settings state
let currentSettings = null;
let listeners = [];

const initialSettings = {
  language: 'ar',
  isDarkMode: true,
  selectedLocation: 'beirut',
  enabledPrayers: {
    imsak: false,
    fajr: false,
    shuruq: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    midnight: false,
  },
  scheduledNotifications: {},
  isSettingsLoaded: false,
  timeFormat: '12h',
  useArabicNumerals: true,
  usePrayerSound: true, // true for prayer sound, false for OS default sound
  adhanVoice: DEFAULT_ADHAN_VOICE,
  adhanFullVersion: DEFAULT_ADHAN_FULL, // false = shortened recitation
  showCountdownNotification: false, // persistent next-prayer countdown, opt-in
};

// Helper function to notify all listeners when settings change
const notifyListeners = (newSettings) => {
  listeners.forEach(listener => listener(newSettings));
};

/**
 * Mirror the keys that onBackgroundEvent needs as flat AsyncStorage entries so
 * they can be read without React context.
 */
const mirrorBgKeys = (s) => {
  if (!s) return;
  AsyncStorage.multiSet([
    [BG_STORAGE_KEYS.SELECTED_LOCATION, s.selectedLocation || 'beirut'],
    [BG_STORAGE_KEYS.ENABLED_PRAYERS,   JSON.stringify(s.enabledPrayers || {})],
    [BG_STORAGE_KEYS.LANGUAGE,          s.language || 'en'],
    [BG_STORAGE_KEYS.USE_PRAYER_SOUND,  String(s.usePrayerSound !== false)],
    [BG_STORAGE_KEYS.ADHAN_VOICE,       s.adhanVoice || DEFAULT_ADHAN_VOICE],
    [BG_STORAGE_KEYS.ADHAN_FULL,        String(s.adhanFullVersion === true)],
    [BG_STORAGE_KEYS.SHOW_COUNTDOWN,    String(s.showCountdownNotification === true)],
  ]).catch(e => console.warn('[Settings] Failed to mirror bg keys:', e));
};

export default function useSettings() {
  const [settings, setLocalSettings] = useState(currentSettings || initialSettings);

  // Initialize settings on first mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const savedSettings = await AsyncStorage.getItem('settings');
        if (savedSettings) {
          const parsedSettings = { ...initialSettings, ...JSON.parse(savedSettings), isSettingsLoaded: true };
          currentSettings = parsedSettings;
          setLocalSettings(parsedSettings);
          notifyListeners(parsedSettings);
          mirrorBgKeys(parsedSettings);
          // Sync with native for widget
          try {
            NativeModules.UpdateModule?.syncSettingsForWidget({
              selectedLocation: parsedSettings.selectedLocation,
              timeFormat: parsedSettings.timeFormat,
              language: parsedSettings.language,
              isDarkMode: parsedSettings.isDarkMode,
            });
          } catch (e) {
            // noop
          }
        } else {
          const defaultSettings = { ...initialSettings, isSettingsLoaded: true };
          currentSettings = defaultSettings;
          setLocalSettings(defaultSettings);
          notifyListeners(defaultSettings);
          mirrorBgKeys(defaultSettings);
          try {
            NativeModules.UpdateModule?.syncSettingsForWidget({
              selectedLocation: defaultSettings.selectedLocation,
              timeFormat: defaultSettings.timeFormat,
              language: defaultSettings.language,
              isDarkMode: defaultSettings.isDarkMode,
            });
          } catch (e) { }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        const defaultSettings = { ...initialSettings, isSettingsLoaded: true };
        currentSettings = defaultSettings;
        setLocalSettings(defaultSettings);
        notifyListeners(defaultSettings);
        try {
          NativeModules.UpdateModule?.syncSettingsForWidget({
            selectedLocation: defaultSettings.selectedLocation,
            timeFormat: defaultSettings.timeFormat,
            language: defaultSettings.language,
            isDarkMode: defaultSettings.isDarkMode,
          });
        } catch (e) { }
      }
    }

    if (!currentSettings || !currentSettings.isSettingsLoaded) {
      loadSettings();
    }
  }, []);

  // Register this component as a listener
  useEffect(() => {
    const listener = (newSettings) => {
      setLocalSettings(newSettings);
    };

    listeners.push(listener);

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  // Wrapped setSettings function that updates global state
  const setSettings = useCallback((updater) => {
    const newSettings = typeof updater === 'function'
      ? updater(currentSettings)
      : updater;

    currentSettings = newSettings;

    // Save settings to AsyncStorage (full blob + individual bg keys)
    AsyncStorage.setItem('settings', JSON.stringify(newSettings))
      .catch(error => console.error('Failed to save settings:', error));
    mirrorBgKeys(newSettings);

    // Notify all listeners
    notifyListeners(newSettings);

    // Sync with native for widget and trigger refresh
    try {
      NativeModules.UpdateModule?.syncSettingsForWidget({
        selectedLocation: newSettings.selectedLocation,
        timeFormat: newSettings.timeFormat,
        language: newSettings.language,
        isDarkMode: newSettings.isDarkMode,
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return [settings, setSettings];
}
