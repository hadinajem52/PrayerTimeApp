//useNotificationScheduler.js
import { useCallback } from 'react';
import moment from 'moment-hijri';
import notifee, { TriggerType, EventType, AndroidImportance } from '@notifee/react-native';
import prayerData from '../assets/prayer_times.json';

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

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[Background] Event received:', type);
  
  if (type === EventType.TRIGGER_NOTIFICATION_CREATED) {
    const notification = detail.notification;
    
    // Check if this is our daily refresh notification
    if (notification?.id === 'daily-refresh' && notification?.data?.type === 'daily-refresh') {
      console.log('[Background] Processing daily refresh');
      
      try {
        // Extract data from notification
        const location = notification.data.location;
        const enabledPrayers = JSON.parse(notification.data.enabledPrayers || '{}');
        
        // Validate data
        if (!location || Object.keys(enabledPrayers).length === 0) {
          console.error('[Background] Missing location or enabledPrayers');
          return;
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
    }
  }
  
  // Return void to indicate we've handled the event
  return Promise.resolve();
});

export function useNotificationScheduler(language) {
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
      
      const today = new Date();
      console.log(`Today's date: ${today.toISOString()}`);
      
      // Focus on finding today first
      const formattedToday = moment(today).format('D/M/YYYY');
      console.log(`Formatted today: ${formattedToday}`);
      
      const upcomingDays = prayerData[location]
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
    [scheduleLocalNotification]
  );

  const scheduleRollingNotifications = useCallback(
    async (location, enabledPrayers) => {
      try {
        // Cancel any existing notifications first
        const existingChannelGroups = await notifee.getChannelGroups();
        if (existingChannelGroups.length > 0) {
          await notifee.cancelAllNotifications();
          console.log('Cancelled all existing notifications');
        }
        
        const today = new Date();
        // Format today's date to match the prayer data format
        const formattedToday = moment(today).format('D/M/YYYY');
        console.log(`Today's formatted date: ${formattedToday}`);
        
        // Find today's data first
        const todayData = prayerData[location].find(day => day.date.trim() === formattedToday);
        if (!todayData) {
          console.warn(`Could not find prayer data for today (${formattedToday})`);
        } else {
          console.log(`Found today's prayer data: ${JSON.stringify(todayData)}`);
        }
        
        // Find data for today and tomorrow
        const availableDays = prayerData[location]
          .filter((dayData) => {
            try {
              const [day, month, year] = dayData.date.trim().split('/').map(Number);
              // Create date at noon to avoid timezone issues
              const dayDate = new Date(year, month - 1, day, 12, 0, 0);
              const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
              
              // Debug log 
              console.log(`Comparing ${dayData.date} (${dayDate.toISOString()}) with today (${todayAtNoon.toISOString()}): ${dayDate >= todayAtNoon}`);
              
              return dayDate >= todayAtNoon;
            } catch (error) {
              console.error(`Error parsing date ${dayData.date}:`, error);
              return false;
            }
          })
          .slice(0, 2); // Only get today and tomorrow
        
        if (availableDays.length === 0) {
          console.warn('No prayer time data available for scheduling');
          return [];
        }
        
        console.log(`Found ${availableDays.length} days for notifications:`);
        availableDays.forEach(day => console.log(`- ${day.date}`));
        
        // Schedule notifications for available days
        const scheduledNotificationPromises = [];
        for (const dayData of availableDays) {
          console.log(`Processing notifications for date: ${dayData.date}`);
          
          for (const prayerKey of ["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"]) {
            if (!enabledPrayers[prayerKey]) {
              console.log(`${prayerKey} is disabled, skipping`);
              continue;
            }
            
            const timeStr = dayData[prayerKey];
            if (!timeStr) {
              console.log(`No time data for ${prayerKey}, skipping`);
              continue;
            }
            
            try {
              const [hour, minute] = timeStr.split(':').map(Number);
              const [day, month, year] = dayData.date.trim().split('/').map(Number);
              
              // Create a date object for this prayer time
              const prayerDate = new Date(year, month - 1, day, hour, minute, 0);
              
              console.log(`${prayerKey} time: ${timeStr} (${prayerDate.toISOString()})`);
              
              if (prayerDate > today) {
                const numericId = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}`;
                console.log(`Scheduling ${prayerKey} notification with ID ${numericId} for ${prayerDate.toLocaleString()}`);
                
                scheduledNotificationPromises.push(
                  scheduleLocalNotification(numericId, prayerKey, prayerDate).then(() => numericId)
                );
              } else {
                console.log(`${prayerKey} time is in the past, skipping`);
              }
            } catch (error) {
              console.error(`Error scheduling ${prayerKey}:`, error);
            }
          }
        }
        
        const scheduledNotificationIds = (await Promise.all(scheduledNotificationPromises)).filter(Boolean);
        console.log(`Scheduled ${scheduledNotificationIds.length} notifications for the next ${availableDays.length} days`);
        return scheduledNotificationIds;
      } catch (error) {
        console.error('Failed to schedule rolling notifications:', error);
        return [];
      }
    },
    [scheduleLocalNotification]
  );

  const setupDailyRefresh = useCallback(
    async (location, enabledPrayers) => {
      console.log(`Setting up daily refresh for location: ${location}`);
      
      // Validate location parameter
      if (!location || !prayerData[location]) {
        console.error(`Invalid location: ${location}`);
        return null;
      }
      
      // Create a notification channel for system tasks if it doesn't exist
      await notifee.createChannel({
        id: 'system-tasks',
        name: 'System Tasks',
        importance: AndroidImportance.LOW,
      });

      // Calculate time for midnight (for rescheduling notifications)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 5, 0); // 12:00:05 AM
      
      console.log(`Setting up refresh trigger for: ${tomorrow.toISOString()}`);

      try {
        // Add location data directly to the notification
        await notifee.createTriggerNotification(
          {
            id: 'daily-refresh',
            title: 'Updating prayer times',
            body: 'Refreshing prayer times for today',
            data: {
              location: location,
              enabledPrayers: JSON.stringify(enabledPrayers),
              type: 'daily-refresh' // Identifier for background task
            },
            android: {
              channelId: 'system-tasks',
              smallIcon: 'ic_launcher',
              // Important settings for background execution:
              pressAction: {
                id: 'default',
              },
              asForegroundService: true,
              // Allow background execution
              actions: [],
              // Wake the device up for this notification
              wakeLockTimeout: 10000, // 10 seconds
              // Importance to ensure delivery
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
        console.log('✅ Daily refresh notification scheduled successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to schedule daily refresh:', error);
        return false;
      }
    },
    [scheduleRollingNotifications]
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
