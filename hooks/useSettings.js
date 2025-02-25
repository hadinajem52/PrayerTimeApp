//useSettings.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialSettings = {
  language: 'ar',
  isDarkMode: true, // Set dark mode as default
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
};

export default function useSettings() {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    async function loadSettings() {
      try {
        const savedSettings = await AsyncStorage.getItem('settings');
        if (savedSettings) {
          setSettings({ ...initialSettings, ...JSON.parse(savedSettings), isSettingsLoaded: true });
        } else {
          setSettings({ ...initialSettings, isSettingsLoaded: true });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSettings({ ...initialSettings, isSettingsLoaded: true });
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.isSettingsLoaded) {
      AsyncStorage.setItem('settings', JSON.stringify(settings)).catch((error) =>
        console.error('Failed to save settings:', error)
      );
    }
  }, [settings]);

  return [settings, setSettings];
}
