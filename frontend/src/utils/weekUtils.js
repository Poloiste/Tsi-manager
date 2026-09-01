/**
 * ISO 8601 week utilities.
 * Used to navigate the schedule by calendar week rather than a fixed TSI school week list.
 */

const FRENCH_MONTHS_SHORT = [
  'jan', 'fév', 'mars', 'avr', 'mai', 'juin',
  'juil', 'août', 'sept', 'oct', 'nov', 'déc'
];

/**
 * Compute the ISO 8601 week number and year for a given Date.
 *
 * ISO weeks start on Monday. Week 1 is the week that contains the year's first Thursday.
 *
 * @param {Date} [date=new Date()] - The date to compute the week for
 * @returns {{ year: number, week: number }}
 */
export function getISOWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Monday=1 … Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/**
 * Return the current ISO week.
 * @returns {{ year: number, week: number }}
 */
export function getCurrentISOWeek() {
  return getISOWeek(new Date());
}

/**
 * Get the Date object for the Monday of a given ISO year/week.
 *
 * @param {number} year  - ISO year
 * @param {number} week  - ISO week number (1-53)
 * @returns {Date} Monday midnight UTC
 */
export function getWeekStartDate(year, week) {
  // Jan 4 is always in week 1 of its ISO year
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay() || 7; // 1=Mon … 7=Sun
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4DayOfWeek - 1));

  const weekStart = new Date(week1Monday);
  weekStart.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return weekStart;
}

/**
 * Format a human-readable week label.
 * e.g. getWeekStartDate(2026, 36) → "S36 — 31 août au 4 sept 2026"
 *
 * @param {number} year
 * @param {number} week
 * @returns {string}
 */
export function formatWeekLabel(year, week) {
  const monday = getWeekStartDate(year, week);
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);

  const fmtDay = (d) => d.getUTCDate();
  const fmtMonth = (d) => FRENCH_MONTHS_SHORT[d.getUTCMonth()];

  const startStr = `${fmtDay(monday)} ${fmtMonth(monday)}`;
  const endStr = monday.getUTCMonth() === friday.getUTCMonth()
    ? `${fmtDay(friday)} ${fmtMonth(friday)} ${friday.getUTCFullYear()}`
    : `${fmtDay(friday)} ${fmtMonth(friday)} ${friday.getUTCFullYear()}`;

  return `S${week} — ${startStr} au ${endStr}`;
}

/**
 * Return the number of ISO weeks in a given year (52 or 53).
 * @param {number} year
 * @returns {number} 52 or 53
 */
export function isoWeeksInYear(year) {
  // A year has 53 weeks if Jan 1 is Thursday, or Dec 31 is Thursday (leap year)
  const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay() || 7;
  const dec31Day = new Date(Date.UTC(year, 11, 31)).getUTCDay() || 7;
  return (jan1Day === 4 || dec31Day === 4) ? 53 : 52;
}
