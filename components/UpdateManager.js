import React, { useEffect, useState } from 'react';
import { AppState, NativeModules, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UpdateService from '../services/UpdateService';
import { ForcedUpdateDialog, OptionalUpdateDialog } from './UpdateDialog';

console.log('UpdateManager initialized');

const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
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

  const checkForUpdates = async (force = false) => {
    try {
      // Check if we should perform an update check
      const lastCheck = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
      const now = Date.now();
      
      if (!force && lastCheck && now - parseInt(lastCheck) < UPDATE_CHECK_INTERVAL) {
        console.log('Skipping update check, last check was recent');
        return;
      }
      
      // Save current check time
      await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, now.toString());
      
      // Check for updates
      const updateData = await UpdateService.checkForUpdates();
      
      if (updateData.needsUpdate) {
        // If it's a forced update, always show the dialog
        if (updateData.isForcedUpdate) {
          setUpdateInfo(updateData);
          setShowUpdateDialog(true);
          return;
        }
        
        // For optional updates, check if user has postponed this version
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
    // Save the postponed version
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
      const hasUpdate = await NativeModules.UpdateModule.forceUpdateCheck();
      console.log('forceUpdateCheck result:', hasUpdate);
      
      if (hasUpdate) {
        // Store a flag indicating data was updated
        await AsyncStorage.setItem('PRAYER_DATA_UPDATED', 'true');
        
        Alert.alert(
          "Prayer Times Updated", 
          "New prayer times data has been downloaded. The app will now refresh.",
          [{ 
            text: "OK",
            onPress: () => {
              // Implement proper refresh mechanism
              if (global.fetchPrayerData && typeof global.fetchPrayerData === 'function') {
                global.fetchPrayerData();
              } else {
                // If no global refresh function, use RN's DevSettings to reload
                const DevSettings = require('react-native').DevSettings;
                if (DevSettings && DevSettings.reload) {
                  DevSettings.reload();
                }
              }
            }
          }]
        );
      }
    } catch (error) {
      console.error("Error in checkForPrayerTimeUpdates:", error);
    }
  };

  useEffect(() => {
    // First effect with timeout and AppState
    const initialCheck = setTimeout(() => {
      checkForUpdates();
    }, 3000); // Delay initial check by 3 seconds to not interfere with app startup
    
    // Set up AppState listener to check for updates when app comes to foreground
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
    // Only run update check once at startup
    checkForUpdates();
    // Don't call checkForPrayerTimeUpdates() here
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