import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

const QiblaFinderWebView = ({ isDarkMode = false, language = 'en', onClose }) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Google Qibla Finder URL - Use English version for better compatibility
  const qiblaFinderUrl = 'https://qiblafinder.withgoogle.com/intl/ar/finder/ar';

  // Request camera and location permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const micGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const locationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

        if (!cameraGranted || !locationGranted) {
          Alert.alert(
            language === 'ar' ? 'أذونات مطلوبة' : 'Permissions Required',
            language === 'ar' 
              ? 'أذونات الكاميرا والموقع مطلوبة لتجربة البحث عن القبلة. إذن الميكروفون اختياري.'
              : 'Camera and location permissions are required for the Qibla Finder AR experience. Microphone permission is optional.',
            [
              { text: language === 'ar' ? 'إلغاء' : 'Cancel', onPress: () => onClose() },
              { text: language === 'ar' ? 'حاول مرة أخرى' : 'Try Again', onPress: requestPermissions },
            ]
          );
          return false;
        }
        
        console.log('Permissions granted:', { camera: cameraGranted, microphone: micGranted, location: locationGranted });
        return true;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // This is Android-only, but keep fallback
  };

  // Handle WebView load start
  const handleLoadStart = () => {
    console.log('WebView load started');
    setIsLoading(true);
    setError(null);
  };

  // Handle WebView load end
  const handleLoadEnd = () => {
    console.log('WebView load ended');
    setIsLoading(false);
  };

  // Handle WebView errors
  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    const errorMessage = language === 'ar' 
      ? 'فشل تحميل باحث القبلة. يرجى التحقق من اتصال الإنترنت.'
      : 'Failed to load Qibla Finder. Please check your internet connection.';
    setError(errorMessage);
    setIsLoading(false);
  };

  // Handle navigation state changes
  const handleNavigationStateChange = (navState) => {
    console.log('Navigation state changed:', navState.url, 'Loading:', navState.loading);
    
    // Hide loading when navigation is complete
    if (!navState.loading) {
      setIsLoading(false);
    }
    
    // Allow navigation within the qiblafinder.withgoogle.com domain
    if (navState.url && !navState.url.includes('qiblafinder.withgoogle.com') && !navState.url.includes('about:blank')) {
      // Prevent navigation to external sites
      webViewRef.current?.stopLoading();
      webViewRef.current?.goBack();
    }
  };

  // Handle WebView permission requests
  const handlePermissionRequest = (request) => {
    console.log('Permission request:', request);
    // Grant all permissions for camera, microphone, and location
    request.grant();
  };

  // Refresh WebView
  const refreshWebView = () => {
    webViewRef.current?.reload();
  };

  // JavaScript to inject into WebView for better mobile experience
  const injectedJavaScript = `
    // Optimize for mobile and request permissions
    (function() {
      // Remove any potential UI elements that might interfere
      const style = document.createElement('style');
      style.textContent = \`
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
        }
        /* Hide any unnecessary navigation or header elements */
        header, .header, nav, .nav, .navigation {
          display: none !important;
        }
        /* Optimize main content */
        main, .main-content, .qibla-finder, .finder-container {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      \`;
      document.head.appendChild(style);
      
      // Auto-request permissions when the page loads
      setTimeout(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(position) {
              console.log('Location permission granted automatically');
            },
            function(error) {
              console.log('Location permission error:', error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
          })
          .then(function(stream) {
            console.log('Camera permission granted automatically');
            // Stop the stream immediately as we just needed permission
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(function(error) {
            console.log('Camera permission error:', error);
          });
        }
      }, 1000);
    })();
    
    true; // Required for injected JavaScript
  `;

  React.useEffect(() => {
    // Request permissions when component mounts
    requestPermissions();
    
    // Force hide loading after 15 seconds as a fallback (extended for slower connections)
    const loadingTimeout = setTimeout(() => {
      console.log('Forcing loading to false after extended timeout');
      setIsLoading(false);
    }, 15000);
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#222' : '#EAEFF2'}
        />
        
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={moderateScale(24)} color={isDarkMode ? '#FFF' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            Qibla Finder
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshWebView}>
            <Icon name="refresh" size={moderateScale(24)} color={isDarkMode ? '#FFF' : '#333'} />
          </TouchableOpacity>
        </View>

        {/* Error Content Container */}
        <View style={[styles.contentContainer, isDarkMode && styles.darkContentContainer]}>
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={moderateScale(50)} color="#F44336" />
            <Text style={[styles.errorText, isDarkMode && styles.darkText]}>
              {error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshWebView}>
              <Text style={styles.retryButtonText}>
                {language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
              </Text>
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
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={moderateScale(24)} color={isDarkMode ? '#FFF' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
          Qibla Finder
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshWebView}>
          <Icon name="refresh" size={moderateScale(24)} color={isDarkMode ? '#FFF' : '#333'} />
        </TouchableOpacity>
      </View>

      {/* Main Content Container */}
      <View style={[styles.contentContainer, isDarkMode && styles.darkContentContainer]}>
        {/* Info Text */}
        <View style={[styles.infoContainer, isDarkMode && styles.darkInfoContainer]}>
          <Icon 
            name="compass-outline" 
            size={moderateScale(24)} 
            color={isDarkMode ? '#66CCFF' : '#007AFF'} 
          />
          <Text style={[styles.infoText, isDarkMode && styles.darkText]}>
            {language === 'ar' 
              ? 'استخدم الكاميرا لتحديد اتجاه القبلة بدقة'
              : 'Use your camera to find the Qibla direction accurately'
            }
          </Text>
        </View>

        {/* WebView Container */}
        <View style={[styles.webViewContainer, isDarkMode && styles.darkWebViewContainer]}>
          {/* Loading Indicator */}
          {isLoading && (
            <TouchableOpacity 
              style={styles.loadingOverlay}
              onPress={() => {
                console.log('Loading overlay tapped, hiding loading');
                setIsLoading(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.loadingContent}>
                <Icon 
                  name="compass-outline" 
                  size={moderateScale(40)} 
                  color="#66CCFF" 
                  style={styles.loadingIcon}
                />
                <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
                  {language === 'ar' ? 'جار تحميل باحث القبلة...' : 'Loading Qibla Finder...'}
                </Text>
                <Text style={[styles.loadingSubText, isDarkMode && styles.darkText]}>
                  {language === 'ar' 
                    ? 'يرجى الانتظار، قد يستغرق هذا بضع ثوانٍ'
                    : 'Please wait, this may take a few seconds'
                  }
                </Text>
                <Text style={[styles.loadingPermissionText, isDarkMode && styles.darkText]}>
                  {language === 'ar' 
                    ? 'تأكد من السماح بأذونات الكاميرا والموقع'
                    : 'Make sure to allow camera and location permissions'
                  }
                </Text>
                <Text style={[styles.tapToHideText, isDarkMode && styles.darkText]}>
                  {language === 'ar' ? 'اضغط للإخفاء إذا تم التحميل' : 'Tap to hide if loaded'}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* WebView */}
          <WebView
            ref={webViewRef}
            source={{ uri: qiblaFinderUrl }}
            style={styles.webView}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onNavigationStateChange={handleNavigationStateChange}
            onPermissionRequest={handlePermissionRequest}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            bounces={false}
            scrollEnabled={true}
            // Camera and location permissions
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            geolocationEnabled={true}
            // Security settings
            mixedContentMode="compatibility"
            thirdPartyCookiesEnabled={true}
            // User agent for better mobile experience
            userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36"
            // Additional props for permissions
            allowsFullscreenVideo={true}
            allowsBackForwardNavigationGestures={false}
          />
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsContainer, isDarkMode && styles.darkInstructionsContainer]}>
          <View style={styles.instructionsRow}>
            <Icon 
              name="information-circle-outline" 
              size={moderateScale(16)} 
              color={isDarkMode ? '#66CCFF' : '#007AFF'} 
              style={styles.instructionsIcon}
            />
            <Text style={[styles.instructionsText, isDarkMode && styles.darkText]}>
              {language === 'ar' 
                ? 'يرجى الانتظار بعد الضغط على زر "حسنا" لتحميل موقعك'
                : 'Allow camera and location permissions for the best experience'
              }
            </Text>
          </View>
        </View>
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
    backgroundColor: '#FFF',
  },
  darkHeader: {
    backgroundColor: '#333',
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#333',
  },
  darkText: {
    color: '#FFF',
  },
  closeButton: {
    padding: moderateScale(5),
  },
  refreshButton: {
    padding: moderateScale(5),
  },
  contentContainer: {
    flex: 1,
    padding: moderateScale(20),
  },
  darkContentContainer: {
    backgroundColor: '#222',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(15),
    padding: moderateScale(15),
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
  },
  darkInfoContainer: {
    backgroundColor: '#333',
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#666',
    marginLeft: moderateScale(10),
    textAlign: 'center',
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: moderateScale(15),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: moderateScale(15),
  },
  darkWebViewContainer: {
    backgroundColor: '#333',
    shadowColor: '#FFF',
    shadowOpacity: 0.05,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: moderateScale(25),
    borderRadius: moderateScale(15),
    maxWidth: '90%',
  },
  loadingIcon: {
    marginBottom: moderateScale(15),
  },
  loadingText: {
    fontSize: moderateScale(18),
    color: '#FFF',
    marginBottom: moderateScale(8),
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: moderateScale(14),
    color: '#E0E0E0',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  loadingPermissionText: {
    fontSize: moderateScale(12),
    color: '#FFEB3B',
    marginBottom: moderateScale(12),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tapToHideText: {
    fontSize: moderateScale(10),
    color: '#CCC',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  instructionsContainer: {
    padding: moderateScale(15),
    backgroundColor: '#F0F8FF',
    borderRadius: moderateScale(10),
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  darkInstructionsContainer: {
    backgroundColor: '#2A2A3E',
    borderLeftColor: '#66CCFF',
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsIcon: {
    marginRight: moderateScale(8),
  },
  instructionsText: {
    fontSize: moderateScale(12),
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
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

export default QiblaFinderWebView;
