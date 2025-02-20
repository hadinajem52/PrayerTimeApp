import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  StyleSheet,
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

import {
  scheduleLocalNotification,
  cancelLocalNotification,
  scheduleNotificationsForUpcomingPeriod,
  cancelAllNotifications,
} from './notificationsender';

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
    console.log(`PrayerRow: ${prayerKey} enabled =`, isEnabled);
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
  // State declarations
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

  // Global enabled-prayer state (persisted via AsyncStorage)
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

  // Memoized location data based on selected location
  const locationData = useMemo(() => {
    return prayerData[selectedLocation] || [];
  }, [selectedLocation]);

  // Daily quote based on the current day and language
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

  // Parse a prayer time string (e.g., "5:19") into a Date object for today
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

  /* --- OS Notification Permission Request --- */
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

  /* --- AsyncStorage: Load & Save Settings (including enabledPrayers) --- */
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

  // Persist enabledPrayers only after settings are loaded
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

  // Save scheduled (current day) notifications locally if needed
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

  /* --- Schedule Upcoming Notifications for the Next 30 Days Based on Enabled Prayers --- */
  useEffect(() => {
    if (isSettingsLoaded && selectedLocation) {
      // Cancel previous upcoming notifications if any
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
  }, [
    currentPrayer,
    currentIndex,
    locationData,
    getTodayIndex,
    getUpcomingPrayerKey,
    parsePrayerTime,
  ]);

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

  // Toggle notification for a single prayer on the current day and update global preference
  const handleNotificationToggle = useCallback(
    async (prayerKey) => {
      console.log(`Toggling notification for prayer: ${prayerKey}`);
      if (enabledPrayers[prayerKey]) {
        // Disable: cancel current day's notification if it exists
        if (scheduledNotifications[prayerKey]) {
          await cancelLocalNotification(scheduledNotifications[prayerKey]);
          setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: null }));
        }
        setEnabledPrayers((prev) => ({ ...prev, [prayerKey]: false }));
        Alert.alert("تم إلغاء الإشعار لـ " + TRANSLATIONS[language][prayerKey]);
      } else {
        // Enable: schedule notification for current day if the time is still in the future
        const timeStr = currentPrayer[prayerKey];
        if (timeStr) {
          const prayerTime = parsePrayerTime(timeStr);
          if (prayerTime > new Date()) {
            const notificationId = `${prayerKey}-${currentPrayer.date}`;
            await scheduleLocalNotification(notificationId, prayerKey, prayerTime);
            setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: notificationId }));
          }
        }
        setEnabledPrayers((prev) => ({ ...prev, [prayerKey]: true }));
        Alert.alert("تم جدولة الإشعار لـ " + TRANSLATIONS[language][prayerKey]);
      }
    },
    [currentPrayer, enabledPrayers, scheduledNotifications, language, parsePrayerTime]
  );

  // Handle location changes with confirmation if notifications are scheduled (both current day and upcoming)
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
              // Cancel all current notifications
              await cancelAllNotifications(Object.values(scheduledNotifications).filter(Boolean));
              await cancelAllNotifications(upcomingNotificationIds);
              // Clear notification states and update location
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

/* --- Styles --- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAEFF2',
  },
  darkContainer: {
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAEFF2',
  },
  header: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  darkHeader: {
    color: '#FFF',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  darkCard: {
    backgroundColor: '#333',
  },
  date: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
    color: '#007AFF',
  },
  darkDate: {
    color: '#66CCFF',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  hijriDate: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#555',
  },
  darkHijriDate: {
    color: '#CCC',
  },
  locationLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 5,
  },
  darkLocationLabel: {
    color: '#66CCFF',
  },
  prayerContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  prayerRow: {
    flexDirection: 'row',
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    position: 'relative',
  },
  upcomingPrayerLight: {
    backgroundColor: '#E0F7FA',
    borderColor: '#007AFF',
    borderWidth: 2,
    borderRadius: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  upcomingPrayerDark: {
    backgroundColor: '#333',
    borderColor: '#FFA500',
    borderWidth: 2,
    borderRadius: 10,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  prayerIcon: {
    marginRight: 10,
  },
  label: {
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  darkLabel: {
    color: '#CCC',
  },
  value: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  darkValue: {
    color: '#FFF',
  },
  ribbon: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF4500',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ribbonText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  darkModalContent: {
    backgroundColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
  },
  darkModalTitle: {
    color: '#FFF',
  },
  locationOption: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  locationOptionText: {
    fontSize: 18,
    color: '#007AFF',
  },
  darkLocationOptionText: {
    color: '#66CCFF',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  darkCloseButtonText: {
    color: '#FFF',
  },
  infoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  quoteModalText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 10,
  },
  darkQuoteModalText: {
    color: '#66CCFF',
  },
});
