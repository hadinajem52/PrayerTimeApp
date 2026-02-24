import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import moment from 'moment-hijri';
import ProgressBar from 'react-native-progress/Bar';
import styles from '../styles/appStyles';
import useSettings from '../hooks/useSettings';
import { toArabicNumerals } from '../utils/timeFormatters';
import { PRAYER_ICONS, getIconComponent } from '../constants/prayerConfig';

const getCountdownLabel = (prayerKey, translations) => {
  if (['shuruq', 'imsak', 'midnight'].includes(prayerKey)) {
    return translations.progressBarLabelTime;
  }
  return translations.progressBarLabelPrayer;
};

const Countdown = ({
  nextPrayerTime,
  lastPrayerTime,
  language,
  translations,
  isDarkMode,
  lastPrayerKey,
  nextPrayerKey,
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [progress, setProgress] = useState(0);

  const [settings] = useSettings();
  const { timeFormat, useArabicNumerals } = settings;
  const forceUpdate = useRef(0);

  useEffect(() => {
    forceUpdate.current += 1;
  }, [timeFormat, useArabicNumerals]);

  useEffect(() => {
    if (!nextPrayerTime || !lastPrayerTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(lastPrayerTime);
      const endTime = new Date(nextPrayerTime);
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        setProgress(1);
        clearInterval(interval);
      } else {
        const duration = moment.duration(diff);
        const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
        const minutes = String(duration.minutes()).padStart(2, '0');
        const seconds = String(duration.seconds()).padStart(2, '0');

        let displayTime = `${hours}:${minutes}:${seconds}`;

        if (language === 'ar' && useArabicNumerals) {
          displayTime = toArabicNumerals(displayTime);
        }

        setTimeRemaining(displayTime);

        const progressFraction = Math.min(Math.max(elapsed / totalDuration, 0), 1);
        setProgress(progressFraction);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayerTime, lastPrayerTime, timeFormat, useArabicNumerals, language]);

  const StartIcon = getIconComponent(lastPrayerKey);
  const EndIcon = getIconComponent(nextPrayerKey);

  if (!nextPrayerTime || timeRemaining === null) {
    return (
      <View>
        <Text style={[styles.countdownText, isDarkMode && styles.darkCountdownText]}>
          {translations.allEnded}
        </Text>
      </View>
    );
  }

  const countdownLabel = getCountdownLabel(nextPrayerKey, translations);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.labelText, isDarkMode && styles.darkLabelText]}>
        {countdownLabel}
      </Text>

      <Text style={[styles.countdownText, isDarkMode && styles.darkCountdownText]}>
        {timeRemaining}
      </Text>

      <View style={styles.progressRow}>
        <View style={{ marginRight: 5 }}>
          <StartIcon
            name={PRAYER_ICONS[lastPrayerKey] || 'time-outline'}
            size={20}
            color={isDarkMode ? '#D4AF37' : '#059669'}
          />
        </View>
        <View style={{ transform: [{ scaleX: language === 'ar' ? 1 : -1 }] }}>
          <ProgressBar
            progress={progress}
            width={230}
            color={isDarkMode ? '#D4AF37' : '#D4AF37'}
            unfilledColor="#555"
            borderWidth={0}
          />
        </View>
        <View style={[styles.endIconContainer, isDarkMode && styles.darkEndIconContainer]}>
          <EndIcon
            name={PRAYER_ICONS[nextPrayerKey] || 'time-outline'}
            size={20}
            color={isDarkMode ? '#D4AF37' : '#059669'}
          />
        </View>
      </View>
    </View>
  );
};

export default Countdown;
