const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Utility function that returns a promise that resolves after ms milliseconds.
 * @param {number} ms - Number of milliseconds to sleep.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a notification with a retry mechanism using exponential backoff.
 * @param {string} token - The FCM device token.
 * @param {Object} payload - The notification payload.
 * @param {number} [maxRetries=3] - Maximum number of attempts.
 * @param {number} [attempt=1] - Current attempt number.
 * @returns {Promise<Object>} The messaging response.
 */
async function sendNotificationWithRetry(token, payload, maxRetries = 3, attempt = 1) {
  console.log(`Sending notification (attempt ${attempt}) to token: ${token}`);
  try {
    const response = await admin.messaging().sendToDevice(token, payload);
    console.log(`Notification sent successfully on attempt ${attempt} to token: ${token}`, response);
    return response;
  } catch (error) {
    console.error(`Error on attempt ${attempt} for token ${token}:`, error);
    // If error indicates an invalid token, do not retry.
    if (
      error.errorInfo &&
      error.errorInfo.code &&
      (error.errorInfo.code === "messaging/registration-token-not-registered" ||
        error.errorInfo.code === "messaging/invalid-registration-token")
    ) {
      console.log(`Token ${token} is invalid. No further retries will be attempted.`);
      throw error;
    }
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Attempt ${attempt} failed. Retrying in ${delay} ms for token: ${token}`);
      await sleep(delay);
      return sendNotificationWithRetry(token, payload, maxRetries, attempt + 1);
    } else {
      console.error(`Exceeded max retries for token: ${token}. Giving up.`);
      throw error;
    }
  }
}

/**
 * Cloud Function that queries Firestore for scheduled prayer notifications
 * and sends a notification for each document if notifications are enabled.
 */
exports.scheduledPrayerNotification = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const nextWindow = admin.firestore.Timestamp.fromMillis(now.toMillis() + 60000); // Next 1 minute window

    console.log(`Function triggered at: ${now.toDate()}`);
    console.log(`Querying documents with notificationTime between ${now.toDate()} and ${nextWindow.toDate()}`);

    try {
      // Query documents scheduled to be notified within the next minute.
      // Optionally, you might also check that they haven't been notified yet:
      const snapshot = await admin
        .firestore()
        .collection("prayerTimes")
        .where("notificationTime", ">=", now)
        .where("notificationTime", "<", nextWindow)
        .where("notified", "==", false)  // optional: ensure we haven't sent the notification already
        .get();

      console.log(`Found ${snapshot.size} document(s) scheduled for notification.`);

      const sendPromises = [];

      snapshot.forEach((doc) => {
        console.log(`Processing document ID: ${doc.id}`);
        const data = doc.data();
        const { deviceToken, prayerName, notificationEnabled } = data;

        // Only send notifications if explicitly enabled.
        if (notificationEnabled !== true) {
          console.log(`Notifications are disabled for document ID: ${doc.id}. Skipping notification.`);
          return;
        }

        if (!deviceToken) {
          console.warn(`No deviceToken found for document ID: ${doc.id}. Skipping notification.`);
          return;
        }

        console.log(`Device token found: ${deviceToken} for prayer: ${prayerName}`);

        const payload = {
          notification: {
            title: "Prayer Reminder",
            body: `It's time for ${prayerName}!`,
          },
          data: {
            prayerName: prayerName || "",
          },
        };

        // Send the notification with retry logic.
        const p = sendNotificationWithRetry(deviceToken, payload)
          .then(async (response) => {
            console.log(`Notification sent for document ID: ${doc.id}. Response:`, response);
            // Update Firestore to record the successful notification.
            await admin.firestore().collection("prayerTimes").doc(doc.id).update({
              notified: true, // mark as notified so we don't send it again
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Firestore updated for document ID: ${doc.id} after sending notification.`);
          })
          .catch(async (error) => {
            console.error(`Failed to send notification for document ID: ${doc.id}:`, error);
            // If error indicates an invalid token, remove it from Firestore.
            if (
              error.errorInfo &&
              error.errorInfo.code &&
              (error.errorInfo.code === "messaging/registration-token-not-registered" ||
                error.errorInfo.code === "messaging/invalid-registration-token")
            ) {
              console.warn(`Invalid token for document ID: ${doc.id}. Removing token from Firestore.`);
              await admin.firestore().collection("prayerTimes").doc(doc.id).update({
                deviceToken: admin.firestore.FieldValue.delete(),
                tokenInvalid: true,
              });
              console.log(`Device token removed for document ID: ${doc.id}.`);
            }
            // Log the failure in a dead-letter collection for further review.
            await admin.firestore().collection("notificationFailures").doc(doc.id).set({
              ...data,
              error: error.message || error.toString(),
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Failure logged for document ID: ${doc.id} in notificationFailures collection.`);
          });

        sendPromises.push(p);
      });

      await Promise.all(sendPromises);
      console.log("All scheduled notifications have been processed.");
    } catch (err) {
      console.error("Error querying Firestore for scheduled notifications:", err);
    }

    return null;
  });
