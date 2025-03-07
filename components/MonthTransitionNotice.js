import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment-hijri';

const TRANSLATIONS = {
  en: {
    title: "Preparing New Month's Data",
    description: "We're currently preparing prayer times for the new month. The latest available prayer times are being shown while we update our data.",
    currentMonth: "Current Month:",
    nextMonth: "Coming Month:",
    expectedUpdate: "Update expected soon",
    stayTuned: "Stay tuned!",
    note: "Note: Prayer times for the last day are used until new data becomes available.",
    close: "Close"
  },
  ar: {
    title: "جاري إعداد بيانات الشهر الجديد",
    description: "نحن نقوم حاليًا بإعداد أوقات الصلاة للشهر الجديد. يتم عرض آخر أوقات صلاة متاحة بينما نقوم بتحديث بياناتنا.",
    currentMonth: "الشهر الحالي:",
    nextMonth: "الشهر القادم:",
    expectedUpdate: "التحديث متوقع قريبًا",
    stayTuned: "ترقبوا!",
    note: "ملاحظة: يتم استخدام أوقات الصلاة لليوم الأخير حتى تتوفر بيانات جديدة.",
    close: "إغلاق"
  }
};

// Arabic month names
const ARABIC_MONTHS = [
  "كانون ٢", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين ١", "تشرين ٢", "كانون ١"
];


const MonthTransitionNotice = ({ language, isDarkMode}) => {
  // Get current month in English
  const currentMonth = moment().format('MMMM');
  // Get next month in English
  const nextMonth = moment().add(1, 'months').format('MMMM');
  
  // Get current and next month in Arabic
  const currentMonthIndex = moment().month();
  const nextMonthIndex = (currentMonthIndex + 1) % 12;
  const currentMonthArabic = ARABIC_MONTHS[currentMonthIndex];
  const nextMonthArabic = ARABIC_MONTHS[nextMonthIndex];
  
  // Translations access
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Removed the close button from here */}
      
      <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
        {t.title}
      </Text>

      {/* Static Scene (previously Animation Scene) */}
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

      {/* Month Information */}
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

      {/* Static progress indicator */}
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

      <Text style={[styles.note, isDarkMode && styles.darkNote]}>
        {t.note}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: moderateScale(15),
    margin: moderateScale(10),
    position: 'relative',  // Added for absolute positioning of close button
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
  // Removed closeButton style
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
    marginBottom: moderateScale(20),
  },
  darkStayTuned: {
    color: '#66CCFF',
  },
  note: {
    fontSize: moderateScale(12),
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  darkNote: {
    color: '#999',
  },
});

export default MonthTransitionNotice;
