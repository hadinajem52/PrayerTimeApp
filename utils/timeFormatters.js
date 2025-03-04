// Helper to convert to Arabic numerals
export const toArabicNumerals = (str) => {
  const arabicNumerals = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  
  return str.toString().replace(/[0-9]/g, match => arabicNumerals[match]);
};

// Format a time string based on the user's preferred format (12h or 24h)
export const formatTimeString = (timeStr, format, language = 'en', useArabicNumerals = false) => {
  if (!timeStr) return '';
  
  // Assuming timeStr is in 24-hour format like "13:45"
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  if (format === '12h') {
    const period = hours >= 12 ? (language === 'ar' ? 'م' : 'PM') : (language === 'ar' ? 'ص' : 'AM');
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    let formattedTime = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    
    // Convert to Arabic numerals if needed and language is Arabic
    if (language === 'ar' && useArabicNumerals) {
      formattedTime = toArabicNumerals(formattedTime.replace(period, '')).trim() + ' ' + period;
    }
    
    return formattedTime;
  } else {
    // 24h format
    let formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    // Convert to Arabic numerals if needed and language is Arabic
    if (language === 'ar' && useArabicNumerals) {
      formattedTime = toArabicNumerals(formattedTime);
    }
    
    return formattedTime;
  }
};
