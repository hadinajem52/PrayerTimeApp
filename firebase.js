// filepath: /c:/projects/ShiaPrayerLeb/firebase.js
import { firebase } from '@react-native-firebase/app';
import '@react-native-firebase/remote-config';

if (!firebase.apps.length) {
  firebase.initializeApp();
}

export default firebase;