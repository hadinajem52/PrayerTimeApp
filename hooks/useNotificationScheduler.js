//useNotificationScheduler.js
import { useCallback, useRef, useEffect, useState } from 'react';
import moment from 'moment-hijri';
import notifee, { TriggerType, EventType, AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrayerTimes } from '../components/PrayerTimesProvider'; // Import the context hook

const PRAYER_NAMES = {
  imsak: { en: 'Imsak', ar: 'الإمساك' },
  fajr: { en: 'Fajr', ar: 'الفجر' },
  shuruq: { en: 'Shuruq', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر' },
  asr: { en: 'Asr', ar: 'العصر' },
  maghrib: { en: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', ar: 'العشاء' },
  midnight: { en: 'Midnight', ar: 'منتصف الليل' },
};

// First, update the background handler to get prayer data from storage
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Existing background handler code remains unchanged
  // ...existing code...
  return Promise.resolve();
});

export function useNotificationScheduler(language) {
  // Get prayer times from context with better error handling
  const { prayerTimes, isLoading: prayerTimesLoading } = usePrayerTimes();
  const [isReady, setIsReady] = useState(false);
  
  // Cache for parsed prayer times
  const parsedTimesCache = useRef({});
  
  // Set isReady once we have prayer times data
  useEffect(() => {
    if (prayerTimes && !prayerTimesLoading) {
      setIsReady(true);
    }
  }, [prayerTimes, prayerTimesLoading]);
  
  // Helper function to find location keys case-insensitively
  const findLocationKey = useCallback((location) => {
    if (!prayerTimes) {
      console.log('Prayer times data not available yet for location matching');
      return null;
    }
    
    // Exact match first (faster)
    if (prayerTimes[location]) return location;
    
    // Case-insensitive match if needed
    const normalizedLocation = location.toLowerCase();
    const matchingKey = Object.keys(prayerTimes).find(
      key => key.toLowerCase() === normalizedLocation
    );
    
    if (!matchingKey) {
      console.log(`No match found for location "${location}". Available locations:`, Object.keys(prayerTimes));
    }
    
    return matchingKey || null;
  }, [prayerTimes]);

  const scheduleLocalNotification = useCallback(
    async (notificationId, prayerKey, prayerDateTime) => {
      // Existing code remains unchanged
      // ...existing code...
      return notificationId;
    },
    [language]
  );

  const scheduleNotificationsForUpcomingPeriod = useCallback(
    async (location, enabledPrayers) => {
      console.log(`Starting to schedule notifications for location: ${location}`);
      
      // Safety checks
      if (!prayerTimes) {
        console.warn('Prayer times data not loaded yet, will try again later');
        return [];
      }
      
      if (!location) {
        console.warn('No location provided for notification scheduling');
        return [];
      }
      
      try {
        // Find location with case-insensitive matching
        const matchingLocation = findLocationKey(location);
        
        if (!matchingLocation) {
          console.error(`No prayer times data available for location: ${location}`);
          console.error('Available locations:', Object.keys(prayerTimes));
          return [];
        }
        
        // Rest of the function as before
        const today = new Date();
        console.log(`Today's date: ${today.toISOString()}`);
        
        // Focus on finding today first
        const formattedToday = moment(today).format('D/M/YYYY');
        console.log(`Formatted today: ${formattedToday}`);
        
        const upcomingDays = prayerTimes[matchingLocation]
          .filter((dayData) => {
            try {
              const [day, month, year] = dayData.date.trim().split('/').map(Number);
              const dayDate = new Date(year, month - 1, day);
              // Use noon to avoid timezone issues
              const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
              const dayNoon = new Date(year, month - 1, day, 12, 0, 0);
              
              return dayNoon >= todayNoon;
            } catch (error) {
              console.error(`Error parsing date ${dayData.date}:`, error);
              return false;
            }
          })
          .slice(0, 2); // LIMIT to today and tomorrow only for testing
        
        // Initialize scheduled notification IDs array
        const scheduledIds = [];
        
        // Process each day's prayer times
        for (const dayData of upcomingDays) {
          // Process each prayer for this day
          for (const prayerKey of ["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"]) {
            // Skip if prayer notifications are not enabled
            if (!enabledPrayers[prayerKey]) continue;
            
            const timeStr = dayData[prayerKey];
            if (!timeStr) continue;
            
            try {
              // Parse the prayer time
              const [hours, minutes] = timeStr.split(':').map(Number);
              const [day, month, year] = dayData.date.trim().split('/').map(Number);
              
              // Create date object for this prayer time
              const prayerTime = new Date(year, month - 1, day, hours, minutes);
              
              // Only schedule if prayer is in the future
              if (prayerTime > today) {
                const numericId = `${moment(prayerTime).format('YYYYMMDDHHmm')}`;
                
                // Schedule the notification
                const notificationId = await scheduleLocalNotification(numericId, prayerKey, prayerTime);
                
                if (notificationId) {
                  scheduledIds.push(notificationId);
                }
              }
            } catch (error) {
              console.error(`Error scheduling ${prayerKey}:`, error);
            }
          }
        }
        
        console.log(`Scheduled ${scheduledIds.length} upcoming notifications`);
        return scheduledIds;
      } catch (error) {
        console.error('Error scheduling upcoming notifications:', error);
        return [];
      }
    },
    [prayerTimes, scheduleLocalNotification, findLocationKey]
  );

  const scheduleRollingNotifications = useCallback(
    async (location, enabledPrayers) => {
      try {
        // Check if any prayers are enabled before proceeding
        if (!Object.values(enabledPrayers).some(val => val === true)) {
          console.log('No prayers enabled, skipping notification scheduling');
          return [];
        }
        
        // Safety check for prayer times data
        if (!prayerTimes) {
          console.warn('Prayer times data not loaded yet, deferring notification scheduling');
          return [];
        }
        
        // Safety check for location
        if (!location) {
          console.warn('No location provided for rolling notification scheduling');
          return [];
        }
        
        console.log('Available locations in prayer times:', Object.keys(prayerTimes));
        
        // Find location with case-insensitive matching
        const matchingLocation = findLocationKey(location);
        
        if (!matchingLocation) {
          console.error(`No prayer times data available for location: ${location}`);
          console.error('Available locations:', Object.keys(prayerTimes));
          return [];
        }
        
        // Cancel existing notifications first
        await notifee.cancelAllNotifications();
        
        // Get today's data and tomorrow's data efficiently
        const today = new Date();
        
        // Find data for today and tomorrow more efficiently using the matching location
        const availableDays = getAvailableDays(prayerTimes[matchingLocation], today);
        
        if (availableDays.length === 0) {
          console.warn('No prayer time data available for scheduling');
          return [];
        }
        
        // Batch notifications for better performance
        const notificationsToSchedule = [];
        
        // Prepare all notifications first
        for (const dayData of availableDays) {
          for (const prayerKey of ["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"]) {
            if (!enabledPrayers[prayerKey]) continue;
            
            const timeStr = dayData[prayerKey];
            if (!timeStr) continue;
            
            try {
              // Create date object more efficiently by caching
              const prayerTime = getParsedTime(dayData.date, timeStr, parsedTimesCache);
              
              if (prayerTime > today) {
                const numericId = `${moment(prayerTime).format('YYYYMMDDHHmm')}`;
                const prayerName = PRAYER_NAMES[prayerKey][language];
                
                notificationsToSchedule.push({
                  id: numericId,
                  prayerKey,
                  prayerTime,
                  prayerName
                });
              }
            } catch (error) {
              console.error(`Error preparing ${prayerKey}:`, error);
            }
          }
        }
        
        // Now batch schedule all notifications
        const scheduledIds = await batchScheduleNotifications(notificationsToSchedule, language);
        
        console.log(`Scheduled ${scheduledIds.length} notifications for the next ${availableDays.length} days`);
        return scheduledIds;
      } catch (error) {
        console.error('Failed to schedule rolling notifications:', error);
        return [];
      }
    },
    [language, prayerTimes, findLocationKey]
  );
  
  // Implement efficient helper functions
  const getAvailableDays = (prayerDataArray, today) => {
    if (!prayerDataArray || !Array.isArray(prayerDataArray)) {
      console.error('Invalid prayer data array provided to getAvailableDays');
      return [];
    }
  
    const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
    
    // Filter days that are today or in the future
    return prayerDataArray
      .filter(dayData => {
        try {
          const [day, month, year] = dayData.date.trim().split('/').map(Number);
          const dayNoon = new Date(year, month - 1, day, 12, 0, 0);
          return dayNoon >= todayNoon;
        } catch (error) {
          console.error(`Error parsing date in getAvailableDays: ${dayData?.date}`, error);
          return false;
        }
      })
      .slice(0, 2); // Only get today and tomorrow
  };
  
  const getParsedTime = (dateStr, timeStr, cache) => {
    if (!dateStr || !timeStr) return null;
    
    const cacheKey = `${dateStr}_${timeStr}`;
    if (cache.current[cacheKey]) return cache.current[cacheKey];
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const [day, month, year] = dateStr.trim().split('/').map(Number);
      const parsedTime = new Date(year, month - 1, day, hours, minutes);
      
      // Save in cache
      cache.current[cacheKey] = parsedTime;
      return parsedTime;
    } catch (error) {
      console.error(`Error parsing time: ${dateStr} ${timeStr}`, error);
      return null;
    }
  };
  
  const batchScheduleNotifications = async (notificationsArray, language) => {
    if (!notificationsArray || !Array.isArray(notificationsArray)) {
      console.error('Invalid notifications array provided to batchScheduleNotifications');
      return [];
    }

    const scheduledIds = [];
    
    try {
      for (const notification of notificationsArray) {
        const { id, prayerKey, prayerTime, prayerName } = notification;
        
        if (!id || !prayerKey || !prayerTime) {
          console.error('Invalid notification data:', notification);
          continue;
        }
        
        // Create individual notification
        await notifee.createTriggerNotification(
          {
            id: id,
            title: prayerName || PRAYER_NAMES[prayerKey][language],
            body: `${prayerName || PRAYER_NAMES[prayerKey][language]} ${language === 'en' ? 'time' : 'الوقت'}`,
            android: {
              channelId: 'prayer_times',
              smallIcon: 'ic_notification',
              pressAction: {
                id: 'default',
              },
            }
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: prayerTime.getTime(),
          }
        );
        
        scheduledIds.push(id);
      }
      
      console.log(`Successfully batch scheduled ${scheduledIds.length} notifications`);
      return scheduledIds;
    } catch (error) {
      console.error('Error during batch notification scheduling:', error);
      return scheduledIds; // Return whatever we managed to schedule
    }
  };

  const setupDailyRefresh = useCallback(
    async (location, enabledPrayers) => {
      // Don't set up refresh if no prayers are enabled
      if (!Object.values(enabledPrayers).some(val => val === true)) {
        console.log('No prayers enabled, skipping daily refresh setup');
        return null;
      }
      
      console.log(`Setting up daily refresh for location: ${location}`);
      
      if (!prayerTimes) {
        console.warn('Prayer times data not loaded yet');
        return null;
      }
      
      // Find location with case-insensitive matching
      const matchingLocation = findLocationKey(location);
      
      if (!matchingLocation) {
        console.error(`Invalid location or no prayer data: ${location}`);
        console.error('Available locations:', Object.keys(prayerTimes));
        return null;
      }
      
      // Use the matched location for the rest of the function
      // ...existing code...
      
      try {
        // Check if we already have a daily refresh scheduled with the same data
        const enabledPrayersStr = JSON.stringify(enabledPrayers);
        const existingRefresh = await AsyncStorage.getItem('daily_refresh_data');
        
        if (existingRefresh === `${matchingLocation}:${enabledPrayersStr}`) {
          console.log('Daily refresh already set up with same parameters');
          return true;
        }
        
        // Create a trigger that will fire at midnight
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 1); // Schedule for next midnight
        
        // Add matched location data directly to the notification
        await notifee.createTriggerNotification(
          {
            id: 'daily-refresh',
            title: 'Updating prayer times',
            body: 'Refreshing prayer times for today',
            data: {
              location: matchingLocation,  // Use matched location
              enabledPrayers: enabledPrayersStr,
              type: 'daily-refresh'
            },
            android: {
              channelId: 'prayer_times',
              smallIcon: 'ic_notification',
              pressAction: {
                id: 'default',
              },
              importance: AndroidImportance.LOW,
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: date.getTime(), // Trigger at midnight
          }
        );
        
        // Save the parameters we used with matched location
        await AsyncStorage.setItem('daily_refresh_data', `${matchingLocation}:${enabledPrayersStr}`);
        console.log('✅ Daily refresh notification scheduled successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to schedule daily refresh:', error);
        return false;
      }
    },
    [prayerTimes, findLocationKey]
  );

  const cancelLocalNotification = useCallback(async (notificationId) => {
    // Existing implementation
    // ...existing code...
  }, []);

  const cancelAllNotifications = useCallback(async (notificationIds) => {
    // Existing implementation
    // ...existing code...
  }, [cancelLocalNotification]);

  return {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    scheduleRollingNotifications,
    setupDailyRefresh,
    cancelLocalNotification,
    cancelAllNotifications,
    isLoading: !isReady || prayerTimesLoading, // Use isReady for better state management
    isDataAvailable: !!prayerTimes // New flag to check if data exists
  };
}

// Function optimizeAvailableDays needs to be updated too
function optimizeAvailableDays(prayerTimesData, location) {
  if (!prayerTimesData) {
    console.error('Prayer times data not loaded in optimizeAvailableDays');
    return [];
  }
  
  // Find location with case-insensitive matching
  const normalizedLocation = location.toLowerCase();
  const matchingLocation = Object.keys(prayerTimesData).find(
    key => key.toLowerCase() === normalizedLocation
  ) || location;
  
  if (!prayerTimesData[matchingLocation]) {
    console.error('Invalid prayer times data in optimizeAvailableDays');
    console.error('Available locations:', Object.keys(prayerTimesData));
    return [];
  }
  
  const today = new Date();
  const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  
  // Memoize all parsed dates in a single pass
  const parsedDates = prayerTimesData[matchingLocation].map(dayData => {
    const [day, month, year] = dayData.date.trim().split('/').map(Number);
    return {
      ...dayData,
      parsedDate: new Date(year, month - 1, day, 12, 0, 0),
    };
  });
  
  // Filter once with the parsed dates
  return parsedDates
    .filter(dayData => dayData.parsedDate >= todayNoon)
    .slice(0, 2); // Only get today and tomorrow
}
