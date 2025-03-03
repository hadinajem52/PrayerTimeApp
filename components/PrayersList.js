import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import PrayerRow from './PrayerRow';

const PrayersList = React.memo(({ 
  prayers, 
  upcomingPrayerKey, 
  onToggleNotification, 
  isDarkMode, 
  language,
  upcomingLabel
}) => {
  const renderItem = useCallback(({ item }) => (
    <PrayerRow
      prayerKey={item.prayerKey}
      time={item.time}
      label={item.label}
      iconName={item.iconName}
      isUpcoming={item.prayerKey === upcomingPrayerKey}
      isEnabled={item.isEnabled}
      onToggleNotification={onToggleNotification}
      isDarkMode={isDarkMode}
      upcomingLabel={upcomingLabel}
      language={language}
    />
  ), [upcomingPrayerKey, onToggleNotification, isDarkMode, language, upcomingLabel]);

  return (
    <FlatList
      data={prayers}
      renderItem={renderItem}
      keyExtractor={item => item.prayerKey}
    />
  );
});

export default PrayersList;