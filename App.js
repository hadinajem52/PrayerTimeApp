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
import moment from 'moment-hijri';
import prayerData from './assets/prayer_times.json';
import dailyQuotes from './data/quotes';
import QiblaCompass from './QiblaCompass';
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles';
import PrayerRow from './components/PrayerRow';
import useSettings from './hooks/useSettings';
import usePrayerTimer from './hooks/usePrayerTimer';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';

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
  } = useNotificationScheduler(language);

  const animation = useRef(new Animated.Value(0)).current;

  const locationData = useMemo(() => {
    return prayerData[selectedLocation] || [];
  }, [selectedLocation]);

  const dailyQuote = useMemo(() => {
    const todayIndex = new Date().getDate() % dailyQuotes.length;
    return dailyQuotes[todayIndex][language];
  }, [language]);

  // Helpers for date and prayer calculations
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

  // Use the custom hook to manage the upcoming prayer timer.
  const upcomingPrayerKey = usePrayerTimer(
    currentPrayer,
    currentIndex,
    locationData,
    getTodayIndex,
    parsePrayerTime,
    getUpcomingPrayerKeyCallback
  );

  // Ensure RTL layout if needed.
  useEffect(() => {
    I18nManager.forceRTL(language === "ar");
  }, [language]);

  // Request OS-level notification permission.
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

  // Notifee initialization.
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

  // Schedule upcoming notifications for the next 30 days.
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

  // Update current prayer data.
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

  // Animation transition between days.
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
    setSettings((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, [setSettings]);

  const toggleLanguage = useCallback(() => {
    setSettings((prev) => ({ ...prev, language: prev.language === "en" ? "ar" : "en" }));
  }, [setSettings]);

  // Toggle notification for a prayer on the current day.
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
        Alert.alert(
          (language === 'ar'
            ? "تم إلغاء الإشعار لـ "
            : "Notification cancelled for ") + TRANSLATIONS[language][prayerKey]
        );
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
        Alert.alert(
          (language === 'ar'
            ? "تم جدولة الإشعار لـ "
            : "Notification scheduled for ") + TRANSLATIONS[language][prayerKey]
        );
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

  // Handle location change with confirmation if notifications exist.
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
      <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
        {TRANSLATIONS[language].prayerTimes}
      </Text>
      <Animated.View style={{ transform: [{ translateX: animation }] }}>
        <View style={[styles.card, isDarkMode && styles.darkCard, { position: "relative" }]}>
          <TouchableOpacity onPress={() => setIsQuoteModalVisible(true)} style={styles.infoButton}>
            <Icon
              name="information-circle-outline"
              size={24}
              color={isDarkMode ? "#66CCFF" : "#007AFF"}
            />
          </TouchableOpacity>
          <Text style={[styles.date, isDarkMode && styles.darkDate]}>
            {currentPrayer.date} — ({TRANSLATIONS[language].day} {currentPrayer.day_number})
          </Text>
          <View style={styles.dateRow}>
            <Text style={[styles.hijriDate, isDarkMode && styles.darkHijriDate]}>{hijriDate}</Text>
            <Text style={[styles.locationLabel, isDarkMode && styles.darkLocationLabel]}>
              {" - " + displayLocation}
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.prayerContainer}>
            {["imsak", "fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"].map((key) => (
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
