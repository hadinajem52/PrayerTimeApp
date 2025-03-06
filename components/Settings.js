import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import useSettings from '../hooks/useSettings';
import { checkForPrayerTimeUpdates } from './UpdateManager'; // Import the function
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';

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
    hijriAdjustment: "Adjustment",
    daysForward: "days forward",
    daysBackward: "days backward",
    noAdjustment: "No adjustment",
    timeFormatSetting: "Time Format",
    hour24: "24-hour",
    hour12: "12-hour",
    timeFormatDescription: "Choose how prayer times are displayed (13:00 or 1:00 PM)",
    updatePrayerTimes: "Update Prayer Times",
    updating: "Updating...",
    updateDescription: "Internet connection is required to update prayer times",
    useArabicNumerals: "Use Arabic Numerals",
    disclaimer: "All prayer times according to the opinion of His Eminence Imam Khamenei",
    hijriAdjustmentDescription: "Shift the hijri date based on your marjaa",
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
    timeFormatSetting: "تنسيق الوقت",
    hour24: "٢٤ ساعة",
    hour12: "١٢ ساعة",
    timeFormatDescription: " اختر طريقة عرض أوقات الصلاة (١٣:٠٠ أو ١:٠٠ م)",
    updatePrayerTimes:  "تحقق من بيانات أوقات الصلاة الجديدة",
    updating: "جاري التحديث...",
    updateDescription: "يلزم الاتصال بالإنترنت لتحديث أوقات الصلاة",
    useArabicNumerals: "استخدام الأرقام العربية",
    disclaimer: "جميع المواقيت طبقًا لرأي سماحة الإمام الخامنئي (دام ظله)",
    hijriAdjustmentDescription: "ضبط التاريخ الهجري حسب مرجعك",
  },
};

const Settings = ({ 
  language, 
  isDarkMode, 
  toggleDarkMode, 
  toggleLanguage, 
  onClose, 
  hijriDateOffset = 0, 
  updateHijriOffset, 
  useArabicNumerals, 
  updateUseArabicNumerals 
}) => {
  const translations = TRANSLATIONS[language];
  const [settings, setSettings] = useSettings();
  const timeFormat = settings.timeFormat || '24h';
  const [isUpdating, setIsUpdating] = useState(false);
  const { displayImmediateNotification, scheduleTestNotification } = useNotificationScheduler(language);

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
      // The function itself will show an alert if data was updated
      // Add a small delay before setting isUpdating to false
      setTimeout(() => {
        setIsUpdating(false);
      }, 1500);
    } catch (error) {
      setIsUpdating(false);
      Alert.alert("Update Failed", error.message || "Could not update prayer times. Please try again later.");
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
      
      {/* Disclaimer Note */}
      <Text style={[
        styles.disclaimer,
        isDarkMode && styles.darkDisclaimer,
        language === 'ar' && styles.rtlText
      ]}>
        {translations.disclaimer}
      </Text>
      
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
          
          <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
            {translations.hijriAdjustmentDescription}
          </Text>
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

          {language === 'ar' && (
            <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
              <Text style={[styles.settingLabel, isDarkMode && styles.darkSettingLabel]}>
                {translations.useArabicNumerals}
              </Text>
              <Switch
                value={useArabicNumerals}
                onValueChange={updateUseArabicNumerals}
                trackColor={{ false: "#767577", true: isDarkMode ? "#66CCFF" : "#007AFF" }}
                thumbColor={useArabicNumerals ? (isDarkMode ? "#FFA500" : "#007AFF") : "#f4f3f4"}
              />
            </View>
          )}
        </View>

        {/* Time Format Section */}
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
              trackColor={{ false: "#767577", true: isDarkMode ? "#66CCFF" : "#007AFF" }}
              thumbColor={isDarkMode ? "#FFA500" : "#f4f3f4"}
            />
          </View>
          
          <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
            {translations.timeFormatDescription}
          </Text>
        </View>

        {/* Prayer Time Updates Section */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
            {translations.updatePrayerTimes}
          </Text>
          
          <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>

            
            <TouchableOpacity
              style={[
                styles.updateButton,
                isDarkMode && styles.darkUpdateButton,
                isUpdating && styles.disabledButton
              ]}
              onPress={handleUpdatePrayerTimes}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator 
                  size="small"
                  color={isDarkMode ? "#222" : "#fff"} 
                />
              ) : (
                <Icon
                  name="refresh"
                  size={18}
                  color={isDarkMode ? "#222" : "#fff"}
                />
              )}
              <Text style={[
                styles.updateButtonText,
                isDarkMode && styles.darkUpdateButtonText
              ]}>
                {isUpdating ? translations.updating : translations.updatePrayerTimes}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
            {translations.updateDescription}
          </Text>
        </View>

        {/* Test Notifications Section */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
            {language === 'en' ? 'Test Notifications' : 'اختبار الإشعارات'}
          </Text>
          
          <View style={styles.row}>
            <TouchableOpacity 
              style={[
                styles.button, 
                isDarkMode ? { backgroundColor: '#66CCFF' } : { backgroundColor: '#007AFF' }
              ]}
              onPress={() => {
                displayImmediateNotification()
                  .then(() => {
                    Alert.alert(
                      language === 'en' ? 'Notification Sent' : 'تم إرسال الإشعار',
                      language === 'en' ? 'Check your notification tray' : 'تحقق من لوحة الإشعارات'
                    );
                  })
                  .catch(error => console.error('Failed to display notification:', error));
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {language === 'en' ? 'Test Immediate' : 'إشعار فوري'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                isDarkMode ? { backgroundColor: '#FFA500' } : { backgroundColor: '#007AFF' },
                { marginLeft: 10 }
              ]}
              onPress={() => {
                scheduleTestNotification()
                  .then(() => {
                    Alert.alert(
                      language === 'en' ? 'Notification Scheduled' : 'تم جدولة الإشعار',
                      language === 'en' ? 'A notification will appear in 10 seconds' : 'سيظهر إشعار خلال ١٠ ثوانٍ'
                    );
                  })
                  .catch(error => console.error('Failed to schedule notification:', error));
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {language === 'en' ? 'Test in 10s' : 'إشعار بعد ١٠ ثوانٍ'}
              </Text>
            </TouchableOpacity>
          </View>
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
  
  // Add the missing description styles
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
    backgroundColor: '#007AFF',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkUpdateButton: {
    backgroundColor: '#FFA500',
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
});

export default Settings;
