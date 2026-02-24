import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const UpdatesSection = ({
  settings,
  translations,
  isDarkMode,
  language,
  styles,
  isUpdating,
  onUpdatePrayerTimes,
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
        {translations.updates}
      </Text>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          {translations.updatePrayerTimes}
        </Text>

        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <TouchableOpacity
            style={[
              styles.updateButton,
              isDarkMode && styles.darkUpdateButton,
              isUpdating && styles.disabledButton,
            ]}
            onPress={onUpdatePrayerTimes}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator
                size="small"
                color={isDarkMode ? '#222' : '#fff'}
              />
            ) : (
              <Icon
                name="refresh"
                size={18}
                color={isDarkMode ? '#222' : '#fff'}
              />
            )}
            <Text style={[
              styles.updateButtonText,
              isDarkMode && styles.darkUpdateButtonText,
            ]}
            >
              {isUpdating ? translations.updating : translations.updatePrayerTimes}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
          {translations.updateDescription}
        </Text>
      </View>
    </>
  );
};

export default UpdatesSection;
