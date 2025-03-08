import React, { useEffect, useState } from 'react';
import { AppState, NativeModules, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UpdateService from '../services/UpdateService';
import { ForcedUpdateDialog, OptionalUpdateDialog } from './UpdateDialog';
import { usePrayerTimes } from './PrayerTimesProvider';

console.log('UpdateManager initialized');

const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; 
const LAST_UPDATE_CHECK_KEY = 'last_update_check';
const POSTPONED_VERSION_KEY = 'postponed_update_version';


export const UpdateManager = () => {
  const [updateInfo, setUpdateInfo] = useState({
    needsUpdate: false,
    isForcedUpdate: false,
    updateTitle: '',
    updateMessage: '',
    storeUrl: '',
    latestVersion: 0
  });
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const { refreshPrayerTimes } = usePrayerTimes();

  const checkForUpdates = async (force = false) => {
    try {
      const lastCheck = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
      const now = Date.now();
      
      if (!force && lastCheck && now - parseInt(lastCheck) < UPDATE_CHECK_INTERVAL) {
        console.log('Skipping update check, last check was recent');
        return;
      }
      
      await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, now.toString());
      
      const updateData = await UpdateService.checkForUpdates();
      
      if (updateData.needsUpdate) {
        if (updateData.isForcedUpdate) {
          setUpdateInfo(updateData);
          setShowUpdateDialog(true);
          return;
        }
        
        const postponedVersion = await AsyncStorage.getItem(POSTPONED_VERSION_KEY);
        if (postponedVersion !== updateData.latestVersion.toString()) {
          setUpdateInfo(updateData);
          setShowUpdateDialog(true);
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const handleUpdate = () => {
    UpdateService.openStore(updateInfo.storeUrl);
  };

  const handleLater = async () => {
    await AsyncStorage.setItem(POSTPONED_VERSION_KEY, updateInfo.latestVersion.toString());
    setShowUpdateDialog(false);
  };

  const checkForPrayerTimeUpdates = async () => {
    console.log('Attempting to check for prayer time updates...');
    try {
      if (!NativeModules.UpdateModule) {
        console.error('UpdateModule is not available!');
        return;
      }
      
      console.log('Calling forceUpdateCheck...');
      const result = await NativeModules.UpdateModule.forceUpdateCheck();
      console.log('forceUpdateCheck result:', result);
      
      if (result.status === "updated") {
        await AsyncStorage.setItem('PRAYER_DATA_UPDATED', 'true');
        
        if (refreshPrayerTimes) {
          refreshPrayerTimes();
        } else if (global.fetchPrayerData && typeof global.fetchPrayerData === 'function') {
          global.fetchPrayerData();
        } else {
          const DevSettings = require('react-native').DevSettings;
          if (DevSettings && DevSettings.reload) {
            DevSettings.reload();
          }
        }
      }
    } catch (error) {
      console.error("Error in checkForPrayerTimeUpdates:", error);
    }
  };

  useEffect(() => {
    const initialCheck = setTimeout(() => {
      checkForUpdates();
    }, 3000); 
    
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForUpdates();
      }
    });
    
    return () => {
      clearTimeout(initialCheck);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, []);

  if (!showUpdateDialog) {
    return null;
  }

  if (updateInfo.isForcedUpdate) {
    return (
      <ForcedUpdateDialog
        visible={true}
        title={updateInfo.updateTitle}
        message={updateInfo.updateMessage}
        onUpdate={handleUpdate}
      />
    );
  } else {
    return (
      <OptionalUpdateDialog
        visible={true}
        title={updateInfo.updateTitle}
        message={updateInfo.updateMessage}
        onUpdate={handleUpdate}
        onLater={handleLater}
      />
    );
  }
};

export const checkForPrayerTimeUpdates = async (customLanguage = null) => {
  console.log('Attempting to check for prayer time updates...');
  try {
    if (!NativeModules.UpdateModule) {
      console.error('UpdateModule is not available!');
      return false;
    }
    
    console.log('Calling forceUpdateCheck...');
    const result = await NativeModules.UpdateModule.forceUpdateCheck();
    console.log('forceUpdateCheck result:', result);
    
    if (result.status === "updated") {
      await AsyncStorage.setItem('PRAYER_DATA_UPDATED', 'true');
      
      if (global.fetchPrayerData && typeof global.fetchPrayerData === 'function') {
        global.fetchPrayerData();
      } else {
        const DevSettings = require('react-native').DevSettings;
        if (DevSettings && DevSettings.reload) {
          DevSettings.reload();
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error in checkForPrayerTimeUpdates:", error);
    return false;
  }
};