import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Animated,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  PermissionsAndroid,
  Platform,
  useWindowDimensions,
  AppState,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment-hijri';
import ProgressBar from 'react-native-progress/Bar'; 
import prayerData from './assets/prayer_times.json';
import dailyQuotes from './data/quotes';
import QiblaCompass from './QiblaCompass';
import notifee, { AndroidImportance } from '@notifee/react-native';
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

// ----- Translations & Constants -----
const TRANSLATIONS = {
  en: {
    prayerTimes: "According to the opinion of His Eminence Imam Khamenei",
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
    selectLocation: "Select Location",
    dailyQuote: "Daily Quote",
    close: "Close",
    changeLocationMessage:
      "Changing location will cancel notifications for the current location. Do you want to proceed?",
    ok: "OK",
    cancel: "Cancel",
    allEnded: "All prayer times for today have ended",
    progressBarLabel: "Next Prayer in:", 
    midnight: "Midnight",
    today: "Today",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  ar: {
    prayerTimes: "طبقًا لرأي سماحة الإمام الخامنئي (دام ظله)",
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
    progressBarLabel: "الصلاة القادمة في:", 
    midnight: "منتصف الليل",
    today: "اليوم",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    days: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  },
};

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

// Helper to get the correct icon component based on prayer key
const getIconComponent = (prayerKey) => {
  if (prayerKey === 'fajr' || prayerKey === 'maghrib') {
    return Feather;
  } else if (prayerKey === 'asr') {
    return MaterialIcons;
  }
  return Ionicons;
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
        // Format remaining time as hh:mm:ss
        const duration = moment.duration(diff);
        const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
        const minutes = String(duration.minutes()).padStart(2, '0');
        const seconds = String(duration.seconds()).padStart(2, '0');
        setTimeRemaining(`${hours}:${minutes}:${seconds}`);

        // Calculate progress fraction
        const progressFraction = Math.min(Math.max(elapsed / totalDuration, 0), 1);
        setProgress(progressFraction);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayerTime, lastPrayerTime]);

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

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Descriptive Label */}
      <Text style={[styles.labelText, isDarkMode && styles.darkLabelText]}>
        {translations.progressBarLabel}
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
        <View style={{ transform: [{ scaleX: language === 'en' ? -1 : 1 }] }}>
          <ProgressBar
            progress={progress}
            width={250}
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

// New component for the Today indicator - using Material Icons instead of text
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

// ----- Main App Component -----
export default function App() {
  const [settings, setSettings] = useSettings();
  const {
    language,
    isDarkMode,
    selectedLocation,
    enabledPrayers,
    scheduledNotifications,
    isSettingsLoaded,
  } = settings;

  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [upcomingNotificationIds, setUpcomingNotificationIds] = useState([]);
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isCompassVisible, setIsCompassVisible] = useState(false);

  const {
    scheduleLocalNotification,
    scheduleNotificationsForUpcomingPeriod,
    cancelLocalNotification,
    cancelAllNotifications,
    scheduleRollingNotifications,
    setupDailyRefresh  
  } = useNotificationScheduler(language);

  const animation = useRef(new Animated.Value(0)).current;

  const locationData = useMemo(() => {
    return prayerData[selectedLocation] || [];
  }, [selectedLocation]);

  const dailyQuote = useMemo(() => {
    const todayIndex = new Date().getDate() % dailyQuotes.length;
    return dailyQuotes[todayIndex][language];
  }, [language]);

  // ----- Helpers for Date & Prayer Calculations -----
  const getTodayIndex = useCallback((data) => {
    const today = new Date();
    const formattedDate = moment(today).format('DD/MM/YYYY');
    return data.findIndex((item) => item.date === formattedDate);
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

  const upcomingPrayerKey = usePrayerTimer(
    currentPrayer,
    currentIndex,
    locationData,
    getTodayIndex,
    parsePrayerTime,
    getUpcomingPrayerKeyCallback
  );

  // Determine the last prayer key and time based on the prayer order.
  const prayerOrder = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];
  const upcomingIndex = prayerOrder.indexOf(upcomingPrayerKey);
  let lastPrayerTime = null;
  let lastPrayerKey = null;
  if (upcomingIndex > 0) {
    lastPrayerKey = prayerOrder[upcomingIndex - 1];
    lastPrayerTime = parsePrayerTime(currentPrayer[lastPrayerKey]);
  } else {
    // Before imsak, default to the current time and use imsak as default icon
    lastPrayerTime = new Date();
    lastPrayerKey = 'imsak';
  }

  useEffect(() => {
    I18nManager.forceRTL(language === "ar");
  }, [language]);

  const requestOSNotificationPermission = async () => {
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
  };

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

  useEffect(() => {
    requestOSNotificationPermission();
  }, []);

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

  useEffect(() => {
    if (locationData.length > 0) {
      const todayIdx = getTodayIndex(locationData);
      if (todayIdx !== -1) {
        setCurrentIndex(todayIdx);
        setCurrentPrayer(locationData[todayIdx]);
      } else {
        setCurrentIndex(0);
        setCurrentPrayer(locationData[0]);
      }
    } else {
      setCurrentPrayer(null);
    }
  }, [selectedLocation, locationData, getTodayIndex]);

  const animateTransition = useCallback(
    (newIndex, direction) => {
      Animated.timing(animation, {
        toValue: -direction * 300,
        duration: 250, 
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), 
      }).start(() => {
        setCurrentIndex(newIndex);
        setCurrentPrayer(locationData[newIndex]);
        animation.setValue(direction * 300); 
        
        Animated.spring(animation, {
          toValue: 0,
          friction: 8, 
          tension: 80, 
          useNativeDriver: true,
        }).start();
      });
    },
    [animation, locationData]
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
      language,
      currentPrayer,
      parsePrayerTime,
      scheduleLocalNotification,
      cancelLocalNotification,
      setSettings,
    ]
  );

  const handleLocationChange = (newLocation) => {
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
      setSettings((prev) => ({ ...prev, selectedLocation: newLocation }));
      setIsLocationModalVisible(false);
    }
  };

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

  // Calculate available height for the card container
  const { height: windowHeight } = useWindowDimensions();
  const headerHeight = moderateScale(50);
  const navHeight = moderateScale(70);
  const cardContainerHeight = windowHeight - headerHeight - navHeight;

  // Determine the next prayer time for the countdown
  const nextPrayerTime = upcomingPrayerKey ? parsePrayerTime(currentPrayer[upcomingPrayerKey]) : null;

  const appState = useRef(AppState.currentState);
  
  // Schedule notifications on app start and when app comes to foreground
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
      scheduleRollingNotifications(
        settings.selectedLocation, 
        settings.enabledPrayers
      );
      
      setupDailyRefresh(
        settings.selectedLocation,
        settings.enabledPrayers
      );
    }
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [scheduleRollingNotifications, setupDailyRefresh, settings]); 
  const convertToArabicNumerals = useCallback((str, lang) => {
    if (lang !== 'ar') return str;
    
    // Map of Western digits to Arabic numerals
    const arabicNumerals = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
      '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };
    
    return str.toString().replace(/[0-9]/g, match => arabicNumerals[match]);
  }, []);

  const formatDate = useCallback((dateStr, lang) => {
    if (!dateStr) return "";
    
    // Parse the date from DD/MM/YYYY format
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    const translations = TRANSLATIONS[lang];
    const dayName = translations.days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = translations.months[date.getMonth()];
    
    // Format with proper numerals based on language
    const formattedDayNum = convertToArabicNumerals(dayNum, lang);
    
    return `${dayName} ${formattedDayNum} ${monthName}`;
  }, [convertToArabicNumerals]);

  const formattedHijriDate = useMemo(() => {
    if (!currentPrayer || !currentPrayer.date) return "";
    
    const hijriDateObj = moment(currentPrayer.date, "D/M/YYYY");
    
    if (language === 'ar') {
      // For Arabic, manually build the string with Arabic numerals
      const day = convertToArabicNumerals(hijriDateObj.format("iD"), 'ar');
      const month = hijriDateObj.format("iMMMM"); // Month name is already in Arabic
      const year = convertToArabicNumerals(hijriDateObj.format("iYYYY"), 'ar');
      return `${day} ${month} ${year}`;
    } else {
      // For English, use the default format
      return hijriDateObj.format("iD iMMMM iYYYY");
    }
  }, [currentPrayer, language, convertToArabicNumerals]);

  if (!isSettingsLoaded || !currentPrayer) {
    return (
      <SafeAreaView style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <StatusBar translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
          {TRANSLATIONS[language].loading}
        </Text>
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
      {/* Header */}
      <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
        {TRANSLATIONS[language].prayerTimes}
      </Text>
      {/* Card container with fixed available height */}
      <Animated.View style={[{ height: cardContainerHeight, transform: [{ translateX: animation }] }]}>
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
            <Text style={[styles.locationLabel, isDarkMode && styles.darkLocationLabel]}>
              {" - " + displayLocation}
            </Text>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.prayerContainer}
            showsVerticalScrollIndicator={false}
          >
            {["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha", "midnight"].map((key) => (
              <PrayerRow
                key={key}
                prayerKey={key}
                time={currentPrayer[key]}
                label={TRANSLATIONS[language][key]}
                iconName={PRAYER_ICONS[key]}
                isUpcoming={isToday && key === upcomingPrayerKey}
                isEnabled={enabledPrayers[key]}
                onToggleNotification={handleNotificationToggle}
                isDarkMode={isDarkMode}
                upcomingLabel={TRANSLATIONS[language].upcoming}
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
      <View
        style={[
          styles.navigation,
          isDarkMode && styles.darkNavigation,
          { height: navHeight, direction: "ltr" } // Removed redundant position:'absolute'
        ]}
      >
        <TouchableOpacity onPress={handlePrevious} disabled={currentIndex === 0}>
          <Icon
            name="arrow-back-circle"
            size={60}
            color={currentIndex === 0 ? "#ccc" : isDarkMode ? "#66CCFF" : "#007AFF"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleDarkMode}>
          <Icon
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={50}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleLanguage}>
          <Icon name="language-outline" size={50} color={isDarkMode ? "#66CCFF" : "#007AFF"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLocationModalVisible(true)}>
          <Icon name="location-outline" size={50} color={isDarkMode ? "#66CCFF" : "#007AFF"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsCompassVisible(true)}>
          <Icon name="compass-outline" size={50} color={isDarkMode ? "#66CCFF" : "#007AFF"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} disabled={currentIndex === locationData.length - 1}>
          <Icon
            name="arrow-forward-circle"
            size={60}
            color={currentIndex === locationData.length - 1 ? "#ccc" : isDarkMode ? "#66CCFF" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>
      {/* Quote Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isQuoteModalVisible}
        onRequestClose={() => setIsQuoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>
              {TRANSLATIONS[language].dailyQuote}
            </Text>
            <Text style={[styles.quoteModalText, isDarkMode && styles.darkQuoteModalText]}>
              {dailyQuote}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsQuoteModalVisible(false)}>
              <Text style={[styles.closeButtonText, isDarkMode && styles.darkCloseButtonText]}>
                {TRANSLATIONS[language].close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLocationModalVisible}
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>
              {TRANSLATIONS[language].selectLocation}
            </Text>
            {Object.keys(prayerData).map((loc) => {
              const locDisplay = LOCATION_NAMES[loc] ? LOCATION_NAMES[loc][language] : loc;
              return (
                <TouchableOpacity
                  key={loc}
                  style={styles.locationOption}
                  onPress={() => handleLocationChange(loc)}
                >
                  <Text style={[styles.locationOptionText, isDarkMode && styles.darkLocationOptionText]}>
                    {locDisplay}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsLocationModalVisible(false)}>
              <Text style={[styles.closeButtonText, isDarkMode && styles.darkCloseButtonText]}>X</Text>
            </TouchableOpacity>
          </View>
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
    </SafeAreaView>
  );
}
