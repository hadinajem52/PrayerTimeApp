import moment from 'moment-hijri';

/**
 * Utility functions for handling dates consistently across the app
 */

/**
 * Formats a date to the D/M/YYYY format used in prayer data
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateForPrayerData = (date) => {
  return moment(date).format('D/M/YYYY');
};

/**
 * Parses a date string in D/M/YYYY format to a Date object
 * @param {string} dateStr - Date string in D/M/YYYY format
 * @returns {Date} Parsed Date object
 */
export const parsePrayerDataDate = (dateStr) => {
  const [day, month, year] = dateStr.trim().split('/').map(Number);
  // Create date at noon to avoid timezone issues
  return new Date(year, month - 1, day, 12, 0, 0);
};

/**
 * Parses a prayer time (HH:MM) on a specific date to a Date object
 * @param {string} timeStr - Time string in HH:MM format
 * @param {string} dateStr - Date string in D/M/YYYY format
 * @returns {Date} Combined Date object
 */
export const parsePrayerTime = (timeStr, dateStr) => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const [day, month, year] = dateStr.trim().split('/').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
};

/**
 * Compares two dates to check if they are the same day (ignoring time)
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are the same day
 */
export const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Gets a readable string representation of a date difference
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {string} Formatted difference
 */
export const getDateDifferenceString = (date1, date2) => {
  const diff = Math.abs(date1 - date2);
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return date1 > date2 ? "Tomorrow" : "Yesterday";
  
  return `${diffDays} days ${date1 > date2 ? "from now" : "ago"}`;
};
