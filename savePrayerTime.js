// savePrayerTime.js
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

async function getOrCreateUserId() {
  try {
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = uuid.v4();
      await AsyncStorage.setItem('userId', userId);
      console.log('Generated new userId:', userId);
    }
    return userId;
  } catch (error) {
    console.error('Error retrieving or creating userId:', error);
    return uuid.v4();
  }
}

export async function storePrayerTime(prayerKey, timeString, deviceToken) {
  // Validate required parameters
  if (!prayerKey || !timeString || !deviceToken) {
    console.error('Missing parameters in storePrayerTime.');
    return null;
  }

  try {
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) {
      throw new Error(`Invalid timeString format: ${timeString}`);
    }

    const now = new Date();
    const prayerDateTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute
    );

    const userId = await getOrCreateUserId();

    const docRef = await addDoc(collection(db, 'prayerTimes'), {
      userId, 
      deviceToken,
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
