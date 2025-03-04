import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

const SkeletonLoader = ({ isDarkMode }) => {
  // Animation values for the shimmer effect
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create a repeating animation
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  // Create a gradient effect for the shimmer
  const shimmerTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width]
  });

  // Base colors for light/dark modes that match app theme
  const baseColor = isDarkMode ? '#2A2A2A' : '#E1E9EE';
  const highlightColor = isDarkMode ? '#3D3D3D' : '#F5F5F5';
  const cardBgColor = isDarkMode ? '#333' : '#FFF';
  const navBgColor = isDarkMode ? '#222' : '#EAEFF2';
  const accentColor = isDarkMode ? '#66CCFF33' : '#007AFF33'; // Semi-transparent accent color
  const activeColor = isDarkMode ? '#FFA50033' : '#007AFF33'; // For active nav item

  // Animated gradient
  const ShimmerEffect = () => (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: highlightColor,
          opacity: 0.6,
          transform: [{ translateX: shimmerTranslate }],
        },
      ]}
    />
  );

  // Skeleton components
  const HeaderSkeleton = () => (
    <View style={styles.header}>
      <View style={[styles.headerText, { backgroundColor: baseColor, overflow: 'hidden' }]}>
        <ShimmerEffect />
      </View>
    </View>
  );

  const CardSkeleton = () => (
    <View style={[styles.card, { backgroundColor: cardBgColor }]}>
      {/* Date */}
      <View style={[styles.dateText, { backgroundColor: baseColor, overflow: 'hidden' }]}>
        <ShimmerEffect />
      </View>
      
      {/* Hijri date + location */}
      <View style={styles.dateRow}>
        <View style={[styles.hijriDate, { backgroundColor: baseColor, overflow: 'hidden' }]}>
          <ShimmerEffect />
        </View>
        <View style={[styles.locationText, { backgroundColor: accentColor, overflow: 'hidden' }]}>
          <ShimmerEffect />
        </View>
      </View>
      
      {/* Prayer rows - create 7 of them */}
      {[...Array(7)].map((_, i) => (
        <View key={i} style={styles.prayerRow}>
          <View style={[styles.prayerIcon, { backgroundColor: baseColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
          <View style={[styles.prayerLabel, { backgroundColor: baseColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
          <View style={[styles.prayerTime, { backgroundColor: baseColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
          <View style={[styles.notifIcon, { backgroundColor: baseColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
        </View>
      ))}

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        <View style={[styles.countdownLabel, { backgroundColor: baseColor, overflow: 'hidden' }]}>
          <ShimmerEffect />
        </View>
        <View style={[styles.countdownTime, { backgroundColor: accentColor, overflow: 'hidden' }]}>
          <ShimmerEffect />
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarIcon, { backgroundColor: baseColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
          <View style={[styles.progressBar, { backgroundColor: baseColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
          <View style={[styles.progressBarIconEnd, { backgroundColor: accentColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
        </View>
      </View>
    </View>
  );

  const NavSkeleton = () => (
    <View style={[styles.navbar, { backgroundColor: navBgColor }]}>
      {[...Array(4)].map((_, i) => (
        <View key={i} style={styles.navItemContainer}>
          <View style={[styles.navIcon, { backgroundColor: i === 0 ? activeColor : accentColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
          <View style={[styles.navLabel, { backgroundColor: i === 0 ? activeColor : baseColor, overflow: 'hidden' }]}>
            <ShimmerEffect />
          </View>
        </View>
      ))}
    </View>
  );

  // Today indicator + Quote button
  const IndicatorButtons = () => (
    <View style={styles.topButtons}>
      <View style={[styles.todayIndicator, { backgroundColor: accentColor, overflow: 'hidden' }]}>
        <ShimmerEffect />
      </View>
      <View style={[styles.quoteButton, { backgroundColor: accentColor, overflow: 'hidden' }]}>
        <ShimmerEffect />
      </View>
    </View>
  );

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#222' : '#EAEFF2' }
    ]}>
      <HeaderSkeleton />
      <View style={styles.cardContainer}>
        <CardSkeleton />
        <IndicatorButtons />
      </View>
      <NavSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginVertical: hp('2%'),
    paddingVertical: moderateScale(8),
  },
  headerText: {
    width: '70%',
    height: moderateScale(20),
    borderRadius: moderateScale(4),
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: moderateScale(15),
  },
  card: {
    flex: 1,
    borderRadius: moderateScale(15),
    padding: moderateScale(15),
    marginBottom: moderateScale(10),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  dateText: {
    width: '50%',
    height: moderateScale(24),
    borderRadius: moderateScale(4),
    alignSelf: 'center',
    marginVertical: moderateScale(10),
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: moderateScale(10),
  },
  hijriDate: {
    width: '40%',
    height: moderateScale(18),
    borderRadius: moderateScale(4),
  },
  locationText: {
    width: '30%',
    height: moderateScale(18),
    borderRadius: moderateScale(4),
    marginLeft: moderateScale(5),
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: wp('83%'),
    alignSelf: 'center',
  },
  prayerIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
  },
  prayerLabel: {
    width: '30%',
    height: moderateScale(18),
    borderRadius: moderateScale(4),
    marginHorizontal: moderateScale(10),
  },
  prayerTime: {
    width: '20%',
    height: moderateScale(18),
    borderRadius: moderateScale(4),
    marginLeft: 'auto',
    marginRight: moderateScale(10),
  },
  notifIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
  },
  countdownContainer: {
    marginTop: moderateScale(15),
    alignItems: 'center',
  },
  countdownLabel: {
    width: '40%',
    height: moderateScale(16),
    borderRadius: moderateScale(4),
    marginBottom: moderateScale(8),
  },
  countdownTime: {
    width: '30%',
    height: moderateScale(24),
    borderRadius: moderateScale(4),
    marginBottom: moderateScale(15),
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
  progressBarIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    marginRight: moderateScale(5),
  },
  progressBar: {
    flex: 1,
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
  progressBarIconEnd: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    marginLeft: moderateScale(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    height: hp('12%'),
    paddingBottom: moderateScale(10),
  },
  navItemContainer: {
    alignItems: 'center',
    width: '20%',
  },
  navIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(4),
  },
  navLabel: {
    width: moderateScale(40),
    height: moderateScale(12),
    borderRadius: moderateScale(4),
  },
  topButtons: {
    position: 'absolute',
    top: moderateScale(15),
    left: moderateScale(20),
    right: moderateScale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todayIndicator: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  quoteButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default SkeletonLoader;
