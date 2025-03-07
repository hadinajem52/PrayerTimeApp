import { initializeApp, getApps } from '@react-native-firebase/app';
import '@react-native-firebase/remote-config';

// Initialize Firebase if no apps are initialized
if (getApps().length === 0) {
  initializeApp();
}

// Export the initialized app
export default { getApps };