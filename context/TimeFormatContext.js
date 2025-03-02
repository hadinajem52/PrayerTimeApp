import React, { createContext, useContext, useEffect, useState } from 'react';
import useSettings from '../hooks/useSettings';

const TimeFormatContext = createContext('24h');

export const TimeFormatProvider = ({ children }) => {
  const [settings] = useSettings();
  const [timeFormat, setTimeFormat] = useState(settings.timeFormat || '24h');
  
  useEffect(() => {
    setTimeFormat(settings.timeFormat || '24h');
  }, [settings.timeFormat]);
  
  return (
    <TimeFormatContext.Provider value={timeFormat}>
      {children}
    </TimeFormatContext.Provider>
  );
};

export const useTimeFormat = () => useContext(TimeFormatContext);
