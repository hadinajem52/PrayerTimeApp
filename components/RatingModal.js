import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import Rate, { AndroidMarket } from 'react-native-rate';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RatingModal = ({ 
  visible, 
  onClose, 
  language = 'en', 
  isDarkMode = false 
}) => {
  const [selectedStars, setSelectedStars] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const translations = {
    en: {
      rateTitle: "Rate ShiaPrayer Lebanon",
      rateMessage: "If you enjoy using our app, would you mind taking a moment to rate it? It won't take more than a minute. Thanks for your support!",
      rateApp: "Rate Us",
      rateLater: "Remind Me Later",
      rateNo: "No, Thanks",
      tapStars: "Tap a star to rate",
      rateOnStore: "Rate on Google Play",
      thanks: "Thank you for your feedback!",
      close: "Close"
    },
    ar: {
      rateTitle: "قيم الصلاة الشيعية لبنان",
      rateMessage: "إذا كنت تستمتع باستخدام تطبيقنا، هل تمانع في تقييمه؟ لن يستغرق الأمر أكثر من دقيقة. شكراً لدعمك!",
      rateApp: "قيم التطبيق",
      rateLater: "ذكرني لاحقاً",
      rateNo: "لا، شكراً",
      tapStars: "اضغط على النجمة للتقييم",
      rateOnStore: "قيم على Google Play",
      thanks: "شكراً لك على تقييمك!",
      close: "إغلاق"
    }
  };

  const t = translations[language];

  const handleStarPress = (rating) => {
    setSelectedStars(rating);
  };

  const handleRateOnStore = async () => {
    const options = {
      AppleAppID: "2193813192",
      GooglePackageName: "com.shiaprayerleb.app",
      AmazonPackageName: "com.shiaprayerleb.app",
      OtherAndroidURL: "https://play.google.com/store/apps/details?id=com.hnjm123.ShiaPrayerLeb&hl=en",
      preferredAndroidMarket: AndroidMarket.Google,
      preferInApp: false,
      openAppStoreIfInAppFails: true,
      fallbackPlatformURL: "https://play.google.com/store/apps/details?id=com.hnjm123.ShiaPrayerLeb&hl=en",
    };

    try {
      await AsyncStorage.setItem('hasRated', 'true');
      Rate.rate(options, (success, errorMessage) => {
        if (success) {
          console.log('User rated the app successfully');
          setIsSubmitted(true);
          setTimeout(() => {
            onClose();
            setIsSubmitted(false);
            setSelectedStars(0);
          }, 2000);
        } else {
          console.log('Rating failed or was cancelled:', errorMessage);
        }
      });
    } catch (error) {
      console.error('Error setting rating flag:', error);
    }
  };

  const handleRemindLater = async () => {
    try {
      await AsyncStorage.setItem('lastRatingPrompt', Date.now().toString());
      onClose();
      setSelectedStars(0);
    } catch (error) {
      console.error('Error setting reminder:', error);
    }
  };

  const handleNoThanks = async () => {
    try {
      await AsyncStorage.setItem('ratingDismissed', 'true');
      onClose();
      setSelectedStars(0);
    } catch (error) {
      console.error('Error dismissing rating:', error);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          style={styles.starButton}
          activeOpacity={0.7}
        >
          <Icon
            name={i <= selectedStars ? "star" : "star-outline"}
            size={35}
            color={i <= selectedStars ? "#FFD700" : (isDarkMode ? "#666" : "#ccc")}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer,
          isDarkMode && styles.darkModalContainer,
          language === 'ar' && styles.rtlContainer
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              isDarkMode && styles.darkIconContainer
            ]}>
              <Icon
                name="star"
                size={30}
                color={isDarkMode ? "#FFA500" : "#007AFF"}
              />
            </View>
            <Text style={[
              styles.title,
              isDarkMode && styles.darkTitle,
              language === 'ar' && styles.rtlText
            ]}>
              {t.rateTitle}
            </Text>
          </View>

          {/* Content */}
          {!isSubmitted ? (
            <>
              <Text style={[
                styles.message,
                isDarkMode && styles.darkMessage,
                language === 'ar' && styles.rtlText
              ]}>
                {t.rateMessage}
              </Text>

              {/* Star Rating */}
              <View style={styles.starsContainer}>
                <Text style={[
                  styles.starsLabel,
                  isDarkMode && styles.darkStarsLabel,
                  language === 'ar' && styles.rtlText
                ]}>
                  {t.tapStars}
                </Text>
                <View style={[
                  styles.starsRow,
                  language === 'ar' && styles.rtlStarsRow
                ]}>
                  {renderStars()}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonsContainer}>
                {selectedStars >= 4 ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isDarkMode && styles.darkPrimaryButton
                    ]}
                    onPress={handleRateOnStore}
                  >
                    <Icon
                      name="logo-google-playstore"
                      size={20}
                      color="#FFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>
                      {t.rateOnStore}
                    </Text>
                  </TouchableOpacity>
                ) : selectedStars > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isDarkMode && styles.darkPrimaryButton
                    ]}
                    onPress={() => {
                      setIsSubmitted(true);
                      setTimeout(() => {
                        onClose();
                        setIsSubmitted(false);
                        setSelectedStars(0);
                      }, 2000);
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {t.thanks}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.secondaryButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      isDarkMode && styles.darkSecondaryButton
                    ]}
                    onPress={handleRemindLater}
                  >
                    <Text style={[
                      styles.secondaryButtonText,
                      isDarkMode && styles.darkSecondaryButtonText
                    ]}>
                      {t.rateLater}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      isDarkMode && styles.darkSecondaryButton
                    ]}
                    onPress={handleNoThanks}
                  >
                    <Text style={[
                      styles.secondaryButtonText,
                      isDarkMode && styles.darkSecondaryButtonText
                    ]}>
                      {t.rateNo}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.thankYouContainer}>
              <Icon
                name="checkmark-circle"
                size={60}
                color="#4CAF50"
                style={{ marginBottom: 16 }}
              />
              <Text style={[
                styles.thankYouText,
                isDarkMode && styles.darkThankYouText,
                language === 'ar' && styles.rtlText
              ]}>
                {t.thanks}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  darkModalContainer: {
    backgroundColor: '#222',
  },
  rtlContainer: {
    direction: 'rtl',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  darkIconContainer: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  darkTitle: {
    color: '#FFF',
  },
  rtlText: {
    textAlign: 'right',
  },
  message: {
    fontSize: moderateScale(16),
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  darkMessage: {
    color: '#CCC',
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  starsLabel: {
    fontSize: moderateScale(14),
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  darkStarsLabel: {
    color: '#AAA',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rtlStarsRow: {
    flexDirection: 'row-reverse',
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minWidth: 200,
  },
  darkPrimaryButton: {
    backgroundColor: '#FFA500',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    marginHorizontal: 4,
  },
  darkSecondaryButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: moderateScale(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  darkSecondaryButtonText: {
    color: '#FFA500',
  },
  thankYouContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  thankYouText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  darkThankYouText: {
    color: '#FFF',
  },
});

export default RatingModal;
