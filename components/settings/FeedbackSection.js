import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const FeedbackSection = ({
  settings,
  translations,
  isDarkMode,
  language,
  styles,
  onRateApp,
  appVersion,
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
        {translations.feedback}
      </Text>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          {translations.rateApp}
        </Text>

        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
            {translations.rateDescription}
          </Text>
          <TouchableOpacity
            style={[
              styles.rateButton,
              isDarkMode && styles.darkRateButton,
            ]}
            onPress={onRateApp}
          >
            <Icon
              name="star-outline"
              size={22}
              color={isDarkMode ? '#D4AF37' : '#059669'}
            />
            <Text style={[
              styles.rateButtonText,
              isDarkMode && styles.darkRateButtonText,
            ]}
            >
              {translations.rateApp}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.appVersionText, isDarkMode && styles.darkAppVersionText]}>
          v{appVersion}
        </Text>
      </View>
    </>
  );
};

export default FeedbackSection;
