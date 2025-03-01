import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';

const TRANSLATIONS = {
  en: {
    settings: "Settings",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    language: "Language",
    english: "English",
    arabic: "Arabic",
    back: "Back",
    hijriDate: "Hijri Date",
    hijriAdjustment: "Date Adjustment",
    daysForward: "days forward",
    daysBackward: "days backward",
    noAdjustment: "No adjustment",
  },
  ar: {
    settings: "الإعدادات",
    appearance: "المظهر",
    darkMode: "الوضع المظلم",
    language: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    back: "رجوع",
    hijriDate: "التاريخ الهجري",
    hijriAdjustment: "تعديل التاريخ",
    daysForward: "أيام للأمام",
    daysBackward: "أيام للخلف",
    noAdjustment: "لا تعديل",
  },
};

const Settings = ({ language, isDarkMode, toggleDarkMode, toggleLanguage, onClose, hijriDateOffset = 0, updateHijriOffset }) => {
  const translations = TRANSLATIONS[language];

  const renderHijriOffsetText = () => {
    if (hijriDateOffset === 0) {
      return translations.noAdjustment;
    } else if (hijriDateOffset > 0) {
      return `${hijriDateOffset} ${translations.daysForward}`;
    } else {
      return `${Math.abs(hijriDateOffset)} ${translations.daysBackward}`;
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
            color={isDarkMode ? "#FFA500" : "#007AFF"} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkHeaderTitle]}>
          {translations.settings}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Appearance Section */}
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
              trackColor={{ false: "#767577", true: "#143d66" }}
              thumbColor={isDarkMode ? "#FFA500" : "#007AFF"}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>
        
        {/* Hijri Date Adjustment Section */}
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
                  color={isDarkMode ? "#FFA500" : "#007AFF"} 
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
                  color={isDarkMode ? "#FFA500" : "#007AFF"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Language Section */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
            {translations.language}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'en' && styles.selectedOption,
              isDarkMode && styles.darkLanguageOption,
              language === 'en' && isDarkMode && styles.darkSelectedOption
            ]}
            onPress={() => language !== 'en' && toggleLanguage()}
          >
            <Text style={[
              styles.languageText,
              isDarkMode && styles.darkLanguageText,
              language === 'en' && styles.selectedLanguageText,
              language === 'en' && isDarkMode && styles.darkSelectedLanguageText
            ]}>
              {translations.english}
            </Text>
            {language === 'en' && (
              <Icon 
                name="checkmark" 
                size={20} 
                color={isDarkMode ? "#FFA500" : "#007AFF"} 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'ar' && styles.selectedOption,
              isDarkMode && styles.darkLanguageOption,
              language === 'ar' && isDarkMode && styles.darkSelectedOption
            ]}
            onPress={() => language !== 'ar' && toggleLanguage()}
          >
            <Text style={[
              styles.languageText,
              isDarkMode && styles.darkLanguageText,
              language === 'ar' && styles.selectedLanguageText,
              language === 'ar' && isDarkMode && styles.darkSelectedLanguageText
            ]}>
              {translations.arabic}
            </Text>
            {language === 'ar' && (
              <Icon 
                name="checkmark" 
                size={20} 
                color={isDarkMode ? "#FFA500" : "#007AFF"} 
              />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  darkSection: {
    backgroundColor: '#222',
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
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  darkSelectedOption: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
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
    color: '#007AFF',
  },
  darkSelectedLanguageText: {
    color: '#FFA500',
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
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  darkAdjustButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  offsetValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    paddingHorizontal: 10,
    width: 120, // Fixed width instead of minWidth
    textAlign: 'center',
    color: '#333',
    alignSelf: 'center', // Ensure vertical alignment
  },
  darkOffsetValue: {
    color: '#fff',
  },
});

export default Settings;
