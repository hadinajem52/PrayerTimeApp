import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const QuoteIconButton = ({ isDarkMode, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'absolute',
        top: 15,
        right: 15,
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
        <FontAwesome6
          name="hands-praying"
          size={17}
          color="#FFF"
        />
      </View>
    </TouchableOpacity>
  );
};

export default QuoteIconButton;
