//useNotificationScheduler.js
import { useCallback, useRef } from 'react';
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
  if (type !== EventType.TRIGGER_NOTIFICATION_CREATED) {
    return Promise.resolve();
  }
  
  const notification = detail.notification;
  
  // Check if this is our daily refresh notification
  if (notification?.id !== 'daily-refresh' || notification?.data?.type !== 'daily-refresh') {
    return Promise.resolve();
  }
  
  console.log('[Background] Processing daily refresh');
  
  try {
    // Debounce processing with timestamp check
    const lastProcessed = await AsyncStorage.getItem('last_daily_refresh');
    const now = Date.now();
    if (lastProcessed && (now - parseInt(lastProcessed)) < 60000) {
      console.log('[Background] Skipping - processed recently');
      return Promise.resolve();
    }
    
    // Save timestamp immediately to prevent duplicate processing
    await AsyncStorage.setItem('last_daily_refresh', now.toString());
    
    // Extract data from notification
    const location = notification.data.location;
    const enabledPrayers = JSON.parse(notification.data.enabledPrayers || '{}');
    
    // Avoid unnecessary processing
    if (!location || !Object.values(enabledPrayers).some(val => val === true)) {
      console.log('[Background] No enabled prayers, skipping');
      return Promise.resolve();
    }
    
    // Get the prayer data - we need to get it from storage in background context
    let prayerData;
    try {
      // Try to get updated data first
      const updatedData = await fetch(`file://${context.filesDir}/updated_prayer_times.json`).then(res => res.json());
      if (updatedData) {
        prayerData = updatedData;
      } else {
        // Fallback to bundled data
        prayerData = require('../assets/prayer_times.json');
      }
    } catch (e) {
      console.error('[Background] Error loading prayer data:', e);
      // Fallback to bundled data
      prayerData = require('../assets/prayer_times.json');
    }
    
    console.log('[Background] Rescheduling notifications for', location);
        
    // Cancel existing notifications
    await notifee.cancelAllNotifications();
    
    // Schedule new notifications for today and tomorrow
    const today = new Date();
    const availableDays = prayerData[location]
      .filter((dayData) => {
        const dayDate = moment(dayData.date, 'D/M/YYYY').toDate();
        return dayDate >= today;
      })
      .slice(0, 2);
    
    if (availableDays.length === 0) {
      console.warn('[Background] No prayer time data available');
      return;
    }
    
    // Schedule new notifications
    for (const dayData of availableDays) {
      for (const prayerKey of ["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"]) {
        if (!enabledPrayers[prayerKey]) continue;
        
        const timeStr = dayData[prayerKey];
        if (!timeStr) continue;
        
        const [hour, minute] = timeStr.split(':').map(Number);
        const prayerMoment = moment(dayData.date, 'D/M/YYYY')
          .hour(hour)
          .minute(minute)
          .second(0);
          
        if (prayerMoment.toDate() > today) {
          const numericId = moment(prayerMoment).format('YYYYMMDDHHmm');
          const prayerName = PRAYER_NAMES[prayerKey]['en']; // Default to English in background
          
          await notifee.createTriggerNotification(
            {
              id: numericId,
              title: 'Prayer Reminder',
              body: `It's time for ${prayerName} prayer.`,
              android: {
                channelId: 'prayer-channel',
                smallIcon: 'ic_launcher',
                importance: AndroidImportance.HIGH,
                sound: 'default',
              },
            },
            {
              type: TriggerType.TIMESTAMP,
              timestamp: prayerMoment.toDate().getTime(),
            }
          );
        }
      }
    }
    
    // Schedule the next day's refresh
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 5, 0);
    
    await notifee.createTriggerNotification(
      {
        id: 'daily-refresh',
        title: 'Updating prayer times',
        body: 'Refreshing prayer times for today',
        data: {
          location: location,
          enabledPrayers: JSON.stringify(enabledPrayers),
          type: 'daily-refresh'
        },
        android: {
          channelId: 'system-tasks',
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
          asForegroundService: true,
          importance: AndroidImportance.HIGH,
          wakeLockTimeout: 10000,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: tomorrow.getTime(),
        alarmManager: {
          allowWhileIdle: true,
          exact: true,
          wakeup: true,
        },
      }
    );
    
    console.log('[Background] Successfully completed daily refresh');
  } catch (error) {
    console.error('[Background] Error in background handler:', error);
  }
  
  return Promise.resolve();
});

export function useNotificationScheduler(language) {
  // Get prayer times from context
  const { prayerTimes } = usePrayerTimes();
  
  // Cache for parsed prayer times
  const parsedTimesCache = useRef({});

  const scheduleLocalNotification = useCallback(
    async (notificationId, prayerKey, prayerDateTime) => {
      console.log(`Attempting to schedule notification for ${prayerKey} at ${prayerDateTime}`);
      
      if (prayerDateTime <= new Date()) {
        console.warn(`Scheduled time ${prayerDateTime} is in the past. Notification not scheduled.`);
        return null;
      }
      
      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerDateTime.getTime(),
      };
      console.log(`Trigger timestamp set to: ${trigger.timestamp} (${new Date(trigger.timestamp).toISOString()})`);

      const title = language === 'ar' ? 'تذكير الصلاة' : 'Prayer Reminder';
      const prayerName = PRAYER_NAMES[prayerKey][language];
      const body =
        language === 'ar'
          ? `حان موعد  ${prayerName}`
          : `It's time for ${prayerName} prayer.`;
      
      console.log(`Creating notification with ID: ${notificationId}, title: ${title}, prayer: ${prayerName}`);

      try {
        await notifee.createTriggerNotification(
          {
            id: notificationId,
            title,
            body,
            android: {
              channelId: 'prayer-channel',
              smallIcon: 'ic_launcher',
              // Add importance to ensure notification is delivered
              importance: 4, // AndroidImportance.HIGH
              // Add sound
              sound: 'default',
            },
          },
          trigger
        );
        console.log(
          `✅ Successfully scheduled notification for ${prayerKey} at ${moment(prayerDateTime).format('YYYY-MM-DD HH:mm:ss')}`
        );
      } catch (error) {
        console.error(`❌ Failed to schedule ${prayerKey}: ${error.message}`);
        console.error('Error details:', error);
      }
      return notificationId;
    },
    [language]
  );

  const scheduleNotificationsForUpcomingPeriod = useCallback(
    async (location, enabledPrayers) => {
      console.log(`Starting to schedule notifications for location: ${location}`);
      console.log(`Enabled prayers:`, enabledPrayers);
      
      if (!prayerTimes || !prayerTimes[location]) {
        console.error(`No prayer times data available for location: ${location}`);
        return [];
      }
      
      const today = new Date();
      console.log(`Today's date: ${today.toISOString()}`);
      
      // Focus on finding today first
      const formattedToday = moment(today).format('D/M/YYYY');
      console.log(`Formatted today: ${formattedToday}`);
      
      const upcomingDays = prayerTimes[location]
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
      
      console.log(`Found ${upcomingDays.length} upcoming days with prayer data`);
      if (upcomingDays.length === 0) {
        console.warn(`⚠️ No upcoming days found for location: ${location}`);
        return [];
      }
      
      // Log first and last days for verification
      if (upcomingDays.length > 0) {
        console.log(`First day: ${upcomingDays[0].date}, Last day: ${upcomingDays[upcomingDays.length-1].date}`);
      }

      // Build an array of promises for scheduling notifications concurrently.
      const scheduledNotificationPromises = [];
      let notificationsAttempted = 0;
      
      for (const dayData of upcomingDays) {
        console.log(`Processing date: ${dayData.date}`);
        
        // Parse the date components
        const [day, month, year] = dayData.date.trim().split('/').map(Number);
        
        for (const prayerKey of ["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"]) {
          if (!enabledPrayers[prayerKey]) {
            console.log(`${prayerKey} is disabled, skipping`);
            continue;
          }
          
          const timeStr = dayData[prayerKey];
          if (!timeStr) {
            console.log(`No time data for ${prayerKey} on ${dayData.date}, skipping`);
            continue;
          }
          
          try {
            const [hour, minute] = timeStr.split(':').map(Number);
            // Create a proper date object for this prayer time
            const prayerDate = new Date(year, month - 1, day, hour, minute, 0);
            
            console.log(`${prayerKey} time for ${dayData.date}: ${timeStr} (${prayerDate.toISOString()})`);
            
            if (prayerDate > today) {
              const numericId = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}`;
              console.log(`Queueing ${prayerKey} notification with ID ${numericId} for ${prayerDate.toLocaleString()}`);
              notificationsAttempted++;
              scheduledNotificationPromises.push(
                scheduleLocalNotification(numericId, prayerKey, prayerDate)
                  .then(id => {
                    if (id) console.log(`✅ Notification ${id} scheduled successfully`);
                    else console.log(`⚠️ Notification scheduling returned null`);
                    return id;
                  })
                  .catch(err => {
                    console.error(`❌ Error scheduling notification: ${err.message}`);
                    return null;
                  })
              );
            } else {
              console.log(`${prayerKey} time ${timeStr} is in the past, skipping`);
            }
          } catch (error) {
            console.error(`Error scheduling ${prayerKey}:`, error);
          }
        }
      }
      
      console.log(`Attempted to schedule ${notificationsAttempted} notifications`);
      console.log(`Waiting for all notifications to be scheduled...`);
      
      const scheduledNotificationIds = await Promise.all(scheduledNotificationPromises);
      const validIds = scheduledNotificationIds.filter(id => id !== null);
      
      console.log(`✅ Successfully scheduled ${validIds.length}/${notificationsAttempted} notifications`);
      
      return validIds;
    },
    [prayerTimes, scheduleLocalNotification] // Add prayerTimes to dependency array
  );

  const scheduleRollingNotifications = useCallback(
    async (location, enabledPrayers) => {
      try {
        // Check if any prayers are enabled before proceeding
        if (!Object.values(enabledPrayers).some(val => val === true)) {
          console.log('No prayers enabled, skipping notification scheduling');
          return [];
        }
        
        if (!prayerTimes || !prayerTimes[location]) {
          console.error(`No prayer times data available for location: ${location}`);
          return [];
        }
        
        // Cancel existing notifications first
        await notifee.cancelAllNotifications();
        
        // Get today's data and tomorrow's data efficiently
        const today = new Date();
        const formattedToday = moment(today).format('D/M/YYYY');
        
        // Find data for today and tomorrow more efficiently
        const availableDays = getAvailableDays(prayerTimes[location], today);
        
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
    [language, prayerTimes] // Add prayerTimes to dependency array
  );
  
  // Implement efficient helper functions
  const getAvailableDays = (prayerDataArray, today) => {
    const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
    const formattedToday = moment(today).format('D/M/YYYY');
    
    // Try to find today's data first (exact match is fastest)
    const todayIndex = prayerDataArray.findIndex(day => day.date.trim() === formattedToday);
    
    if (todayIndex !== -1) {
      // Return today and tomorrow
      return prayerDataArray.slice(todayIndex, todayIndex + 2);
    } else {
      // Fallback to filtering dates
      return prayerDataArray
        .filter(dayData => {
          try {
            const [day, month, year] = dayData.date.trim().split('/').map(Number);
            const dayDate = new Date(year, month - 1, day, 12, 0, 0);
            return dayDate >= todayAtNoon;
          } catch (error) {
            return false;
          }
        })
        .slice(0, 2);
    }
  };
  
  const getParsedTime = (dateStr, timeStr, cache) => {
    const cacheKey = `${dateStr}-${timeStr}`;
    
    if (cache.current[cacheKey]) {
      return cache.current[cacheKey];
    }
    
    const [day, month, year] = dateStr.trim().split('/').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const result = new Date(year, month - 1, day, hour, minute, 0);
    
    // Cache the result
    cache.current[cacheKey] = result;
    return result;
  };
  
  const batchScheduleNotifications = async (notificationsArray, language) => {
    const scheduledIds = [];
    
    // Use Promise.all with batching for better performance
    const batchSize = 5;
    for (let i = 0; i < notificationsArray.length; i += batchSize) {
      const batch = notificationsArray.slice(i, i + batchSize);
      const batchPromises = batch.map(notification => {
        const { id, prayerKey, prayerTime, prayerName } = notification;
        
        const title = language === 'ar' ? 'تذكير الصلاة' : 'Prayer Reminder';
        const body = language === 'ar' 
          ? `حان موعد ${prayerName}` 
          : `It's time for ${prayerName} prayer.`;
        
        return notifee.createTriggerNotification(
          {
            id,
            title,
            body,
            android: {
              channelId: 'prayer-channel',
              smallIcon: 'ic_launcher',
              importance: AndroidImportance.HIGH,
              sound: 'default',
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: prayerTime.getTime(),
          }
        ).then(() => id).catch(err => {
          console.error(`Failed to schedule ${prayerKey}:`, err);
          return null;
        });
      });
      
      const batchResults = await Promise.all(batchPromises);
      scheduledIds.push(...batchResults.filter(Boolean));
    }
    
    return scheduledIds;
  };

  const setupDailyRefresh = useCallback(
    async (location, enabledPrayers) => {
      // Don't set up refresh if no prayers are enabled
      if (!Object.values(enabledPrayers).some(val => val === true)) {
        console.log('No prayers enabled, skipping daily refresh setup');
        return null;
      }
      
      console.log(`Setting up daily refresh for location: ${location}`);
      
      // Validate location parameter
      if (!location || !prayerTimes || !prayerTimes[location]) {
        console.error(`Invalid location or no prayer data: ${location}`);
        return null;
      }
      
      // Only create channel once
      const channelExists = await notifee.getChannel('system-tasks');
      if (!channelExists) {
        await notifee.createChannel({
          id: 'system-tasks',
          name: 'System Tasks',
          importance: AndroidImportance.LOW,
        });
      }

      // Calculate time for midnight (for rescheduling notifications)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 5, 0); // 12:00:05 AM
      
      try {
        // Check if we already have a daily refresh scheduled with the same data
        const enabledPrayersStr = JSON.stringify(enabledPrayers);
        const existingRefresh = await AsyncStorage.getItem('daily_refresh_data');
        
        if (existingRefresh === `${location}:${enabledPrayersStr}`) {
          console.log('Daily refresh already set up with same parameters');
          return true;
        }
        
        // Add location data directly to the notification
        await notifee.createTriggerNotification(
          {
            id: 'daily-refresh',
            title: 'Updating prayer times',
            body: 'Refreshing prayer times for today',
            data: {
              location,
              enabledPrayers: enabledPrayersStr,
              type: 'daily-refresh'
            },
            android: {
              channelId: 'system-tasks',
              smallIcon: 'ic_launcher',
              pressAction: { id: 'default' },
              asForegroundService: true,
              wakeLockTimeout: 10000,
              importance: AndroidImportance.HIGH,
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: tomorrow.getTime(),
            alarmManager: {
              allowWhileIdle: true,
              exact: true,
              wakeup: true,
            },
          }
        );
        
        // Save the parameters we used
        await AsyncStorage.setItem('daily_refresh_data', `${location}:${enabledPrayersStr}`);
        console.log('✅ Daily refresh notification scheduled successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to schedule daily refresh:', error);
        return false;
      }
    },
    [prayerTimes] // Add prayerTimes to dependency array
  );

  const cancelLocalNotification = useCallback(async (notificationId) => {
    await notifee.cancelNotification(notificationId);
    console.log(`Cancelled notification with id: ${notificationId}`);
    return true;
  }, []);

  const cancelAllNotifications = useCallback(async (notificationIds) => {
    await Promise.all(notificationIds.map(id => cancelLocalNotification(id)));
    return true;
  }, [cancelLocalNotification]);

  return {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    scheduleRollingNotifications,
    setupDailyRefresh,
    cancelLocalNotification,
    cancelAllNotifications,
  };
}

// Function optimizeAvailableDays needs to be updated too
function optimizeAvailableDays(prayerTimesData, location) {
  if (!prayerTimesData || !prayerTimesData[location]) {
    console.error('Invalid prayer times data in optimizeAvailableDays');
    return [];
  }
  
  const today = new Date();
  const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  
  // Memoize all parsed dates in a single pass
  const parsedDates = prayerTimesData[location].map(dayData => {
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
