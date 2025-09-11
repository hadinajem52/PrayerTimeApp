import React from 'react';
import { View, Text } from 'react-native';
import { usePrayerTimes } from './PrayerTimesProvider';
import useSettings from '../hooks/useSettings';
import moment from 'moment-hijri';
import { toArabicNumerals } from '../utils/timeFormatters';

/**
 * NextPrayerWidget Component
 * Displays the next upcoming prayer time for use in home screen widgets
 */
const NextPrayerWidget = () => {
  const { prayerTimes } = usePrayerTimes();
  const { 
    selectedCity,
    timeFormat24h,
    arabicNumerals,
    getUpcomingPrayerKey,
    getTodayIndex,
    parsePrayerTime,
    formatPrayerTime,
    getCurrentPrayer,
    getCurrentPrayerIndex
  } = useSettings();

  const getNextPrayerInfo = () => {
    if (!prayerTimes || !selectedCity) {
      return null;
    }

    try {
      const todayIndex = getTodayIndex(prayerTimes[selectedCity]);
      const currentPrayerData = getCurrentPrayer();
      
      if (!currentPrayerData) {
        return null;
      }

      const upcomingPrayerKey = getUpcomingPrayerKey();
      
      if (!upcomingPrayerKey) {
        // If no more prayers today, get first prayer of tomorrow
        const tomorrowIndex = (todayIndex + 1) % prayerTimes[selectedCity].length;
        const tomorrowData = prayerTimes[selectedCity][tomorrowIndex];
        
        return {
          name: 'الفجر', // Fajr is always first
          time: formatPrayerTime(tomorrowData.fajr, timeFormat24h, arabicNumerals),
          isTomorrow: true
        };
      }

      const prayerNames = {
        fajr: 'الصبح',
        sunrise: 'الشروق',
        dhuhr: 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء'
      };

      const todayData = prayerTimes[selectedCity][todayIndex];
      const prayerTime = todayData[upcomingPrayerKey];
      
      return {
        name: prayerNames[upcomingPrayerKey],
        time: formatPrayerTime(prayerTime, timeFormat24h, arabicNumerals),
        isTomorrow: false
      };
    } catch (error) {
      console.error('Error getting next prayer info:', error);
      return null;
    }
  };

  const nextPrayer = getNextPrayerInfo();

  if (!nextPrayer) {
    return (
      <View style={styles.widgetContainer}>
        <Text style={styles.widgetTitle}>الصلاة القادمة</Text>
        <Text style={styles.widgetSubtitle}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.widgetContainer}>
      <Text style={styles.widgetTitle}>الصلاة القادمة</Text>
      <Text style={styles.prayerName}>
        {nextPrayer.name}
        {nextPrayer.isTomorrow && ' (غداً)'}
      </Text>
      <Text style={styles.prayerTime}>
        {arabicNumerals ? toArabicNumerals(nextPrayer.time) : nextPrayer.time}
      </Text>
      <Text style={styles.cityName}>{selectedCity}</Text>
    </View>
  );
};

const styles = {
  widgetContainer: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  widgetTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  prayerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  prayerTime: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  cityName: {
    color: '#E8F5E8',
    fontSize: 12,
    textAlign: 'center',
  },
  widgetSubtitle: {
    color: '#E8F5E8',
    fontSize: 16,
    textAlign: 'center',
  },
};

export default NextPrayerWidget;
