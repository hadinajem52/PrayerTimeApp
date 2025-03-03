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
  
  // Get time format from settings
  const [settings] = useSettings();
  const { timeFormat } = settings;

  // Format the time according to user preference
  const formattedTime = formatTimeString(time, timeFormat);
  
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
    fadeAnim.setValue(0);
    AnimationUtils.fadeIn(fadeAnim, 400);
  }, []); // Empty dependency array
  
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
        {formattedTime}
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
  // Only include props that actually need re-renders
  return prevProps.time === nextProps.time &&
         prevProps.isUpcoming === nextProps.isUpcoming &&
         prevProps.isEnabled === nextProps.isEnabled &&
         prevProps.isDarkMode === nextProps.isDarkMode;
});
