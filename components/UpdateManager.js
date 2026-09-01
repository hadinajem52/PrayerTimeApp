import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkForPrayerTimeUpdates = async (customLanguage = null) => {
  console.log('Attempting to check for prayer time updates...');
  try {
    if (!NativeModules.UpdateModule) {
      console.error('UpdateModule is not available!');
      return 'error';
    }

    console.log('Calling forceUpdateCheck...');
    const result = await NativeModules.UpdateModule.forceUpdateCheck();
    console.log('forceUpdateCheck result:', result);

    if (result.status === "updated") {
      await AsyncStorage.setItem('PRAYER_DATA_UPDATED', 'true');
      if (global.fetchPrayerData && typeof global.fetchPrayerData === 'function') {
        await global.fetchPrayerData();
      }
      return 'updated';
    }
    if (result.status === "offline") {
      return 'offline';
    }
    return 'no_update';
  } catch (error) {
    console.error("Error in checkForPrayerTimeUpdates:", error);
    return 'error';
  }
};
