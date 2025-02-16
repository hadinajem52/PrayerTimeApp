// savePrayerTime.js
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function storePrayerTime(prayerKey, timeString, deviceToken) {
  try {
    const [hour, minute] = timeString.split(':').map(Number);
    const now = new Date();
    const prayerDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    
    const docRef = await addDoc(collection(db, 'prayerTimes'), {
      userId: 'dummyUser', 
      deviceToken: deviceToken,
      prayerName: prayerKey,
      prayerTime: Timestamp.fromDate(prayerDateTime),
      notified: false, 
    });
    console.log('Prayer time stored with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error storing prayer time:', error);
    return null;
  }
}
