import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment-hijri';
import { checkForPrayerTimeUpdates } from './UpdateManager';

const TRANSLATIONS = {
  en: {
    title: "Preparing New Month's Data",
    description: "We're currently preparing prayer times for the new month. The latest available prayer times are being shown while we update our data.",
    currentMonth: "Current Month:",
    nextMonth: "Coming Month:",
    expectedUpdate: "Update expected soon",
    stayTuned: "Stay tuned!",
    updateButton: "Update Prayer Times",
    updating: "Updating...",
    testButton: "Show Month Transition Notice",
    restartNote: "Please close and reopen the app after updating."
  },
  ar: {
    title: "جاري إعداد بيانات الشهر الجديد",
    description: "نحن نقوم حاليًا بإعداد أوقات الصلاة للشهر الجديد. يتم عرض آخر أوقات صلاة متاحة بينما نقوم بتحديث بياناتنا.",
    currentMonth: "الشهر الحالي:",
    nextMonth: "الشهر القادم:",
    expectedUpdate: "التحديث متوقع قريبًا",
    stayTuned: "ترقبوا!",
    updateButton: "تحديث أوقات الصلاة",
    updating: "جاري التحديث...",
    testButton: "عرض إشعار انتقال الشهر",
    restartNote: "يرجى إغلاق التطبيق وإعادة فتحه بعد التحديث."
  }
};

const ARABIC_MONTHS = [
  "كانون ٢", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين ١", "تشرين ٢", "كانون ١"
];


const MonthTransitionNotice = ({ language, isDarkMode, onUpdatePrayerTimes}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const currentMonth = moment().format('MMMM');
  const nextMonth = moment().add(1, 'months').format('MMMM');
  
  const currentMonthIndex = moment().month();
  const nextMonthIndex = (currentMonthIndex + 1) % 12;
  const currentMonthArabic = ARABIC_MONTHS[currentMonthIndex];
  const nextMonthArabic = ARABIC_MONTHS[nextMonthIndex];
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleUpdatePrayerTimes = async () => {
    setIsUpdating(true);
    try {
      await checkForPrayerTimeUpdates();

      setTimeout(() => {
        setIsUpdating(false);
        if (onUpdatePrayerTimes) {
          onUpdatePrayerTimes();
        }
      }, 1500);
    } catch (error) {
      setIsUpdating(false);
      Alert.alert("Update Failed", error.message || "Could not update prayer times. Please try again later.");
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      
      <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
        {t.title}
      </Text>

      <View style={styles.animationContainer}>
        <View style={styles.sunContainer}>
          <FontAwesome5 
            name="sun" 
            size={40} 
            color={isDarkMode ? "#FFA500" : "#FFA500"} 
            solid
          />
        </View>
        
        <View style={styles.moonContainer}>
          <Icon 
            name="moon-waning-crescent" 
            size={35} 
            color={isDarkMode ? "#E0E0E0" : "#888888"} 
          />
        </View>
        
        <View style={styles.cloudContainer}>
          <Icon 
            name="cloud" 
            size={30} 
            color={isDarkMode ? "#CCCCCC" : "#BBBBBB"} 
          />
        </View>
      </View>

      <Text style={[styles.description, isDarkMode && styles.darkDescription]}>
        {t.description}
      </Text>

      <View style={styles.monthsContainer}>
        <View style={styles.monthRow}>
          <Text style={[styles.monthLabel, isDarkMode && styles.darkMonthLabel]}>
            {t.currentMonth}
          </Text>
          <Text style={[styles.monthValue, isDarkMode && styles.darkMonthValue]}>
            {language === 'ar' ? currentMonthArabic : currentMonth}
          </Text>
        </View>
        
        <View style={styles.monthRow}>
          <Text style={[styles.monthLabel, isDarkMode && styles.darkMonthLabel]}>
            {t.nextMonth}
          </Text>
          <Text style={[styles.monthValue, isDarkMode && styles.darkMonthValue]}>
            {language === 'ar' ? nextMonthArabic : nextMonth}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <Text style={[styles.updateText, isDarkMode && styles.darkUpdateText]}>
        {t.expectedUpdate}
      </Text>
      
      <Text style={[styles.stayTuned, isDarkMode && styles.darkStayTuned]}>
        {t.stayTuned}
      </Text>

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
            color={isDarkMode ? "#1a1a1a" : "#FFFFFF"} 
          />
        ) : (
          <Icon 
            name="refresh" 
            size={moderateScale(20)} 
            color={isDarkMode ? "#1a1a1a" : "#FFFFFF"} 
          />
        )}
        <Text style={[styles.updateButtonText, isDarkMode && styles.darkUpdateButtonText]}>
          {isUpdating ? t.updating : t.updateButton}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.restartNote, isDarkMode && styles.darkRestartNote]}>
        {t.restartNote}
      </Text>
    </View>
  );
};

const MonthTransitionModal = ({ visible, language, isDarkMode, onUpdatePrayerTimes, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <MonthTransitionNotice 
            language={language}
            isDarkMode={isDarkMode}
            onUpdatePrayerTimes={onUpdatePrayerTimes}
          />
        </View>
      </View>
    </Modal>
  );
};



const styles = StyleSheet.create({
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContainer: {
    width: '100%',
    maxWidth: moderateScale(400),
  },
  
  // Test button styles
  testButtonContainer: {
    padding: moderateScale(20),
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkTestButton: {
    backgroundColor: '#FFA500',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  darkTestButtonText: {
    color: '#1a1a1a',
  },
  
  // Update button styles
  updateButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(25),
    marginTop: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  darkUpdateButton: {
    backgroundColor: '#FFA500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: moderateScale(8),
  },
  darkUpdateButtonText: {
    color: '#1a1a1a',
  },
  
  // Existing container styles
  container: {
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: moderateScale(15),
    position: 'relative',  
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    marginBottom: moderateScale(20),
    color: '#333',
    textAlign: 'center',
  },
  darkTitle: {
    color: '#FFA500',
  },
  animationContainer: {
    height: moderateScale(100),
    width: '100%',
    position: 'relative',
    marginBottom: moderateScale(20),
  },
  sunContainer: {
    position: 'absolute',
    left: moderateScale(30),
    top: moderateScale(20),
  },
  moonContainer: {
    position: 'absolute',
    right: moderateScale(60),
    top: moderateScale(15),
  },
  cloudContainer: {
    position: 'absolute',
    right: moderateScale(40),
    bottom: moderateScale(20),
  },
  description: {
    fontSize: moderateScale(16),
    color: '#555',
    textAlign: 'center',
    marginBottom: moderateScale(20),
    lineHeight: moderateScale(22),
  },
  darkDescription: {
    color: '#DDD',
  },
  monthsContainer: {
    width: '100%',
    marginBottom: moderateScale(20),
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  monthLabel: {
    fontSize: moderateScale(15),
    color: '#555',
    fontWeight: '500',
  },
  darkMonthLabel: {
    color: '#AAA',
  },
  monthValue: {
    fontSize: moderateScale(15),
    color: '#007AFF',
    fontWeight: 'bold',
  },
  darkMonthValue: {
    color: '#66CCFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  progressDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#007AFF',
    marginHorizontal: moderateScale(5),
  },
  updateText: {
    fontSize: moderateScale(14),
    color: '#777',
    marginBottom: moderateScale(5),
    fontStyle: 'italic',
  },
  darkUpdateText: {
    color: '#AAA',
  },
  stayTuned: {
    fontSize: moderateScale(16),
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
  },
  darkStayTuned: {
    color: '#66CCFF',
  },
  restartNote: {
    marginTop: moderateScale(10),
    color: '#C0392B',
    fontSize: moderateScale(13),
    textAlign: 'center',
  },
  darkRestartNote: {
    color: '#FFB366',
  },
});

export default MonthTransitionNotice;
export { MonthTransitionModal };
