import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AppearanceSection = ({
  settings,
  translations,
  isDarkMode,
  language,
  styles,
  toggleDarkMode,
  toggleLanguage,
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
        {translations.general}
      </Text>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          {translations.appearance}
        </Text>

        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
            {translations.darkMode}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#143d66' }}
            thumbColor={isDarkMode ? '#D4AF37' : '#059669'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>

      <View style={[styles.section, isDarkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          {translations.language}
        </Text>

        <TouchableOpacity
          style={[
            styles.languageOption,
            language === 'en' && styles.selectedOption,
            isDarkMode && styles.darkLanguageOption,
            language === 'en' && isDarkMode && styles.darkSelectedOption,
          ]}
          onPress={() => language !== 'en' && toggleLanguage()}
        >
          <Text style={[
            styles.languageText,
            isDarkMode && styles.darkLanguageText,
            language === 'en' && styles.selectedLanguageText,
            language === 'en' && isDarkMode && styles.darkSelectedLanguageText,
          ]}
          >
            {translations.english}
          </Text>
          {language === 'en' && (
            <Icon
              name="checkmark"
              size={20}
              color={isDarkMode ? '#D4AF37' : '#059669'}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.languageOption,
            language === 'ar' && styles.selectedOption,
            isDarkMode && styles.darkLanguageOption,
            language === 'ar' && isDarkMode && styles.darkSelectedOption,
          ]}
          onPress={() => language !== 'ar' && toggleLanguage()}
        >
          <Text style={[
            styles.languageText,
            isDarkMode && styles.darkLanguageText,
            language === 'ar' && styles.selectedLanguageText,
            language === 'ar' && isDarkMode && styles.darkSelectedLanguageText,
          ]}
          >
            {translations.arabic}
          </Text>
          {language === 'ar' && (
            <Icon
              name="checkmark"
              size={20}
              color={isDarkMode ? '#D4AF37' : '#059669'}
            />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

export default AppearanceSection;
