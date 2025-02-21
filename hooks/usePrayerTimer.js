import { useEffect, useRef, useState } from 'react';

export default function usePrayerTimer(
  currentPrayer,
  currentIndex,
  locationData,
  getTodayIndex,
  parsePrayerTime,
  getUpcomingPrayerKey
) {
  const [upcomingPrayerKey, setUpcomingPrayerKey] = useState(null);
  const upcomingTimer = useRef(null);

  useEffect(() => {
    if (currentPrayer && currentIndex === getTodayIndex(locationData)) {
      if (upcomingTimer.current) clearTimeout(upcomingTimer.current);
      const updateUpcomingPrayer = () => {
        const upcoming = getUpcomingPrayerKey();
        setUpcomingPrayerKey(upcoming);
        if (upcoming) {
          const prayerTime = parsePrayerTime(currentPrayer[upcoming]);
          const now = new Date();
          const msUntilPrayer = prayerTime - now;
          if (msUntilPrayer <= 0) {
            updateUpcomingPrayer();
          } else {
            upcomingTimer.current = setTimeout(updateUpcomingPrayer, msUntilPrayer + 500);
          }
        } else {
          setUpcomingPrayerKey(null);
        }
      };
      updateUpcomingPrayer();
      return () => {
        if (upcomingTimer.current) clearTimeout(upcomingTimer.current);
      };
    } else {
      setUpcomingPrayerKey(null);
    }
  }, [currentPrayer, currentIndex, locationData, getTodayIndex, parsePrayerTime, getUpcomingPrayerKey]);

  return upcomingPrayerKey;
}
