import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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
  },
  ar: {
    title: "جاري إعداد بيانات الشهر الجديد",
    description: "نحن نقوم حاليًا بإعداد أوقات الصلاة للشهر الجديد. يتم عرض آخر أوقات صلاة متاحة بينما نقوم بتحديث بياناتنا.",
    currentMonth: "الشهر الحالي:",
    nextMonth: "الشهر القادم:",
    expectedUpdate: "التحديث متوقع قريبًا",
    stayTuned: "ترقبوا!",
    note: "ملاحظة: يتم استخدام أوقات الصلاة لليوم الأخير حتى تتوفر بيانات جديدة.",
  }
};

const MonthTransitionNotice = ({ language, isDarkMode }) => {
  // Animation references
  const moonRotation = useRef(new Animated.Value(0)).current;
  const moonPosition = useRef(new Animated.Value(0)).current;
  const sunPosition = useRef(new Animated.Value(0)).current;
  const cloudOpacity = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  const currentMonth = moment().format('MMMM');
  const nextMonth = moment().add(1, 'months').format('MMMM');
  const currentMonthHijri = moment().format('iMMMM');
  const nextMonthHijri = moment().add(1, 'months').format('iMMMM');
  
  // Translations access
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  useEffect(() => {
    // Start animations
    Animated.loop(
      Animated.timing(moonRotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Moon moving across
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonPosition, {
          toValue: 1,
          duration: 15000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true
        }),
        Animated.timing(moonPosition, {
          toValue: 0,
          duration: 15000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true
        })
      ])
    ).start();

    // Sun moving up and down
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunPosition, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(sunPosition, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        })
      ])
    ).start();

    // Cloud opacity pulsating
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudOpacity, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true
        }),
        Animated.timing(cloudOpacity, {
          toValue: 0.5,
          duration: 3000,
          useNativeDriver: true
        })
      ])
    ).start();

    // Progress indicator
    Animated.loop(
      Animated.timing(progressValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false
      })
    ).start();

  }, [moonRotation, moonPosition, sunPosition, cloudOpacity, progressValue]);

  const moonRotationInterpolate = moonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const moonPositionInterpolate = moonPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 50]
  });

  const sunPositionInterpolate = sunPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20]
  });

  const progressInterpolate = progressValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#66CCFF', '#007AFF', '#66CCFF']
  });

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Text style={[styles.title, isDarkMode && styles.darkTitle]}>
        {t.title}
      </Text>

      {/* Animation Scene */}
      <View style={styles.animationContainer}>
        <Animated.View style={[
          styles.sunContainer, 
          {transform: [{translateY: sunPositionInterpolate}]}
        ]}>
          <FontAwesome5 
            name="sun" 
            size={40} 
            color={isDarkMode ? "#FFA500" : "#FFA500"} 
            solid
          />
        </Animated.View>
        
        <Animated.View style={[
          styles.moonContainer, 
          {
            transform: [
              {rotate: moonRotationInterpolate},
              {translateX: moonPositionInterpolate}
            ]
          }
        ]}>
          <Icon 
            name="moon-waning-crescent" 
            size={35} 
            color={isDarkMode ? "#E0E0E0" : "#888888"} 
          />
        </Animated.View>
        
        <Animated.View style={[
          styles.cloudContainer, 
          {opacity: cloudOpacity}
        ]}>
          <Icon 
            name="cloud" 
            size={30} 
            color={isDarkMode ? "#CCCCCC" : "#BBBBBB"} 
          />
        </Animated.View>
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
            {language === 'ar' ? currentMonthHijri : currentMonth}
          </Text>
        </View>
        
        <View style={styles.monthRow}>
          <Text style={[styles.monthLabel, isDarkMode && styles.darkMonthLabel]}>
            {t.nextMonth}
          </Text>
          <Text style={[styles.monthValue, isDarkMode && styles.darkMonthValue]}>
            {language === 'ar' ? nextMonthHijri : nextMonth}
          </Text>
        </View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Animated.View style={[
          styles.progressDot,
          {backgroundColor: progressInterpolate}
        ]} />
        <Animated.View style={[
          styles.progressDot,
          {backgroundColor: progressInterpolate, opacity: cloudOpacity}
        ]} />
        <Animated.View style={[
          styles.progressDot,
          {backgroundColor: progressInterpolate, opacity: moonPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
          })}
        ]} />
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
