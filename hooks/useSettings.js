import { useState, useEffect, useCallback } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
};

// Helper function to notify all listeners when settings change
const notifyListeners = (newSettings) => {
  listeners.forEach(listener => listener(newSettings));
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
          // Sync with native for widget
          try {
            NativeModules.UpdateModule?.syncSettingsForWidget({
              selectedLocation: parsedSettings.selectedLocation,
              timeFormat: parsedSettings.timeFormat,
              language: parsedSettings.language,
            });
          } catch (e) {
            // noop
          }
        } else {
          const defaultSettings = { ...initialSettings, isSettingsLoaded: true };
          currentSettings = defaultSettings;
          setLocalSettings(defaultSettings);
          notifyListeners(defaultSettings);
          try {
            NativeModules.UpdateModule?.syncSettingsForWidget({
              selectedLocation: defaultSettings.selectedLocation,
              timeFormat: defaultSettings.timeFormat,
              language: defaultSettings.language,
            });
          } catch (e) {}
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
          });
        } catch (e) {}
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
    
    // Save settings to AsyncStorage
    AsyncStorage.setItem('settings', JSON.stringify(newSettings))
      .catch(error => console.error('Failed to save settings:', error));
    
    // Notify all listeners
    notifyListeners(newSettings);
    
    // Sync with native for widget and trigger refresh
    try {
      NativeModules.UpdateModule?.syncSettingsForWidget({
        selectedLocation: newSettings.selectedLocation,
        timeFormat: newSettings.timeFormat,
        language: newSettings.language,
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return [settings, setSettings];
}
