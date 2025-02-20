// notificationsender.js
import PushNotification from 'react-native-push-notification';
import moment from 'moment';
import prayerData from './assets/prayer_times.json';

// Create a notification channel for Android
PushNotification.createChannel(
  {
    channelId: 'prayer-channel',
    channelName: 'Prayer Notifications',
  },
  (created) => console.log(`createChannel returned '${created}'`)
);

/**
 * Schedule a single local notification.
 *
 * @param {string} notificationId - Unique identifier for the notification.
 * @param {string} prayerKey - The key for the prayer (e.g., 'fajr').
 * @param {Date} prayerDateTime - JavaScript Date object representing the prayer time.
 * @returns {Promise<string>} - Returns the notificationId.
 */
export async function scheduleLocalNotification(notificationId, prayerKey, prayerDateTime) {
  PushNotification.localNotificationSchedule({
    channelId: 'prayer-channel',
    id: notificationId, // Unique id (e.g., "fajr-1/2/2025")
    title: 'Prayer Reminder',
    message: `It's time for ${prayerKey} prayer.`,
    date: prayerDateTime, // Notification will trigger at this Date
    allowWhileIdle: true, // Ensures notification fires even in Doze mode on Android
  });
  return notificationId;
}

/**
 * Cancel a local notification by its id.
 *
 * @param {string} notificationId - The notification id to cancel.
 * @returns {Promise<boolean>}
 */
export async function cancelLocalNotification(notificationId) {
  // Updated to use cancelLocalNotification (without the trailing 's') per deprecation warning.
  PushNotification.cancelLocalNotification({ id: notificationId });
  console.log(`Cancelled notification with id: ${notificationId}`);
  return true;
}

/**
 * Schedule notifications for the upcoming period (e.g., next 30 days) for a given location,
 * but only for prayers that the user has enabled.
 *
 * @param {string} location - The location key (e.g., 'beirut').
 * @param {Object} enabledPrayers - An object mapping prayer keys to booleans indicating if notifications are enabled.
 * @returns {Promise<Array<string>>} - An array of scheduled notification IDs.
 */
export async function scheduleNotificationsForUpcomingPeriod(location, enabledPrayers) {
  const today = new Date();

  // Filter out days that are today or later and select the next 30 days
  const upcomingDays = prayerData[location]
    .filter(dayData => {
      const dayDate = moment(dayData.date, 'D/M/YYYY').toDate();
      return dayDate >= today;
    })
    .slice(0, 30);

  const scheduledNotificationIds = [];

  // Iterate over each day and each prayer
  for (const dayData of upcomingDays) {
    for (const prayerKey of ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      // Only schedule notifications for prayers that are enabled
      if (!enabledPrayers[prayerKey]) continue;

      const timeStr = dayData[prayerKey];
      if (!timeStr) continue; // Skip if time is missing

      const timeParts = timeStr.split(':');
      const prayerMoment = moment(dayData.date, 'D/M/YYYY')
        .hour(parseInt(timeParts[0], 10))
        .minute(parseInt(timeParts[1], 10))
        .second(0);

      // Only schedule if the prayer time is in the future
      if (prayerMoment.toDate() > today) {
        const notificationId = `${prayerKey}-${dayData.date}`; // Unique id per prayer per day
        await scheduleLocalNotification(notificationId, prayerKey, prayerMoment.toDate());
        scheduledNotificationIds.push(notificationId);
      }
    }
  }

  return scheduledNotificationIds;
}

/**
 * Cancel all notifications given an array of notification IDs.
 *
 * @param {Array<string>} notificationIds - Array of notification IDs to cancel.
 * @returns {Promise<boolean>}
 */
export async function cancelAllNotifications(notificationIds) {
  for (const id of notificationIds) {
    await cancelLocalNotification(id);
  }
  return true;
}
