import React from 'react';
import { View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TodayIndicator = ({ isDarkMode }) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 15,
        left: 15,
        zIndex: 5,
      }}
    >
      <View
        style={{
          backgroundColor: isDarkMode ? '#D4AF37' : '#059669',
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 20,
          shadowColor: isDarkMode ? '#D4AF37' : '#059669',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 6,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons
          name="today"
          size={20}
          color="#FFF"
        />
      </View>
    </View>
  );
};

export default TodayIndicator;
