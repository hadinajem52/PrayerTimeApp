// App.js
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment-hijri';
import prayerData from './assets/prayer_times.json';
import dailyQuotes from './data/quotes';
import QiblaCompass from './QiblaCompass';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import styles from './styles';

/* --- Static Constants --- */
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
  fajr: 'cloudy-night',
  shuruq: 'partly-sunny',
  dhuhr: 'sunny',
  asr: 'sunny',
  maghrib: 'moon',
  isha: 'moon',
  imsak: 'cloudy-night',
};

/* --- Memoized PrayerRow Component --- */
const PrayerRow = React.memo(
  ({
    prayerKey,
    time,
    label,
    iconName,
    isUpcoming,
    isEnabled,
    onToggleNotification,
    isDarkMode,
    upcomingLabel,
  }) => {
    const upcomingStyle = isDarkMode
      ? styles.upcomingPrayerDark
      : styles.upcomingPrayerLight;
    return (
      <View style={[styles.prayerRow, isUpcoming && upcomingStyle]}>
        <Icon
          name={iconName}
          size={24}
          color={isDarkMode ? "#FFA500" : "#007AFF"}
          style={styles.prayerIcon}
        />
        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>
          {label}
        </Text>
        <Text style={[styles.value, isDarkMode && styles.darkValue]}>
          {time}
        </Text>
        <TouchableOpacity onPress={() => onToggleNotification(prayerKey)}>
          <Icon
            name={isEnabled ? "notifications" : "notifications-outline"}
            size={24}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
        {isUpcoming && (
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>{upcomingLabel}</Text>
          </View>
        )}
      </View>
    );
  }
);

/* --- Main App Component --- */
export default function App() {
  /* --- Notifee Initialization --- */
  useEffect(() => {
    async function requestPermissions() {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus >= 1) {
        console.log('Permission granted:', settings);
      } else {
        Alert.alert(
          'Notifications Disabled',
          'Without notification permissions, you might miss important reminders.'
        );
      }
    }
    requestPermissions();
  }, []);

  // Create Android notification channel
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

  /* --- Notification Scheduling Functions --- */
  async function scheduleLocalNotification(notificationId, prayerKey, prayerDateTime) {
    if (prayerDateTime <= new Date()) {
      console.warn(`Scheduled time ${prayerDateTime} is in the past. Notification not scheduled.`);
      return null;
    }
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: prayerDateTime.getTime(),
    };
  
    // Use the language state to decide the notification text
    const title = language === 'ar' ? 'تذكير الصلاة' : 'Prayer Reminder';
    // Use the translations object to get the appropriate prayer name
    const prayerName = TRANSLATIONS[language][prayerKey];
    const body = language === 'ar' 
      ? `حان موعد صلاة ${prayerName}` 
      : `It's time for ${prayerName} prayer.`;
  
    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: title,
        body: body,
        android: {
          channelId: 'prayer-channel',
          smallIcon: 'ic_launcher', // ensure you have a valid icon in your native project
        },
      },
      trigger,
    );
    console.log(`Scheduled notification for ${prayerKey} at ${moment(prayerDateTime).format('YYYY-MM-DD HH:mm:ss')}`);
    return notificationId;
  }
  

  async function scheduleNotificationsForUpcomingPeriod(location, enabledPrayers) {
    const today = new Date();
    const upcomingDays = prayerData[location]
      .filter(dayData => {
        const dayDate = moment(dayData.date, 'D/M/YYYY').toDate();
        return dayDate >= today;
      })
      .slice(0, 30);

    const scheduledNotificationIds = [];
    for (const dayData of upcomingDays) {
      for (const prayerKey of ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']) {
        if (!enabledPrayers[prayerKey]) continue;
        const timeStr = dayData[prayerKey];
        if (!timeStr) continue;
        const timeParts = timeStr.split(':');
        const prayerMoment = moment(dayData.date, 'D/M/YYYY')
          .hour(parseInt(timeParts[0], 10))
          .minute(parseInt(timeParts[1], 10))
          .second(0);
        if (prayerMoment.toDate() > today) {
          const numericId = moment(prayerMoment).format('YYYYMMDDHHmm');
          await scheduleLocalNotification(numericId, prayerKey, prayerMoment.toDate());
          scheduledNotificationIds.push(numericId);
        }
      }
    }
    return scheduledNotificationIds;
  }

  async function cancelLocalNotification(notificationId) {
    await notifee.cancelNotification(notificationId);
    console.log(`Cancelled notification with id: ${notificationId}`);
    return true;
  }

  async function cancelAllNotifications(notificationIds) {
    for (const id of notificationIds) {
      await cancelLocalNotification(id);
    }
    return true;
  }

  // Generate unique IDs for notifications
  const generateNumericId = (date) => moment(date).format('YYYYMMDDHHmm');
  const generateAlternativeId = (date) => {
    const timestamp = date.getTime();
    const randomPart = Math.floor(Math.random() * 900) + 100;
    return `${timestamp}${randomPart}`;
  };

  /* --- State Declarations --- */
  const [language, setLanguage] = useState("ar");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState({});
  const [upcomingNotificationIds, setUpcomingNotificationIds] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("beirut");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [upcomingPrayerKey, setUpcomingPrayerKey] = useState(null);
  const [isCompassVisible, setIsCompassVisible] = useState(false);

  // Global enabled-prayer state
  const [enabledPrayers, setEnabledPrayers] = useState({
    imsak: false,
    fajr: false,
    shuruq: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  });

  // Refs for animation and timers
  const isInitialMount = useRef(true);
  const animation = useRef(new Animated.Value(0)).current;
  const upcomingTimer = useRef(null);

  const locationData = useMemo(() => {
    return prayerData[selectedLocation] || [];
  }, [selectedLocation]);

  const dailyQuote = useMemo(() => {
    const todayIndex = new Date().getDate() % dailyQuotes.length;
    return dailyQuotes[todayIndex][language];
  }, [language]);

  /* --- Utility Functions --- */
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

  const getUpcomingPrayerKey = useCallback(() => {
    if (!currentPrayer) return null;
    const now = new Date();
    const prayerOrder = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (let key of prayerOrder) {
      const prayerTime = parsePrayerTime(currentPrayer[key]);
      if (now < prayerTime) {
        return key;
      }
    }
    return null;
  }, [currentPrayer, parsePrayerTime]);

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
      console.log('Notification permission automatically granted on this Android version or not applicable.');
    }
  };

  /* --- AsyncStorage: Load & Save Settings --- */
  useEffect(() => {
    (async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedDarkMode = await AsyncStorage.getItem('isDarkMode');
        const savedLocation = await AsyncStorage.getItem('selectedLocation');
        const savedEnabledPrayers = await AsyncStorage.getItem('enabledPrayers');
        console.log("Loaded settings:", { savedLanguage, savedDarkMode, savedLocation, savedEnabledPrayers });
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }
        if (savedLocation !== null) {
          setSelectedLocation(savedLocation);
        }
        if (savedEnabledPrayers !== null) {
          setEnabledPrayers(JSON.parse(savedEnabledPrayers));
        }
      } catch (error) {
        console.error("Error loading settings: ", error);
      } finally {
        setIsSettingsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('language', language);
        console.log("Saved language:", language);
      } catch (error) {
        console.error("Error saving language: ", error);
      }
    })();
    I18nManager.forceRTL(language === "ar");
  }, [language]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      (async () => {
        try {
          await AsyncStorage.setItem('isDarkMode', isDarkMode.toString());
          console.log("Saved dark mode:", isDarkMode);
        } catch (error) {
          console.error("Error saving dark mode:", error);
        }
      })();
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isSettingsLoaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem('enabledPrayers', JSON.stringify(enabledPrayers));
      } catch (error) {
        console.error("Error saving enabledPrayers: ", error);
      }
    })();
  }, [enabledPrayers, isSettingsLoaded]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
        console.log("Saved scheduled notifications:", scheduledNotifications);
      } catch (error) {
        console.error("Error saving scheduled notifications:", error);
      }
    })();
  }, [scheduledNotifications]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('selectedLocation', selectedLocation);
        console.log("Saved location:", selectedLocation);
      } catch (error) {
        console.error("Error saving location:", error);
      }
    })();
  }, [selectedLocation]);

  /* --- Schedule Upcoming Notifications for Next 30 Days --- */
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
  }, [isSettingsLoaded, selectedLocation, enabledPrayers]);

  /* --- Update Current Prayer Data --- */
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

  /* --- Upcoming Prayer Timer --- */
  useEffect(() => {
    if (currentPrayer && currentIndex === getTodayIndex(locationData)) {
      if (upcomingTimer.current) {
        clearTimeout(upcomingTimer.current);
      }
      const updateUpcomingPrayer = () => {
        const upcoming = getUpcomingPrayerKey();
        setUpcomingPrayerKey(upcoming);
        if (upcoming) {
          const prayerTime = parsePrayerTime(currentPrayer[upcoming]);
          const now = new Date();
          const msUntilPrayer = prayerTime - now;
          if (msUntilPrayer <= 0) {
            updateUpcomingPrayer();
          } else {
            upcomingTimer.current = setTimeout(updateUpcomingPrayer, msUntilPrayer + 500);
          }
        } else {
          setUpcomingPrayerKey(null);
        }
      };
      updateUpcomingPrayer();
      return () => {
        if (upcomingTimer.current) clearTimeout(upcomingTimer.current);
      };
    } else {
      setUpcomingPrayerKey(null);
    }
  }, [currentPrayer, currentIndex, locationData, getTodayIndex, getUpcomingPrayerKey, parsePrayerTime]);

  /* --- Animation Transition --- */
  const animateTransition = useCallback(
    (newIndex, direction) => {
      Animated.timing(animation, {
        toValue: -direction * 300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(newIndex);
        setCurrentPrayer(locationData[newIndex]);
        animation.setValue(direction * 300);
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    },
    [animation, locationData]
  );

  /* --- Navigation & Toggle Handlers --- */
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

  const goToToday = useCallback(() => {
    const todayIdx = getTodayIndex(locationData);
    if (todayIdx !== -1 && todayIdx !== currentIndex) {
      const direction = todayIdx > currentIndex ? 1 : -1;
      animateTransition(todayIdx, direction);
    }
  }, [currentIndex, locationData, getTodayIndex, animateTransition]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  // Toggle notification for a prayer on the current day
  const handleNotificationToggle = useCallback(
    async (prayerKey) => {
      console.log(`Toggling notification for prayer: ${prayerKey}`);
      if (enabledPrayers[prayerKey]) {
        if (scheduledNotifications[prayerKey]) {
          await cancelLocalNotification(scheduledNotifications[prayerKey]);
          setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: null }));
        }
        setEnabledPrayers((prev) => ({ ...prev, [prayerKey]: false }));
        Alert.alert("تم إلغاء الإشعار لـ " + TRANSLATIONS[language][prayerKey]);
      } else {
        const timeStr = currentPrayer[prayerKey];
        if (timeStr) {
          const prayerTime = parsePrayerTime(timeStr);
          const localPrayerTime = moment(prayerTime).format('YYYY-MM-DD HH:mm:ss');
          const utcPrayerTime = moment(prayerTime).utc().format('YYYY-MM-DD HH:mm:ss');
          console.log(`Scheduling ${prayerKey} Notification - Local: ${localPrayerTime}, UTC: ${utcPrayerTime}`);
          if (prayerTime > new Date()) {
            const numericId = moment(prayerTime).format('YYYYMMDDHHmm');
            await scheduleLocalNotification(numericId, prayerKey, prayerTime);
            setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: numericId }));
          }
        }
        setEnabledPrayers((prev) => ({ ...prev, [prayerKey]: true }));
        Alert.alert("تم جدولة الإشعار لـ " + TRANSLATIONS[language][prayerKey]);
      }
    },
    [currentPrayer, enabledPrayers, scheduledNotifications, language, parsePrayerTime]
  );

  // Handle location changes with confirmation if notifications exist
  const handleLocationChange = (newLocation) => {
    if (
      Object.values(scheduledNotifications).some(val => val) ||
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
              await cancelAllNotifications(Object.values(scheduledNotifications).filter(Boolean));
              await cancelAllNotifications(upcomingNotificationIds);
              setScheduledNotifications({});
              setUpcomingNotificationIds([]);
              setSelectedLocation(newLocation);
              setIsLocationModalVisible(false);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      setSelectedLocation(newLocation);
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

  const isToday = useMemo(() => {
    return currentIndex === getTodayIndex(locationData);
  }, [currentIndex, locationData, getTodayIndex]);

  // Request OS notification permission on first launch
  useEffect(() => {
    requestOSNotificationPermission();
  }, []);

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
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkContainer, { direction: language === "ar" ? "rtl" : "ltr" }]}>
      <StatusBar translucent backgroundColor="transparent" />
      <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
        {TRANSLATIONS[language].prayerTimes}
      </Text>
      <Animated.View style={{ transform: [{ translateX: animation }] }}>
        <View style={[styles.card, isDarkMode && styles.darkCard, { position: "relative" }]}>
          <TouchableOpacity onPress={() => setIsQuoteModalVisible(true)} style={styles.infoButton}>
            <Icon name="information-circle-outline" size={24} color={isDarkMode ? "#66CCFF" : "#007AFF"} />
          </TouchableOpacity>
          <Text style={[styles.date, isDarkMode && styles.darkDate]}>
            {currentPrayer.date} — ({TRANSLATIONS[language].day} {currentPrayer.day_number})
          </Text>
          <View style={styles.dateRow}>
            <Text style={[styles.hijriDate, isDarkMode && styles.darkHijriDate]}>
              {hijriDate}
            </Text>
            <Text style={[styles.locationLabel, isDarkMode && styles.darkLocationLabel]}>
              {" - " + displayLocation}
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.prayerContainer}>
            {["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"].map((key) => {
              console.log(`Rendering prayer ${key}: enabled =`, enabledPrayers[key]);
              return (
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
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
      <View style={[styles.navigation, { direction: "ltr" }]}>
        <TouchableOpacity onPress={handlePrevious} disabled={currentIndex === 0}>
          <Icon name="arrow-back-circle" size={60} color={currentIndex === 0 ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Icon name="today-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleDarkMode}>
          <Icon name={isDarkMode ? "sunny-outline" : "moon-outline"} size={50} color={isDarkMode ? "#FFA500" : "#007AFF"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleLanguage}>
          <Icon name="language-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLocationModalVisible(true)}>
          <Icon name="location-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsCompassVisible(true)}>
          <Icon name="compass-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} disabled={currentIndex === locationData.length - 1}>
          <Icon name="arrow-forward-circle" size={60} color={currentIndex === locationData.length - 1 ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>
      <Modal animationType="fade" transparent={true} visible={isQuoteModalVisible} onRequestClose={() => setIsQuoteModalVisible(false)}>
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
      <Modal animationType="slide" transparent={true} visible={isLocationModalVisible} onRequestClose={() => setIsLocationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkModalTitle]}>
              {TRANSLATIONS[language].selectLocation}
            </Text>
            {Object.keys(prayerData).map((loc) => {
              const locDisplay = LOCATION_NAMES[loc] ? LOCATION_NAMES[loc][language] : loc;
              return (
                <TouchableOpacity key={loc} style={styles.locationOption} onPress={() => handleLocationChange(loc)}>
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
      <Modal animationType="slide" transparent={false} visible={isCompassVisible} onRequestClose={() => setIsCompassVisible(false)}>
        <QiblaCompass isDarkMode={isDarkMode} language={language} onClose={() => setIsCompassVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}
