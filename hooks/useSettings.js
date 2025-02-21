import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useSettings() {
  const [settings, setSettings] = useState({
    language: 'ar',
    isDarkMode: false,
    selectedLocation: 'beirut',
    enabledPrayers: {
      imsak: false,
      fajr: false,
      shuruq: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    },
    scheduledNotifications: {},
    isSettingsLoaded: false,
  });

  // Load settings on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedLanguage, savedDarkMode, savedLocation, savedEnabledPrayers] =
          await Promise.all([
            AsyncStorage.getItem('language'),
            AsyncStorage.getItem('isDarkMode'),
            AsyncStorage.getItem('selectedLocation'),
            AsyncStorage.getItem('enabledPrayers'),
          ]);
        setSettings((prev) => ({
          ...prev,
          language: savedLanguage || prev.language,
          isDarkMode: savedDarkMode ? savedDarkMode === 'true' : prev.isDarkMode,
          selectedLocation: savedLocation || prev.selectedLocation,
          enabledPrayers: savedEnabledPrayers ? JSON.parse(savedEnabledPrayers) : prev.enabledPrayers,
          isSettingsLoaded: true,
        }));
      } catch (error) {
        console.error("Error loading settings: ", error);
        setSettings((prev) => ({ ...prev, isSettingsLoaded: true }));
      }
    })();
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (!settings.isSettingsLoaded) return;
    (async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem('language', settings.language),
          AsyncStorage.setItem('isDarkMode', settings.isDarkMode.toString()),
          AsyncStorage.setItem('selectedLocation', settings.selectedLocation),
          AsyncStorage.setItem('enabledPrayers', JSON.stringify(settings.enabledPrayers)),
          AsyncStorage.setItem('scheduledNotifications', JSON.stringify(settings.scheduledNotifications)),
        ]);
        console.log("Settings saved.");
      } catch (error) {
        console.error("Error saving settings: ", error);
      }
    })();
  }, [settings]);

  return [settings, setSettings];
}
