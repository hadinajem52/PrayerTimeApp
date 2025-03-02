//usePrayerTimer.js
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to monitor prayer times and determine the upcoming prayer
 */
const usePrayerTimer = (
  currentPrayer, 
  currentIndex, 
  locationData, 
  getTodayIndex, 
  parsePrayerTime, 
  getUpcomingPrayerKeyCallback
) => {
  const [upcomingPrayerKey, setUpcomingPrayerKey] = useState(null);
  const timerRef = useRef(null);
  
  // Function to determine the upcoming prayer
  const updateUpcomingPrayer = () => {
    if (currentPrayer) {
      const upcoming = getUpcomingPrayerKeyCallback();
      setUpcomingPrayerKey(upcoming);
      return upcoming;
    }
    return null;
  };

  // Effect to update the upcoming prayer whenever the current prayer changes
  useEffect(() => {
    updateUpcomingPrayer();
    
    // Set up an interval to check for prayer time changes every minute
    // This ensures we update even if the app remains open for extended periods
    timerRef.current = setInterval(() => {
      const todayIdx = getTodayIndex(locationData);
      const currentIdx = currentIndex;
      
      // If we're viewing today's prayers and the day hasn't changed
      if (currentIdx === todayIdx) {
        // Check if the upcoming prayer has changed
        const newUpcoming = updateUpcomingPrayer();
        
        // If all prayers have passed and we're at the end of the day,
        // we'll see null as the upcoming prayer
        if (!newUpcoming) {
          console.log('All prayers for today have passed');
        }
      }
    }, 60000); // Check every minute
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentPrayer, currentIndex, locationData, getTodayIndex, getUpcomingPrayerKeyCallback]);
  
  return upcomingPrayerKey;
};

export default usePrayerTimer;
