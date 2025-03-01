import remoteConfig from '@react-native-firebase/remote-config';
import { Platform, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import VersionCheck from 'react-native-version-check';

class UpdateService {
  constructor() {
    this.remoteConfig = remoteConfig();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Set default values
      await this.remoteConfig.setDefaults({
        minimum_version_code: '0',
        latest_version_code: '0',
        update_title: 'Update Available',
        update_message: 'A new version is available. Please update to continue using the app.',
        is_update_critical: false
      });
      
      // Fetch and activate
      await this.remoteConfig.fetchAndActivate();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize remote config:', error);
    }
  }

  async checkForUpdates() {
    await this.initialize();
    
    try {
      const currentVersion = parseInt(DeviceInfo.getBuildNumber(), 10);
      const minimumVersion = parseInt(this.remoteConfig.getValue('minimum_version_code').asString(), 10);
      const latestVersion = parseInt(this.remoteConfig.getValue('latest_version_code').asString(), 10);
      const isCritical = this.remoteConfig.getValue('is_update_critical').asBoolean();
      
      return {
        currentVersion,
        minimumVersion,
        latestVersion,
        updateTitle: this.remoteConfig.getValue('update_title').asString(),
        updateMessage: this.remoteConfig.getValue('update_message').asString(),
        needsUpdate: currentVersion < latestVersion,
        isForcedUpdate: currentVersion < minimumVersion || isCritical,
        storeUrl: await VersionCheck.getStoreUrl({ appID: Platform.OS === 'ios' ? 'YOUR_IOS_APP_ID' : undefined })
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