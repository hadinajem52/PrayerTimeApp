import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Animated,
  StatusBar,
  Modal,
  Alert,
  PermissionsAndroid,
  Platform,
  useWindowDimensions,
  AppState,
  Easing,
  PanResponder,  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment-hijri';
import ProgressBar from 'react-native-progress/Bar'; 
import dailyQuotes from './data/quotes';
import QiblaCompass from './QiblaCompass';
import notifee, { AndroidImportance,EventType  } from '@notifee/react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import styles from './styles';
import PrayerRow from './components/PrayerRow';
import useSettings from './hooks/useSettings';
import usePrayerTimer from './hooks/usePrayerTimer';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { moderateScale } from 'react-native-size-matters';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Settings from './components/Settings';
import CalendarView from './components/Calendar';
import SkeletonLoader from './components/SkeletonLoader';
import {AnimationUtils } from './utils/animations';
import { UpdateManager } from './components/UpdateManager';
import './firebase';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MonthTransitionNotice from './components/MonthTransitionNotice';
import {toArabicNumerals } from './utils/timeFormatters';
import { PrayerTimesProvider, usePrayerTimes } from './components/PrayerTimesProvider';


// ----- Translations & Constants -----
const TRANSLATIONS = {
  en: {
    prayerTimes: "Prayer Times Schedule",
    loading: "Loading...",
    day: "Day",
    fajr: "Morning",
    shuruq: "Shuruq",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    imsak: "Imsak",
    upcoming: "Upcoming",
    selectLocation: "Location",
    dailyQuote: "Daily Quote",
    close: "Close",
    changeLocationMessage:
      "Changing location will cancel notifications for the current location. Do you want to proceed?",
    ok: "OK",
    cancel: "Cancel",
    allEnded: "All prayer times for today have ended",
    progressBarLabelPrayer: "Next Prayer in:", 
    progressBarLabelTime: "Next Time in:",
    midnight: "Midnight",
    today: "Today",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    settings: "Settings",
    calendar: "Calendar",
    hijriMonths: [
      "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", 
      "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ]
  },
  ar: {
    prayerTimes: "جدول مواقيت الصلاة",
    loading: "جار التحميل...",
    day: "اليوم",
    fajr: "الصبح",
    shuruq: "الشروق",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
    imsak: "الإمساك",
    upcoming: "القادم",
    selectLocation: "اختر المنطقة",
    dailyQuote: "اقتباس اليوم",
    close: "إغلاق",
    changeLocationMessage:
      "تغيير المنطقة سيقوم بإلغاء جميع الإشعارات الخاصة بموقعك الحالي. هل تريد المتابعة؟",
    ok: "موافق",
    cancel: "إلغاء",
    allEnded: "انتهت كل مواعيد الصلاة لهذا اليوم",
    progressBarLabelPrayer: "الصلاة القادمة في:", 
    progressBarLabelTime: "الوقت القادم في:",
    midnight: "منتصف الليل",
    today: "اليوم",
    months: ["كانون ٢", "شباط", "آذار", "نيسان", "أيار", "حزيران","تموز", "آب", "أيلول", "تشرين ١", "تشرين ٢", "كانون ١"],
    days: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    settings: "الإعدادات",
    calendar: "التقويم",
    hijriMonths: [
      "محرم", "صفر", "ربيع ١", "ربيع ٢", 
      "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
      "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ]
  },
};

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.TRIGGER) {
    const { notification } = detail;
    
    if (notification?.data?.type === 'refresh') {
      console.log('[Background] Daily refresh trigger received');
    }

    return null;
  }
});

const LOCATION_NAMES = {
  beirut: { en: "Beirut", ar: "بيروت" },
  tyre: { en: "Tyre", ar: "صور" },
  saida: { en: "Saida", ar: "صيدا" },
  baalbek: { en: "Baalbek", ar: "بعلبك" },
  hermel: { en: "Hermel", ar: "الهرمل" },
  tripoli: { en: "Tripoli", ar: "طرابلس" },
  "nabatieh-bintjbeil": { en: "Nabatieh-Bint Jbeil", ar: "النبطية-بنت جبيل" },
};

const PRAYER_ICONS = {
  imsak: 'cloudy-night',
  fajr: 'sunrise',           
  shuruq: 'partly-sunny',
  dhuhr: 'sunny',
  asr: 'sunny-snowing',      
  maghrib: 'sunset',          
  isha: 'moon-outline',
  midnight: 'moon',
};

const LOCATION_ICONS = {
  beirut: "city",
  tyre: "beach",
  saida: "waves",
  baalbek: "pillar",
  hermel: "mountain",
  tripoli: "lighthouse",
  "nabatieh-bintjbeil": "home-group"
};

const getIconComponent = (prayerKey) => {
  if (prayerKey === 'fajr' || prayerKey === 'maghrib') {
    return Feather;
  } else if (prayerKey === 'asr') {
    return MaterialIcons;
  }
  return Ionicons;
};

const getCountdownLabel = (prayerKey, translations) => {
  if (['shuruq', 'imsak', 'midnight'].includes(prayerKey)) {
    return translations.progressBarLabelTime;
  }
  return translations.progressBarLabelPrayer;
};

const Countdown = ({
  nextPrayerTime,
  lastPrayerTime,
  language,
  translations,
  isDarkMode,
  lastPrayerKey,
  nextPrayerKey,
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [progress, setProgress] = useState(0);
  
  const [settings] = useSettings();
  const { timeFormat, useArabicNumerals } = settings;
  const forceUpdate = useRef(0);

  useEffect(() => {
    forceUpdate.current += 1;
  }, [timeFormat, useArabicNumerals]);

  useEffect(() => {
    if (!nextPrayerTime || !lastPrayerTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(lastPrayerTime);
      const endTime = new Date(nextPrayerTime);
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        setProgress(1);
        clearInterval(interval);
      } else {
        const duration = moment.duration(diff);
        const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
        const minutes = String(duration.minutes()).padStart(2, '0');
        const seconds = String(duration.seconds()).padStart(2, '0');
        
        let displayTime = `${hours}:${minutes}:${seconds}`;
        
        if (language === 'ar' && useArabicNumerals) {
          displayTime = toArabicNumerals(displayTime);
        }
        
        setTimeRemaining(displayTime);

        const progressFraction = Math.min(Math.max(elapsed / totalDuration, 0), 1);
        setProgress(progressFraction);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayerTime, lastPrayerTime, timeFormat, useArabicNumerals, language]);

  const StartIcon = getIconComponent(lastPrayerKey);
  const EndIcon = getIconComponent(nextPrayerKey);

  if (!nextPrayerTime || timeRemaining === null) {
    return (
      <View>
        <Text style={[styles.countdownText, isDarkMode && styles.darkCountdownText]}>
          {translations.allEnded}
        </Text>
      </View>
    );
  }

  const countdownLabel = getCountdownLabel(nextPrayerKey, translations);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Descriptive Label */}
      <Text style={[styles.labelText, isDarkMode && styles.darkLabelText]}>
        {countdownLabel}
      </Text>

      {/* Countdown Timer */}
      <Text style={[styles.countdownText, isDarkMode && styles.darkCountdownText]}>
        {timeRemaining}
      </Text>

      {/* Progress Bar Row with Icons */}
      <View style={styles.progressRow}>
        <View style={{ marginRight: 5 }}>
          <StartIcon
            name={PRAYER_ICONS[lastPrayerKey] || 'time-outline'}
            size={20}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
          />
        </View>
        <View style={{ transform: [{ scaleX: language === 'ar' ? 1 : -1 }] }}>
          <ProgressBar
            progress={progress}
            width={230}
            color={isDarkMode ? "#66CCFF" : "#66CCFF"}
            unfilledColor="#555"
            borderWidth={0}
          />
        </View>
        <View style={[styles.endIconContainer, isDarkMode && styles.darkEndIconContainer]}>
          <EndIcon
            name={PRAYER_ICONS[nextPrayerKey] || 'time-outline'}
            size={20}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
          />
        </View>
      </View>
    </View>
  );
};

const TodayIndicator = ({ isDarkMode }) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 15,
        left: 15,
        zIndex: 5,
        }}
    >
      <View
        style={{
          backgroundColor: isDarkMode ? '#FFA500' : '#007AFF',
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 20,
          shadowColor: isDarkMode ? '#FFA500' : '#007AFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 6,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons
          name="today"
          size={20}
          color="#FFF"
        />
      </View>
    </View>
  );
};

const QuoteIconButton = ({ isDarkMode, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'absolute',
        top: 15,
        right: 15, 
        zIndex: 5,
      }}
    >
      <View
        style={{
          backgroundColor: isDarkMode ? '#66CCFF' : '#007AFF',
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 20,
          shadowColor: isDarkMode ? '#66CCFF' : '#007AFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 6,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome6
          name="hands-praying"
          size={17}
          color="#FFF"
        />
      </View>
    </TouchableOpacity>
  );
};

const LocationItem = React.memo(({ 
  loc, 
  locDisplay, 
  isSelected, 
  isDarkMode, 
  onPress 
}) => {
  const iconColor = isSelected 
    ? (isDarkMode ? "#FFA500" : "#007AFF") 
    : (isDarkMode ? "#66CCFF" : "#555");
    
  return (
    <TouchableOpacity
      key={loc}
      style={[
        styles.enhancedLocationOption,
        isDarkMode && styles.darkEnhancedLocationOption,
        isSelected && styles.selectedLocationOption,
        isSelected && isDarkMode && styles.darkSelectedLocationOption
      ]}
      onPress={onPress}
    >
      <View style={[
        styles.locationIconContainer,
        isDarkMode ? styles.darkLocationIconContainer : styles.lightLocationIconContainer,
        isSelected && styles.selectedLocationIconContainer
      ]}>
        {loc === 'hermel' ? (
          <FontAwesome5
            name="mountain"
            size={18}
            color={iconColor}
            solid
          />
        ) : (
          <MaterialCommunityIcons
            name={LOCATION_ICONS[loc] || "map-marker"}
            size={24}
            color={iconColor}
          />
        )}
      </View>
      <Text style={[
        styles.enhancedLocationText,
        isDarkMode && styles.darkEnhancedLocationText,
        isSelected && styles.selectedLocationText,
        isSelected && isDarkMode && styles.darkSelectedLocationText
      ]}>
        {locDisplay}
      </Text>
      {isSelected && (
        <Icon 
          name="checkmark-circle" 
          size={22} 
          color={isDarkMode ? "#FFA500" : "#007AFF"}
          style={styles.selectedCheckmark}
        />
      )}
    </TouchableOpacity>
  );
});

// ----- Main App Component -----
export default function App() {
  return (
    <PrayerTimesProvider>
      <MainApp />
    </PrayerTimesProvider>
  );
}

function MainApp() {
  const [settings, setSettings] = useSettings();
  const { prayerTimes, isLoading: prayerTimesLoading, error: prayerTimesError, refreshPrayerTimes } = usePrayerTimes();
  
  const {
    language,
    isDarkMode,
    selectedLocation,
    enabledPrayers,
    scheduledNotifications,
    isSettingsLoaded,
    timeFormat, 
  } = settings;

  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [upcomingNotificationIds, setUpcomingNotificationIds] = useState([]);
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isCompassVisible, setIsCompassVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(''); 
  const [isShowingLastAvailableDay, setIsShowingLastAvailableDay] = useState(false);
  const [notificationsScheduled, setNotificationsScheduled] = useState(false);

  const {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    cancelLocalNotification,
    cancelAllNotifications,
    scheduleRollingNotifications,
    setupDailyRefresh,
    isLoading: notificationsLoading,
    isDataAvailable
  } = useNotificationScheduler(language);

  const animation = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const locationChangeAnim = useRef(new Animated.Value(1)).current;
  const navigationBarAnim = useRef(new Animated.Value(1)).current;
  const settingsButtonAnim = useRef(new Animated.Value(1)).current;
  const calendarButtonAnim = useRef(new Animated.Value(1)).current;
  const locationButtonAnim = useRef(new Animated.Value(1)).current;
  const compassButtonAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);

  const locationData = useMemo(() => {
    return (prayerTimes && prayerTimes[selectedLocation]) || [];
  }, [prayerTimes, selectedLocation]);

  const locationKeys = useMemo(() => 
    Object.keys(prayerTimes || {}).filter(loc => loc !== "last_updated"),
    [prayerTimes]
  );

  const dailyQuote = useMemo(() => {
    // Create a seed based on current date (year, month, day)
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Simple seeded random function
    const seededRandom = (seed) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Get a random index based on the date seed
    const randomIndex = Math.floor(seededRandom(seed) * dailyQuotes.length);
    return dailyQuotes[randomIndex][language];
  }, [language, dailyQuotes]);


// Add this debug code temporarily to see what's happening
const getTodayIndex = useCallback((data) => {
  const today = new Date();
  const formattedDate = moment(today).format('D/M/YYYY');
  
  // Normalize by converting both to Date objects for comparison
  const todayObj = moment(formattedDate, ['D/M/YYYY', 'D/MM/YYYY']).toDate();
  
  const index = data.findIndex((item) => {
    if (!item.date) return false;
    // Parse the data date with flexible format
    const dataDate = moment(item.date.trim(), ['D/M/YYYY', 'D/MM/YYYY']).toDate();
    return dataDate.getDate() === todayObj.getDate() && 
           dataDate.getMonth() === todayObj.getMonth() && 
           dataDate.getFullYear() === todayObj.getFullYear();
  });
  
  return index;
}, []);

  const parsePrayerTime = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  }, []);

  const getUpcomingPrayerKeyCallback = useCallback(() => {
    if (!currentPrayer) return null;
    const prayerOrder = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];
    const now = new Date();
    for (let key of prayerOrder) {
      const prayerTime = parsePrayerTime(currentPrayer[key]);
      if (now < prayerTime) {
        return key;
      }
    }
    return null;
  }, [currentPrayer, parsePrayerTime]);

  const animateTransition = useCallback(
    (newIndex, direction) => {
      Animated.timing(cardScaleAnim, {
        toValue: 0.97,
        duration: 120,
        useNativeDriver: true,
      }).start();
      
      Animated.timing(animation, {
        toValue: -direction * 300,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(() => {
        setCurrentIndex(newIndex);
        setCurrentPrayer(locationData[newIndex]);
        animation.setValue(direction * 300);
        
        Animated.parallel([
          Animated.spring(animation, {
            toValue: 0,
            friction: 7,
            tension: 70,
            useNativeDriver: true
          }),
          Animated.spring(cardScaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 50,
            useNativeDriver: true
          })
        ]).start();
      });
    },
    [animation, cardScaleAnim, locationData]
  );

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      animateTransition(currentIndex - 1, -1);
    }
  }, [currentIndex, animateTransition]);

  const handleNext = useCallback(() => {
    if (currentIndex < locationData.length - 1) {
      animateTransition(currentIndex + 1, 1);
    }
  }, [currentIndex, locationData, animateTransition]);

  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, [setSettings]);

  const toggleLanguage = useCallback(() => {
    setSettings((prev) => ({ ...prev, language: prev.language === "en" ? "ar" : "en" }));
  }, [setSettings]);

  const updateHijriOffset = useCallback((newOffset) => {
    setSettings((prev) => ({ ...prev, hijriDateOffset: newOffset }));
  }, [setSettings]);
  
  const handleNotificationToggle = useCallback(
    async (prayerKey) => {
      console.log(`Toggling notification for prayer: ${prayerKey}`);
      if (enabledPrayers[prayerKey]) {
        if (scheduledNotifications[prayerKey]) {
          await cancelLocalNotification(scheduledNotifications[prayerKey]);
          setSettings((prev) => ({
            ...prev,
            scheduledNotifications: { ...prev.scheduledNotifications, [prayerKey]: null },
          }));
        }
        setSettings((prev) => ({
          ...prev,
          enabledPrayers: { ...prev.enabledPrayers, [prayerKey]: false },
        }));
      } else {
        const timeStr = currentPrayer[prayerKey];
        if (timeStr) {
          const prayerTime = parsePrayerTime(timeStr);
          if (prayerTime > new Date()) {
            const numericId = moment(prayerTime).format('YYYYMMDDHHmm');
            await scheduleLocalNotification(numericId, prayerKey, prayerTime);
            setSettings((prev) => ({
              ...prev,
              scheduledNotifications: { ...prev.scheduledNotifications, [prayerKey]: numericId },
            }));
          }
        }
        setSettings((prev) => ({
          ...prev,
          enabledPrayers: { ...prev.enabledPrayers, [prayerKey]: true },
        }));
      }
    },
    [
      enabledPrayers,
      scheduledNotifications,
      currentPrayer,
      parsePrayerTime,
      scheduleLocalNotification,
      cancelLocalNotification,
      setSettings,
    ]
  );

  const convertToArabicNumerals = useCallback((str, lang) => {
    if (lang !== 'ar') return str;
    
    const arabicNumerals = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
      '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    
    return str.toString().replace(/[0-9]/g, match => arabicNumerals[match]);
  }, []);

  const formatDate = useCallback((dateStr, lang) => {
    if (!dateStr) return "";
    
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    const translations = TRANSLATIONS[lang];
    const dayName = translations.days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = translations.months[date.getMonth()];
    
    const formattedDayNum = convertToArabicNumerals(dayNum, lang);
    
    return `${dayName} ${formattedDayNum} ${monthName}`;
  }, [convertToArabicNumerals]);
  
  const animateNavItem = useCallback(() => {
    AnimationUtils.bounce(navigationBarAnim);
  }, [navigationBarAnim]);

  const animateSettingsButton = useCallback(() => {
    AnimationUtils.bounce(settingsButtonAnim);
    setIsSettingsVisible(true);
  }, [settingsButtonAnim]);
  
  const animateCalendarButton = useCallback(() => {
    AnimationUtils.bounce(calendarButtonAnim);
    setIsCalendarVisible(true);
  }, [calendarButtonAnim]);
  
  const animateLocationButton = useCallback(() => {
    AnimationUtils.bounce(locationButtonAnim);
    setIsLocationModalVisible(true);
  }, [locationButtonAnim]);
  
  const animateCompassButton = useCallback(() => {
    AnimationUtils.bounce(compassButtonAnim);
    setIsCompassVisible(true);
  }, [compassButtonAnim]);

  const handleLocationChange = useCallback((newLocation) => {
    if (
      Object.values(scheduledNotifications).some((val) => val) ||
      upcomingNotificationIds.length > 0
    ) {
      Alert.alert(
        TRANSLATIONS[language].selectLocation,
        TRANSLATIONS[language].changeLocationMessage,
        [
          {
            text: TRANSLATIONS[language].cancel,
            style: "cancel",
            onPress: () => {},
          },
          {
            text: TRANSLATIONS[language].ok,
            onPress: async () => {
              AnimationUtils.pulse(locationChangeAnim);
              
              const scheduledIds = Object.values(scheduledNotifications).filter(Boolean);
              await cancelAllNotifications(scheduledIds);
              if (upcomingNotificationIds.length > 0) {
                await cancelAllNotifications(upcomingNotificationIds);
                setUpcomingNotificationIds([]);
              }
              setSettings((prev) => ({ ...prev, scheduledNotifications: {} }));
              setSettings((prev) => ({ ...prev, selectedLocation: newLocation }));
              setIsLocationModalVisible(false);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      AnimationUtils.pulse(locationChangeAnim);
      
      setSettings((prev) => ({ ...prev, selectedLocation: newLocation }));
      setIsLocationModalVisible(false);
    }
  }, [TRANSLATIONS, language, locationChangeAnim, scheduledNotifications, upcomingNotificationIds, cancelAllNotifications, setSettings]);

  const upcomingPrayerKey = usePrayerTimer(
    currentPrayer,
    currentIndex,
    locationData,
    getTodayIndex,
    parsePrayerTime,
    getUpcomingPrayerKeyCallback
  );

  const displayLocation = useMemo(() => {
    return LOCATION_NAMES[selectedLocation]
      ? LOCATION_NAMES[selectedLocation][language]
      : selectedLocation;
  }, [selectedLocation, language]);

  const hijriDate = useMemo(() => {
    if (currentPrayer && currentPrayer.date) {
      return moment(currentPrayer.date, "D/M/YYYY").format("iD iMMMM iYYYY");
    }
    return "";
  }, [currentPrayer]);

  const isToday = useMemo(() => currentIndex === getTodayIndex(locationData), [
    currentIndex,
    locationData,
    getTodayIndex,
  ]);

  const nextPrayerTime = useMemo(() => {
    return upcomingPrayerKey ? parsePrayerTime(currentPrayer?.[upcomingPrayerKey]) : null;
  }, [upcomingPrayerKey, currentPrayer, parsePrayerTime]);

  const formattedHijriDate = useMemo(() => {
    if (!currentPrayer || !currentPrayer.date) return "";
    
    const hijriDateObj = moment(currentPrayer.date, "D/M/YYYY");
    if (settings.hijriDateOffset) {
      hijriDateObj.add(settings.hijriDateOffset, 'days');
    }
    
      const day = hijriDateObj.iDate();
      const monthIndex = hijriDateObj.iMonth();
      const year = hijriDateObj.iYear();

      const monthName = TRANSLATIONS[language].hijriMonths[monthIndex];
  
if (language === 'ar') {
    const dayStr = convertToArabicNumerals(String(day), 'ar');
    const yearStr = convertToArabicNumerals(String(year), 'ar');
    return `${dayStr} ${monthName} ${yearStr}`;
  } else {
    return `${day} ${monthName} ${year}`;
  }
}, [currentPrayer, language, convertToArabicNumerals, settings.hijriDateOffset]);
  
  const preparedPrayerData = useMemo(() => {
    if (!currentPrayer) return null;
    
    return {
      times: ["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"]
        .map(key => ({
          key,
          time: currentPrayer[key],
          label: TRANSLATIONS[language][key],
          iconName: PRAYER_ICONS[key],
          isUpcoming: isToday && key === upcomingPrayerKey,
          isEnabled: enabledPrayers[key]
        }))
    };
  }, [currentPrayer, language, isToday, upcomingPrayerKey, enabledPrayers]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          const minMovementThreshold = 8;
          
          const { dx, dy } = gestureState;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          
          return (
            absDx > absDy &&
            absDx > minMovementThreshold &&
            ((dx > 0 && currentIndex > 0) ||
             (dx < 0 && currentIndex < locationData.length - 1))
          );
        },
        
        onPanResponderGrant: () => {
          Animated.spring(cardScaleAnim, {
            toValue: 0.98,
            friction: 10,
            tension: 40,
            useNativeDriver: true
          }).start();
        },
        
        onPanResponderMove: (evt, gestureState) => {
          if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
            animation.setValue(gestureState.dx * 0.8);
          }
        },
        
        onPanResponderRelease: (evt, gestureState) => {
          const swipeThreshold = 80;
          
          if (gestureState.dx > swipeThreshold && currentIndex > 0) {
            handlePrevious();
          } 
          else if (gestureState.dx < -swipeThreshold && currentIndex < locationData.length - 1) {
            handleNext();
          } 
          else {
            Animated.parallel([
              Animated.spring(animation, {
                toValue: 0,
                friction: 9,
                tension: 80,
                useNativeDriver: true,
              }),
              Animated.spring(cardScaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 60,
                useNativeDriver: true
              })
            ]).start();
          }
        },
        
        onPanResponderTerminationRequest: () => true,
      }),
    [animation, cardScaleAnim, handlePrevious, handleNext, currentIndex, locationData.length]
  );

  const { height: windowHeight } = useWindowDimensions();
  const headerHeight = moderateScale(50);
  const navHeight = moderateScale(70);
  const cardContainerHeight = windowHeight - headerHeight - navHeight;
  
  const prayerOrder = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];
  const upcomingIndex = prayerOrder.indexOf(upcomingPrayerKey);
  
  const lastPrayerKey = useMemo(() => {
    if (upcomingIndex > 0) {
      return prayerOrder[upcomingIndex - 1];
    }
    return 'imsak';
  }, [upcomingIndex]);
  
  const lastPrayerTime = useMemo(() => {
    if (upcomingIndex > 0 && currentPrayer) {
      const key = prayerOrder[upcomingIndex - 1];
      return parsePrayerTime(currentPrayer[key]);
    }
    return new Date(); 
  }, [upcomingIndex, currentPrayer, parsePrayerTime]);

  useEffect(() => {
    I18nManager.forceRTL(language === "ar");
  }, [language]);

  useEffect(() => {
    async function requestPermissions() {
      const settingsNotifee = await notifee.requestPermission();
      if (settingsNotifee.authorizationStatus >= 1) {
        console.log('Notifee permission granted:', settingsNotifee);
      } else {
        Alert.alert(
          'Notifications Disabled',
          'Without notification permissions, you might miss important reminders.'
        );
      }
    }
    requestPermissions();
  }, []);

  useEffect(() => {
    async function createChannel() {
      const channelId = await notifee.createChannel({
        id: 'prayer-channel',
        name: 'Prayer Notifications',
        importance: AndroidImportance.HIGH,
      });
      console.log('Notification channel created:', channelId);
    }
    createChannel();
  }, []);

  const requestOSNotificationPermission = useCallback(async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Allow Notifications',
            message:
              'This app uses notifications to remind you about prayer times. Please allow notifications.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
          Alert.alert(
            'Notifications Disabled',
            'Without notification permissions, you might miss important reminders.'
          );
        }
      } catch (error) {
        console.warn('Notification permission error:', error);
      }
    } else {
      console.log(
        'Notification permission automatically granted on this Android version or not applicable.'
      );
    }
  }, []);

  useEffect(() => {
    requestOSNotificationPermission();
  }, [requestOSNotificationPermission]); 

  useEffect(() => {
    if (isSettingsLoaded && selectedLocation) {
      if (upcomingNotificationIds.length > 0) {
        cancelAllNotifications(upcomingNotificationIds);
        setUpcomingNotificationIds([]);
      }
      scheduleNotificationsForUpcomingPeriod(selectedLocation, enabledPrayers)
        .then((ids) => {
          console.log("Scheduled upcoming notifications:", ids);
          setUpcomingNotificationIds(ids);
        })
        .catch((err) => console.error("Error scheduling upcoming notifications:", err));
    }
  }, [
    isSettingsLoaded,
    selectedLocation,
    enabledPrayers,
    cancelAllNotifications,
    scheduleNotificationsForUpcomingPeriod
  ]);

  const refreshCurrentPrayerData = useCallback(() => {
    if (locationData.length > 0) {
      const todayIdx = getTodayIndex(locationData);
      console.log(`[REFRESH] Today's index in prayer data: ${todayIdx}`);
      
      if (todayIdx !== -1) {
        console.log(`[REFRESH] Setting current index to today: ${todayIdx}`);
        setCurrentIndex(todayIdx);
        setCurrentPrayer(locationData[todayIdx]);
      } else {
        console.log('[REFRESH] Today not found in prayer data, determining best date to show');
        const today = new Date();
        
        const datesToCompare = locationData.map(dayData => {
          const [day, month, year] = dayData.date.split('/').map(Number);
          return new Date(year, month - 1, day);
        });
        
        const earliestDate = new Date(Math.min(...datesToCompare));
        const latestDate = new Date(Math.max(...datesToCompare));
        
        if (today > latestDate) {
          const lastIndex = locationData.length - 1;
          console.log(`[REFRESH] Today (${today.toLocaleDateString()}) is after latest data (${latestDate.toLocaleDateString()}), using last available date at index ${lastIndex}`);
          setCurrentIndex(lastIndex);
          setCurrentPrayer(locationData[lastIndex]);
        
          setIsShowingLastAvailableDay(true);
        } else if (today < earliestDate) {
          console.log(`[REFRESH] Today (${today.toLocaleDateString()}) is before earliest data (${earliestDate.toLocaleDateString()}), using first date at index 0`);
          setCurrentIndex(0);
          setCurrentPrayer(locationData[0]);
          setIsShowingLastAvailableDay(false);
        } else {
          console.log('[REFRESH] Today is within date range but exact date not found, finding closest date');
          let closestIndex = 0;
          let smallestDiff = Infinity;
          
          locationData.forEach((dayData, index) => {
            const [day, month, year] = dayData.date.split('/').map(Number);
            const dataDate = new Date(year, month - 1, day);
            const diff = Math.abs(dataDate - today);
            
            if (diff < smallestDiff) {
              smallestDiff = diff;
              closestIndex = index;
            }
          });
          
          console.log(`[REFRESH] Using closest date at index: ${closestIndex}`);
          setCurrentIndex(closestIndex);
          setCurrentPrayer(locationData[closestIndex]);
          setIsShowingLastAvailableDay(false);
        }
      }
    }
  }, [locationData, getTodayIndex]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground - refreshing data and notifications');
        
        refreshCurrentPrayerData();
        
        if (settings.selectedLocation && settings.enabledPrayers && isDataAvailable) {
          console.log('Scheduling notifications with loaded prayer times data');
          try {
            scheduleRollingNotifications(
              settings.selectedLocation, 
              settings.enabledPrayers
            );
          } catch (error) {
            console.error('Failed to schedule notifications on app foreground:', error);
          }
        } else {
          console.log('Skipping notification scheduling - data not ready');
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [scheduleRollingNotifications, settings, refreshCurrentPrayerData, isDataAvailable]);

  useEffect(() => { 
    if (isDataAvailable && !notificationsScheduled) { 
      scheduleRollingNotifications(selectedLocation, enabledPrayers)
        .then(() => { 
          setNotificationsScheduled(true);  
        })
        .catch(error => console.error('Failed to schedule notifications:', error)); 
    } 
  }, [isDataAvailable, notificationsScheduled, scheduleRollingNotifications, selectedLocation, enabledPrayers]);

  useEffect(() => {
    if (locationData.length > 0) {
      refreshCurrentPrayerData();
    } else {
      setCurrentPrayer(null);
    }
  }, [selectedLocation, locationData, refreshCurrentPrayerData]);
  
  useEffect(() => {
    let loadTimer;
    
    if (locationData.length > 0 && isSettingsLoaded) {
      loadTimer = setTimeout(() => {
        setIsLoading(false);
      }, 700);
    }
    
    return () => {
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, [locationData, isSettingsLoaded]);
  
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground - refreshing notifications');
        if (settings.selectedLocation && settings.enabledPrayers) {
          scheduleRollingNotifications(
            settings.selectedLocation, 
            settings.enabledPrayers
          );
        }
      }
      appState.current = nextAppState;
    };
    
    if (settings.selectedLocation && settings.enabledPrayers) {
      setupDailyRefresh(
        settings.selectedLocation,
        settings.enabledPrayers
      );
    }
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [setupDailyRefresh, settings]); 
  
  useEffect(() => {
    global.fetchPrayerData = refreshPrayerTimes;
    
    return () => {
      global.fetchPrayerData = undefined;
    };
  }, [refreshPrayerTimes]);
  
  if (prayerTimesError) {
    console.error("Prayer Times Error:", prayerTimesError);
    return (
      <SafeAreaView style={[{ flex: 1 }, isDarkMode && styles.darkContainer]}>
        <StatusBar translucent backgroundColor="transparent" />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <Text style={{color: isDarkMode ? '#FFF' : '#000', marginBottom: 20}}>
            {language === 'en' ? 'Failed to load prayer times' : 'فشل تحميل أوقات الصلاة'}
          </Text>
          <TouchableOpacity 
            style={{
              padding: 10, 
              backgroundColor: isDarkMode ? '#FFA500' : '#007AFF',
              borderRadius: 8
            }}
            onPress={refreshPrayerTimes}
          >
            <Text style={{color: '#FFF'}}>
              {language === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!isSettingsLoaded || !currentPrayer || isLoading || prayerTimesLoading || 
    (notificationsLoading && !isOperationInProgress)){
    return (
      <SafeAreaView style={[{ flex: 1 }, isDarkMode && styles.darkContainer]}>
        <StatusBar translucent backgroundColor="transparent" />
        <SkeletonLoader isDarkMode={isDarkMode} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isDarkMode && styles.darkContainer,
        { direction: language === "ar" ? "rtl" : "ltr" },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" />
      <UpdateManager language={language} />
      
      <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
        {TRANSLATIONS[language].prayerTimes}
      </Text>

      <Animated.View 
        style={[
          { 
            height: cardContainerHeight, 
            transform: [
              { translateX: animation },
              { scale: cardScaleAnim }
            ],
            backfaceVisibility: 'hidden',
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.card, isDarkMode && styles.darkCard, { height: '100%' }]}>
          {/* Add Today Indicator if this is today's card */}
          {isToday && <TodayIndicator isDarkMode={isDarkMode} />}
          
          {/* Show QuoteIconButton only for today's prayer card */}
          {isToday && (
            <QuoteIconButton 
              isDarkMode={isDarkMode} 
              onPress={() => setIsQuoteModalVisible(true)} 
            />
          )}
          
          {isToday && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderWidth: 2,
                borderColor: isDarkMode ? '#FFA500' : '#007AFF',
                borderRadius: moderateScale(15),
                opacity: 0.3,
              }}
            />
          )}
          
          <Text style={[styles.date, isDarkMode && styles.darkDate]}>
            {currentPrayer.date ? formatDate(currentPrayer.date, language) : ''} 
          </Text>
          <View style={styles.dateRow}>
            <Text style={[styles.hijriDate, isDarkMode && styles.darkHijriDate]}>{formattedHijriDate}</Text>
            <Animated.Text 
              style={[
                styles.locationLabel, 
                isDarkMode && styles.darkLocationLabel,
                { transform: [{ scale: locationChangeAnim }]}
              ]}
            >
              {" - " + displayLocation}
            </Animated.Text>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.prayerContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true} 
            scrollEventThrottle={16} 
          >
            {preparedPrayerData && preparedPrayerData.times.map((item) => (
              <PrayerRow
                key={item.key}
                prayerKey={item.key}
                time={item.time}
                label={item.label}
                iconName={item.iconName}
                isUpcoming={item.isUpcoming}
                isEnabled={item.isEnabled}
                onToggleNotification={handleNotificationToggle}
                isDarkMode={isDarkMode}
                upcomingLabel={TRANSLATIONS[language].upcoming}
                language={language} 
              />
            ))}
            {isToday && (
              <Countdown
                nextPrayerTime={nextPrayerTime}
                lastPrayerTime={lastPrayerTime}
                language={language}
                translations={TRANSLATIONS[language]}
                isDarkMode={isDarkMode}
                lastPrayerKey={lastPrayerKey}
                nextPrayerKey={upcomingPrayerKey}
              />
            )}
          </ScrollView>
        </View>
      </Animated.View>
      {isShowingLastAvailableDay && (
        <View style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: navHeight + 10,
          backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
          borderWidth: 2,
          borderColor: isDarkMode ? '#FFA500' : '#007AFF',
          borderRadius: 15,
          padding: 5,
          elevation: 10,
          zIndex: 999
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: 5,
              top: 5,
              zIndex: 1000,
              backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(200,200,200,0.5)',
              borderRadius: 15,
              width: 30,
              height: 30,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setIsShowingLastAvailableDay(false)}
          >
            <Icon name="close" size={20} color={isDarkMode ? "#FFA500" : "#007AFF"} />
          </TouchableOpacity>
          <MonthTransitionNotice 
            language={language}
            isDarkMode={isDarkMode}
          />
        </View>
      )}
      
      <Animated.View
        style={[
          styles.navigation,
          isDarkMode && styles.darkNavigation,
          { 
            height: navHeight, 
            direction: "ltr",
            transform: [{ scale: navigationBarAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.navItem,
            isSettingsVisible && styles.navItemActive,
            isSettingsVisible && isDarkMode && styles.darkNavItemActive
          ]} 
          onPress={animateSettingsButton}
        >
          <Animated.View style={[
            { transform: [{ scale: settingsButtonAnim }] },
            { alignItems: 'center', width: '100%' }
          ]}>
            <View style={styles.navIconContainer}>
              <Icon
                name="settings-outline"
                size={28}
                color={isDarkMode ? 
                  (isSettingsVisible ? "#FFA500" : "#66CCFF") : 
                  (isSettingsVisible ? "#007AFF" : "#555")}
              />
            </View>
            <Text style={[
              styles.navLabel,
              isDarkMode && styles.darkNavLabel,
              isSettingsVisible && styles.navLabelActive,
              isSettingsVisible && isDarkMode && styles.darkNavLabelActive
            ]}>
              {TRANSLATIONS[language].settings}
            </Text>
          </Animated.View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.navItem,
            isCalendarVisible && styles.navItemActive,
            isCalendarVisible && isDarkMode && styles.darkNavItemActive
          ]} 
          onPress={animateCalendarButton}
        >
          <Animated.View style={{ transform: [{ scale: calendarButtonAnim }] }}>
            <Icon
              name="calendar-outline"
              size={28}
              color={isDarkMode ? 
                (isCalendarVisible ? "#FFA500" : "#66CCFF") : 
                (isCalendarVisible ? "#007AFF" : "#555")}
              style={styles.navIcon}
            />
            <Text style={[
              styles.navLabel,
              isDarkMode && styles.darkNavLabel,
              isCalendarVisible && styles.navLabelActive,
              isCalendarVisible && isDarkMode && styles.darkNavLabelActive
            ]}>
              {TRANSLATIONS[language].calendar}
            </Text>
          </Animated.View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.navItem,
            isLocationModalVisible && styles.navItemActive,
            isLocationModalVisible && isDarkMode && styles.darkNavItemActive
          ]} 
          onPress={animateLocationButton}
        >
          <Animated.View style={{ transform: [{ scale: locationButtonAnim }] }}>
            <Icon 
              name="location-outline" 
              size={28} 
              color={isDarkMode ? 
                (isLocationModalVisible ? "#FFA500" : "#66CCFF") : 
                (isLocationModalVisible ? "#007AFF" : "#555")}
              style={styles.navIcon}
            />
            <Text style={[
              styles.navLabel,
              isDarkMode && styles.darkNavLabel,
              isLocationModalVisible && styles.navLabelActive,
              isLocationModalVisible && isDarkMode && styles.darkNavLabelActive
            ]}>
              {TRANSLATIONS[language].selectLocation}
            </Text>
          </Animated.View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.navItem,
            isCompassVisible && styles.navItemActive,
            isCompassVisible && isDarkMode && styles.darkNavItemActive
          ]} 
          onPress={animateCompassButton}
        >
          <Animated.View style={{ transform: [{ scale: compassButtonAnim }] }}>
            <Icon 
              name="compass-outline" 
              size={28} 
              color={isDarkMode ? 
                (isCompassVisible ? "#FFA500" : "#66CCFF") : 
                (isCompassVisible ? "#007AFF" : "#555")}
              style={styles.navIcon}
            />
            <Text style={[
              styles.navLabel,
              isDarkMode && styles.darkNavLabel,
              isCompassVisible && styles.navLabelActive,
              isCompassVisible && isDarkMode && styles.darkNavLabelActive
            ]}>
              {language === 'en' ? 'Qibla' : 'القبلة '}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Calendar Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isCalendarVisible}
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <CalendarView
          language={language}
          isDarkMode={isDarkMode}
          onClose={() => setIsCalendarVisible(false)}
          onSelectDate={(index) => {
            setCurrentIndex(index);
            setCurrentPrayer(locationData[index]);
            setIsCalendarVisible(false);
          }}
          currentSelectedDate={currentPrayer ? currentPrayer.date : null}
          todayIndex={getTodayIndex(locationData)}
          selectedLocation={selectedLocation}
          prayerTimes={prayerTimes} 
        />
      </Modal>
      {/* Quote Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isQuoteModalVisible}
        onRequestClose={() => setIsQuoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[
            styles.enhancedModalContent, 
            isDarkMode && styles.darkEnhancedModalContent,
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.enhancedModalTitle, isDarkMode && styles.darkEnhancedModalTitle]}>
                {TRANSLATIONS[language].dailyQuote}
              </Text>
              <TouchableOpacity 
                style={[styles.roundedCloseButton, isDarkMode && styles.darkRoundedCloseButton]} 
                onPress={() => setIsQuoteModalVisible(false)}
              >
                <Icon name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.quoteContainer}>
              <FontAwesome6 
                name="hands-praying" 
                size={24} 
                color={isDarkMode ? "#FFA500" : "#007AFF"} 
                style={styles.quoteIcon}
              />
              <Text style={[styles.enhancedQuoteText, isDarkMode && styles.darkEnhancedQuoteText]}>
                {dailyQuote}
              </Text>
            </View>

          </Animated.View>
        </View>
      </Modal>
      {/* Location Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLocationModalVisible}
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.enhancedModalContent, 
              isDarkMode && styles.darkEnhancedModalContent,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.enhancedModalTitle, isDarkMode && styles.darkEnhancedModalTitle]}>
                {TRANSLATIONS[language].selectLocation}
              </Text>
              <TouchableOpacity 
                style={[styles.roundedCloseButton, isDarkMode && styles.darkRoundedCloseButton]} 
                onPress={() => setIsLocationModalVisible(false)}
              >
                <Icon name="close" size={20} color={isDarkMode ? "#FFF" : "#FFF"} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.locationListContainer}>
              {locationKeys.map((loc) => {
                const locDisplay = LOCATION_NAMES[loc] ? LOCATION_NAMES[loc][language] : loc;
                const isSelected = selectedLocation === loc;
                
                return (
                  <LocationItem
                    key={loc}
                    loc={loc}
                    locDisplay={locDisplay}
                    isSelected={isSelected}
                    isDarkMode={isDarkMode}
                    onPress={() => handleLocationChange(loc)}
                  />
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Compass Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isCompassVisible}
        onRequestClose={() => setIsCompassVisible(false)}
      >
        <QiblaCompass isDarkMode={isDarkMode} language={language} onClose={() => setIsCompassVisible(false)} />
      </Modal>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isSettingsVisible}
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <Settings
          language={language}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          toggleLanguage={toggleLanguage}
          onClose={() => setIsSettingsVisible(false)}
          hijriDateOffset={settings.hijriDateOffset || 0}
          updateHijriOffset={updateHijriOffset}
          useArabicNumerals={settings.useArabicNumerals || false}
          updateUseArabicNumerals={(value) => setSettings(prev => ({...prev, useArabicNumerals: value}))}
        />
      </Modal>
    </SafeAreaView>
  );
}
