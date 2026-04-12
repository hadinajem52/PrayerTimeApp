import React, { createContext, useState, useEffect, useContext } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BG_STORAGE_KEYS,
  BG_PRAYER_TIMES_KEY,
  NOTIF_ROLLING_WINDOW_DAYS,
} from '../constants/notificationConfig';

export const PrayerTimesContext = createContext();

const parsePrayerDate = (value) => {
  if (!value) return null;

  const [day, month, year] = value.trim().split('/').map(Number);
  if (!day || !month || !year) return null;

  return new Date(year, month - 1, day);
};

const getReferenceLocationData = (data, selectedLocation) => {
  if (!data) return null;

  if (selectedLocation && Array.isArray(data[selectedLocation])) {
    return data[selectedLocation];
  }

  const locationKey = Object.keys(data).find(
    (key) => key !== 'last_updated' && Array.isArray(data[key])
  );
  return locationKey ? data[locationKey] : null;
};

const hasPrayerDataCoverage = (
  data,
  selectedLocation,
  days = NOTIF_ROLLING_WINDOW_DAYS,
  startDate = new Date()
) => {
  const locationData = getReferenceLocationData(data, selectedLocation);
  if (!Array.isArray(locationData) || locationData.length === 0) return false;

  for (let i = 0; i < days; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + i);

    const hasMatch = locationData.some((entry) => {
      const entryDate = parsePrayerDate(entry?.date);
      return (
        entryDate &&
        entryDate.getDate() === targetDate.getDate() &&
        entryDate.getMonth() === targetDate.getMonth() &&
        entryDate.getFullYear() === targetDate.getFullYear()
      );
    });

    if (!hasMatch) {
      return false;
    }
  }

  return true;
};

const persistPrayerTimesCache = async (rawJson, parsedData) => {
  try {
    const payload = rawJson || JSON.stringify(parsedData);
    await AsyncStorage.setItem(BG_PRAYER_TIMES_KEY, payload);
  } catch (error) {
    console.warn('Failed to cache prayer times for background refresh:', error);
  }
};

const readPrayerTimes = async () => {
  const updatedData = await NativeModules.UpdateModule.getUpdatedPrayerTimes();
  if (updatedData) {
    return { data: JSON.parse(updatedData), raw: updatedData, source: 'file' };
  }

  const bundledData = require('../assets/prayer_times.json');
  return { data: bundledData, raw: JSON.stringify(bundledData), source: 'bundle' };
};

export const PrayerTimesProvider = ({ children }) => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPrayerTimes = async () => {
    console.log('Loading prayer times data...');
    setIsLoading(true);
    
    try {
      const isFirstLaunch = await AsyncStorage.getItem('FIRST_LAUNCH') === null;
      
      if (isFirstLaunch) {
        console.log('First launch detected, downloading latest data from GitHub...');
        try {
          // Download fresh data from GitHub
          const downloadSuccess = await NativeModules.UpdateModule.downloadLatestPrayerTimesFromGitHub();
          
          if (downloadSuccess) {
            console.log('Successfully downloaded prayer times data from GitHub');
            // Mark first launch complete
            await AsyncStorage.setItem('FIRST_LAUNCH', 'false');
          }
        } catch (downloadErr) {
          console.error('Failed to download from GitHub:', downloadErr);
          // Will fall back to bundled data
        }
      }
      
      const selectedLocation =
        (await AsyncStorage.getItem(BG_STORAGE_KEYS.SELECTED_LOCATION)) || 'beirut';

      let prayerTimesResult = await readPrayerTimes();

      if (prayerTimesResult.source === 'file') {
        console.log('Using updated prayer times data from file');
      } else {
        console.log('No updated file found, using bundled data');
      }

      if (!hasPrayerDataCoverage(prayerTimesResult.data, selectedLocation)) {
        console.log('Prayer times data is stale for the upcoming window, checking GitHub for refresh...');
        try {
          const refreshResult = await NativeModules.UpdateModule.forceUpdateCheck();
          if (refreshResult?.status === 'updated' || refreshResult?.status === 'no_update') {
            prayerTimesResult = await readPrayerTimes();
            console.log('Loaded refreshed prayer times data after update check');
          }
        } catch (refreshError) {
          console.warn('Failed to refresh stale prayer times data:', refreshError);
        }
      }

      setPrayerTimes(prayerTimesResult.data);
      await persistPrayerTimesCache(prayerTimesResult.raw, prayerTimesResult.data);
      
    } catch (err) {
      console.error('Failed to load prayer times:', err);
      setError(err.message);
      
      try {
        const bundledData = require('../assets/prayer_times.json');
        setPrayerTimes(bundledData);
        await persistPrayerTimesCache(null, bundledData);
      } catch (fallbackErr) {
        console.error('Even fallback data loading failed:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPrayerTimes();
    
    global.fetchPrayerData = loadPrayerTimes;
    
    return () => {
      global.fetchPrayerData = undefined;
    };
  }, []);

  return (
    <PrayerTimesContext.Provider 
      value={{ 
        prayerTimes, 
        isLoading, 
        error,
        refreshPrayerTimes: loadPrayerTimes
      }}
    >
      {children}
    </PrayerTimesContext.Provider>
  );
};

export const usePrayerTimes = () => useContext(PrayerTimesContext);
