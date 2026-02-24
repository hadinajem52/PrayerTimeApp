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
import dailyQuotes from './data/quotes';
import QiblaFinderWebView from './QiblaFinderWebView';
import notifee, { AndroidImportance } from '@notifee/react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import styles from './styles/appStyles';
import PrayerRow from './components/PrayerRow';
import useSettings from './hooks/useSettings';
import usePrayerTimer from './hooks/usePrayerTimer';
import {
  useNotificationScheduler,
  getPrayerTimesForDayStatic,
} from './hooks/useNotificationScheduler';
import { moderateScale } from 'react-native-size-matters';
import Settings from './components/Settings';
import CalendarView from './components/Calendar';
import SkeletonLoader from './components/SkeletonLoader';
import { AnimationUtils } from './utils/animations';
import { UpdateManager } from './components/UpdateManager';
import './firebase';
import MonthTransitionNotice from './components/MonthTransitionNotice';
import { toArabicNumerals } from './utils/timeFormatters';
import { PrayerTimesProvider, usePrayerTimes } from './components/PrayerTimesProvider';
import Rate, { AndroidMarket } from 'react-native-rate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RatingModal from './components/RatingModal';
import DeviceInfo from 'react-native-device-info';
import * as IntentLauncher from 'expo-intent-launcher';
import {
  PRAYER_ICONS,
  LOCATION_NAMES,
  PRAYER_ORDER,
} from './constants/prayerConfig';
import Countdown from './components/Countdown';
import TodayIndicator from './components/TodayIndicator';
import QuoteIconButton from './components/QuoteIconButton';
import LocationItem from './components/LocationItem';
import { TRANSLATIONS } from './constants/translations/app';
import {
  NOTIF_CHANNEL_SOUND,
  NOTIF_CHANNEL_DEFAULT,
  NOTIF_MIGRATED_V2_KEY,
  NOTIF_PRAYER_ID_PREFIX,
} from './constants/notificationConfig';


// ----- Main App Component -----
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <PrayerTimesProvider>
        <MainApp />
      </PrayerTimesProvider>
    </SafeAreaProvider>
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
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);

  const [isBatteryModalVisible, setIsBatteryModalVisible] = useState(false);
  const [isBatteryOptimizationEnabled, setIsBatteryOptimizationEnabled] = useState(true);

  const {
    cancelAllNotifications,
    scheduleRollingNotifications,
    isLoading: notificationsLoading,
    isDataAvailable,
  } = useNotificationScheduler(language, settings.usePrayerSound ?? true);

  const animation = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const locationChangeAnim = useRef(new Animated.Value(1)).current;
  const navigationBarAnim = useRef(new Animated.Value(1)).current;
  const settingsButtonAnim = useRef(new Animated.Value(1)).current;
  const calendarButtonAnim = useRef(new Animated.Value(1)).current;
  const locationButtonAnim = useRef(new Animated.Value(1)).current;
  const compassButtonAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);
  // Prevent duplicate scheduling by effects right after manual reschedule on location change
  const justChangedLocationRef = useRef(false);
  // Mirror of upcomingNotificationIds so the debounced scheduling callback can
  // read the latest IDs without them becoming an effect dependency (which would
  // cause an infinite reschedule loop after each successful scheduling pass).
  const pendingNotifIdsRef = useRef([]);

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
    const now = new Date();
    for (let key of PRAYER_ORDER) {
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

  const formatDate = useCallback((dateStr, lang) => {
    if (!dateStr) return "";

    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);

    const translations = TRANSLATIONS[lang];
    const dayName = translations.days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = translations.months[date.getMonth()];

    const formattedDayNum = lang === 'ar' ? toArabicNumerals(String(dayNum)) : String(dayNum);

    return `${dayName} ${formattedDayNum} ${monthName}`;
  }, []);

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
            onPress: () => { },
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
              // Reset and clear any stored notification mapping
              setSettings((prev) => ({ ...prev, scheduledNotifications: {} }));
              setSettings((prev) => ({ ...prev, selectedLocation: newLocation }));

              // Proactively schedule notifications for the new location
              try {
                const ids = await scheduleRollingNotifications(newLocation, enabledPrayers);
                if (Array.isArray(ids)) setUpcomingNotificationIds(ids);
              } catch (e) {
                console.error('Failed to schedule rolling notifications after location change:', e);
              }
              // Signal the next effect pass to skip re-scheduling once
              justChangedLocationRef.current = true;
              setIsLocationModalVisible(false);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      AnimationUtils.pulse(locationChangeAnim);

      (async () => {
        try {
          // Ensure a clean state and force fresh scheduling
          const scheduledIds = Object.values(scheduledNotifications).filter(Boolean);
          if (scheduledIds.length > 0) await cancelAllNotifications(scheduledIds);
          if (upcomingNotificationIds.length > 0) {
            await cancelAllNotifications(upcomingNotificationIds);
            setUpcomingNotificationIds([]);
          }
        } catch (e) {
          console.warn('Error during notification cleanup on quick location change:', e);
        }

        setSettings((prev) => ({ ...prev, scheduledNotifications: {} }));
        setSettings((prev) => ({ ...prev, selectedLocation: newLocation }));

        try {
          const ids = await scheduleRollingNotifications(newLocation, enabledPrayers);
          if (Array.isArray(ids)) setUpcomingNotificationIds(ids);
        } catch (e) {
          console.error('Failed to schedule rolling notifications on quick location change:', e);
        }

        justChangedLocationRef.current = true;
        setIsLocationModalVisible(false);
      })();
    }
  }, [
    TRANSLATIONS,
    language,
    locationChangeAnim,
    scheduledNotifications,
    upcomingNotificationIds,
    cancelAllNotifications,
    setSettings,
    setUpcomingNotificationIds,
    scheduleRollingNotifications,
    enabledPrayers,
  ]);

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
      const dayStr = toArabicNumerals(String(day));
      const yearStr = toArabicNumerals(String(year));
      return `${dayStr} ${monthName} ${yearStr}`;
    } else {
      return `${day} ${monthName} ${year}`;
    }
  }, [currentPrayer, language, settings.hijriDateOffset]);

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

  const upcomingIndex = PRAYER_ORDER.indexOf(upcomingPrayerKey);

  const lastPrayerKey = useMemo(() => {
    if (upcomingIndex > 0) {
      return PRAYER_ORDER[upcomingIndex - 1];
    }
    return 'imsak';
  }, [upcomingIndex]);

  const lastPrayerTime = useMemo(() => {
    if (upcomingIndex > 0 && currentPrayer) {
      const key = PRAYER_ORDER[upcomingIndex - 1];
      return parsePrayerTime(currentPrayer[key]);
    }
    return new Date();
  }, [upcomingIndex, currentPrayer, parsePrayerTime]);

  useEffect(() => {
    I18nManager.forceRTL(language === "ar");
  }, [language]);

  useEffect(() => {
    async function requestPermissions() {
      // Check Battery Optimization on Android
      if (Platform.OS === 'android') {
        try {
          // Determine if battery optimization is enabled for this app
          // notifee returns true if battery optimization is enabled (needs disabling)
          const isOptimized = await notifee.isBatteryOptimizationEnabled();
          setIsBatteryOptimizationEnabled(isOptimized);
          const dismissed = await AsyncStorage.getItem('batteryOptimizationDismissed');
          if (isOptimized && dismissed !== 'true') {
            setIsBatteryModalVisible(true);
          }
        } catch (e) {
          console.warn('Battery optimization check failed:', e);
        }
      }

      const settingsNotifee = await notifee.requestPermission();
      if (settingsNotifee.authorizationStatus >= 1) {
        console.log('Notifee permission granted:', settingsNotifee);
      } else {
        Alert.alert(
          TRANSLATIONS[language].notificationsDisabled,
          TRANSLATIONS[language].notificationPermissionMessage
        );
      }
    }
    requestPermissions();
  }, [language]);

  useEffect(() => {
    async function createChannels() {
      // Channel with custom adhan sound
      await notifee.createChannel({
        id: NOTIF_CHANNEL_SOUND,
        name: 'Prayer Notifications (Adhan)',
        importance: AndroidImportance.MAX,
        sound: 'prayersound',
        vibration: true,
      });

      // Channel with default system sound
      await notifee.createChannel({
        id: NOTIF_CHANNEL_DEFAULT,
        name: 'Prayer Notifications (Default)',
        importance: AndroidImportance.MAX,
        vibration: true,
        sound: 'default',
      });

      console.log('Notification channels created');
    }
    createChannels();
  }, []);

  // One-time migration: move scheduled notifications to v2 channels
  useEffect(() => {
    const migrateNotificationsToV2 = async () => {
      if (!isSettingsLoaded || !selectedLocation || !enabledPrayers) return;
      try {
        const migrated = await AsyncStorage.getItem(NOTIF_MIGRATED_V2_KEY);
        if (migrated === 'true') return;

        const triggers = await notifee.getTriggerNotifications();
        const idsToCancel = triggers
          .filter(tn => {
            const ch = tn.notification?.android?.channelId;
            // Cancel anything not explicitly on a v2 channel
            return !ch || !String(ch).endsWith('-v2');
          })
          .map(tn => String(tn.notification.id))
          .filter(Boolean);

        if (idsToCancel.length > 0) {
          console.log('[Migration] Cancelling', idsToCancel.length, 'old notifications');
          await cancelAllNotifications(idsToCancel);
        }

        // Reschedule upcoming notifications on v2 channels
        console.log('[Migration] Rescheduling notifications on v2 channels');
        await scheduleRollingNotifications(selectedLocation, enabledPrayers);

        await AsyncStorage.setItem(NOTIF_MIGRATED_V2_KEY, 'true');
        console.log('[Migration] Completed notification channel migration to v2');
      } catch (e) {
        console.error('[Migration] Failed migrating notifications to v2:', e);
      }
    };

    migrateNotificationsToV2();
  }, [isSettingsLoaded, selectedLocation, enabledPrayers, cancelAllNotifications, scheduleRollingNotifications]);

  const requestOSNotificationPermission = useCallback(async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: TRANSLATIONS[language].allowNotifications,
            message: TRANSLATIONS[language].notificationUsageMessage,
            buttonPositive: TRANSLATIONS[language].allow,
            buttonNegative: TRANSLATIONS[language].deny,
          }
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
          Alert.alert(
            TRANSLATIONS[language].notificationsDisabled,
            TRANSLATIONS[language].notificationPermissionMessage
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
  }, [language]);

  useEffect(() => {
    requestOSNotificationPermission();
  }, [requestOSNotificationPermission]);

  // Keep the ref in sync so the debounced callback always sees current IDs.
  useEffect(() => { pendingNotifIdsRef.current = upcomingNotificationIds; }, [upcomingNotificationIds]);

  // ── Unified, debounced scheduling effect ─────────────────────────────────
  // Single source of truth for all reactive auto-scheduling.  Waits for both
  // settings AND prayer data to be ready before attempting anything.
  // The 500 ms debounce coalesces rapid prayer-toggle changes into a single
  // scheduling pass, preventing overlapping async operations.
  useEffect(() => {
    if (!isSettingsLoaded || !isDataAvailable || !selectedLocation) return;

    // Skip one cycle right after a manual reschedule triggered by location change
    if (justChangedLocationRef.current) {
      justChangedLocationRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const staleIds = pendingNotifIdsRef.current;
        if (staleIds.length > 0) {
          await cancelAllNotifications(staleIds);
          setUpcomingNotificationIds([]);
        }
        const ids = await scheduleRollingNotifications(selectedLocation, enabledPrayers);
        if (Array.isArray(ids)) setUpcomingNotificationIds(ids);
      } catch (err) {
        console.error('[Notification] Error scheduling notifications:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    isSettingsLoaded,
    isDataAvailable,
    selectedLocation,
    enabledPrayers,
    cancelAllNotifications,
    scheduleRollingNotifications,
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

  // Effect B (previously a separate one-shot scheduling effect gated on
  // notificationsScheduled) has been merged into the unified debounced effect above.

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

  // NOTE: The duplicate AppState listener and setupDailyRefresh call that
  // previously lived here has been intentionally removed.  All foreground
  // recovery and daily refresh scheduling is handled by the single
  // AppState listener above (lines ~1244-1276) together with
  // scheduleRollingNotifications() which now always recreates the nightly
  // refresh trigger via scheduleNightlyRefreshTrigger().

  useEffect(() => {
    global.fetchPrayerData = refreshPrayerTimes;

    return () => {
      global.fetchPrayerData = undefined;
    };
  }, [refreshPrayerTimes]);

  // Apply notification sound preference immediately by rescheduling upcoming notifications
  useEffect(() => {
    const rescheduleForSoundChange = async () => {
      try {
        if (!isSettingsLoaded || !selectedLocation || !enabledPrayers || !isDataAvailable) return;
        console.log('[Notification Sound] Preference changed ->', settings.usePrayerSound ? 'Adhan' : 'Default');

        // Cancel only prayer trigger notifications (keep other app triggers intact)
        const triggers = await notifee.getTriggerNotifications();
        const prayerIds = triggers
          .map(tn => String(tn.notification?.id))
          .filter(id => id && id.startsWith(NOTIF_PRAYER_ID_PREFIX));

        if (prayerIds.length > 0) {
          await cancelAllNotifications(prayerIds);
        }

        // Reschedule with the new channel selection
        const ids = await scheduleRollingNotifications(selectedLocation, enabledPrayers);
        if (Array.isArray(ids)) setUpcomingNotificationIds(ids);
      } catch (e) {
        console.error('[Notification Sound] Failed to re-schedule after sound change:', e);
      }
    };
    rescheduleForSoundChange();
  }, [settings.usePrayerSound, isSettingsLoaded, selectedLocation, enabledPrayers, isDataAvailable, cancelAllNotifications, scheduleRollingNotifications]);

  // Rating functionality
  const checkAndShowRating = useCallback(async () => {
    try {
      // Check if user has already rated or dismissed the rating
      const hasRated = await AsyncStorage.getItem('hasRated');
      const ratingDismissed = await AsyncStorage.getItem('ratingDismissed');
      const lastRatingPrompt = await AsyncStorage.getItem('lastRatingPrompt');

      // Don't show if user has rated or permanently dismissed
      if (hasRated === 'true' || ratingDismissed === 'true') {
        return;
      }

      // Show rating popup every 7 days if user selected "Remind Me Later"
      const now = Date.now();
      if (lastRatingPrompt) {
        const daysSinceLastPrompt = (now - parseInt(lastRatingPrompt)) / (1000 * 60 * 60 * 24);
        if (daysSinceLastPrompt < 7) {
          return;
        }
      }

      // Show the rating modal
      setIsRatingModalVisible(true);
    } catch (error) {
      console.error('Error checking rating status:', error);
    }
  }, []);

  // Check and show rating popup
  useEffect(() => {
    // Show rating popup after 3 seconds when the app is fully loaded
    if (isSettingsLoaded && !prayerTimesLoading && !isLoading && !isBatteryModalVisible) {
      const timer = setTimeout(() => {
        checkAndShowRating();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSettingsLoaded, prayerTimesLoading, isLoading, isBatteryModalVisible, checkAndShowRating]);

  // Alarm permission modal removed

  if (prayerTimesError) {
    console.error("Prayer Times Error:", prayerTimesError);
    return (
      <SafeAreaView style={[{ flex: 1 }, isDarkMode && styles.darkContainer]}>
        <StatusBar translucent backgroundColor="transparent" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: isDarkMode ? '#FFF' : '#000', marginBottom: 20 }}>
            {language === 'en' ? 'Failed to load prayer times' : 'فشل تحميل أوقات الصلاة'}
          </Text>
          <TouchableOpacity
            style={{
              padding: 10,
              backgroundColor: isDarkMode ? '#D4AF37' : '#059669',
              borderRadius: 8
            }}
            onPress={refreshPrayerTimes}
          >
            <Text style={{ color: '#FFF' }}>
              {language === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSettingsLoaded || !currentPrayer || isLoading || prayerTimesLoading ||
    (notificationsLoading && !isOperationInProgress)) {
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
                borderColor: isDarkMode ? '#D4AF37' : '#059669',
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
                { transform: [{ scale: locationChangeAnim }] }
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
          borderColor: isDarkMode ? '#D4AF37' : '#059669',
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
            <Icon name="close" size={20} color={isDarkMode ? "#D4AF37" : "#059669"} />
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
                  (isSettingsVisible ? "#D4AF37" : "#D4AF37") :
                  (isSettingsVisible ? "#059669" : "#555")}
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
                (isCalendarVisible ? "#D4AF37" : "#D4AF37") :
                (isCalendarVisible ? "#059669" : "#555")}
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
                (isLocationModalVisible ? "#D4AF37" : "#D4AF37") :
                (isLocationModalVisible ? "#059669" : "#555")}
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
                (isCompassVisible ? "#D4AF37" : "#D4AF37") :
                (isCompassVisible ? "#059669" : "#555")}
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
            <View style={[
              styles.modalHeader,
              {
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: moderateScale(52),
                paddingVertical: moderateScale(10),
                // reserve space so title doesn't collide with the close button
                ...(language === 'ar' ? { paddingLeft: moderateScale(44) } : { paddingRight: moderateScale(44) })
              }
            ]}>
              <Text style={[styles.enhancedModalTitle, isDarkMode && styles.darkEnhancedModalTitle]}>
                {TRANSLATIONS[language].dailyQuote}
              </Text>
              <TouchableOpacity
                style={[
                  styles.roundedCloseButton,
                  isDarkMode && styles.darkRoundedCloseButton,
                  (
                    language === 'ar'
                      ? { left: moderateScale(12) }
                      : { right: moderateScale(12) }
                  ),
                  { top: moderateScale(8), position: 'absolute', zIndex: 10 }
                ]}
                onPress={() => setIsQuoteModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Icon name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.quoteContainer}>
              <FontAwesome6
                name="hands-praying"
                size={24}
                color={isDarkMode ? "#D4AF37" : "#059669"}
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
            <View style={[
              styles.modalHeader,
              {
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: moderateScale(52),
                paddingVertical: moderateScale(10),
                ...(language === 'ar' ? { paddingLeft: moderateScale(44) } : { paddingRight: moderateScale(44) })
              }
            ]}>
              <Text style={[styles.enhancedModalTitle, isDarkMode && styles.darkEnhancedModalTitle]}>
                {TRANSLATIONS[language].selectLocation}
              </Text>
              <TouchableOpacity
                style={[
                  styles.roundedCloseButton,
                  isDarkMode && styles.darkRoundedCloseButton,
                  (
                    language === 'ar'
                      ? { left: moderateScale(12) }
                      : { right: moderateScale(12) }
                  ),
                  { top: moderateScale(8), position: 'absolute', zIndex: 10 }
                ]}
                onPress={() => setIsLocationModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
        <QiblaFinderWebView isDarkMode={isDarkMode} language={language} onClose={() => setIsCompassVisible(false)} />
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
          updateUseArabicNumerals={(value) => setSettings(prev => ({ ...prev, useArabicNumerals: value }))}
          usePrayerSound={settings.usePrayerSound ?? true}
          updateUsePrayerSound={(value) => setSettings(prev => ({ ...prev, usePrayerSound: value }))}
        />
      </Modal>

      {/* Rating Modal */}
      <RatingModal
        visible={isRatingModalVisible}
        language={language}
        isDarkMode={isDarkMode}
        onClose={() => setIsRatingModalVisible(false)}
      />

      {/* Battery Optimization Modal */}
      <Modal
        visible={isBatteryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={async () => {
          setIsBatteryModalVisible(false);
          await AsyncStorage.setItem('batteryOptimizationDismissed', 'true');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && styles.darkModalContainer]}>
            <View style={[styles.modalHeader, isDarkMode && styles.darkModalHeader]}>
              <Icon
                name="battery-charging-outline"
                size={moderateScale(32)}
                color={isDarkMode ? '#D4AF37' : '#059669'}
              />
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                {TRANSLATIONS[language].batteryOptimization}
              </Text>
            </View>

            <Text style={[styles.modalMessage, isDarkMode && styles.darkText]}>
              {TRANSLATIONS[language].batteryOptimizationSettingDescription}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, isDarkMode && styles.darkCancelButton]}
                onPress={async () => {
                  setIsBatteryModalVisible(false);
                  await AsyncStorage.setItem('batteryOptimizationDismissed', 'true');
                }}
              >
                <Text style={[styles.cancelButtonText, isDarkMode && styles.darkCancelText]}>
                  {TRANSLATIONS[language].cancel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, isDarkMode && styles.darkConfirmButton]}
                onPress={async () => {
                  try {
                    const packageName = DeviceInfo.getBundleId();
                    await IntentLauncher.startActivityAsync(
                      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                      { data: `package:${packageName}` }
                    );
                  } catch (error) {
                    console.error('Error opening battery optimization settings:', error);
                    try {
                      await notifee.openBatteryOptimizationSettings();
                    } catch (e) {
                      console.error('Fallback battery optimization settings failed:', e);
                    }
                  } finally {
                    setIsBatteryModalVisible(false);
                    await AsyncStorage.setItem('batteryOptimizationDismissed', 'true');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>
                  {TRANSLATIONS[language].openSettings}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}
