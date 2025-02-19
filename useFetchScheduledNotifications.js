// useFetchScheduledNotifications.js
import { useEffect } from 'react';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getOrCreateUserId } from './savePrayerTime';

export function useFetchScheduledNotifications(setScheduledNotifications) {
  useEffect(() => {
    async function fetchScheduledNotifications() {
      try {
        const userId = await getOrCreateUserId();
        console.log("User ID in useFetchScheduledNotifications:", userId);
        const q = query(
          collection(db, "prayerTimes"),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);

        let scheduled = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const prayerName = data.prayerName;
          scheduled[prayerName] = doc.id;
        });

        console.log("Fetched scheduled notifications:", scheduled);
        setScheduledNotifications(scheduled);
      } catch (error) {
        console.error("Error fetching scheduled notifications:", error);
      }
    }

    fetchScheduledNotifications();
  }, [setScheduledNotifications]);
}
