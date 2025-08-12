import { useState, useEffect, useCallback } from 'react';
import notifee, { TriggerType, RepeatFrequency, AndroidImportance } from '@notifee/react-native';
import moment from 'moment-hijri';
import { usePrayerTimes } from '../components/PrayerTimesProvider';

const TRANSLATIONS = {
  en: {
    prayerTime: "Prayer Time",
    timeApproaching: "It's {time} time",
    prayerApproaching: "{prayer} prayer time",
    dailyRefresh: "Prayer Schedule Updated",
    dailyRefreshBody: "Your prayer notifications have been refreshed for today",
    // Prayer times
    fajr: "Morning Prayer",
    dhuhr: "Dhuhr Prayer",
    asr: "Asr Prayer",
    maghrib: "Maghrib Prayer",
    isha: "Isha Prayer",
    // Other significant times (not prayers)
    shuruq: "Sunrise",
    imsak: "Imsak",
    midnight: "Midnight"
  },
  ar: {
    prayerTime: "وقت الصلاة",
    timeApproaching: "حان وقت {time}", 
    prayerApproaching: "حان وقت صلاة {prayer}",
    dailyRefresh: "تم تحديث جدول الصلاة",
    dailyRefreshBody: "تم تحديث إشعارات الصلاة الخاصة بك لهذا اليوم",
    // Prayer times
    fajr: "الصبح",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
    // Other significant times (not prayers)
    shuruq: "الشروق",
    imsak: "الإمساك",
    midnight: "منتصف الليل"
  }
};

export const useNotificationScheduler = (language, usePrayerSound = true) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false); 
  const [isDataAvailable, setIsDataAvailable] = useState(false);
  
  const { prayerTimes, isLoading: prayerTimesLoading } = usePrayerTimes();
  
  const translate = useCallback((key, params = {}) => {
    const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
    let text = translations[key] || key;
    
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, value);
    });
    
    return text;
  }, [language]);
  
  // Update data availability when prayer times load
  useEffect(() => {
    if (prayerTimes && Object.keys(prayerTimes).length > 0 && !prayerTimesLoading) {
      setIsDataAvailable(true);
      setIsLoading(false);
    } else {
      setIsDataAvailable(false);
    }
  }, [prayerTimes, prayerTimesLoading]);
  
  /**
   * Schedule a single local notification
   * 
   * @param {string} id - Unique identifier for the notification
   * @param {string} prayerKey - Prayer key (fajr, dhuhr, etc.)
   * @param {Date} prayerTime - Date object for the prayer time
   * @returns {string|null} - The notification ID or null if scheduling failed
   */
  const scheduleLocalNotification = useCallback(async (id, prayerKey, prayerTime) => {
    try {
      setIsOperationInProgress(true); 
      
      // Standardize notification ID format - ensure consistent format across app
      const standardizedId = `prayer_${moment(prayerTime).format('YYYYMMDD')}_${prayerKey}`;
      
      // Check if this notification already exists
      const existingNotifications = await notifee.getTriggerNotifications();
      const alreadyScheduled = existingNotifications.some(n => n.notification.id === standardizedId);
      
      if (alreadyScheduled) {
        console.log(`[Notification] Skipping ${prayerKey} - already scheduled with ID: ${standardizedId}`);
        return standardizedId;
      }
      
      // Skip scheduling if time is in the past
      if (prayerTime < new Date()) {
        console.log(`[Notification] Skipping ${prayerKey} - time already passed:`, prayerTime);
        return null;
      }
      
      // Get localized prayer name
      const prayerName = translate(prayerKey);
      
      // Create trigger for the specific time
      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),

      };
      
      // Determine if this is a prayer or other significant time
      const isPrayer = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(prayerKey);
      
      // Determine channel based on sound preference
      const channelId = usePrayerSound ? 'prayer-channel-sound' : 'prayer-channel-default';

      // Create notification content with appropriate message format
      const notification = {
        id: standardizedId,
        title: translate('prayerTime'),
        body: isPrayer 
          ? translate('prayerApproaching', { prayer: prayerName })
          : translate('timeApproaching', { time: prayerName }),
        android: {
          // Dynamically select channel based on sound setting
          channelId,
          smallIcon: 'ic_launcher', 
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.MAX,
          // Add timestamp for when notification was posted
          timestamp: prayerTime.getTime(), // Shows the actual prayer time as when notification was sent
          showTimestamp: true,
          alarmManager: {
            allowWhileIdle: true,
          },
          // Sound is now handled by the notification channel
        },
      };
      
      // Schedule the notification
      await notifee.createTriggerNotification(notification, trigger);
      console.log(`[Notification] Scheduled ${prayerKey} at ${prayerTime.toLocaleString()} with ID: ${standardizedId}`);
      
      return standardizedId;
    } catch (error) {
      console.error('[Notification] Error scheduling notification:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, [translate, language, usePrayerSound]);
  
  /**
   * Parse a prayer time string into a Date object
   * 
   * @param {string} timeStr - Time string in format "HH:MM"
   * @param {Date} date - Base date to use (defaults to today)
   * @returns {Date} - Date object representing the prayer time
   */
  const parsePrayerTime = useCallback((timeStr, date = new Date()) => {
    // Parse hours and minutes from timeStr (e.g. "17:56")
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a new date object based on the input date
    const prayerDate = new Date(date);
    
    prayerDate.setHours(hours, minutes, 0, 0);
    
    console.log(`Parsing prayer time: ${timeStr} to local time:`, 
      `${prayerDate.toLocaleTimeString()} (${prayerDate.toISOString()})`);
    
    return prayerDate;
  }, []);
  
  /**
   * Get prayer times for a specific date and location
   * 
   * @param {string} location - Location key (e.g., "beirut")
   * @param {Date} date - Date to get prayer times for
   * @returns {Object|null} - Prayer times object or null if not found
   */
  const getPrayerTimesForDay = useCallback((location, date = new Date()) => {
    if (!prayerTimes || !prayerTimes[location]) {
      console.log('[Notification] No prayer data available for location:', location);
      return null;
    }
    
    // Create a moment object for the target date
    const targetDate = moment(date);
    const targetDay = targetDate.date(); // Day of month (1-31)
    const targetMonth = targetDate.month() + 1; // Month is 0-indexed in moment
    const targetYear = targetDate.year();
    
    // Find prayer times with more robust date matching
    const dayData = prayerTimes[location].find(day => {
      if (!day.date) return false;
      
      // Parse the date parts from the data
      const dateParts = day.date.trim().split('/');
      if (dateParts.length !== 3) return false;
      
      const dayPart = parseInt(dateParts[0], 10);
      const monthPart = parseInt(dateParts[1], 10);
      const yearPart = parseInt(dateParts[2], 10);
      
      // Compare the numeric values directly
      return dayPart === targetDay && monthPart === targetMonth && yearPart === targetYear;
    });
    
    if (!dayData) {
      console.log(`[Notification] No prayer data for ${targetDay}/${targetMonth}/${targetYear} in ${location}`);
      return null;
    }
    
    return dayData;
  }, [prayerTimes]);
  
  /**
   * Cancel a specific notification by ID
   * 
   * @param {string} id - Notification ID to cancel
   */
  const cancelLocalNotification = useCallback(async (id) => {
    if (!id) return;
    
    try {
      setIsOperationInProgress(true); 
      await notifee.cancelTriggerNotification(String(id));
      console.log('[Notification] Canceled notification:', id);
    } catch (error) {
      console.error('[Notification] Error canceling notification:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false); 
    }
  }, []);
  
  /**
   * Cancel multiple or all notifications
   * 
   * @param {Array} ids - Array of notification IDs (empty to cancel all)
   */
  const cancelAllNotifications = useCallback(async (ids = []) => {
    try {
      setIsOperationInProgress(true); 
      
      if (!ids || ids.length === 0) {
        // Cancel all notifications if no IDs provided
        await notifee.cancelAllNotifications();
        console.log('[Notification] Canceled all notifications');
      } else {
        // Cancel specific notifications by ID
        for (const id of ids) {
          await cancelLocalNotification(id);
        }
        console.log(`[Notification] Canceled ${ids.length} notifications`);
      }
    } catch (error) {
      console.error('[Notification] Error canceling notifications:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, [cancelLocalNotification]);
  
  /**
   * Schedule notifications for all enabled prayers for a specific period
   * 
   * @param {string} location - Location key (e.g., "beirut")
   * @param {Object} enabledPrayers - Object with prayer keys as keys and boolean values
   * @param {number} days - Number of days to schedule for (default: 2)
   * @returns {Array} - Array of scheduled notification IDs
   */
  const scheduleNotificationsForUpcomingPeriod = useCallback(async (location, enabledPrayers, days = 2) => {
    try {
      setIsOperationInProgress(true);
      const scheduledIds = [];
      
      // First, get all existing notifications to avoid duplicates
      const existingNotifications = await notifee.getTriggerNotifications();
      const existingIds = existingNotifications.map(n => n.notification.id);
      
      // Schedule notifications for each day in the period
      for (let i = 0; i < days; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        
        const dayPrayers = getPrayerTimesForDay(location, targetDate);
        if (!dayPrayers) continue;
        
        // Format date for logging and ID generation
        const dateStr = moment(targetDate).format('YYYYMMDD');
        
        // Schedule notifications for each enabled prayer
        const prayerKeys = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];
        
        for (const prayer of prayerKeys) {
          // Skip if this prayer is not enabled
          if (!enabledPrayers[prayer]) continue;
          
          // Skip if no time available for this prayer
          if (!dayPrayers[prayer]) continue;
          
          // Parse the prayer time string to a Date object
          const prayerTime = parsePrayerTime(dayPrayers[prayer], targetDate);
          
          // Use standardized ID format matching scheduleLocalNotification
          const notificationId = `prayer_${moment(targetDate).format('YYYYMMDD')}_${prayer}`;
          
          // Skip if already in trigger notifications list
          if (existingIds.includes(String(notificationId))) {
            console.log(`[Notification] Skipping ${prayer} - already in pending notifications`);
            continue;
          }
          
          // Only schedule if the prayer time is in the future
          if (prayerTime > new Date()) {
            console.log("Scheduling notification for:", prayer);
            console.log("Prayer time parsed:", prayerTime, "Original string:", dayPrayers[prayer]);
            
            const scheduledId = await scheduleLocalNotification(notificationId, prayer, prayerTime);
            if (scheduledId) scheduledIds.push(scheduledId);
          }
        }
      }
      
      console.log(`[Notification] Scheduled ${scheduledIds.length} notifications for ${days} days`);
      return scheduledIds;
    } catch (error) {
      console.error('[Notification] Error scheduling period notifications:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false); 
    }
  }, [getPrayerTimesForDay, parsePrayerTime, scheduleLocalNotification]);
  
  /**
   * Schedule rolling notifications for today and tomorrow
   * 
   * @param {string} location - Location key
   * @param {Object} enabledPrayers - Enabled prayers configuration
   * @returns {Array} - Array of scheduled notification IDs
   */
  const scheduleRollingNotifications = useCallback(async (location, enabledPrayers) => {
    try {
      console.log('[Notification] Scheduling rolling notifications for', location);
      
      // First, schedule today and tomorrow (2 days)
      const scheduledIds = await scheduleNotificationsForUpcomingPeriod(location, enabledPrayers, 2);
      
      // Then set up the daily refresh to maintain the rolling window
      await setupDailyRefresh(location, enabledPrayers);
      
      return scheduledIds;
    } catch (error) {
      console.error('[Notification] Error scheduling rolling notifications:', error);
      throw error;
    }
  }, [scheduleNotificationsForUpcomingPeriod, setupDailyRefresh]);
  
  /**
   * Set up a daily refresh notification to prompt app to update schedules
   * 
   * @param {string} location - Location key
   * @param {Object} enabledPrayers - Enabled prayers configuration
   */
  const setupDailyRefresh = useCallback(async (location, enabledPrayers) => {
    try {
      setIsOperationInProgress(true);
      
      // Cancel any existing refresh notification/trigger
      await notifee.cancelTriggerNotification('daily-refresh');
      
      // Set up midnight trigger for the next day
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      midnight.setDate(midnight.getDate() + 1); // Tomorrow midnight
      
      // Schedule the next day's notifications silently (without showing a notification)
      console.log('[Notification] Setting up silent daily refresh at midnight');
      
      // Get existing notifications before scheduling more
      const existingNotifications = await notifee.getTriggerNotifications();
      const existingIds = existingNotifications.map(n => n.notification.id);
      
      // Schedule only for the day after tomorrow
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      // Schedule only for the day after tomorrow
      const targetDate = dayAfterTomorrow;
      const dayPrayers = getPrayerTimesForDay(location, targetDate);
      
      if (dayPrayers) {
        // Format date for logging and ID generation
        const dateStr = moment(targetDate).format('YYYYMMDD');
        const scheduledIds = [];
        
        // Schedule notifications for each enabled prayer
        const prayerKeys = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];
        
        for (const prayer of prayerKeys) {
          if (!enabledPrayers[prayer] || !dayPrayers[prayer]) continue;
          
          const prayerTime = parsePrayerTime(dayPrayers[prayer], targetDate);
          
          // Use standardized ID format matching scheduleLocalNotification
          const notificationId = `prayer_${moment(targetDate).format('YYYYMMDD')}_${prayer}`;
          
          // Skip if already scheduled
          if (existingIds.includes(String(notificationId))) {
            console.log(`[Notification] Skipping ${prayer} - already scheduled for day+2`);
            continue;
          }
          
          const scheduledId = await scheduleLocalNotification(notificationId, prayer, prayerTime);
          if (scheduledId) scheduledIds.push(scheduledId);
        }
        
        console.log(`[Notification] Scheduled ${scheduledIds.length} notifications for day after tomorrow`);
      }
      
    } catch (error) {
      console.error('[Notification] Error setting up daily refresh:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false);
    }
  }, [translate, getPrayerTimesForDay, parsePrayerTime, scheduleLocalNotification]);

  const triggerTestNotification = useCallback(async () => {
    try {
      setIsOperationInProgress(true);
      const channelId = usePrayerSound ? 'prayer-channel-sound' : 'prayer-channel-default';
      
      const testNotification = {
        title: translate('testNotificationTitle'),
        body: translate('testNotificationBody'),
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      };

      await notifee.displayNotification(testNotification);
      console.log('[Notification] Test notification displayed');
    } catch (error) {
      console.error('[Notification] Error displaying test notification:', error);
    } finally {
      setIsOperationInProgress(false);
    }
  }, [usePrayerSound, translate]);

  return {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    cancelLocalNotification,
    cancelAllNotifications,
    scheduleRollingNotifications,
    setupDailyRefresh,
    triggerTestNotification,
    isLoading, 
    isOperationInProgress, 
    isDataAvailable
  };
};

export default useNotificationScheduler;