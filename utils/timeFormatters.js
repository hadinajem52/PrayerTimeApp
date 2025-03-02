/**
 * Formats a time string according to the desired format
 * @param {string} timeStr - Time string in 24h format (HH:MM)
 * @param {string} format - Format preference ('12h' or '24h')
 * @param {boolean} includeSeconds - Whether to include seconds in the output
 * @returns {string} - Formatted time string
 */
export const formatTimeString = (timeStr, format = '24h', includeSeconds = false) => {
  if (!timeStr) return '';
  
  // Parse the time string (expected format HH:MM or HH:MM:SS)
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const seconds = parts.length > 2 ? parts[2] : '00';
  
  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return includeSeconds
      ? `${hours}:${minutes}:${seconds} ${period}`
      : `${hours}:${minutes} ${period}`;
  }
  
  // 24h format
  return includeSeconds
    ? `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`
    : timeStr;
};
