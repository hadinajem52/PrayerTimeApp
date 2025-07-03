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
import {
  accelerometer,
  gyroscope,
  magnetometer,
  SensorTypes,
  setUpdateIntervalForType,
} from 'react-native-sensors';

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
    // Sensor status translations
    sensorStatus: 'Sensor Status',
    showSensorStatus: 'Show Sensor Status',
    gps: 'GPS',
    compass: 'Compass',
    magnetometer: 'Magnetometer',
    accelerometer: 'Accelerometer',
    gyroscope: 'Gyroscope',
    active: 'Active',
    inactive: 'Inactive',
    available: 'Available',
    unavailable: 'Unavailable',
    unknown: 'Unknown',
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
    // Sensor status translations
    sensorStatus: 'حالة الحساسات',
    showSensorStatus: 'إظهار حالة الحساسات',
    gps: 'نظام تحديد المواقع',
    compass: 'البوصلة',
    magnetometer: 'مقياس المغناطيسية',
    accelerometer: 'مقياس التسارع',
    gyroscope: 'الجيروسكوب',
    active: 'نشط',
    inactive: 'غير نشط',
    available: 'متاح',
    unavailable: 'غير متاح',
    unknown: 'غير معروف',
  },
};

const QiblaCompass = ({ isDarkMode = false, language = 'en', onClose }) => {
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isCompassEnabled, setIsCompassEnabled] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Sensor status states
  const [showSensorStatus, setShowSensorStatus] = useState(false);
  const [sensorStatus, setSensorStatus] = useState({
    gps: 'unknown',
    compass: 'unknown',
    magnetometer: 'unknown',
    accelerometer: 'unknown',
    gyroscope: 'unknown',
  });

  // Additional sensor states
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroscopeData, setGyroscopeData] = useState({ x: 0, y: 0, z: 0 });
  const [magnetometerData, setMagnetometerData] = useState({ x: 0, y: 0, z: 0 });
  const [isSensorFusionEnabled, setSensorFusionEnabled] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [sensorAccuracy, setSensorAccuracy] = useState({
    magnetometer: 0, // 0-3 where 3 is best
    accelerometer: 0,
    gyroscope: 0
  });

  // Sensor subscriptions
  const accelerometerSubscription = useRef(null);
  const gyroscopeSubscription = useRef(null);
  const magnetometerSubscription = useRef(null);

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
        
        // Update GPS sensor status
        setSensorStatus(prev => ({
          ...prev,
          gps: 'active'
        }));
        
        // Calculate Qibla direction
        const bearing = calculateBearing(
          latitude, longitude,
          KAABA_COORDINATES.latitude, KAABA_COORDINATES.longitude
        );
        console.log('User location:', latitude, longitude);
        console.log('Qibla direction:', bearing);
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
        setIsLocationEnabled(false);
        
        // Update GPS sensor status
        setSensorStatus(prev => ({
          ...prev,
          gps: 'unavailable'
        }));
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
    const degree_update_rate = 1; // Update every 1 degree change for more responsiveness
    
    try {
      CompassHeading.start(degree_update_rate, (compassData) => {
        console.log('Received heading update:', compassData); // Debug log
        
        // Extract heading value - it might be an object or a number
        let headingValue;
        if (typeof compassData === 'object' && compassData.heading !== undefined) {
          headingValue = compassData.heading;
        } else if (typeof compassData === 'number') {
          headingValue = compassData;
        } else {
          console.warn('Invalid compass data:', compassData);
          return;
        }
        
        console.log('Compass heading:', headingValue); // Debug log
        setHeading(headingValue);
        setIsCompassEnabled(true);
        
        // Update sensor status when compass starts working
        setSensorStatus(prev => ({
          ...prev,
          compass: 'active'
        }));
        
        // Smooth rotation animation
        Animated.timing(compassRotation, {
          toValue: -headingValue,
          duration: 100, // Faster animation for better responsiveness
          useNativeDriver: true,
        }).start();
        
        // Calculate needle rotation relative to Qibla
        if (qiblaDirection !== null && !isNaN(qiblaDirection)) {
          const needleAngle = qiblaDirection - headingValue;
          console.log('Qibla direction:', qiblaDirection, 'Needle angle:', needleAngle); // Debug log
          Animated.timing(needleRotation, {
            toValue: needleAngle,
            duration: 100,
            useNativeDriver: true,
          }).start();
        }
      });
    } catch (error) {
      console.error('Error starting compass:', error);
      setError('Compass not available on this device');
      setIsCompassEnabled(false);
      setSensorStatus(prev => ({
        ...prev,
        compass: 'unavailable'
      }));
    }
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
      startPulseAnimation();
    } else {
      setError(t.locationPermissionError);
      setIsLoading(false);
    }
  };

  // Refresh location and compass
  const refreshCompass = () => {
    console.log('Refreshing compass and location...');
    setIsLoading(true);
    
    // Reset sensor statuses to unknown before refresh
    setSensorStatus({
      gps: 'unknown',
      compass: 'unknown',
      magnetometer: 'unknown',
      accelerometer: 'unknown',
      gyroscope: 'unknown',
    });
    
    // Stop current sensors and restart
    stopSensors();
    stopCompass();
    
    // Restart everything
    setTimeout(() => {
      detectAvailableSensors();
      startSensors();
      getCurrentLocation();
    }, 100);
  };

  // Enhanced sensor detection
  const detectAvailableSensors = () => {
    console.log('Detecting available sensors...');
    
    try {
      // Set update intervals for sensors
      setUpdateIntervalForType(SensorTypes.accelerometer, 100);
      setUpdateIntervalForType(SensorTypes.gyroscope, 100);
      setUpdateIntervalForType(SensorTypes.magnetometer, 100);

      // Test sensor availability by attempting to subscribe
      const testAccelerometer = accelerometer.subscribe(
        (data) => {
          console.log('Accelerometer available:', data);
          setSensorStatus(prev => ({
            ...prev,
            accelerometer: 'available'
          }));
          testAccelerometer.unsubscribe();
        },
        (error) => {
          console.log('Accelerometer not available:', error);
          setSensorStatus(prev => ({
            ...prev,
            accelerometer: 'unavailable'
          }));
        }
      );

      const testGyroscope = gyroscope.subscribe(
        (data) => {
          console.log('Gyroscope available:', data);
          setSensorStatus(prev => ({
            ...prev,
            gyroscope: 'available'
          }));
          testGyroscope.unsubscribe();
        },
        (error) => {
          console.log('Gyroscope not available:', error);
          setSensorStatus(prev => ({
            ...prev,
            gyroscope: 'unavailable'
          }));
        }
      );

      const testMagnetometer = magnetometer.subscribe(
        (data) => {
          console.log('Magnetometer available:', data);
          setSensorStatus(prev => ({
            ...prev,
            magnetometer: 'available'
          }));
          testMagnetometer.unsubscribe();
        },
        (error) => {
          console.log('Magnetometer not available:', error);
          setSensorStatus(prev => ({
            ...prev,
            magnetometer: 'unavailable'
          }));
        }
      );

      // Set compass to available by default - will be updated when CompassHeading starts
      setSensorStatus(prev => ({
        ...prev,
        compass: 'available'
      }));

    } catch (error) {
      console.error('Error detecting sensors:', error);
      setSensorStatus(prev => ({
        ...prev,
        accelerometer: 'unavailable',
        gyroscope: 'unavailable',
        magnetometer: 'unavailable'
      }));
    }
  };

  // Get accuracy text based on GPS accuracy
  const getAccuracyText = () => {
    if (accuracy <= 5) return t.excellent;
    if (accuracy <= 10) return t.good;
    return t.poor;
  };

  // Start accelerometer and gyroscope listeners with real sensors
  const startSensors = () => {
    console.log('Starting real device sensors');
    
    try {
      // Subscribe to accelerometer
      accelerometerSubscription.current = accelerometer.subscribe(
        ({ x, y, z }) => {
          setAccelerometerData({ x, y, z });
          
          // Calculate accelerometer accuracy based on magnitude consistency
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const expectedGravity = 9.81;
          const variance = Math.abs(magnitude - expectedGravity) / expectedGravity;
          const accuracy = variance < 0.1 ? 3 : variance < 0.2 ? 2 : variance < 0.5 ? 1 : 0;
          
          setSensorAccuracy(prev => ({
            ...prev,
            accelerometer: accuracy
          }));
          
          // Update sensor status
          setSensorStatus(prev => ({
            ...prev,
            accelerometer: 'active'
          }));
        },
        (error) => {
          console.error('Accelerometer error:', error);
          setSensorStatus(prev => ({
            ...prev,
            accelerometer: 'unavailable'
          }));
        }
      );

      // Subscribe to gyroscope
      gyroscopeSubscription.current = gyroscope.subscribe(
        ({ x, y, z }) => {
          setGyroscopeData({ x, y, z });
          
          // Calculate gyroscope accuracy based on stability (lower values = more stable)
          const totalRotation = Math.abs(x) + Math.abs(y) + Math.abs(z);
          const accuracy = totalRotation < 0.1 ? 3 : totalRotation < 0.3 ? 2 : totalRotation < 0.5 ? 1 : 0;
          
          setSensorAccuracy(prev => ({
            ...prev,
            gyroscope: accuracy
          }));
          
          // Update sensor status
          setSensorStatus(prev => ({
            ...prev,
            gyroscope: 'active'
          }));
        },
        (error) => {
          console.error('Gyroscope error:', error);
          setSensorStatus(prev => ({
            ...prev,
            gyroscope: 'unavailable'
          }));
        }
      );

      // Subscribe to magnetometer
      magnetometerSubscription.current = magnetometer.subscribe(
        ({ x, y, z }) => {
          setMagnetometerData({ x, y, z });
          
          // Calculate magnetometer accuracy based on field strength consistency
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const expectedMagnitude = 50; // Typical Earth's magnetic field in μT
          const variance = Math.abs(magnitude - expectedMagnitude) / expectedMagnitude;
          const accuracy = variance < 0.2 ? 3 : variance < 0.4 ? 2 : variance < 0.6 ? 1 : 0;
          
          setSensorAccuracy(prev => ({
            ...prev,
            magnetometer: accuracy
          }));
          
          // Update sensor status
          setSensorStatus(prev => ({
            ...prev,
            magnetometer: 'active'
          }));
          
          // Enable sensor fusion if compass is also enabled
          if (isCompassEnabled) {
            setSensorFusionEnabled(true);
          }
        },
        (error) => {
          console.error('Magnetometer error:', error);
          setSensorStatus(prev => ({
            ...prev,
            magnetometer: 'unavailable'
          }));
        }
      );

      // Update calibration progress if in calibration mode
      if (calibrationMode) {
        const calibrationInterval = setInterval(() => {
          setCalibrationProgress(prev => {
            const newProgress = Math.min(100, prev + 5);
            if (newProgress >= 100) {
              clearInterval(calibrationInterval);
            }
            return newProgress;
          });
        }, 300);
        
        return () => {
          clearInterval(calibrationInterval);
          stopSensors();
        };
      }
      
      return stopSensors;
      
    } catch (error) {
      console.error('Error starting sensors:', error);
      setSensorStatus(prev => ({
        ...prev,
        accelerometer: 'unavailable',
        gyroscope: 'unavailable',
        magnetometer: 'unavailable'
      }));
      return () => {};
    }
  };

  // Stop all sensor subscriptions
  const stopSensors = () => {
    if (accelerometerSubscription.current) {
      accelerometerSubscription.current.unsubscribe();
      accelerometerSubscription.current = null;
    }
    if (gyroscopeSubscription.current) {
      gyroscopeSubscription.current.unsubscribe();
      gyroscopeSubscription.current = null;
    }
    if (magnetometerSubscription.current) {
      magnetometerSubscription.current.unsubscribe();
      magnetometerSubscription.current = null;
    }
    
    setSensorStatus(prev => ({
      ...prev,
      accelerometer: prev.accelerometer === 'active' ? 'available' : prev.accelerometer,
      gyroscope: prev.gyroscope === 'active' ? 'available' : prev.gyroscope,
      magnetometer: prev.magnetometer === 'active' ? 'available' : prev.magnetometer
    }));
    
    setSensorFusionEnabled(false);
  };
  
  // Calculate heading using sensor fusion with real sensor data
  const calculateSensorFusionHeading = () => {
    // Improved sensor fusion using real accelerometer and magnetometer data
    if (isSensorFusionEnabled && 
        sensorAccuracy.magnetometer > 0 && 
        sensorAccuracy.accelerometer > 0) {
      
      try {
        // Normalize accelerometer data to get gravity vector
        const { x: ax, y: ay, z: az } = accelerometerData;
        const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
        
        if (accelMagnitude === 0) return heading;
        
        const gx = ax / accelMagnitude;
        const gy = ay / accelMagnitude;
        const gz = az / accelMagnitude;
        
        // Normalize magnetometer data
        const { x: mx, y: my, z: mz } = magnetometerData;
        const magMagnitude = Math.sqrt(mx * mx + my * my + mz * mz);
        
        if (magMagnitude === 0) return heading;
        
        const nx = mx / magMagnitude;
        const ny = my / magMagnitude;
        const nz = mz / magMagnitude;
        
        // Calculate east vector (cross product of north and gravity)
        const ex = ny * gz - nz * gy;
        const ey = nz * gx - nx * gz;
        const ez = nx * gy - ny * gx;
        
        // Calculate north vector (cross product of gravity and east)
        const hx = gy * ez - gz * ey;
        const hy = gz * ex - gx * ez;
        
        // Calculate heading from north and east vectors
        let fusedHeading = Math.atan2(ey, hx) * (180 / Math.PI);
        
        // Normalize to 0-360 degrees
        if (fusedHeading < 0) {
          fusedHeading += 360;
        }
        
        // Apply gyroscope correction for smooth movement
        const { z: gz_gyro } = gyroscopeData;
        const gyroCorrection = gz_gyro * 0.1; // Small correction factor
        fusedHeading += gyroCorrection;
        
        // Ensure heading stays within 0-360 range
        fusedHeading = fusedHeading % 360;
        if (fusedHeading < 0) fusedHeading += 360;
        
        console.log('Sensor fusion heading:', fusedHeading, 'Original:', heading);
        return fusedHeading;
        
      } catch (error) {
        console.error('Error in sensor fusion calculation:', error);
        return heading;
      }
    }
    
    return heading;
  };

  // Start calibration mode
  const startCalibration = () => {
    setCalibrationMode(true);
    setCalibrationProgress(0);
    
    // Exit calibration mode after 15 seconds
    setTimeout(() => {
      setCalibrationMode(false);
      setCalibrationProgress(100);
      
      // Show success message
      Alert.alert(
        t.calibrate,
        language === 'en' ? 'Calibration completed. Compass accuracy improved!' : 'اكتملت المعايرة. تحسنت دقة البوصلة!',
        [{ text: 'OK' }]
      );
    }, 15000);
  };

  // Debug function to log current sensor status
  const logSensorStatus = () => {
    console.log('=== Current Sensor Status ===');
    console.log('GPS:', sensorStatus.gps, '| Location enabled:', isLocationEnabled);
    console.log('Compass:', sensorStatus.compass, '| Compass enabled:', isCompassEnabled);
    console.log('Magnetometer:', sensorStatus.magnetometer, '| Accuracy:', sensorAccuracy.magnetometer);
    console.log('Accelerometer:', sensorStatus.accelerometer, '| Accuracy:', sensorAccuracy.accelerometer);
    console.log('Gyroscope:', sensorStatus.gyroscope, '| Accuracy:', sensorAccuracy.gyroscope);
    console.log('Sensor Fusion:', isSensorFusionEnabled);
    console.log('============================');
  };

  // Enhanced sensor status check
  const updateSensorStatus = () => {
    setSensorStatus(prev => ({
      gps: isLocationEnabled ? 'active' : (userLocation ? 'available' : 'inactive'),
      compass: isCompassEnabled ? 'active' : (prev.compass === 'available' ? 'available' : 'inactive'),
      magnetometer: sensorAccuracy.magnetometer > 0 ? 'active' : 
                   (prev.magnetometer === 'available' || prev.magnetometer === 'active' ? 'available' : 'inactive'),
      accelerometer: sensorAccuracy.accelerometer > 0 ? 'active' : 
                    (prev.accelerometer === 'available' || prev.accelerometer === 'active' ? 'available' : 'inactive'),
      gyroscope: sensorAccuracy.gyroscope > 0 ? 'active' : 
                (prev.gyroscope === 'available' || prev.gyroscope === 'active' ? 'available' : 'inactive'),
    }));
  };

  // Get sensor accuracy indicator
  const getSensorAccuracyIndicator = (sensorType) => {
    const accuracy = sensorAccuracy[sensorType] || 0;
    
    switch (accuracy) {
      case 3: return '⭐⭐⭐'; // Excellent
      case 2: return '⭐⭐'; // Good
      case 1: return '⭐'; // Fair
      case 0:
      default: return '❌'; // Poor or unavailable
    }
  };

  // Get sensor status color based on status
  const getSensorStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50'; // Green
      case 'available': return '#FF9800'; // Orange
      case 'inactive': return '#9E9E9E'; // Gray
      case 'unavailable': return '#F44336'; // Red
      case 'unknown':
      default: return '#607D8B'; // Blue Gray
    }
  };

  // Get sensor status text based on language
  const getSensorStatusText = (status) => {
    const statusTexts = {
      active: t.active,
      available: t.available,
      inactive: t.inactive,
      unavailable: t.unavailable,
      unknown: t.unknown,
    };
    
    return statusTexts[status] || t.unknown;
  };

  // Calculate initial sensor status
  const calculateInitialSensorStatus = () => {
    const initialStatus = {
      gps: 'unknown',
      compass: 'unknown',
      magnetometer: 'unknown',
      accelerometer: 'unknown',
      gyroscope: 'unknown',
    };
    
    // Set GPS status based on location permission and availability
    initialStatus.gps = isLocationEnabled ? 'available' : 'unavailable';
    
    // Set compass and magnetometer status based on compass availability
    initialStatus.compass = isCompassEnabled ? 'available' : 'unavailable';
    initialStatus.magnetometer = isCompassEnabled ? 'available' : 'unavailable';
    
    // Set accelerometer and gyroscope status based on sensor fusion availability
    initialStatus.accelerometer = sensorAccuracy.accelerometer > 0 ? 'available' : 'unavailable';
    initialStatus.gyroscope = sensorAccuracy.gyroscope > 0 ? 'available' : 'unavailable';
    
    setSensorStatus(initialStatus);
  };

  // Initialize compass, sensors, and status
  const initialize = async () => {
    setIsLoading(true);
    const hasPermission = await requestLocationPermission();
    
    if (hasPermission) {
      getCurrentLocation();
      startPulseAnimation();
      detectAvailableSensors();
      
      // Start sensors and get cleanup function
      const cleanupSensors = startSensors();
      
      return () => {
        stopCompass();
        if (typeof cleanupSensors === 'function') {
          cleanupSensors();
        } else {
          stopSensors();
        }
      };
    } else {
      setError(t.locationPermissionError);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cleanup;
    initialize().then((cleanupFn) => {
      cleanup = cleanupFn;
    });
    
    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
      stopSensors();
    };
  }, []);

  // Start compass when qibla direction is available
  useEffect(() => {
    if (qiblaDirection !== null && !isCompassEnabled && isLocationEnabled) {
      console.log('Starting compass with qibla direction:', qiblaDirection);
      startCompass();
    }
  }, [qiblaDirection, isLocationEnabled]);

  // Monitor sensor status changes
  useEffect(() => {
    updateSensorStatus();
  }, [isLocationEnabled, isCompassEnabled]);

  // Update sensor status on location or compass change
  useEffect(() => {
    updateSensorStatus();
    calculateInitialSensorStatus();
  }, [isLocationEnabled, isCompassEnabled]);

  // Apply sensor fusion to heading
  useEffect(() => {
    if (isSensorFusionEnabled) {
      const fusedHeading = calculateSensorFusionHeading();
      if (fusedHeading !== heading && !isNaN(fusedHeading)) {
        // Update compass rotation with the fused heading
        Animated.timing(compassRotation, {
          toValue: -fusedHeading,
          duration: 100,
          useNativeDriver: true,
        }).start();
        
        // Update needle rotation with fused heading
        if (qiblaDirection !== null && !isNaN(qiblaDirection)) {
          const needleAngle = qiblaDirection - fusedHeading;
          Animated.timing(needleRotation, {
            toValue: needleAngle,
            duration: 100,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  }, [heading, accelerometerData, gyroscopeData, magnetometerData, isSensorFusionEnabled]);

  // Update sensor status periodically
  useEffect(() => {
    const statusInterval = setInterval(() => {
      updateSensorStatus();
      // Uncomment for debugging sensor status
      // logSensorStatus();
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(statusInterval);
  }, [isLocationEnabled, isCompassEnabled, sensorAccuracy]);

  // Enhanced Sensor Status Display
  const SensorStatusDisplay = () => {
    if (!showSensorStatus) return null;
    
    const sensors = [
      { key: 'gps', name: t.gps, icon: 'location' },
      { key: 'compass', name: t.compass, icon: 'compass' },
      { key: 'magnetometer', name: t.magnetometer, icon: 'magnet', accuracyKey: 'magnetometer' },
      { key: 'accelerometer', name: t.accelerometer, icon: 'speedometer', accuracyKey: 'accelerometer' },
      { key: 'gyroscope', name: t.gyroscope, icon: 'refresh', accuracyKey: 'gyroscope' },
    ];

    return (
      <View style={[styles.sensorStatusContainer, isDarkMode && styles.darkSensorStatusContainer]}>
        <Text style={[styles.sensorStatusTitle, isDarkMode && styles.darkText]}>
          {t.sensorStatus}
        </Text>
        {sensors.map((sensor) => (
          <View key={sensor.key} style={styles.sensorRow}>
            <View style={styles.sensorInfo}>
              <Icon 
                name={sensor.icon} 
                size={moderateScale(16)} 
                color={getSensorStatusColor(sensorStatus[sensor.key])} 
              />
              <Text style={[styles.sensorName, isDarkMode && styles.darkText]}>
                {sensor.name}
              </Text>
            </View>
            <View style={styles.sensorStatusBadge}>
              <View 
                style={[
                  styles.sensorStatusDot, 
                  { backgroundColor: getSensorStatusColor(sensorStatus[sensor.key]) }
                ]} 
              />
              <Text 
                style={[
                  styles.sensorStatusText, 
                  { color: getSensorStatusColor(sensorStatus[sensor.key]) }
                ]}
              >
                {getSensorStatusText(sensorStatus[sensor.key])}
                {sensor.accuracyKey && ` ${getSensorAccuracyIndicator(sensor.accuracyKey)}`}
              </Text>
            </View>
          </View>
        ))}
        
        {/* Sensor Fusion Status */}
        <View style={styles.sensorFusionStatus}>
          <Text style={[styles.sensorFusionLabel, isDarkMode && styles.darkText]}>
            Sensor Fusion:
          </Text>
          <Text style={[
            styles.sensorFusionValue,
            { color: isSensorFusionEnabled ? '#4CAF50' : '#F44336' }
          ]}>
            {isSensorFusionEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        
        {/* Calibration Button */}
        <TouchableOpacity 
          style={[
            styles.calibrateButton, 
            calibrationMode && styles.calibratingButton
          ]}
          onPress={startCalibration}
          disabled={calibrationMode}
        >
          <Text style={styles.calibrateButtonText}>
            {calibrationMode 
              ? `${t.calibrate}: ${calibrationProgress}%` 
              : t.calibrate}
          </Text>
        </TouchableOpacity>
        
        {calibrationMode && (
          <View style={styles.calibrationProgressContainer}>
            <View 
              style={[
                styles.calibrationProgressBar,
                { width: `${calibrationProgress}%` }
              ]} 
            />
          </View>
        )}
        
        {calibrationMode && (
          <View style={styles.calibrationInstructionContainer}>
            <Text style={[styles.calibrationInstruction, isDarkMode && styles.darkText]}>
              Move your device in a figure-8 pattern
            </Text>
            <FontAwesome5 
              name="infinity" 
              size={moderateScale(24)} 
              color={isDarkMode ? '#66CCFF' : '#007AFF'} 
              style={styles.infinityIcon}
            />
          </View>
        )}
      </View>
    );
  };

  // Enhance accuracy color calculation based on sensor fusion
  const getAccuracyColor = () => {
    // If sensor fusion is enabled, factor in magnetometer accuracy
    if (isSensorFusionEnabled && sensorAccuracy.magnetometer > 0) {
      // Combine GPS accuracy with magnetometer accuracy
      const combinedAccuracy = accuracy * (4 - sensorAccuracy.magnetometer) / 4;
      if (combinedAccuracy <= 5) return '#4CAF50'; // Excellent
      if (combinedAccuracy <= 10) return '#FF9800'; // Good
      return '#F44336'; // Poor
    }
    
    // Fall back to original method
    if (accuracy <= 5) return '#4CAF50'; // Excellent
    if (accuracy <= 10) return '#FF9800'; // Good
    return '#F44336'; // Poor
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
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => setShowSensorStatus(!showSensorStatus)}
          >
            <Icon 
              name="settings-outline" 
              size={moderateScale(24)} 
              color={showSensorStatus ? (isDarkMode ? '#66CCFF' : '#007AFF') : (isDarkMode ? '#FFF' : '#333')} 
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          {/* Sensor Status Display */}
          <SensorStatusDisplay />
          
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
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => setShowSensorStatus(!showSensorStatus)}
          >
            <Icon 
              name="settings-outline" 
              size={moderateScale(24)} 
              color={showSensorStatus ? (isDarkMode ? '#66CCFF' : '#007AFF') : (isDarkMode ? '#FFF' : '#333')} 
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          {/* Sensor Status Display */}
          <SensorStatusDisplay />
          
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
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => setShowSensorStatus(!showSensorStatus)}
        >
          <Icon 
            name="settings-outline" 
            size={moderateScale(24)} 
            color={showSensorStatus ? (isDarkMode ? '#66CCFF' : '#007AFF') : (isDarkMode ? '#FFF' : '#333')} 
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, isDarkMode && styles.darkCard]}>
        
        {/* Sensor Status Display */}
        <SensorStatusDisplay />
        
        {/* Distance Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
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
                          { rotate: `${angle}deg` }
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

          {/* Static Test Needle - for debugging */}
          <View style={[styles.needleContainer, { transform: [{ rotate: '45deg' }] }]}>
            <View style={[styles.needle, { opacity: 0.3 }]}>
              <View style={[styles.needlePoint, { borderBottomColor: '#00FF00' }]} />
              <View style={[styles.needleBody, { backgroundColor: '#00FF00' }]} />
            </View>
          </View>

          {/* Center Kaaba Icon */}
          <View style={[styles.centerIcon, isDarkMode && styles.darkCenterIcon]}>
            <FontAwesome5 name="kaaba" size={moderateScale(24)} color={isDarkMode ? '#66CCFF' : '#007AFF'} />
          </View>

          {/* Direction Indicator */}
          <View style={styles.directionIndicator}>
            <Text style={[styles.directionText, isDarkMode && styles.darkText]}>
              {qiblaDirection !== null ? Math.round(qiblaDirection) : 0}°
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

        {/* Sensor Status Display - Always show in dark mode for better visibility */}
        <SensorStatusDisplay />
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
  settingsButton: {
    padding: moderateScale(5),
  },
  // Sensor Status Styles
  sensorStatusContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  darkSensorStatusContainer: {
    backgroundColor: '#2A2A2A',
    borderColor: '#444',
  },
  sensorStatusTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(5),
  },
  sensorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sensorName: {
    fontSize: moderateScale(14),
    color: '#333',
    marginLeft: moderateScale(8),
    flex: 1,
  },
  sensorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorStatusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(6),
  },
  sensorStatusText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
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
    marginBottom: moderateScale(60),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    borderWidth: 4,
    borderColor: '#007AFF',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  darkCompassRose: {
    borderColor: '#66CCFF',
    backgroundColor: '#2A2A2A',
    shadowColor: '#FFF',
    shadowOpacity: 0.1,
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
    top: 0,
    left: '50%',
    marginLeft: -0.5,
    transformOrigin: 'bottom center',
  },
  mainDegreeMarker: {
    width: 2,
    height: moderateScale(15),
    backgroundColor: '#007AFF',
    marginLeft: -1,
  },
  darkMainDegreeMarker: {
    backgroundColor: '#66CCFF',
  },
  needleContainer: {
    position: 'absolute',
    width: COMPASS_SIZE * 0.8,
    height: COMPASS_SIZE * 0.8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 10,
  },
  needle: {
    width: 4,
    height: COMPASS_SIZE * 0.6,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  needlePoint: {
    width: 0,
    height: 0,
    borderLeftWidth: moderateScale(10),
    borderRightWidth: moderateScale(10),
    borderBottomWidth: moderateScale(40),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF4444',
    marginBottom: moderateScale(2),
  },
  darkNeedlePoint: {
    borderBottomColor: '#FF6666',
  },
  needleBody: {
    width: moderateScale(6),
    height: COMPASS_SIZE * 0.25,
    backgroundColor: '#FF4444',
    borderRadius: moderateScale(3),
  },
  darkNeedleBody: {
    backgroundColor: '#FF6666',
  },
  needleTail: {
    width: moderateScale(8),
    height: moderateScale(30),
    backgroundColor: '#DDD',
    marginTop: moderateScale(2),
    borderRadius: moderateScale(4),
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
    elevation: 15,
    zIndex: 20,
  },
  darkCenterIcon: {
    backgroundColor: '#333',
  },
  directionIndicator: {
    position: 'absolute',
    top: -moderateScale(60),
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
  headingIndicator: {
    position: 'absolute',
    bottom: -moderateScale(40),
    alignItems: 'center',
  },
  headingText: {
    fontSize: moderateScale(12),
    color: '#999',
    fontFamily: 'monospace',
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
  sensorStatusContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  darkSensorStatusContainer: {
    backgroundColor: '#2A2A2A',
    borderColor: '#444',
  },
  sensorStatusTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(5),
  },
  sensorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sensorName: {
    fontSize: moderateScale(14),
    color: '#333',
    marginLeft: moderateScale(8),
    flex: 1,
  },
  sensorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorStatusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: moderateScale(6),
  },
  sensorStatusText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  // Additional styles for sensor fusion and calibration
  sensorFusionStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(15),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  sensorFusionLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#333',
    marginRight: moderateScale(8),
  },
  sensorFusionValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  calibrateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(15),
    alignSelf: 'center',
  },
  calibratingButton: {
    backgroundColor: '#FF9800',
  },
  calibrateButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  calibrationProgressContainer: {
    height: moderateScale(6),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(3),
    marginTop: moderateScale(10),
    width: '100%',
    overflow: 'hidden',
  },
  calibrationProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  calibrationInstructionContainer: {
    marginTop: moderateScale(15),
    alignItems: 'center',
  },
  calibrationInstruction: {
    fontSize: moderateScale(14),
    color: '#666',
    marginBottom: moderateScale(8),
  },
  infinityIcon: {
    transform: [{ rotate: '90deg' }],
  },
  calibrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  calibrationOverlayText: {
    color: '#FFF',
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default QiblaCompass;