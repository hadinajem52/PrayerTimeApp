import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import useSettings from '../hooks/useSettings';
import { checkForPrayerTimeUpdates } from './UpdateManager'; 
import RatingModal from './RatingModal';
import notifee from '@notifee/react-native';
import DeviceInfo from 'react-native-device-info';
import * as IntentLauncher from 'expo-intent-launcher';
import WidgetManager from '../utils/WidgetManager';
import { TRANSLATIONS } from '../constants/translations/settings';
import AppearanceSection from './settings/AppearanceSection';
import NotificationsSection from './settings/NotificationsSection';
import HijriDateSection from './settings/HijriDateSection';
import UpdatesSection from './settings/UpdatesSection';
import FeedbackSection from './settings/FeedbackSection';
import styles from '../styles/settingsStyles';

const Settings = ({ 
  language, 
  isDarkMode, 
  toggleDarkMode, 
  toggleLanguage, 
  onClose, 
  hijriDateOffset = 0, 
  updateHijriOffset, 
  useArabicNumerals, 
  updateUseArabicNumerals,
  requestAlarmPermission,
  usePrayerSound,
  updateUsePrayerSound
}) => {
  const translations = TRANSLATIONS[language];
  const [settings, setSettings] = useSettings();
  const timeFormat = settings.timeFormat || '24h';
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [alarmPermissionGranted, setAlarmPermissionGranted] = useState(false);
  const [isBatteryOptimizationEnabled, setIsBatteryOptimizationEnabled] = useState(true);
  const appVersion = `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;

  const renderHijriOffsetText = () => {
    if (hijriDateOffset === 0) {
      return translations.noAdjustment;
    } else if (hijriDateOffset > 0) {
      return `${hijriDateOffset} ${translations.daysForward}`;
    } else {
      return `${Math.abs(hijriDateOffset)} ${translations.daysBackward}`;
    }
  };
  
  const toggleTimeFormat = () => {
    setSettings(prev => ({
      ...prev,
      timeFormat: prev.timeFormat === '24h' ? '12h' : '24h'
    }));
  };

  const handleUpdatePrayerTimes = async () => {
    setIsUpdating(true);
    try {
      await checkForPrayerTimeUpdates();

      setTimeout(() => {
        setIsUpdating(false);
      }, 1500);
    } catch (error) {
      setIsUpdating(false);
      Alert.alert("Update Failed", error.message || "Could not update prayer times. Please try again later.");
    }
  };

  const handleRateApp = () => {
    setIsRatingModalVisible(true);
  };

  // Check alarm permission status
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const settings = await notifee.getNotificationSettings();
          setAlarmPermissionGranted(settings.android.alarm === 1); // 1 is 'granted'

          const isEnabled = await notifee.isBatteryOptimizationEnabled();
          setIsBatteryOptimizationEnabled(isEnabled);
        } catch (error) {
          console.error('Error checking permissions:', error);
        }
      }
    };
    
    checkPermissions();
  }, []);

  // Update widget when relevant settings change
  useEffect(() => {
    if (settings.isSettingsLoaded) {
      WidgetManager.updateWidget();
    }
  }, [
    settings.timeFormat, 
    useArabicNumerals, 
    settings.selectedLocation, 
    settings.isSettingsLoaded
  ]);

  const handleRequestAlarmPermission = async () => {
    if (requestAlarmPermission) {
      await requestAlarmPermission();
      // Recheck permission status after user returns
      setTimeout(async () => {
        if (Platform.OS === 'android') {
          try {
            const settings = await notifee.getNotificationSettings();
            setAlarmPermissionGranted(settings.android.alarm === 1);
          } catch (error) {
            console.error('Error rechecking alarm permission:', error);
          }
        }
      }, 1000);
    }
  };

  const handleDisableBatteryOptimization = async () => {
    if (Platform.OS !== 'android') return;
  
    const packageName = DeviceInfo.getBundleId();
  
    try {
        await IntentLauncher.startActivityAsync(
          'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
          {
            data: `package:${packageName}`,
          }
        );
    } catch (error) {
      console.error('Error opening battery optimization settings:', error);
      // Fallback to the general settings if the specific intent fails
      try {
        await notifee.openBatteryOptimizationSettings();
      } catch (e) {
        console.error('Error opening battery optimization settings fallback:', e);
        Alert.alert(
          translations.batteryOptimization,
          'Unable to open settings automatically. Please go to your device settings to disable battery optimization for this app.',
          [{ text: translations.ok, style: 'default' }]
        );
      }
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      isDarkMode && styles.darkContainer
    ]}>
      <StatusBar translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.backButton}
        >
          <Icon 
            name={language === 'ar' ? "arrow-forward" : "arrow-back"} 
            size={24} 
            color={isDarkMode ? "#D4AF37" : "#059669"} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkHeaderTitle]}>
          {translations.settings}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Disclaimer Note */}
      <Text style={[
        styles.disclaimer,
        isDarkMode && styles.darkDisclaimer,
        language === 'ar' && styles.rtlText
      ]}>
        {translations.disclaimer}
      </Text>
      
      <ScrollView style={styles.scrollView}>
        <NotificationsSection
          settings={settings}
          translations={translations}
          isDarkMode={isDarkMode}
          language={language}
          styles={styles}
          usePrayerSound={usePrayerSound}
          updateUsePrayerSound={updateUsePrayerSound}
          alarmPermissionGranted={alarmPermissionGranted}
          onRequestAlarmPermission={handleRequestAlarmPermission}
          isBatteryOptimizationEnabled={isBatteryOptimizationEnabled}
          onDisableBatteryOptimization={handleDisableBatteryOptimization}
        />

        <AppearanceSection
          settings={settings}
          translations={translations}
          isDarkMode={isDarkMode}
          language={language}
          styles={styles}
          toggleDarkMode={toggleDarkMode}
          toggleLanguage={toggleLanguage}
        />

        <HijriDateSection
          settings={settings}
          translations={translations}
          isDarkMode={isDarkMode}
          language={language}
          styles={styles}
          hijriDateOffset={hijriDateOffset}
          updateHijriOffset={updateHijriOffset}
          renderHijriOffsetText={renderHijriOffsetText}
          useArabicNumerals={useArabicNumerals}
          updateUseArabicNumerals={updateUseArabicNumerals}
          timeFormat={timeFormat}
          toggleTimeFormat={toggleTimeFormat}
        />

        <UpdatesSection
          settings={settings}
          translations={translations}
          isDarkMode={isDarkMode}
          language={language}
          styles={styles}
          isUpdating={isUpdating}
          onUpdatePrayerTimes={handleUpdatePrayerTimes}
        />

        <FeedbackSection
          settings={settings}
          translations={translations}
          isDarkMode={isDarkMode}
          language={language}
          styles={styles}
          onRateApp={handleRateApp}
          appVersion={appVersion}
        />
      </ScrollView>

      {/* Rating Modal */}
      <RatingModal 
        visible={isRatingModalVisible}
        language={language}
        isDarkMode={isDarkMode}
        onClose={() => setIsRatingModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default Settings;
