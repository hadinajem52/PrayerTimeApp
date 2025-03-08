import { initializeApp, getApps } from '@react-native-firebase/app';
import '@react-native-firebase/remote-config';

if (getApps().length === 0) {
  initializeApp();
}

export default { getApps };