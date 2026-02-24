import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  darkHeaderTitle: {
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  mainTitle: {
    marginTop: 12,
    marginBottom: 4,
    marginHorizontal: 16,
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
    textTransform: 'none',
  },
  darkMainTitle: {
    color: '#D4AF37',
  },
  rtlTitle: {
    textAlign: 'right',
    // Swap horizontal margin emphasis to feel aligned with the edge in RTL
    marginLeft: 16,
    marginRight: 16,
  },
  darkSection: {
    backgroundColor: '#0F172A',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    color: '#333',
  },
  darkSectionTitle: {
    color: '#fff',
    borderBottomColor: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  darkSettingItem: {
    borderTopColor: '#333',
  },
  settingLabel: {
    fontSize: moderateScale(16),
    color: '#333',
  },
  darkSettingLabel: {
    color: '#fff',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  darkLanguageOption: {
    borderTopColor: '#333',
  },
  selectedOption: {
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
  },
  darkSelectedOption: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  languageText: {
    fontSize: moderateScale(16),
    color: '#333',
  },
  darkLanguageText: {
    color: '#fff',
  },
  selectedLanguageText: {
    fontWeight: '600',
    color: '#059669',
  },
  darkSelectedLanguageText: {
    color: '#D4AF37',
  },
  adjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  darkAdjustButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  offsetValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    paddingHorizontal: 10,
    width: 120, 
    textAlign: 'center',
    color: '#333',
    alignSelf: 'center',
  },
  darkOffsetValue: {
    color: '#fff',
  },
  
  description: {
    fontSize: moderateScale(13),
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    fontStyle: 'italic',
  },
  darkDescription: {
    color: '#aaa',
  },
  updateButton: {
    backgroundColor: '#059669',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkUpdateButton: {
    backgroundColor: '#D4AF37',
  },
  disabledButton: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: moderateScale(14),
  },
  darkUpdateButtonText: {
    color: '#222',
  },
  disclaimer: {
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: moderateScale(14),
    color: '#666',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkDisclaimer: {
    color: '#aaa',
    borderBottomColor: '#333',
  },
  rtlText: {
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  darkRateButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  rateButtonText: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#059669',
  },
  darkRateButtonText: {
    color: '#D4AF37',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  darkTestButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#4CAF50',
  },
  darkTestButtonText: {
    color: '#66BB6A',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  darkPermissionButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  permissionButtonText: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#059669',
  },
  darkPermissionButtonText: {
    color: '#D4AF37',
  },
  permissionStatus: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    marginTop: 4,
  },
  grantedStatus: {
    color: '#4CAF50',
  },
  disabledStatus: {
    color: '#888',
  },
  appVersionText: {
    fontSize: moderateScale(12),
    color: '#888',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  darkAppVersionText: {
    color: '#aaa',
  },
});

export default Settings;
