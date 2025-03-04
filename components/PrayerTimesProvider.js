import React, { createContext, useState, useEffect, useContext } from 'react';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
export const PrayerTimesContext = createContext();

export const PrayerTimesProvider = ({ children }) => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPrayerTimes = async () => {
    console.log('Loading prayer times data...');
    setIsLoading(true);
    
    try {
      // Check if we need to load updated data
      const hasUpdates = await AsyncStorage.getItem('PRAYER_DATA_UPDATED');
      
      if (hasUpdates === 'true') {
        console.log('Loading updated prayer times data from native module');
        // Clear the flag
        await AsyncStorage.removeItem('PRAYER_DATA_UPDATED');
        
        // Try to get the updated data from native storage
        const updatedData = await NativeModules.UpdateModule.getUpdatedPrayerTimes();
        
        if (updatedData) {
          // Parse and use the updated data
          const parsedData = JSON.parse(updatedData);
          setPrayerTimes(parsedData);
          console.log('Successfully loaded updated prayer times data');
          setIsLoading(false);
          return;
        }
      }
      
      // If no updates or failed to get updated data, fall back to bundled data
      console.log('Loading bundled prayer times data');
      const bundledData = require('../assets/prayer_times.json');
      setPrayerTimes(bundledData);
      
    } catch (err) {
      console.error('Failed to load prayer times:', err);
      setError(err.message);
      
      // Try to load bundled data as fallback
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
    
    // Make the reload function globally available
    global.fetchPrayerData = loadPrayerTimes;
    
    return () => {
      // Clean up
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

// Custom hook to use the prayer times context
export const usePrayerTimes = () => useContext(PrayerTimesContext);