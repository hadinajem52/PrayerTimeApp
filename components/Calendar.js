import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import moment from 'moment-hijri';
import { usePrayerTimes } from './PrayerTimesProvider'; 

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

const TRANSLATIONS = {
  en: {
    calendar: "Calendar",
    back: "Back",
    today: "Today",
    selected: "Selected",
  },
  ar: {
    calendar: "التقويم",
    back: "رجوع",
    today: "اليوم",
    selected: "محدد",
  },
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
            color={isDarkMode ? "#FFA500" : "#007AFF"} 
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

const { width } = Dimensions.get('window');
const cellSize = width / 7 - 8; 

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
  calendarContainer: {
    padding: 16,
  },
  monthYearHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  darkMonthYearHeader: {
    backgroundColor: '#333',
  },
  monthYearText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#333',
  },
  darkMonthYearText: {
    color: '#fff',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: cellSize,
    height: cellSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: cellSize / 2,
  },
  dayText: {
    fontSize: moderateScale(16),
    color: '#333',
  },
  darkDayText: {
    color: '#fff',
  },
  todayCell: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  darkTodayCell: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: '#FFA500',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  darkSelectedCell: {
    backgroundColor: 'rgba(102, 204, 255, 0.2)',
  },
  selectedDayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  disabledCell: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#999',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  todayDot: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  darkTodayDot: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: '#FFA500',
  },
  selectedDot: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  darkSelectedDot: {
    backgroundColor: 'rgba(102, 204, 255, 0.2)',
  },
  disabledDot: {
    backgroundColor: '#ccc',
    opacity: 0.3,
  },
  legendText: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  darkLegendText: {
    color: '#aaa',
  },
});

export default CalendarView;
