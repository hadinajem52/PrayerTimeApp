//useNotificationScheduler.js
import { useCallback } from 'react';
import moment from 'moment-hijri';
import notifee, { TriggerType } from '@notifee/react-native';
import prayerData from '../assets/prayer_times.json';

export function useNotificationScheduler(language) {
  const scheduleLocalNotification = useCallback(
    async (notificationId, prayerKey, prayerDateTime) => {
      if (prayerDateTime <= new Date()) {
        console.warn(`Scheduled time ${prayerDateTime} is in the past. Notification not scheduled.`);
        return null;
      }
      const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerDateTime.getTime(),
      };

      const title = language === 'ar' ? 'تذكير الصلاة' : 'Prayer Reminder';
      // You may use a translation mapping here for prayerKey if needed.
      const body =
        language === 'ar'
          ? `حان موعد صلاة ${prayerKey}`
          : `It's time for ${prayerKey} prayer.`;

      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title,
          body,
          android: {
            channelId: 'prayer-channel',
            smallIcon: 'ic_launcher',
          },
        },
        trigger
      );
      console.log(
        `Scheduled notification for ${prayerKey} at ${moment(prayerDateTime).format('YYYY-MM-DD HH:mm:ss')}`
      );
      return notificationId;
    },
    [language]
  );

  const scheduleNotificationsForUpcomingPeriod = useCallback(
    async (location, enabledPrayers) => {
      const today = new Date();
      const upcomingDays = prayerData[location]
        .filter((dayData) => {
          const dayDate = moment(dayData.date, 'D/M/YYYY').toDate();
          return dayDate >= today;
        })
        .slice(0, 30);

      const scheduledNotificationIds = [];
      for (const dayData of upcomingDays) {
        for (const prayerKey of ["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"]) {
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
            await scheduleLocalNotification(numericId, prayerKey, prayerMoment.toDate());
            scheduledNotificationIds.push(numericId);
          }
        }
      }
      return scheduledNotificationIds;
    },
    [scheduleLocalNotification]
  );

  const cancelLocalNotification = useCallback(async (notificationId) => {
    await notifee.cancelNotification(notificationId);
    console.log(`Cancelled notification with id: ${notificationId}`);
    return true;
  }, []);

  const cancelAllNotifications = useCallback(async (notificationIds) => {
    for (const id of notificationIds) {
      await cancelLocalNotification(id);
    }
    return true;
  }, [cancelLocalNotification]);

  return {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    cancelLocalNotification,
    cancelAllNotifications,
  };
}
