//usePrayerTimer.js
import { useState, useEffect } from 'react';

const usePrayerTimer = (
  currentPrayer,
  currentIndex,
  prayerData,
  getTodayIndex,
  parsePrayerTime,
  getUpcomingPrayerKeyCallback
) => {
  const [upcomingPrayer, setUpcomingPrayer] = useState(null);

  useEffect(() => {
    // Only run this for today's prayer card
    const todayIndex = getTodayIndex(prayerData);
    if (currentIndex !== todayIndex || !currentPrayer) {
      // Don't calculate upcoming prayer for non-today cards
      setUpcomingPrayer(null);
      return;
    }

    const prayerOrder = ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'];
    const now = new Date();
    
    console.log(`Calculating upcoming prayer for today (${currentPrayer.date})`);
    
    // Find the next prayer that hasn't occurred yet
    let foundUpcoming = false;
    for (const prayer of prayerOrder) {
      if (!currentPrayer[prayer]) continue;
      
      try {
        const prayerTime = parsePrayerTime(currentPrayer[prayer]);
        console.log(`Checking ${prayer}: ${currentPrayer[prayer]}, parsed: ${prayerTime.toLocaleTimeString()}, now: ${now.toLocaleTimeString()}`);
        
        if (prayerTime > now) {
          console.log(`Found upcoming prayer: ${prayer} at ${prayerTime.toLocaleTimeString()}`);
          setUpcomingPrayer(prayer);
          foundUpcoming = true;
          break;
        }
      } catch (error) {
        console.error(`Error parsing time for ${prayer}:`, error);
      }
    }
    
    if (!foundUpcoming) {
      console.log('No more prayers for today');
      setUpcomingPrayer(null);
    }
  }, [currentPrayer, currentIndex, prayerData, getTodayIndex, parsePrayerTime]);

  return upcomingPrayer;
};

export default usePrayerTimer;
