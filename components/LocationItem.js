import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import styles from '../styles/appStyles';
import { LOCATION_ICONS } from '../constants/prayerConfig';

const LocationItem = React.memo(({
  loc,
  locDisplay,
  isSelected,
  isDarkMode,
  onPress,
}) => {
  const iconColor = isSelected
    ? (isDarkMode ? '#D4AF37' : '#059669')
    : (isDarkMode ? '#D4AF37' : '#555');

  return (
    <TouchableOpacity
      key={loc}
      style={[
        styles.enhancedLocationOption,
        isDarkMode && styles.darkEnhancedLocationOption,
        isSelected && styles.selectedLocationOption,
        isSelected && isDarkMode && styles.darkSelectedLocationOption,
      ]}
      onPress={onPress}
    >
      <View style={[
        styles.locationIconContainer,
        isDarkMode ? styles.darkLocationIconContainer : styles.lightLocationIconContainer,
        isSelected && styles.selectedLocationIconContainer,
      ]}
      >
        {loc === 'hermel' ? (
          <FontAwesome5
            name="mountain"
            size={18}
            color={iconColor}
            solid
          />
        ) : (
          <MaterialCommunityIcons
            name={LOCATION_ICONS[loc] || 'map-marker'}
            size={24}
            color={iconColor}
          />
        )}
      </View>
      <Text style={[
        styles.enhancedLocationText,
        isDarkMode && styles.darkEnhancedLocationText,
        isSelected && styles.selectedLocationText,
        isSelected && isDarkMode && styles.darkSelectedLocationText,
      ]}
      >
        {locDisplay}
      </Text>
      {isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={22}
          color={isDarkMode ? '#D4AF37' : '#059669'}
          style={styles.selectedCheckmark}
        />
      )}
    </TouchableOpacity>
  );
});

export default LocationItem;
