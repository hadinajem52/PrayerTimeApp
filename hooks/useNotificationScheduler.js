import { useState, useEffect, useCallback } from 'react';
import notifee, { TriggerType, RepeatFrequency, AndroidImportance } from '@notifee/react-native';
import moment from 'moment-hijri';
import { usePrayerTimes } from '../components/PrayerTimesProvider';

// Translation keys for notifications
const TRANSLATIONS = {
  en: {
    prayerTime: "Prayer Time",
    prayerApproaching: "{prayer} prayer time",
    dailyRefresh: "Prayer Schedule Updated",
    dailyRefreshBody: "Your prayer notifications have been refreshed for today",
    fajr: "Morning Prayer",
    shuruq: "Sunrise",
    dhuhr: "Noon Prayer",
    asr: "Afternoon Prayer",
    maghrib: "Sunset Prayer",
    isha: "Night Prayer",
    imsak: "Pre-dawn meal time",
    midnight: "Midnight"
  },
  ar: {
    prayerTime: "وقت الصلاة",
    prayerApproaching: "حان وقت صلاة {prayer}",
    dailyRefresh: "تم تحديث جدول الصلاة",
    dailyRefreshBody: "تم تحديث إشعارات الصلاة الخاصة بك لهذا اليوم",
    fajr: "الصبح",
    shuruq: "الشروق",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
    imsak: "الإمساك",
    midnight: "منتصف الليل"
  }
};

/**
 * Custom hook for managing prayer time notifications
 * 
 * @param {string} language - The current app language (en/ar)
 * @returns {Object} - Functions and state for notification management
 */
export const useNotificationScheduler = (language) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false); // New state
  const [isDataAvailable, setIsDataAvailable] = useState(false);
  
  // Access prayer times from context
  const { prayerTimes, isLoading: prayerTimesLoading } = usePrayerTimes();
  
  // Helper function to translate notification text
  const translate = useCallback((key, params = {}) => {
    const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
    let text = translations[key] || key;
    
    // Replace parameters in text (e.g., {prayer})
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
      setIsOperationInProgress(true); // Use new state instead of isLoading
      
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
      
      // Create notification content
      const notification = {
        id: String(id),
        title: translate('prayerTime'),
        body: translate('prayerApproaching', { prayer: prayerName }),
        android: {
          channelId: 'prayer-channel',
          smallIcon: 'ic_launcher', // Use your app icon (already exists)
          // Alternatively: try "ic_stat_notify"
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.HIGH,
        },
        ios: {
          sound: 'default',
        }
      };
      
      // Schedule the notification
      await notifee.createTriggerNotification(notification, trigger);
      console.log(`[Notification] Scheduled ${prayerKey} at ${prayerTime.toLocaleString()}`);
      
      return id;
    } catch (error) {
      console.error('[Notification] Error scheduling notification:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false); // Reset new state
    }
  }, [translate]);
  
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
    
    // Set local hours and minutes (not UTC)
    prayerDate.setHours(hours, minutes, 0, 0);
    
    // Log for debugging
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
    
    // Format date to match the format in prayer times data (D/M/YYYY)
    const formattedDate = moment(date).format('D/M/YYYY');
    
    // Find prayer times for the specified date
    const dayData = prayerTimes[location].find(day => day.date.trim() === formattedDate);
    
    if (!dayData) {
      console.log(`[Notification] No prayer data for ${formattedDate} in ${location}`);
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
      setIsOperationInProgress(true); // Use new state
      await notifee.cancelTriggerNotification(String(id));
      console.log('[Notification] Canceled notification:', id);
    } catch (error) {
      console.error('[Notification] Error canceling notification:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false); // Reset new state
    }
  }, []);
  
  /**
   * Cancel multiple or all notifications
   * 
   * @param {Array} ids - Array of notification IDs (empty to cancel all)
   */
  const cancelAllNotifications = useCallback(async (ids = []) => {
    try {
      setIsOperationInProgress(true); // Use new state
      
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
      setIsOperationInProgress(false); // Reset new state
    }
  }, [cancelLocalNotification]);
  
  /**
   * Schedule notifications for all enabled prayers for a specific period
   * 
   * @param {string} location - Location key (e.g., "beirut")
   * @param {Object} enabledPrayers - Object with prayer keys as keys and boolean values
   * @param {number} days - Number of days to schedule for (default: 3)
   * @returns {Array} - Array of scheduled notification IDs
   */
  const scheduleNotificationsForUpcomingPeriod = useCallback(async (location, enabledPrayers, days = 3) => {
    try {
      setIsOperationInProgress(true); // Use new state
      const scheduledIds = [];
      
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
          
          // Only schedule if the prayer time is in the future
          if (prayerTime > new Date()) {
            // Create a unique ID for this notification
            const notificationId = `${dateStr}${prayer}`;
            
            // Schedule the notification
            const scheduledId = await scheduleLocalNotification(notificationId, prayer, prayerTime);
            if (scheduledId) scheduledIds.push(scheduledId);
          }
          console.log("Available prayer times for day:", dayPrayers);
          console.log("Enabled prayers:", enabledPrayers);
          console.log("Prayer time parsed:", prayerTime, "Original string:", dayPrayers[prayer]);
        }
      }
      
      console.log(`[Notification] Scheduled ${scheduledIds.length} notifications for ${days} days`);
      return scheduledIds;
    } catch (error) {
      console.error('[Notification] Error scheduling period notifications:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false); // Reset new state
    }
  }, [getPrayerTimesForDay, parsePrayerTime, scheduleLocalNotification]);
  
  /**
   * Schedule rolling notifications for the next week
   * 
   * @param {string} location - Location key
   * @param {Object} enabledPrayers - Enabled prayers configuration
   * @returns {Array} - Array of scheduled notification IDs
   */
  const scheduleRollingNotifications = useCallback(async (location, enabledPrayers) => {
    try {
      console.log('[Notification] Scheduling rolling notifications for', location);
      return await scheduleNotificationsForUpcomingPeriod(location, enabledPrayers, 7);
    } catch (error) {
      console.error('[Notification] Error scheduling rolling notifications:', error);
      throw error;
    }
  }, [scheduleNotificationsForUpcomingPeriod]);
  
  /**
   * Set up a daily refresh notification to prompt app to update schedules
   * 
   * @param {string} location - Location key
   * @param {Object} enabledPrayers - Enabled prayers configuration
   */
  const setupDailyRefresh = useCallback(async (location, enabledPrayers) => {
    try {
      setIsOperationInProgress(true); // Use new state
      
      // Cancel any existing refresh notification
      await notifee.cancelTriggerNotification('daily-refresh');
      
      // Set up midnight trigger for the next day
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      midnight.setDate(midnight.getDate() + 1); // Tomorrow midnight
      
      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: midnight.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };
      
      // Create notification content
      const notification = {
        id: 'daily-refresh',
        title: translate('dailyRefresh'),
        body: translate('dailyRefreshBody'),
        android: {
          channelId: 'prayer-channel',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
        data: {
          type: 'refresh',
          location,
          enabledPrayers: JSON.stringify(enabledPrayers),
        },
      };
      
      await notifee.createTriggerNotification(notification, trigger);
      console.log('[Notification] Setup daily refresh at midnight');
      
    } catch (error) {
      console.error('[Notification] Error setting up daily refresh:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false); // Reset new state
    }
  }, [translate]);

  /**
   * Display an immediate notification without scheduling
   * 
   * @returns {Promise<string>} - The notification ID
   */
  const displayImmediateNotification = useCallback(async () => {
    try {
      setIsOperationInProgress(true); // Use new state
      
      // Create a unique ID for this notification
      const id = `immediate-${Date.now()}`;
      
      // Create notification content
      const notification = {
        id,
        title: translate('prayerTime'),
        body: language === 'en' ? 'This is an immediate test notification' : 'هذا إشعار تجريبي فوري',
        android: {
          channelId: 'prayer-channel',
          smallIcon: 'ic_launcher', // Use your app icon (already exists)
          // Alternatively: try "ic_stat_notify"
          pressAction: {
            id: 'default',
          },
          importance: AndroidImportance.HIGH,
        },
        ios: {
          sound: 'default',
        }
      };
      
      // Display the notification immediately
      await notifee.displayNotification(notification);
      console.log(`[Notification] Displayed immediate notification with ID: ${id}`);
      
      return id;
    } catch (error) {
      console.error('[Notification] Error displaying notification:', error);
      throw error;
    } finally {
      setIsOperationInProgress(false); // Reset new state
    }
  }, [translate, language]);
  
  /**
   * Schedule a test notification 10 seconds in the future
   * 
   * @returns {Promise<string>} - The notification ID
   */
  const scheduleTestNotification = useCallback(async () => {
    try {
      // Create a date object 10 seconds in the future
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 10);
      
      // Create a unique ID
      const id = `test-${Date.now()}`;
      
      // Use existing function to schedule the notification
      const result = await scheduleLocalNotification(
        id, 
        'test', 
        testTime
      );
      
      return result;
    } catch (error) {
      console.error('[Notification] Error scheduling test notification:', error);
      throw error;
    }
  }, [scheduleLocalNotification]);

  return {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    cancelLocalNotification,
    cancelAllNotifications,
    scheduleRollingNotifications,
    setupDailyRefresh,
    displayImmediateNotification,  // Add this new function
    scheduleTestNotification,      // Add this new function
    isLoading, // Keep this for initial loading only
    isOperationInProgress, // Add this new state
    isDataAvailable
  };
};

export default useNotificationScheduler;