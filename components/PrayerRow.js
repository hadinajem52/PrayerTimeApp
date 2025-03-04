import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';
import { AnimationUtils } from '../utils/animations';
import { formatTimeString } from '../utils/timeFormatters';
import useSettings from '../hooks/useSettings';

// Helper to get the correct icon component based on prayer key
const getIconComponent = (prayerKey) => {
  if (prayerKey === 'fajr' || prayerKey === 'maghrib') {
    return Feather;
  } else if (prayerKey === 'asr') {
    return MaterialIcons;
  }
  return Ionicons;
};

// Prayer row icons
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

// Helper to convert to Arabic numerals
const toArabicNumerals = (str) => {
  const arabicNumerals = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  
  return str.toString().replace(/[0-9]/g, match => arabicNumerals[match]);
};

const PrayerRow = ({ 
  prayerKey, 
  time, 
  label, 
  iconName = null, 
  isUpcoming, 
  isEnabled, 
  onToggleNotification, 
  isDarkMode,
  upcomingLabel,
  language // Add language prop
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const notificationAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [wasEnabled, setWasEnabled] = useState(isEnabled);
  const isFirstRender = useRef(true);
  
  // Get time format and useArabicNumerals from settings
  const [settings] = useSettings();
  const { timeFormat, useArabicNumerals } = settings;

  // Format the time according to user preference, passing language and useArabicNumerals
  const formattedTime = formatTimeString(time, timeFormat, language, useArabicNumerals);
  
  // No need for separate display time processing since it's handled in the formatTimeString function
  const displayTime = formattedTime;
  
  // Animation when row becomes the upcoming prayer
  useEffect(() => {
    if (isUpcoming) {
      AnimationUtils.pulse(scaleAnim);
    }
  }, [isUpcoming, scaleAnim]);
  
  // Animation when enabling/disabling notifications
  useEffect(() => {
    if (wasEnabled !== isEnabled) {
      AnimationUtils.bounce(notificationAnim);
      setWasEnabled(isEnabled);
    }
  }, [isEnabled, notificationAnim, wasEnabled]);
  
  // Handle initial mount animation
  useEffect(() => {
    if (isFirstRender.current) {
      fadeAnim.setValue(0);
      AnimationUtils.fadeIn(fadeAnim, 400);
      isFirstRender.current = false;
    }
  }, []);
  
  const IconComponent = getIconComponent(prayerKey);
  
  return (
    <Animated.View 
      key={prayerKey}
      style={[
        styles.prayerRow,
        isUpcoming ? 
          (isDarkMode ? styles.upcomingPrayerDark : styles.upcomingPrayerLight) : 
          null,
        {
          opacity: fadeAnim,
          transform: [
            { scale: isUpcoming ? scaleAnim : 1 }
          ]
        }
      ]}
    >
      {isUpcoming && (
        <View style={styles.ribbon}>
          <Text style={styles.ribbonText}>{upcomingLabel}</Text>
        </View>
      )}
      
      <IconComponent 
        name={iconName || PRAYER_ICONS[prayerKey] || 'time-outline'} 
        size={24} 
        color={isDarkMode ? "#FFA500" : "#007AFF"}
        style={styles.prayerIcon}
      />
      
      <Text style={[styles.label, isDarkMode && styles.darkLabel]}>
        {label}
      </Text>
      
      <Text style={[styles.value, isDarkMode && styles.darkValue]}>
        {displayTime}
      </Text>
      
      <Animated.View style={{
        transform: [{ scale: notificationAnim }]
      }}>
        <TouchableOpacity onPress={() => onToggleNotification(prayerKey)}>
          <Ionicons
            name={isEnabled ? "notifications" : "notifications-off-outline"}
            size={24}
            color={isEnabled ? (isDarkMode ? "#FFA500" : "#007AFF") : "#999"}
          />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// Ensure component re-renders when settings change
export default React.memo(PrayerRow, (prevProps, nextProps) => {
  return prevProps.time === nextProps.time &&
         prevProps.isUpcoming === nextProps.isUpcoming &&
         prevProps.isEnabled === nextProps.isEnabled &&
         prevProps.isDarkMode === nextProps.isDarkMode &&
         prevProps.language === nextProps.language;
});
