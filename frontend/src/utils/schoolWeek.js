/**
 * School calendar for TSI 2025-2026
 * Maps each school week (S1-S33) to actual teaching dates, excluding vacation periods
 * 
 * Vacation periods:
 * - Toussaint: Oct 19 - Nov 3
 * - Noël: Dec 21 - Jan 5
 * - Hiver (Zone B): Feb 15 - Mar 2
 * - Printemps: Apr 12 - Apr 27
 * 
 * @note This calendar covers Monday-Sunday (full week) for accurate calculations.
 * The display calendar in App.js shows Monday-Friday (class days) for UI purposes.
 * 
 * @note This calendar must be updated annually for each new school year.
 * To update for a new year:
 * 1. Obtain the official TSI school calendar for the new academic year
 * 2. Update each week's start and end dates to match the actual teaching dates
 * 3. Ensure vacation periods are excluded (weeks should cover Monday-Sunday of teaching periods)
 * 4. Update the tests in schoolWeek.test.js to reflect the new dates
 */
export const schoolCalendar2025_2026 = {
  1: { start: '2025-09-01', end: '2025-09-07' },
  2: { start: '2025-09-08', end: '2025-09-14' },
  3: { start: '2025-09-15', end: '2025-09-21' },
  4: { start: '2025-09-22', end: '2025-09-28' },
  5: { start: '2025-09-29', end: '2025-10-05' },
  6: { start: '2025-10-06', end: '2025-10-12' },
  7: { start: '2025-10-13', end: '2025-10-19' },
  // VACANCES TOUSSAINT: 19 oct - 3 nov
  8: { start: '2025-11-03', end: '2025-11-09' },
  9: { start: '2025-11-10', end: '2025-11-16' },
  10: { start: '2025-11-17', end: '2025-11-23' },
  11: { start: '2025-11-24', end: '2025-11-30' },
  12: { start: '2025-12-01', end: '2025-12-07' },
  13: { start: '2025-12-08', end: '2025-12-14' },
  14: { start: '2025-12-15', end: '2025-12-21' },
  // VACANCES NOËL: 21 déc - 5 jan
  15: { start: '2026-01-05', end: '2026-01-11' },
  16: { start: '2026-01-12', end: '2026-01-18' },
  17: { start: '2026-01-19', end: '2026-01-25' },
  18: { start: '2026-01-26', end: '2026-02-01' },
  19: { start: '2026-02-02', end: '2026-02-08' },
  20: { start: '2026-02-09', end: '2026-02-15' },
  // VACANCES HIVER: 15 fév - 2 mars (zone B)
  21: { start: '2026-03-02', end: '2026-03-08' },
  22: { start: '2026-03-09', end: '2026-03-15' },
  23: { start: '2026-03-16', end: '2026-03-22' },
  24: { start: '2026-03-23', end: '2026-03-29' },
  25: { start: '2026-03-30', end: '2026-04-05' },
  26: { start: '2026-04-06', end: '2026-04-12' },
  // VACANCES PRINTEMPS: 12 avr - 27 avr
  27: { start: '2026-04-27', end: '2026-05-03' },
  28: { start: '2026-05-04', end: '2026-05-10' },
  29: { start: '2026-05-11', end: '2026-05-17' },
  30: { start: '2026-05-18', end: '2026-05-24' },
  31: { start: '2026-05-25', end: '2026-05-31' },
  32: { start: '2026-06-01', end: '2026-06-07' },
  33: { start: '2026-06-08', end: '2026-06-14' }
};

/**
 * Calculate current school week number based on actual school calendar
 * 
 * This function finds which school week (S1-S33) corresponds to the given date
 * by checking the actual teaching dates, excluding vacation periods.
 * 
 * Behavior:
 * - If the date falls within a school week's date range, returns that week number.
 * - If the date falls outside school week ranges (e.g., weekends, vacations), returns the next upcoming school week.
 * - If the date is after S33, returns S1 (default for next school year).
 * 
 * Note: School weeks are defined as Monday-Sunday periods to cover the entire week
 * including weekends. This ensures accurate week calculations.
 * 
 * @param {Date} [date=new Date()] - The date to calculate the week for (defaults to current date)
 * @returns {number} Current or next school week number (1-33)
 */
export const getCurrentSchoolWeek = (date = new Date()) => {
  const today = new Date(date);
  const todayStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  // Single loop: check if in a school week or find the next one
  for (let weekNum = 1; weekNum <= 33; weekNum++) {
    const dates = schoolCalendar2025_2026[weekNum];
    
    // If we're in this school week, return it
    if (todayStr >= dates.start && todayStr <= dates.end) {
      return weekNum;
    }
    
    // If this week hasn't started yet, it's the next school week
    if (todayStr < dates.start) {
      return weekNum;
    }
  }
  
  // Default: if after S33, return S1
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
