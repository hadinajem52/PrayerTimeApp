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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CompassHeading from 'react-native-compass-heading';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const QiblaCompass = ({ isDarkMode = false, language = "en", onClose = () => {} }) => {
  // Translations for English and Arabic
  const TRANSLATIONS = {
    en: {
      qiblaCompass: "Qibla Compass",
      deviceHeading: "Device Heading",
      qiblaDirection: "Qibla Direction",
      rotateNeedle: "Rotate Needle by",
      flatSurfaceNotice: "For improved accuracy, place your phone on a flat surface.",
      magnetometerNotice: "Note: The magnetometer on some devices may provide inaccurate directions.",
      close: "Close",
      loading: "Loading Qibla direction..."
    },
    ar: {
      qiblaCompass: "بوصلة القبلة",
      deviceHeading: "اتجاه الجهاز",
      qiblaDirection: "اتجاه القبلة",
      rotateNeedle: "تدوير الإبرة بمقدار",
      flatSurfaceNotice: "للحصول على دقة أفضل، يرجى وضع هاتفك على سطح مستوٍ.",
      magnetometerNotice: "ملاحظة: قد يوفر مقياس المغناطيسية في بعض الأجهزة اتجاهات غير دقيقة.",
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
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.headerText, isDarkMode && styles.darkHeaderText]}>
          {TRANSLATIONS[language].qiblaCompass}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close-circle" size={28} color={isDarkMode ? "#FFA500" : "#007AFF"} />
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={[styles.card, isDarkMode && styles.darkCard]}>
        {!location ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={isDarkMode ? '#66CCFF' : '#007AFF'}
            />
            <Text style={[styles.loadingText, isDarkMode && styles.darkLoadingText]}>
              {TRANSLATIONS[language].loading}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.noticeText, isDarkMode && styles.darkNoticeText]}>
              {TRANSLATIONS[language].flatSurfaceNotice}
            </Text>

            {/* Animated info section */}
            <Animated.View style={styles.infoContainer}>
              <View style={[styles.infoBox, isDarkMode && styles.darkInfoBox]}>
                <Icon name="compass" size={20} color={isDarkMode ? "#FFA500" : "#007AFF"} />
                <Text style={[styles.infoLabel, isDarkMode && styles.darkInfoLabel]}>
                  {TRANSLATIONS[language].deviceHeading}:
                </Text>
                <Text style={[styles.infoValue, isDarkMode && styles.darkInfoValue]}>
                  {deviceHeading.toFixed(1)}°
                </Text>
              </View>

              <View style={[styles.infoBox, isDarkMode && styles.darkInfoBox]}>
                <Icon name="location" size={20} color={isDarkMode ? "#FFA500" : "#007AFF"} />
                <Text style={[styles.infoLabel, isDarkMode && styles.darkInfoLabel]}>
                  {TRANSLATIONS[language].qiblaDirection}:
                </Text>
                <Text style={[styles.infoValue, isDarkMode && styles.darkInfoValue]}>
                  {qiblaDirection.toFixed(1)}°
                </Text>
              </View>
            </Animated.View>

            {/* Compass View */}
            <View style={styles.compassWrapper}>
              <LinearGradient
                colors={isDarkMode ? ['#2A2A2A', '#333', '#2A2A2A'] : ['#F0F8FF', '#F5F5F5', '#F0F8FF']}
                style={[
                  styles.compassContainer,
                  {
                    width: compassSize,
                    height: compassSize,
                    borderRadius: compassSize / 2,
                  },
                ]}
              >
                {/* Compass markers */}
                <View style={[styles.compassMarker, styles.northMarker]} />
                <View style={[styles.compassMarker, styles.eastMarker]} />
                <View style={[styles.compassMarker, styles.southMarker]} />
                <View style={[styles.compassMarker, styles.westMarker]} />
                
                {/* Cardinal directions */}
                <Text style={[styles.cardinalDirection, styles.northDirection, isDarkMode && styles.darkCardinalDirection]}>N</Text>
                <Text style={[styles.cardinalDirection, styles.eastDirection, isDarkMode && styles.darkCardinalDirection]}>E</Text>
                <Text style={[styles.cardinalDirection, styles.southDirection, isDarkMode && styles.darkCardinalDirection]}>S</Text>
                <Text style={[styles.cardinalDirection, styles.westDirection, isDarkMode && styles.darkCardinalDirection]}>W</Text>

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
                
                {/* Center dot */}
                <View style={[styles.centerDot, isDarkMode && styles.darkCenterDot]} />
              </LinearGradient>
            </View>

            <Text style={[styles.noticeText, isDarkMode && styles.darkNoticeText, styles.bottomNotice]}>
              {TRANSLATIONS[language].magnetometerNotice}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAEFF2',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 35 : 10,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    position: 'relative',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  darkHeaderText: {
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    padding: 5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 25,
    paddingHorizontal: 20,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
    marginTop: 10,
    flex: 1,
  },
  darkCard: {
    backgroundColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  noticeText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginVertical: 15,
    paddingHorizontal: 15,
    lineHeight: 20,
  },
  darkNoticeText: {
    color: '#AAA',
  },
  bottomNotice: {
    marginTop: 25,
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 15,
  },
  infoBox: {
    backgroundColor: 'rgba(102, 204, 255, 0.1)',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  darkInfoBox: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  darkInfoLabel: {
    color: '#DDD',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 3,
  },
  darkInfoValue: {
    color: '#FFA500',
  },
  compassWrapper: {
    padding: 10,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#66CCFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 7,
    overflow: 'visible',
  },
  compassMarker: {
    position: 'absolute',
    width: 4,
    height: 12,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  northMarker: {
    top: 10,
    transform: [{ translateX: 0 }],
  },
  eastMarker: {
    right: 10,
    transform: [{ rotate: '90deg' }],
  },
  southMarker: {
    bottom: 10,
    transform: [{ translateX: 0 }],
  },
  westMarker: {
    left: 10,
    transform: [{ rotate: '90deg' }],
  },
  cardinalDirection: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  darkCardinalDirection: {
    color: '#FFA500',
  },
  northDirection: {
    top: 25,
  },
  eastDirection: {
    right: 25,
  },
  southDirection: {
    bottom: 25,
  },
  westDirection: {
    left: 25,
  },
  needle: {
    width: 150,
    height: 150,
    position: 'absolute',
    resizeMode: 'contain',
  },
  kaabaIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  centerDot: {
    width: 12,
    height: 12,
    backgroundColor: '#FF4136',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
    position: 'absolute',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  darkCenterDot: {
    borderColor: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#007AFF',
  },
  darkLoadingText: {
    color: '#66CCFF',
  },
});

export default QiblaCompass;
