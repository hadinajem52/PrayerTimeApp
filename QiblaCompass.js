import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CompassHeading from 'react-native-compass-heading';
import Geolocation from 'react-native-geolocation-service';

const QiblaCompass = ({ isDarkMode = false, language = "en", onClose = () => {} }) => {
  // Translations for English and Arabic
  const TRANSLATIONS = {
    en: {
      qiblaCompass: "Qibla Compass",
      deviceHeading: "Device Heading",
      qiblaDirection: "Qibla Direction",
      rotateNeedle: "Rotate Needle by",
      flatSurfaceNotice: "For improved accuracy, place your phone on a flat surface.",
      close: "Close",
      loading: "Loading Qibla direction..."
    },
    ar: {
      qiblaCompass: "بوصلة القبلة",
      deviceHeading: "اتجاه الجهاز",
      qiblaDirection: "اتجاه القبلة",
      rotateNeedle: "تدوير الإبرة بمقدار",
      flatSurfaceNotice: "للحصول على دقة أفضل، يرجى وضع هاتفك على سطح مستوٍ.",
      close: "إغلاق",
      loading: "جاري تحميل اتجاه القبلة..."
    },
  };

  const [deviceHeading, setDeviceHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [location, setLocation] = useState(null);
  const [currentAnimatedRotation, setCurrentAnimatedRotation] = useState(0);

  // Animated value for needle rotation and a ref to track last rotation
  const animatedRotation = useRef(new Animated.Value(0)).current;
  const lastRotationRef = useRef(0);

  // Listen to animatedRotation updates for positioning
  useEffect(() => {
    const id = animatedRotation.addListener(({ value }) => {
      setCurrentAnimatedRotation(value);
    });
    return () => {
      animatedRotation.removeListener(id);
    };
  }, [animatedRotation]);

  // Start compass sensor updates
  useEffect(() => {
    const degree_update_rate = 1; // update when heading changes by at least 1°
    CompassHeading.start(degree_update_rate, ({ heading }) => {
      setDeviceHeading(heading);
    });
    return () => {
      CompassHeading.stop();
    };
  }, [location]);

  // Request location permission and watch location changes
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
            distanceFilter: 1,
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

  // Calculate Qibla bearing when location is available/changes
  useEffect(() => {
    if (location) {
      const { latitude, longitude } = location;
      const bearing = calculateBearing(latitude, longitude);
      setQiblaDirection(bearing);
    }
  }, [location]);

  // Calculate bearing from current location to the Kaaba
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

  // Update the needle rotation using the shortest path
  useEffect(() => {
    const newRotation = ((qiblaDirection - deviceHeading) + 360) % 360;
    let diff = newRotation - lastRotationRef.current;
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }
    const targetRotation = lastRotationRef.current + diff;
    Animated.timing(animatedRotation, {
      toValue: targetRotation,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      lastRotationRef.current = targetRotation;
    });
  }, [deviceHeading, qiblaDirection, animatedRotation]);

  // --- Updated Compass Dimensions & Calculations ---
  const compassSize = 220; // Increased overall size
  const center = compassSize / 2; // e.g., 110
  const kaabaSize = 40;
  const kaabaMargin = 11;
  const rIcon = center + (kaabaSize / 2) + kaabaMargin;
  const kaabaAngleRad = (currentAnimatedRotation - 90) * (Math.PI / 180);
  const kaabaX = center + rIcon * Math.cos(kaabaAngleRad) - (kaabaSize / 2);
  const kaabaY = center + rIcon * Math.sin(kaabaAngleRad) - (kaabaSize / 2);

  // If location is not available (and so qiblaDirection is still 0), show a loading indicator.
  if (!location) {
    return (
      <SafeAreaView
        style={[styles.safeArea, isDarkMode && styles.darkContainer]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? '#66CCFF' : '#007AFF'}
          />
          <Text style={[styles.loadingText, isDarkMode && styles.darkLoadingText]}>
            {TRANSLATIONS[language].loading}
          </Text>
        </View>
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
      <View style={[styles.card, isDarkMode && styles.darkCard]}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeButtonText, isDarkMode && styles.darkCloseButtonText]}>
            {TRANSLATIONS[language].close}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.header, isDarkMode && styles.darkHeader]}>
          {TRANSLATIONS[language].qiblaCompass}
        </Text>
        <Text style={[styles.noticeText, isDarkMode && styles.darkNoticeText]}>
          {TRANSLATIONS[language].flatSurfaceNotice}
        </Text>
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, isDarkMode && styles.darkInfoText]}>
            {TRANSLATIONS[language].deviceHeading}: {deviceHeading.toFixed(2)}°
          </Text>
          <Text style={[styles.infoText, isDarkMode && styles.darkInfoText]}>
            {TRANSLATIONS[language].qiblaDirection}: {qiblaDirection.toFixed(2)}°
          </Text>
          <Text style={[styles.infoText, isDarkMode && styles.darkInfoText]}>
            {TRANSLATIONS[language].rotateNeedle}: {currentAnimatedRotation.toFixed(2)}°
          </Text>
        </View>
        <View
          style={[
            styles.compassContainer,
            {
              width: compassSize,
              height: compassSize,
              borderRadius: compassSize / 2,
            },
          ]}
        >
          {/* Vertical Alignment Indicator */}
          <View style={[styles.verticalIndicator, { left: center - 10 }]} />
          
          {/* Compass Needle */}
          <Animated.Image
            source={require('./assets/compass-needle.png')}
            style={[
              styles.needle,
              {
                transform: [
                  {
                    rotate: animatedRotation.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
          {/* Kaaba Icon */}
          <Image
            source={require('./assets/kaaba.png')}
            style={[styles.kaabaIcon, { left: kaabaX, top: kaabaY }]}
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
    backgroundColor: '#121212',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
    minHeight: 590, // Increased height for more space at the bottom
  },
  darkCard: {
    backgroundColor: '#333',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 2,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  darkCloseButtonText: {
    color: '#FFF',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
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
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  darkNoticeText: {
    color: '#AAA',
  },
  infoContainer: {
    marginVertical: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 3,
  },
  darkInfoText: {
    color: '#66CCFF',
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
    backgroundColor: '#F0F4F7',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'visible',
  },
  needle: {
    width: 150,
    height: 150,
    position: 'absolute',
    resizeMode: 'contain',
  },
  verticalIndicator: {
    position: 'absolute',
    top: -20,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#007AFF',
    zIndex: 10,
  },
  kaabaIcon: {
    position: 'absolute',
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  centerDot: {
    width: 12,
    height: 12,
    backgroundColor: 'red',
    borderRadius: 6,
    position: 'absolute',
    zIndex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  darkLoadingText: {
    color: '#66CCFF',
  },
});

export default QiblaCompass;
