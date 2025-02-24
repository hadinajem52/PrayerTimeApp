import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from '../styles';

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
    const upcomingStyle = isDarkMode ? styles.upcomingPrayerDark : styles.upcomingPrayerLight;
    
    const renderIcon = () => {
      // For fajr and maghrib, use Feather for sunrise/sunset icons
      if (prayerKey === 'fajr' || prayerKey === 'maghrib') {
        return (
          <Feather
            name={iconName}
            size={24}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
            style={styles.prayerIcon}
          />
        );
      } else if (prayerKey === 'asr') {
        // For asr, use MaterialIcons (for example, "sunny-snowing")
        return (
          <MaterialIcons
            name={iconName}
            size={24}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
            style={styles.prayerIcon}
          />
        );
      } else {
        // For the rest, use Ionicons
        return (
          <Ionicons
            name={iconName}
            size={24}
            color={isDarkMode ? "#FFA500" : "#007AFF"}
            style={styles.prayerIcon}
          />
        );
      }
    };

    return (
      <View style={[styles.prayerRow, isUpcoming && upcomingStyle]}>
        {renderIcon()}
        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>{label}</Text>
        <Text style={[styles.value, isDarkMode && styles.darkValue]}>{time}</Text>
        <TouchableOpacity onPress={() => onToggleNotification(prayerKey)}>
          <Ionicons
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

export default PrayerRow;
