import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import styles from '../styles/skeletonStyles';

const { width } = Dimensions.get('window');

const SkeletonLoader = ({ isDarkMode }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  const shimmerTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width]
  });

  const baseColor = isDarkMode ? '#2A2A2A' : '#E1E9EE';
  const highlightColor = isDarkMode ? '#3D3D3D' : '#F5F5F5';
  const cardBgColor = isDarkMode ? '#333' : '#FFF';
  const navBgColor = isDarkMode ? '#222' : '#F8FAFC';
  const accentColor = isDarkMode ? '#D4AF3733' : '#05966933'; 
  const activeColor = isDarkMode ? '#D4AF3733' : '#05966933';  

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
      
      <View style={styles.dateRow}>
        <View style={[styles.hijriDate, { backgroundColor: baseColor, overflow: 'hidden' }]}>
          <ShimmerEffect />
        </View>
        <View style={[styles.locationText, { backgroundColor: accentColor, overflow: 'hidden' }]}>
          <ShimmerEffect />
        </View>
      </View>
      
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
      { backgroundColor: isDarkMode ? '#222' : '#F8FAFC' }
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

export default SkeletonLoader;
