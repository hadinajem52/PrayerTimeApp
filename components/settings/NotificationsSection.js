import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AdhanPicker from './AdhanPicker';
import { getAdhanVoiceName } from '../../constants/adhanConfig';

const NotificationsSection = ({
  settings,
  translations,
  isDarkMode,
  language,
  styles,
  usePrayerSound,
  updateUsePrayerSound,
  adhanVoice,
  updateAdhanVoice,
  adhanFullVersion,
  updateAdhanFullVersion,
  alarmPermissionGranted,
  onRequestAlarmPermission,
  isBatteryOptimizationEnabled,
  onDisableBatteryOptimization,
}) => {
  const [isVoicePickerVisible, setIsVoicePickerVisible] = useState(false);
  const isRTL = language === 'ar';
  const switchTrack = { false: '#767577', true: isDarkMode ? '#D4AF37' : '#059669' };
  const thumb = (on) => (on ? (isDarkMode ? '#D4AF37' : '#059669') : '#f4f3f4');

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
            trackColor={switchTrack}
            thumbColor={thumb(usePrayerSound)}
          />
        </View>

        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
          {translations.prayerSoundDescription}
        </Text>

        {/* Voice + length only mean anything while the adhan is switched on. */}
        {usePrayerSound && (
          <>
            <TouchableOpacity
              style={[
                styles.adhanDropdown,
                isDarkMode && styles.darkAdhanDropdown,
                isRTL && styles.adhanDropdownRTL,
              ]}
              onPress={() => setIsVoicePickerVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.adhanDropdownLabels}>
                <Text
                  style={[
                    styles.settingLabel,
                    isDarkMode && styles.darkSettingLabel,
                    isRTL && styles.rtlText,
                  ]}
                >
                  {translations.adhanVoiceSetting}
                </Text>
                <Text
                  style={[
                    styles.adhanDropdownValue,
                    isDarkMode && styles.darkAdhanDropdownValue,
                    isRTL && styles.rtlText,
                  ]}
                  numberOfLines={2}
                >
                  {getAdhanVoiceName(adhanVoice, language)}
                </Text>
              </View>
              <Icon
                name="chevron-down"
                size={20}
                color={isDarkMode ? '#D4AF37' : '#059669'}
              />
            </TouchableOpacity>

            <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
              <Text
                style={[
                  styles.settingLabel,
                  isDarkMode && styles.darkSettingLabel,
                  isRTL && styles.rtlText,
                ]}
              >
                {translations.adhanFullVersionSetting}
              </Text>
              <Switch
                value={adhanFullVersion}
                onValueChange={updateAdhanFullVersion}
                trackColor={switchTrack}
                thumbColor={thumb(adhanFullVersion)}
              />
            </View>

            <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
              {translations.adhanFullVersionDescription}
            </Text>
          </>
        )}
      </View>

      <AdhanPicker
        visible={isVoicePickerVisible}
        onClose={() => setIsVoicePickerVisible(false)}
        selectedVoice={adhanVoice}
        onSelectVoice={updateAdhanVoice}
        useFullVersion={adhanFullVersion}
        translations={translations}
        isDarkMode={isDarkMode}
        language={language}
        styles={styles}
      />

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
