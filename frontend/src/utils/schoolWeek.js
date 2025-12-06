/**
 * School calendar for TSI 2024-2025
 * Maps each school week (S1-S33) to actual teaching dates, excluding vacation periods
 * 
 * Vacation periods:
 * - Toussaint: Oct 19 - Nov 3
 * - Noël: Dec 21 - Jan 5
 * - Hiver (Zone B): Feb 15 - Mar 2
 * - Printemps: Apr 12 - Apr 27
 */
export const schoolCalendar2024_2025 = {
  1: { start: '2024-09-02', end: '2024-09-06' },
  2: { start: '2024-09-09', end: '2024-09-13' },
  3: { start: '2024-09-16', end: '2024-09-20' },
  4: { start: '2024-09-23', end: '2024-09-27' },
  5: { start: '2024-09-30', end: '2024-10-04' },
  6: { start: '2024-10-07', end: '2024-10-11' },
  7: { start: '2024-10-14', end: '2024-10-18' },
  // VACANCES TOUSSAINT: 19 oct - 3 nov
  8: { start: '2024-11-04', end: '2024-11-08' },
  9: { start: '2024-11-11', end: '2024-11-15' },
  10: { start: '2024-11-18', end: '2024-11-22' },
  11: { start: '2024-11-25', end: '2024-11-29' },
  12: { start: '2024-12-02', end: '2024-12-06' },
  13: { start: '2024-12-09', end: '2024-12-13' },
  14: { start: '2024-12-16', end: '2024-12-20' },
  // VACANCES NOËL: 21 déc - 5 jan
  15: { start: '2025-01-06', end: '2025-01-10' },
  16: { start: '2025-01-13', end: '2025-01-17' },
  17: { start: '2025-01-20', end: '2025-01-24' },
  18: { start: '2025-01-27', end: '2025-01-31' },
  19: { start: '2025-02-03', end: '2025-02-07' },
  20: { start: '2025-02-10', end: '2025-02-14' },
  // VACANCES HIVER: 15 fév - 2 mars (zone B)
  21: { start: '2025-03-03', end: '2025-03-07' },
  22: { start: '2025-03-10', end: '2025-03-14' },
  23: { start: '2025-03-17', end: '2025-03-21' },
  24: { start: '2025-03-24', end: '2025-03-28' },
  25: { start: '2025-03-31', end: '2025-04-04' },
  26: { start: '2025-04-07', end: '2025-04-11' },
  // VACANCES PRINTEMPS: 12 avr - 27 avr
  27: { start: '2025-04-28', end: '2025-05-02' },
  28: { start: '2025-05-05', end: '2025-05-09' },
  29: { start: '2025-05-12', end: '2025-05-16' },
  30: { start: '2025-05-19', end: '2025-05-23' },
  31: { start: '2025-05-26', end: '2025-05-30' },
  32: { start: '2025-06-02', end: '2025-06-06' },
  33: { start: '2025-06-09', end: '2025-06-13' }
};

/**
 * Calculate current school week number based on actual school calendar
 * 
 * This function finds which school week (S1-S33) corresponds to the given date
 * by checking the actual teaching dates, excluding vacation periods.
 * 
 * If the date falls within a school week, returns that week number.
 * If the date falls during a vacation or weekend, returns the next upcoming school week.
 * If the date is before S1 or after S33, returns S1.
 * 
 * @param {Date} [date=new Date()] - The date to calculate the week for (defaults to current date)
 * @returns {number} Current or next school week number (1-33)
 */
export const getCurrentSchoolWeek = (date = new Date()) => {
  const today = new Date(date);
  const todayStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  // Check if we're in a school week
  for (const [weekNum, dates] of Object.entries(schoolCalendar2024_2025)) {
    if (todayStr >= dates.start && todayStr <= dates.end) {
      return parseInt(weekNum);
    }
  }
  
  // If not in a school week (vacation or weekend), find the next school week
  for (const [weekNum, dates] of Object.entries(schoolCalendar2024_2025)) {
    if (todayStr < dates.start) {
      return parseInt(weekNum);
    }
  }
  
  // Default: if after S33 or before S1, return S1
  return 1;
};

/**
 * Get the default day name in French
 * 
 * @param {Date} [date=new Date()] - The date to get the day for (defaults to current date)
 * @returns {string} Day name in French (Lundi, Mardi, etc.)
 */
export const getDefaultDay = (date = new Date()) => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[date.getDay()];
};
