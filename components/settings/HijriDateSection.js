import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const HijriDateSection = ({
  settings,
  translations,
  isDarkMode,
  language,
  styles,
  hijriDateOffset,
  updateHijriOffset,
  renderHijriOffsetText,
  useArabicNumerals,
  updateUseArabicNumerals,
  timeFormat,
  toggleTimeFormat,
}) => {
  return (
    <>
      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          {translations.hijriDate}
        </Text>

        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
            {translations.hijriAdjustment}
          </Text>
          <View style={styles.adjustmentContainer}>
            <TouchableOpacity
              style={[styles.adjustButton, isDarkMode && styles.darkAdjustButton]}
              onPress={() => updateHijriOffset(hijriDateOffset - 1)}
            >
              <Icon
                name="remove-outline"
                size={22}
                color={isDarkMode ? '#D4AF37' : '#059669'}
              />
            </TouchableOpacity>

            <Text style={[styles.offsetValue, isDarkMode && styles.darkOffsetValue]}>
              {renderHijriOffsetText()}
            </Text>

            <TouchableOpacity
              style={[styles.adjustButton, isDarkMode && styles.darkAdjustButton]}
              onPress={() => updateHijriOffset(hijriDateOffset + 1)}
            >
              <Icon
                name="add-outline"
                size={22}
                color={isDarkMode ? '#D4AF37' : '#059669'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
          {translations.hijriAdjustmentDescription}
        </Text>

        {language === 'ar' && (
          <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
            <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
              {translations.useArabicNumerals}
            </Text>
            <Switch
              value={useArabicNumerals}
              onValueChange={updateUseArabicNumerals}
              trackColor={{ false: '#767577', true: isDarkMode ? '#D4AF37' : '#059669' }}
              thumbColor={useArabicNumerals ? (isDarkMode ? '#D4AF37' : '#059669') : '#f4f3f4'}
            />
          </View>
        )}
      </View>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          {translations.timeFormatSetting}
        </Text>

        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
            {timeFormat === '24h' ? translations.hour24 : translations.hour12}
          </Text>
          <Switch
            value={timeFormat === '12h'}
            onValueChange={toggleTimeFormat}
            trackColor={{ false: '#767577', true: isDarkMode ? '#D4AF37' : '#059669' }}
            thumbColor={isDarkMode ? '#D4AF37' : '#f4f3f4'}
          />
        </View>

        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
          {translations.timeFormatDescription}
        </Text>
      </View>
    </>
  );
};

export default HijriDateSection;
