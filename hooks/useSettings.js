import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Singleton pattern to ensure all components share the same settings state
let currentSettings = null;
let listeners = [];

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
  timeFormat: '24h', // Add default time format (24-hour)
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
        } else {
          const defaultSettings = { ...initialSettings, isSettingsLoaded: true };
          currentSettings = defaultSettings;
          setLocalSettings(defaultSettings);
          notifyListeners(defaultSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        const defaultSettings = { ...initialSettings, isSettingsLoaded: true };
        currentSettings = defaultSettings;
        setLocalSettings(defaultSettings);
        notifyListeners(defaultSettings);
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
  }, []);

  return [settings, setSettings];
}
