import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationsSection = ({
  settings,
  translations,
  isDarkMode,
  language,
  styles,
  usePrayerSound,
  updateUsePrayerSound,
  alarmPermissionGranted,
  onRequestAlarmPermission,
  isBatteryOptimizationEnabled,
  onDisableBatteryOptimization,
}) => {
  return (
    <>
      <Text
        style={[
          styles.mainTitle,
          isDarkMode && styles.darkMainTitle,
          language === 'ar' && styles.rtlTitle,
        ]}
      >
        {translations.notifications}
      </Text>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          {translations.notificationSound}
        </Text>

        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
            {translations.prayerSoundSetting}
          </Text>
          <Switch
            value={usePrayerSound}
            onValueChange={updateUsePrayerSound}
            trackColor={{ false: '#767577', true: isDarkMode ? '#D4AF37' : '#059669' }}
            thumbColor={usePrayerSound ? (isDarkMode ? '#D4AF37' : '#059669') : '#f4f3f4'}
          />
        </View>

        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
          {translations.prayerSoundDescription}
        </Text>
      </View>

      {Platform.OS === 'android' && (
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
            {translations.alarmPermission}
          </Text>

          <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
                {translations.alarmPermissionSetting}
              </Text>
              {alarmPermissionGranted && (
                <Text style={[styles.permissionStatus, styles.grantedStatus]}>
                  ✓ Granted
                </Text>
              )}
            </View>

            {!alarmPermissionGranted && (
              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  isDarkMode && styles.darkPermissionButton,
                ]}
                onPress={onRequestAlarmPermission}
              >
                <Icon
                  name="alarm-outline"
                  size={18}
                  color={isDarkMode ? '#D4AF37' : '#059669'}
                />
                <Text style={[
                  styles.permissionButtonText,
                  isDarkMode && styles.darkPermissionButtonText,
                ]}
                >
                  Grant
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
            {translations.alarmPermissionSettingDescription}
          </Text>
        </View>
      )}

      {Platform.OS === 'android' && (
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
            {translations.batteryOptimization}
          </Text>

          <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
                {translations.batteryOptimizationSetting}
              </Text>
              {!isBatteryOptimizationEnabled && (
                <Text style={[styles.permissionStatus, styles.disabledStatus]}>
                  ✓ {translations.batteryOptimizationDisabled}
                </Text>
              )}
            </View>

            {isBatteryOptimizationEnabled && (
              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  isDarkMode && styles.darkPermissionButton,
                ]}
                onPress={onDisableBatteryOptimization}
              >
                <Icon
                  name="battery-charging-outline"
                  size={18}
                  color={isDarkMode ? '#D4AF37' : '#059669'}
                />
                <Text style={[
                  styles.permissionButtonText,
                  isDarkMode && styles.darkPermissionButtonText,
                ]}
                >
                  {translations.openSettings}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
            {translations.batteryOptimizationSettingDescription}
          </Text>
        </View>
      )}
    </>
  );
};

export default NotificationsSection;
