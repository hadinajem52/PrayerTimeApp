import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CompassHeading from 'react-native-compass-heading';
import Geolocation from 'react-native-geolocation-service';

const QiblaCompass = ({ isDarkMode = false, language = "en", onClose = () => {} }) => {
  // Translation object for English and Arabic
  const TRANSLATIONS = {
    en: {
      qiblaCompass: "Qibla Compass",
      deviceHeading: "Device Heading",
      qiblaDirection: "Qibla Direction",
      rotateNeedle: "Rotate Needle by",
      flatSurfaceNotice: "For improved accuracy, please place your phone on a flat surface.",
      close: "Close",
    },
    ar: {
      qiblaCompass: "بوصلة القبلة",
      deviceHeading: "اتجاه الجهاز",
      qiblaDirection: "اتجاه القبلة",
      rotateNeedle: "تدوير الإبرة بمقدار",
      flatSurfaceNotice: "للحصول على دقة أفضل، يرجى وضع هاتفك على سطح مستوٍ.",
      close: "إغلاق",
    },
  };

  const [deviceHeading, setDeviceHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [location, setLocation] = useState(null);

  // Start compass sensor updates
  useEffect(() => {
    const degree_update_rate = 1; // Update when heading changes by at least 1°
    CompassHeading.start(degree_update_rate, ({ heading }) => {
      // Optionally, adjust for magnetic declination here if needed.
      setDeviceHeading(heading);
    });
    return () => {
      CompassHeading.stop();
    };
  }, [location]);

  // Request location permission and continuously watch location changes
  useEffect(() => {
    let watchId;
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message:
                'This app needs access to your location to calculate Qibla direction',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Location permission denied');
            return;
          }
        }
        watchId = Geolocation.watchPosition(
          (position) => {
            setLocation(position.coords);
          },
          (error) => console.error(error),
          {
            enableHighAccuracy: true,
            distanceFilter: 1, // update when user moves at least 1 meter
            interval: 5000,
            fastestInterval: 2000,
          }
        );
      } catch (err) {
        console.warn(err);
      }
    };

    requestLocationPermission();

    return () => {
      if (watchId !== undefined) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Calculate Qibla bearing once we have location (or when it changes)
  useEffect(() => {
    if (location) {
      const { latitude, longitude } = location;
      const bearing = calculateBearing(latitude, longitude);
      setQiblaDirection(bearing);
    }
  }, [location]);

  // Function to calculate bearing from current location to the Kaaba
  const calculateBearing = (
    lat1,
    lon1,
    lat2 = 21.4225, // Kaaba latitude
    lon2 = 39.8262  // Kaaba longitude
  ) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δλ = toRad(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    return bearing;
  };

  // Calculate the rotation angle for the compass needle and normalize it
  const rotation = ((qiblaDirection - deviceHeading) + 360) % 360;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isDarkMode && styles.darkContainer,
        { direction: language === "ar" ? "rtl" : "ltr" },
      ]}
    >
      <View style={[styles.card, isDarkMode && styles.darkCard]}>
        {/* Close button positioned at the top-right of the card */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeButtonText, isDarkMode && styles.darkCloseButtonText]}>
            {TRANSLATIONS[language].close}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
          {TRANSLATIONS[language].qiblaCompass}
        </Text>
        {/* Notices for improved accuracy */}
        <Text style={[styles.noticeText, isDarkMode && styles.darkNoticeText]}>
          {TRANSLATIONS[language].flatSurfaceNotice}
        </Text>
        <Text style={[styles.noticeText, isDarkMode && styles.darkNoticeText]}>
          {TRANSLATIONS[language].additionalNotice}
        </Text>
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, isDarkMode && styles.darkInfoText]}>
            {TRANSLATIONS[language].deviceHeading}: {deviceHeading.toFixed(2)}°
          </Text>
          <Text style={[styles.infoText, isDarkMode && styles.darkInfoText]}>
            {TRANSLATIONS[language].qiblaDirection}: {qiblaDirection.toFixed(2)}°
          </Text>
          <Text style={[styles.infoText, isDarkMode && styles.darkInfoText]}>
            {TRANSLATIONS[language].rotateNeedle}: {rotation.toFixed(2)}°
          </Text>
        </View>
        <View style={styles.compassContainer}>
          <Image
            source={require('./assets/compass-needle.png')}
            style={[styles.needle, { transform: [{ rotate: `${rotation}deg` }] }]}
          />
          <View style={styles.centerDot} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAEFF2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#222',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
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
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  darkCloseButtonText: {
    color: '#FFF',
  },
  header: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  darkHeader: {
    color: '#66CCFF',
  },
  noticeText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginVertical: 3,
  },
  darkNoticeText: {
    color: '#AAA',
  },
  infoContainer: {
    marginVertical: 10,
  },
  infoText: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 3,
  },
  darkInfoText: {
    color: '#66CCFF',
  },
  compassContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 100,
    borderColor: '#ccc',
    marginTop: 20,
  },
  needle: {
    width: 150,
    height: 150,
    position: 'absolute',
    resizeMode: 'contain',
  },
  centerDot: {
    width: 10,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    position: 'absolute',
  },
});

export default QiblaCompass;
