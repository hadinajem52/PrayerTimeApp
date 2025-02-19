// cancelPrayerTime.js
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function cancelPrayerTime(docId) {
  if (!docId) {
    console.error('No document ID provided for cancellation.');
    return false;
  }
  try {
    await deleteDoc(doc(db, 'prayerTimes', docId));
    console.log('Prayer time notification canceled. Deleted doc ID:', docId);
    return true;
  } catch (error) {
    console.error('Error canceling prayer time notification:', error);
    return false;
  }
}