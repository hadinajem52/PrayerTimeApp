const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendPrayerNotification = functions.firestore
  .document('prayerTimes/{docId}')
  .onCreate(async (snap, context) => {
    // Log that the function has been triggered, along with the document ID.
    console.log(`sendPrayerNotification triggered for docId: ${context.params.docId}`);

    // Retrieve and log the Firestore data.
    const data = snap.data();
    console.log("Firestore data received:", data);
    
    const { deviceToken, prayerName, prayerTime } = data;

    // Convert Firestore Timestamp to JavaScript Date
    const scheduledTime = prayerTime.toDate();
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    console.log(`Current time: ${now}`);
    console.log(`Scheduled time: ${scheduledTime}`);
    console.log(`Calculated delay: ${delay} milliseconds`);

    const payload = {
      notification: {
        title: "Prayer Reminder",
        body: `It's time for ${prayerName}!`,
      },
    };

    // If the scheduled time is in the past or immediate, send the notification now.
    if (delay <= 0) {
      try {
        await admin.messaging().sendToDevice(deviceToken, payload);
        console.log(`Notification sent immediately for ${prayerName}`);
      } catch (error) {
        console.error(`Error sending immediate notification for ${prayerName}:`, error);
      }
      return null;
    }

    // If delay is short enough (e.g., less than 9 minutes), wait then send.
    if (delay < 540000) { // 9 minutes in milliseconds
      await new Promise(resolve => {
        setTimeout(async () => {
          try {
            await admin.messaging().sendToDevice(deviceToken, payload);
            console.log(`Notification sent after delay for ${prayerName}`);
          } catch (error) {
            console.error(`Error sending delayed notification for ${prayerName}:`, error);
          }
          resolve();
        }, delay);
      });
      return null;
    }

 
    try {
      await admin.messaging().sendToDevice(deviceToken, payload);
      console.log(`Notification sent immediately (fallback) for ${prayerName}`);
    } catch (error) {
      console.error(`Error sending fallback notification for ${prayerName}:`, error);
    }
    return null;
  });
