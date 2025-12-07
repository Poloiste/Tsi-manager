/**
 * Date utilities for handling date calculations with proper timezone handling
 */

/**
 * Parse a date string (YYYY-MM-DD) and return a Date object in local timezone at midnight
 * This avoids the UTC timezone issues that occur when using new Date("YYYY-MM-DD")
 * 
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object set to midnight in local timezone
 * @throws {Error} If dateString is not in valid YYYY-MM-DD format
 */
export const parseLocalDate = (dateString) => {
  // Validate format
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Invalid date format: expected YYYY-MM-DD, got "${dateString}"`);
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Validate ranges
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month} (must be 1-12)`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day} (must be 1-31)`);
  }
  
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  // Check if the date was valid (JavaScript may silently adjust invalid dates)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateString}`);
  }
  
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Normalize a date to midnight in local timezone
 * 
 * @param {Date} date - Date to normalize
 * @returns {Date} New date object set to midnight in local timezone
 */
export const normalizeToMidnight = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Calculate the number of days between two dates
 * Both dates are normalized to midnight before calculation to ensure accurate day counts
 * 
 * @param {Date} fromDate - Starting date
 * @param {Date} toDate - Ending date
 * @returns {number} Number of days between the dates (can be negative if toDate is before fromDate)
 */
export const calculateDaysBetween = (fromDate, toDate) => {
  const from = normalizeToMidnight(fromDate);
  const to = normalizeToMidnight(toDate);
  return Math.floor((to - from) / (1000 * 60 * 60 * 24));
};
