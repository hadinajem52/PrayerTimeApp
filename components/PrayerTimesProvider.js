import React, { createContext, useState, useEffect, useContext } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PrayerTimesContext = createContext();

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
      
      // SIMPLIFIED: Always try to load from file first
      const updatedData = await NativeModules.UpdateModule.getUpdatedPrayerTimes();

      if (updatedData) {
        // Use the updated data from file
        console.log('Using updated prayer times data from file');
        setPrayerTimes(JSON.parse(updatedData));
      } else {
        // Fall back to bundled data
        console.log('No updated file found, using bundled data');
        setPrayerTimes(require('../assets/prayer_times.json'));
      }
      
    } catch (err) {
      console.error('Failed to load prayer times:', err);
      setError(err.message);
      
      try {
        const bundledData = require('../assets/prayer_times.json');
        setPrayerTimes(bundledData);
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