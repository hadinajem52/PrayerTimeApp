import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../styles'; // Assume you export your styles from a separate file

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
    return (
      <View style={[styles.prayerRow, isUpcoming && upcomingStyle]}>
        <Icon
          name={iconName}
          size={24}
          color={isDarkMode ? "#FFA500" : "#007AFF"}
          style={styles.prayerIcon}
        />
        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>{label}</Text>
        <Text style={[styles.value, isDarkMode && styles.darkValue]}>{time}</Text>
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

export default PrayerRow;
