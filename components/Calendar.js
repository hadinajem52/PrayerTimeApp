import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment-hijri';
import { usePrayerTimes } from './PrayerTimesProvider'; 
import { TRANSLATIONS } from '../constants/translations/calendar';
import styles from '../styles/calendarStyles';

const MONTHS = {
  en: [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ],
  ar:[
    "كانون ٢", "شباط", "آذار", "نيسان", "أيار", "حزيران",
    "تموز", "آب", "أيلول", "تشرين ١", "تشرين ٢", "كانون ١"
  ]
};

const CalendarView = ({ 
  language, 
  isDarkMode, 
  onClose, 
  onSelectDate, 
  currentSelectedDate, 
  todayIndex,
  selectedLocation,
  prayerTimes 
}) => {
  
  
  const translations = TRANSLATIONS[language];
  
  const prayerDates = useMemo(() => {
    if (!prayerTimes || !selectedLocation || !prayerTimes[selectedLocation]) {
      return [];
    }
    return prayerTimes[selectedLocation].map(item => item.date);
  }, [prayerTimes, selectedLocation]);

  const currentDate = useMemo(() => {
    if (currentSelectedDate) {
      return moment(currentSelectedDate, "DD/MM/YYYY");
    }
    return moment();
  }, [currentSelectedDate]);

  const today = moment();
  const [currentMonth, setCurrentMonth] = useState(currentDate.month());
  const [currentYear, setCurrentYear] = useState(currentDate.year());

  const daysInMonth = useMemo(() => {
    const firstDayOfMonth = moment([currentYear, currentMonth]).startOf('month');
    const lastDayOfMonth = moment([currentYear, currentMonth]).endOf('month');
    
    const daysCount = lastDayOfMonth.date();
    const firstDayWeekday = firstDayOfMonth.day();
    
    const days = [];
    
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push({ 
        day: null, 
        date: null, 
        disabled: true 
      });
    }
    
    for (let i = 1; i <= daysCount; i++) {
      const currentDay = moment([currentYear, currentMonth, i]);
      
    
      const formattedDate = currentDay.format('D/M/YYYY');
      const formattedDatePadded = currentDay.format('DD/MM/YYYY');
      
      const dateIndex = prayerDates.findIndex(date => 
        date === formattedDate || date === formattedDatePadded
      );
      
      days.push({
        day: i,
        date: dateIndex !== -1 ? prayerDates[dateIndex] : formattedDate,
        isToday: today.date() === i && today.month() === currentMonth && today.year() === currentYear,
        isSelected: currentSelectedDate && (
          currentSelectedDate === formattedDate || 
          currentSelectedDate === formattedDatePadded
        ),
        disabled: dateIndex === -1,
        dateIndex: dateIndex
      });
    }
    
    return days;
  }, [currentMonth, currentYear, today, prayerDates, currentSelectedDate]);

  const monthName = MONTHS[language][currentMonth];

  const handleSelectDate = (item) => {
    if (!item.disabled && item.dateIndex !== -1) {
      onSelectDate(item.dateIndex);
      onClose();
    }
  };

  useEffect(() => {
    if (prayerDates.length > 0) {
      console.log('Sample prayer date format:', prayerDates[0]);
    }
  }, [prayerDates]);

  return (
    <SafeAreaView style={[
      styles.container,
      isDarkMode && styles.darkContainer
    ]}>
      <StatusBar translucent backgroundColor="transparent" />
      
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.backButton}
        >
          <Icon 
            name={language === 'ar' ? "arrow-forward" : "arrow-back"} 
            size={24} 
            color={isDarkMode ? "#D4AF37" : "#059669"} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkHeaderTitle]}>
          {translations.calendar}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={[
          styles.calendarContainer,
          { direction: 'ltr' }
        ]}>
          <View style={[styles.monthYearHeader, isDarkMode && styles.darkMonthYearHeader]}>
            <Text style={[
              styles.monthYearText, 
              isDarkMode && styles.darkMonthYearText,
              { writingDirection: language === 'ar' ? 'rtl' : 'ltr', textAlign: 'center' }
            ]}>
              {monthName} {currentYear}
            </Text>
          </View>
          
          <View style={[
            styles.calendarGrid,
            { direction: 'ltr' }
          ]}>
            {daysInMonth.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  item.isToday && styles.todayCell,
                  item.isToday && isDarkMode && styles.darkTodayCell,
                  item.isSelected && styles.selectedCell,
                  item.isSelected && isDarkMode && styles.darkSelectedCell,
                  item.disabled && styles.disabledCell,
                ]}
                onPress={() => handleSelectDate(item)}
                disabled={item.disabled}
              >
                {item.day !== null ? (
                  <Text style={[
                    styles.dayText,
                    isDarkMode && styles.darkDayText,
                    item.isToday && styles.todayText,
                    item.isSelected && styles.selectedDayText,
                    item.disabled && styles.disabledDayText,
                    { writingDirection: 'ltr' }
                  ]}>
                    {item.day}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={[
            styles.legendContainer,
            language === 'ar' ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }
          ]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.todayDot, isDarkMode && styles.darkTodayDot]} />
              <Text style={[styles.legendText, isDarkMode && styles.darkLegendText]}>
                {translations.today}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.selectedDot, isDarkMode && styles.darkSelectedDot]} />
              <Text style={[styles.legendText, isDarkMode && styles.darkLegendText]}>
                {translations.selected}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarView;
