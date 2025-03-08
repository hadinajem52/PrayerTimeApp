import { getApp, initializeApp } from '@react-native-firebase/app';
import { getRemoteConfig, getValue, fetchAndActivate, setDefaults } from '@react-native-firebase/remote-config';
import { Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import VersionCheck from 'react-native-version-check';

class UpdateService {
  constructor() {
    this.remoteConfig = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      try {
        this.app = getApp();
      } catch (e) {
        this.app = initializeApp();
      }
      
      this.remoteConfig = getRemoteConfig(this.app);
      
      await setDefaults(this.remoteConfig, {
        minimum_version_code: '0',
        latest_version_code: '0',
        update_title: 'Update Available',
        update_message: 'A new version is available. Please update to continue using the app.',
        is_update_critical: false
      });
      
      await fetchAndActivate(this.remoteConfig);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize remote config:', error);
    }
  }

  async checkForUpdates() {
    await this.initialize();
    
    try {
      const currentVersion = parseInt(DeviceInfo.getBuildNumber(), 10);
      const minimumVersion = parseInt(getValue(this.remoteConfig, 'minimum_version_code').asString(), 10);
      const latestVersion = parseInt(getValue(this.remoteConfig, 'latest_version_code').asString(), 10);
      const isCritical = getValue(this.remoteConfig, 'is_update_critical').asBoolean();
      
      return {
        currentVersion,
        minimumVersion,
        latestVersion,
        updateTitle: getValue(this.remoteConfig, 'update_title').asString(),
        updateMessage: getValue(this.remoteConfig, 'update_message').asString(),
        needsUpdate: currentVersion < latestVersion,
        isForcedUpdate: currentVersion < minimumVersion || isCritical,
        storeUrl: await VersionCheck.getStoreUrl()
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { needsUpdate: false, isForcedUpdate: false };
    }
  }

  openStore(url) {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.error("Can't open store URL:", url);
      }
    });
  }
}

export default new UpdateService();