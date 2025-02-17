import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment-hijri';
import prayerData from './assets/prayer_times.json';
import dailyQuotes from './data/quotes';
import messaging from '@react-native-firebase/messaging';
import { storePrayerTime } from './savePrayerTime';

// Import the QiblaCompass component
import QiblaCompass from './QiblaCompass';

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
    isScheduled,
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
            name={isScheduled ? "notifications" : "notifications-outline"}
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
  // Existing states
  const [language, setLanguage] = useState("ar");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState({});
  const [selectedLocation, setSelectedLocation] = useState("beirut");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isQuoteModalVisible, setIsQuoteModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [upcomingPrayerKey, setUpcomingPrayerKey] = useState(null);
  const [deviceToken, setDeviceToken] = useState(null);
  
  // New state for showing Qibla Compass
  const [isCompassVisible, setIsCompassVisible] = useState(false);

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

  // Returns the index of today's prayer data from the provided data array.
  const getTodayIndex = useCallback((data) => {
    const today = new Date();
    const formattedDate = moment(today).format('DD/MM/YYYY');
    return data.findIndex((item) => item.date === formattedDate);
  }, []);

  // Converts a time string "HH:mm" to a Date object for today.
  const parsePrayerTime = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  }, []);

  // Determines the upcoming prayer key based on the current time.
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

  /* --- Firebase Messaging Setup --- */
  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) {
          Alert.alert('Permission for notifications not granted!');
          return;
        }
        const token = await messaging().getToken();
        console.log("FCM Token:", token);
        setDeviceToken(token);
      } catch (error) {
        console.error("Error registering for FCM:", error);
      }
    };
    registerForPushNotificationsAsync();

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert("New Notification", JSON.stringify(remoteMessage.notification));
    });
    return unsubscribe;
  }, []);

  /* --- AsyncStorage: Load Settings --- */
  useEffect(() => {
    (async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedDarkMode = await AsyncStorage.getItem('isDarkMode');
        const savedLocation = await AsyncStorage.getItem('selectedLocation');
        console.log("Loaded settings:", { savedLanguage, savedDarkMode, savedLocation });
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }
        if (savedLocation !== null) {
          setSelectedLocation(savedLocation);
        }
      } catch (error) {
        console.error("Error loading settings: ", error);
      } finally {
        setIsSettingsLoaded(true);
      }
    })();
  }, []);

  /* --- AsyncStorage: Load Scheduled Notifications --- */
  useEffect(() => {
    (async () => {
      try {
        const savedNotifications = await AsyncStorage.getItem('scheduledNotifications');
        if (savedNotifications !== null) {
          setScheduledNotifications(JSON.parse(savedNotifications));
        }
      } catch (error) {
        console.error("Error loading scheduled notifications:", error);
      }
    })();
  }, []);

  /* --- AsyncStorage: Save Settings --- */
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
    (async () => {
      try {
        await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
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

  const handleNotificationToggle = useCallback(
    async (prayerKey) => {
      if (scheduledNotifications[prayerKey]) {
        setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: null }));
        console.log("Notification cancelled for", prayerKey);
        Alert.alert(
          "تم إلغاء الإشعار لـ " + TRANSLATIONS[language][prayerKey]
        );
      } else {
        const timeString = currentPrayer[prayerKey];
        const docId = await storePrayerTime(prayerKey, timeString, deviceToken);
        if (docId) {
          setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: docId }));
          Alert.alert("تم جدولة الإشعار لـ " + TRANSLATIONS[language][prayerKey]);
        }
      }
    },
    [currentPrayer, deviceToken, scheduledNotifications, language]
  );

  // Derived values for display
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

  /* --- Render Loading Screen if Settings or Data Not Ready --- */
  if (!isSettingsLoaded || !currentPrayer) {
    return (
      <SafeAreaView
        style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}
      >
        <StatusBar translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
          {TRANSLATIONS[language].loading}
        </Text>
      </SafeAreaView>
    );
  }

  /* --- Main Render --- */
  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isDarkMode && styles.darkContainer,
        { direction: language === "ar" ? "rtl" : "ltr" },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" />
      <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
        {TRANSLATIONS[language].prayerTimes}
      </Text>
      <Animated.View style={{ transform: [{ translateX: animation }] }}>
        <View style={[styles.card, isDarkMode && styles.darkCard, { position: "relative" }]}>
          <TouchableOpacity
            onPress={() => setIsQuoteModalVisible(true)}
            style={styles.infoButton}
          >
            <Icon
              name="information-circle-outline"
              size={24}
              color={isDarkMode ? "#66CCFF" : "#007AFF"}
            />
          </TouchableOpacity>
          <Text style={[styles.date, isDarkMode && styles.darkDate]}>
            {currentPrayer.date} — ({TRANSLATIONS[language].day}{" "}
            {currentPrayer.day_number})
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
            {["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"].map(
              (key) => (
                <PrayerRow
                  key={key}
                  prayerKey={key}
                  time={currentPrayer[key]}
                  label={TRANSLATIONS[language][key]}
                  iconName={PRAYER_ICONS[key]}
                  isUpcoming={isToday && key === upcomingPrayerKey}
                  isScheduled={!!scheduledNotifications[key]}
                  onToggleNotification={handleNotificationToggle}
                  isDarkMode={isDarkMode}
                  upcomingLabel={TRANSLATIONS[language].upcoming}
                />
              )
            )}
          </ScrollView>
        </View>
      </Animated.View>
      <View style={[styles.navigation, { direction: "ltr" }]}>
        <TouchableOpacity onPress={handlePrevious} disabled={currentIndex === 0}>
          <Icon
            name="arrow-back-circle"
            size={60}
            color={currentIndex === 0 ? "#ccc" : "#007AFF"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Icon name="today-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleDarkMode}>
          <Icon
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={50}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleLanguage}>
          <Icon name="language-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLocationModalVisible(true)}>
          <Icon name="location-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        {/* New button to open the Qibla Compass */}
        <TouchableOpacity onPress={() => setIsCompassVisible(true)}>
          <Icon name="compass-outline" size={50} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          disabled={currentIndex === locationData.length - 1}
        >
          <Icon
            name="arrow-forward-circle"
            size={60}
            color={currentIndex === locationData.length - 1 ? "#ccc" : "#007AFF"}
          />
        </TouchableOpacity>
      </View>
      {/* Daily Quote Modal */}
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
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsQuoteModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, isDarkMode && styles.darkCloseButtonText]}>
                {TRANSLATIONS[language].close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Location Selection Modal */}
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
              const locDisplay = LOCATION_NAMES[loc]
                ? LOCATION_NAMES[loc][language]
                : loc;
              return (
                <TouchableOpacity
                  key={loc}
                  style={styles.locationOption}
                  onPress={() => {
                    setSelectedLocation(loc);
                    setIsLocationModalVisible(false);
                  }}
                >
                  <Text style={[styles.locationOptionText, isDarkMode && styles.darkLocationOptionText]}>
                    {locDisplay}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsLocationModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, isDarkMode && styles.darkCloseButtonText]}>
                X
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Qibla Compass Modal */}
     {/* Qibla Compass Modal */}
<Modal
  animationType="slide"
  transparent={false}
  visible={isCompassVisible}
  onRequestClose={() => setIsCompassVisible(false)}
>
  <QiblaCompass 
    isDarkMode={isDarkMode} 
    language={language} 
    onClose={() => setIsCompassVisible(false)}
  />
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

