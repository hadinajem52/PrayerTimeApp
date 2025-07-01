import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Geolocation from 'react-native-geolocation-service';
import CompassHeading from 'react-native-compass-heading';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const { width, height } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width * 0.8, 300);

// Kaaba coordinates (Mecca, Saudi Arabia)
const KAABA_COORDINATES = {
  latitude: 21.4225,
  longitude: 39.8262,
};

// Translations
const TRANSLATIONS = {
  en: {
    title: 'Qibla Compass',
    accuracy: 'Accuracy',
    distance: 'Distance',
    toMecca: 'to Mecca',
    excellent: 'Excellent',
    good: 'Good',
    poor: 'Poor',
    gettingLocation: 'Getting your location...',
    locationError: 'Unable to get your location. Please check your GPS settings.',
    locationPermissionError: 'Location permission is required to determine Qibla direction.',
    tryAgain: 'Try Again',
    refresh: 'Tap to refresh or calibrate your device by moving it in a figure-8 pattern',
    calibrate: 'Calibrate',
  },
  ar: {
    title: 'بوصلة القبلة',
    accuracy: 'الدقة',
    distance: 'المسافة',
    toMecca: 'إلى مكة',
    excellent: 'ممتاز',
    good: 'جيد',
    poor: 'ضعيف',
    gettingLocation: 'جار تحديد موقعك...',
    locationError: 'لا يمكن الحصول على موقعك. يرجى التحقق من إعدادات GPS.',
    locationPermissionError: 'إذن الموقع مطلوب لتحديد اتجاه القبلة.',
    tryAgain: 'أعد المحاولة',
    refresh: 'اضغط للتحديث أو المعايرة بتحريك الجهاز في شكل الرقم 8',
    calibrate: 'معايرة',
  },
};

const QiblaCompass = ({ isDarkMode = false, language = 'en', onClose }) => {
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isCompassEnabled, setIsCompassEnabled] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const compassRotation = useRef(new Animated.Value(0)).current;
  const needleRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Calculate bearing between two coordinates
  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Request location permissions
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to determine Qibla direction.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Get user's current location
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ latitude, longitude });
        setAccuracy(accuracy);
        setIsLocationEnabled(true);
        
        // Calculate Qibla direction
        const bearing = calculateBearing(
          latitude, longitude,
          KAABA_COORDINATES.latitude, KAABA_COORDINATES.longitude
        );
        setQiblaDirection(bearing);
        
        // Calculate distance to Kaaba
        const dist = calculateDistance(
          latitude, longitude,
          KAABA_COORDINATES.latitude, KAABA_COORDINATES.longitude
        );
        setDistance(dist);
        
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.log('Location error:', error);
        setError(t.locationError);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // Start compass heading updates
  const startCompass = () => {
    const degree_update_rate = 3; // Update every 3 degrees change
    
    CompassHeading.start(degree_update_rate, (compassHeading) => {
      setHeading(compassHeading);
      setIsCompassEnabled(true);
      
      // Smooth rotation animation
      Animated.timing(compassRotation, {
        toValue: -compassHeading,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Calculate needle rotation relative to Qibla
      const needleAngle = qiblaDirection - compassHeading;
      Animated.timing(needleRotation, {
        toValue: needleAngle,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Stop compass updates
  const stopCompass = () => {
    CompassHeading.stop();
    setIsCompassEnabled(false);
  };

  // Pulse animation for accuracy indicator
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Initialize compass and location
  const initializeCompass = async () => {
    setIsLoading(true);
    const hasPermission = await requestLocationPermission();
    
    if (hasPermission) {
      getCurrentLocation();
      startCompass();
      startPulseAnimation();
    } else {        setError(t.locationPermissionError);
      setIsLoading(false);
    }
  };

  // Refresh location and compass
  const refreshCompass = () => {
    setIsLoading(true);
    getCurrentLocation();
  };

  useEffect(() => {
    initializeCompass();
    
    return () => {
      stopCompass();
    };
  }, []);

  // Get accuracy color based on GPS accuracy
  const getAccuracyColor = () => {
    if (accuracy <= 5) return '#4CAF50'; // Excellent
    if (accuracy <= 10) return '#FF9800'; // Good
    return '#F44336'; // Poor
  };

  // Get accuracy text
  const getAccuracyText = () => {
    if (accuracy <= 5) return t.excellent;
    if (accuracy <= 10) return t.good;
    return t.poor;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={isDarkMode ? '#222' : '#EAEFF2'} 
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={moderateScale(24)} color={isDarkMode ? '#FFF' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            {t.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.loadingCircle, { transform: [{ scale: pulseAnim }] }]}>
              <FontAwesome5 name="kaaba" size={moderateScale(40)} color={isDarkMode ? '#66CCFF' : '#007AFF'} />
            </Animated.View>
            <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
              {t.gettingLocation}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={isDarkMode ? '#222' : '#EAEFF2'} 
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={moderateScale(24)} color={isDarkMode ? '#FFF' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            {t.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={styles.errorContainer}>
            <Icon name="location-outline" size={moderateScale(50)} color="#F44336" />
            <Text style={[styles.errorText, isDarkMode && styles.darkText]}>
              {error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={initializeCompass}>
              <Text style={styles.retryButtonText}>{t.tryAgain}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#222' : '#EAEFF2'} 
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={moderateScale(24)} color={isDarkMode ? '#FFF' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
          {t.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.card, isDarkMode && styles.darkCard]}>
        
        {/* Accuracy and Distance Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="location" size={moderateScale(16)} color={getAccuracyColor()} />
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{t.accuracy}</Text>
              <Text style={[styles.infoValue, { color: getAccuracyColor() }]}>
                {getAccuracyText()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="kaaba" size={moderateScale(14)} color={isDarkMode ? '#66CCFF' : '#007AFF'} />
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>{t.distance}</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>
                {distance.toFixed(0)} km
              </Text>
            </View>
          </View>
        </View>

        {/* Compass Container */}
        <View style={styles.compassContainer}>
          {/* Compass Base */}
          <Animated.View 
            style={[
              styles.compassBase,
              {
                transform: [{ rotate: compassRotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                })}]
              }
            ]}
          >
            {/* Compass Rose */}
            <View style={[styles.compassRose, isDarkMode && styles.darkCompassRose]}>
              {/* Cardinal Directions */}
              <Text style={[styles.cardinalN, isDarkMode && styles.darkCardinal]}>N</Text>
              <Text style={[styles.cardinalE, isDarkMode && styles.darkCardinal]}>E</Text>
              <Text style={[styles.cardinalS, isDarkMode && styles.darkCardinal]}>S</Text>
              <Text style={[styles.cardinalW, isDarkMode && styles.darkCardinal]}>W</Text>
              
              {/* Degree Markers */}
              {Array.from({ length: 36 }, (_, i) => {
                const angle = i * 10;
                const isMainDirection = angle % 90 === 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.degreeMarker,
                      isMainDirection && styles.mainDegreeMarker,
                      isDarkMode && isMainDirection && styles.darkMainDegreeMarker,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -COMPASS_SIZE / 2 + 10 }
                        ]
                      }
                    ]}
                  />
                );
              })}
            </View>
          </Animated.View>

          {/* Qibla Needle */}
          <Animated.View
            style={[
              styles.needleContainer,
              {
                transform: [{ rotate: needleRotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                })}]
              }
            ]}
          >
            <View style={styles.needle}>
              <View style={[styles.needlePoint, isDarkMode && styles.darkNeedlePoint]} />
              <View style={[styles.needleBody, isDarkMode && styles.darkNeedleBody]} />
              <View style={styles.needleTail} />
            </View>
          </Animated.View>

          {/* Center Kaaba Icon */}
          <View style={[styles.centerIcon, isDarkMode && styles.darkCenterIcon]}>
            <FontAwesome5 name="kaaba" size={moderateScale(24)} color={isDarkMode ? '#66CCFF' : '#007AFF'} />
          </View>

          {/* Direction Indicator */}
          <View style={styles.directionIndicator}>
            <Text style={[styles.directionText, isDarkMode && styles.darkText]}>
              {Math.round(qiblaDirection)}°
            </Text>
            <Text style={[styles.directionLabel, isDarkMode && styles.darkText]}>
              {t.toMecca}
            </Text>
          </View>
        </View>

        {/* Calibration Reminder */}
        <TouchableOpacity style={styles.calibrationContainer} onPress={refreshCompass}>
          <Icon name="refresh" size={moderateScale(16)} color={isDarkMode ? '#66CCFF' : '#007AFF'} />
          <Text style={[styles.calibrationText, isDarkMode && styles.darkText]}>
            {t.refresh}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAEFF2',
  },
  darkContainer: {
    backgroundColor: '#222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: moderateScale(5),
  },
  headerSpacer: {
    width: moderateScale(34), // Same width as close button to center title
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(15),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(10),
    elevation: 8,
    margin: moderateScale(20),
    alignItems: 'center',
    flex: 1,
  },
  darkCard: {
    backgroundColor: '#333',
  },
  darkText: {
    color: '#FFF',
  },
  infoContainer: {
    width: '100%',
    marginBottom: moderateScale(20),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: '#666',
    marginTop: moderateScale(4),
  },
  infoValue: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginTop: moderateScale(2),
  },
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: moderateScale(20),
  },
  compassBase: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassRose: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  darkCompassRose: {
    borderColor: '#555',
    backgroundColor: '#2A2A2A',
  },
  cardinalN: {
    position: 'absolute',
    top: moderateScale(10),
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cardinalE: {
    position: 'absolute',
    right: moderateScale(10),
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#666',
  },
  cardinalS: {
    position: 'absolute',
    bottom: moderateScale(10),
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#666',
  },
  cardinalW: {
    position: 'absolute',
    left: moderateScale(10),
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#666',
  },
  darkCardinal: {
    color: '#CCC',
  },
  degreeMarker: {
    position: 'absolute',
    width: 1,
    height: moderateScale(10),
    backgroundColor: '#CCC',
  },
  mainDegreeMarker: {
    width: 2,
    height: moderateScale(15),
    backgroundColor: '#007AFF',
  },
  darkMainDegreeMarker: {
    backgroundColor: '#66CCFF',
  },
  needleContainer: {
    position: 'absolute',
    width: COMPASS_SIZE * 0.8,
    height: COMPASS_SIZE * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  needle: {
    width: 4,
    height: COMPASS_SIZE * 0.6,
    alignItems: 'center',
  },
  needlePoint: {
    width: 0,
    height: 0,
    borderLeftWidth: moderateScale(8),
    borderRightWidth: moderateScale(8),
    borderBottomWidth: moderateScale(30),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF4444',
    marginBottom: moderateScale(2),
  },
  darkNeedlePoint: {
    borderBottomColor: '#FF6666',
  },
  needleBody: {
    width: moderateScale(4),
    height: COMPASS_SIZE * 0.3,
    backgroundColor: '#FF4444',
  },
  darkNeedleBody: {
    backgroundColor: '#FF6666',
  },
  needleTail: {
    width: moderateScale(6),
    height: moderateScale(20),
    backgroundColor: '#DDD',
    marginTop: moderateScale(2),
  },
  centerIcon: {
    position: 'absolute',
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  darkCenterIcon: {
    backgroundColor: '#333',
  },
  directionIndicator: {
    position: 'absolute',
    top: -moderateScale(40),
    alignItems: 'center',
  },
  directionText: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#007AFF',
  },
  directionLabel: {
    fontSize: moderateScale(12),
    color: '#666',
    marginTop: moderateScale(2),
  },
  calibrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(20),
    paddingHorizontal: moderateScale(15),
  },
  calibrationText: {
    fontSize: moderateScale(12),
    color: '#666',
    marginLeft: moderateScale(8),
    textAlign: 'center',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: moderateScale(40),
    flex: 1,
    justifyContent: 'center',
  },
  loadingCircle: {
    marginBottom: moderateScale(20),
  },
  loadingText: {
    fontSize: moderateScale(16),
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: moderateScale(40),
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: moderateScale(16),
    color: '#666',
    textAlign: 'center',
    marginVertical: moderateScale(20),
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default QiblaCompass;
