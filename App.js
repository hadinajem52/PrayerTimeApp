import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment-hijri';
import prayerData from './assets/prayer_times.json';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [language, setLanguage] = useState("ar");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [upcomingPrayerKey, setUpcomingPrayerKey] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState({});

  const isInitialMount = useRef(true);
  const animation = useRef(new Animated.Value(0)).current;
  const upcomingTimer = useRef(null);

  const translations = {
    en: {
      prayerTimes:
        "Prayer Times according to the opinion of His Eminence Imam Khamenei (Beirut)",
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
    },
    ar: {
      prayerTimes:
        "مواقيت صلاة مدينة بيروت طبقًا لرأي سماحة الإمام الخامنئي (دام ظله)",
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
    },
  };

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission for notifications not granted!');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedDarkMode = await AsyncStorage.getItem('isDarkMode');
        console.log("Loaded settings:", { savedLanguage, savedDarkMode });
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
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
        const savedNotifications = await AsyncStorage.getItem('scheduledNotifications');
        if (savedNotifications !== null) {
          setScheduledNotifications(JSON.parse(savedNotifications));
        }
      } catch (error) {
        console.error("Error loading scheduled notifications:", error);
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
          console.error("Error saving dark mode setting: ", error);
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

  const prayerIcons = {
    fajr: 'cloudy-night',
    shuruq: 'partly-sunny',
    dhuhr: 'sunny',
    asr: 'sunny',
    maghrib: 'moon',
    isha: 'moon',
    imsak: 'cloudy-night',
  };

  const getTodayIndex = () => {
    const today = new Date();
    const formattedDate = moment(today).format('DD/MM/YYYY'); 
    return prayerData.findIndex(item => item.date === formattedDate);
  };

  useEffect(() => {
    const index = getTodayIndex();
    if (index !== -1) {
      setCurrentIndex(index);
      setCurrentPrayer(prayerData[index]);
    } else {
      setCurrentPrayer(prayerData[0]);
    }
  }, []);

  const parsePrayerTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  };

  const getUpcomingPrayerKey = () => {
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
  };

  useEffect(() => {
    if (currentPrayer && currentIndex === getTodayIndex()) {
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
  }, [currentPrayer, currentIndex]);

  const animateTransition = (newIndex, direction) => {
    Animated.timing(animation, {
      toValue: -direction * 300, 
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(newIndex);
      setCurrentPrayer(prayerData[newIndex]);
      animation.setValue(direction * 300);
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      animateTransition(newIndex, -1);
    }
  };

  const handleNext = () => {
    if (currentIndex < prayerData.length - 1) {
      const newIndex = currentIndex + 1;
      animateTransition(newIndex, 1);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const goToToday = () => {
    const todayIndex = getTodayIndex();
    if (todayIndex !== -1 && todayIndex !== currentIndex) {
      const direction = todayIndex > currentIndex ? 1 : -1;
      animateTransition(todayIndex, direction);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "en" ? "ar" : "en"));
  };

  const isToday = currentIndex === getTodayIndex();

  const schedulePrayerNotification = async (prayerKey, timeString) => {
    const [hour, minute] = timeString.split(':').map(Number);
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: translations[language].prayerTimes,
          body: `It's time for ${translations[language][prayerKey]} prayer.`,
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });
      return notificationId;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  };

  const handleNotificationToggle = async (prayerKey) => {
    if (scheduledNotifications[prayerKey]) {
      await Notifications.cancelScheduledNotificationAsync(scheduledNotifications[prayerKey]);
      setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: null }));
    } else {
      const timeString = currentPrayer[prayerKey];
      const notificationId = await schedulePrayerNotification(prayerKey, timeString);
      if (notificationId) {
        setScheduledNotifications((prev) => ({ ...prev, [prayerKey]: notificationId }));
      }
    }
  };

  const renderPrayerRow = (key, value) => {
    const iconName = prayerIcons[key];
    const isUpcoming = isToday && key === upcomingPrayerKey;
    const upcomingStyle = isDarkMode ? styles.upcomingPrayerDark : styles.upcomingPrayerLight;
    return (
      <View key={key} style={[styles.prayerRow, isUpcoming && upcomingStyle]}>
        <Icon
          name={iconName}
          size={24}
          color={isDarkMode ? "#FFA500" : "#007AFF"}
          style={styles.prayerIcon}
        />
        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>
          {translations[language][key]}
        </Text>
        <Text style={[styles.value, isDarkMode && styles.darkValue]}>
          {value}
        </Text>
        <TouchableOpacity onPress={() => handleNotificationToggle(key)}>
          <Icon
            name={scheduledNotifications[key] ? "notifications" : "notifications-outline"}
            size={24}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>
        {isUpcoming && (
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>
              {translations[language].upcoming}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!isSettingsLoaded || !currentPrayer) {
    return (
      <SafeAreaView style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <StatusBar translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
          {translations[language].loading}
        </Text>
      </SafeAreaView>
    );
  }

  const hijriDate = moment(currentPrayer.date, "D/M/YYYY").format('iD iMMMM iYYYY');

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isDarkMode && styles.darkContainer,
        { direction: language === "ar" ? 'rtl' : 'ltr' },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" />
      <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
        {translations[language].prayerTimes}
      </Text>
      <Animated.View style={{ transform: [{ translateX: animation }] }}>
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <Text style={[styles.date, isDarkMode && styles.darkDate]}>
            {currentPrayer.date} — ({translations[language].day} {currentPrayer.day_number})
          </Text>
          <Text style={[styles.hijriDate, isDarkMode && styles.darkHijriDate]}>
            {hijriDate}
          </Text>
          <ScrollView contentContainerStyle={styles.prayerContainer}>
            {renderPrayerRow('imsak', currentPrayer.imsak)}
            {renderPrayerRow('fajr', currentPrayer.fajr)}
            {renderPrayerRow('shuruq', currentPrayer.shuruq)}
            {renderPrayerRow('dhuhr', currentPrayer.dhuhr)}
            {renderPrayerRow('asr', currentPrayer.asr)}
            {renderPrayerRow('maghrib', currentPrayer.maghrib)}
            {renderPrayerRow('isha', currentPrayer.isha)}
          </ScrollView>
        </View>
      </Animated.View>
      <View style={[styles.navigation, { direction: "ltr" }]}>
        <TouchableOpacity onPress={handlePrevious} disabled={currentIndex === 0}>
          <Icon
            name="arrow-back-circle"
            size={60}
            color={currentIndex === 0 ? '#ccc' : '#007AFF'}
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
        <TouchableOpacity onPress={handleNext} disabled={currentIndex === prayerData.length - 1}>
          <Icon
            name="arrow-forward-circle"
            size={60}
            color={currentIndex === prayerData.length - 1 ? '#ccc' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
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
  hijriDate: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#555',
    marginBottom: 15,
  },
  darkHijriDate: {
    color: '#CCC',
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
});
