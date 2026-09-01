/**
 * ICS / iCalendar parser for university schedule synchronisation.
 *
 * Parses VEVENT blocks and returns course objects compatible with
 * the existing schedule display in App.js.
 */

/**
 * Unfold RFC 5545 folded lines (lines continued with a leading space or tab).
 * @param {string} raw - Raw ICS text
 * @returns {string} Unfolded text
 */
function unfold(raw) {
  return raw.replace(/\r?\n[ \t]/g, '');
}

/**
 * Extract the value of a property line, stripping parameters.
 * e.g. "DTSTART;TZID=Europe/Paris:20260901T080000" → "20260901T080000"
 * @param {string} line
 * @returns {string}
 */
function lineValue(line) {
  const colonIdx = line.indexOf(':');
  return colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : '';
}

/**
 * Parse a DATE-TIME value into a Date object.
 * Handles:
 *  - UTC format:   "20260901T080000Z"
 *  - Local format: "20260901T080000"   (treated as Europe/Paris local time)
 *  - Date only:    "20260901"
 *
 * @param {string} value - The raw DTSTART / DTEND value
 * @returns {Date}
 */
function parseDateTime(value) {
  if (!value) return null;

  // UTC: ends with Z
  if (value.endsWith('Z')) {
    const y = value.slice(0, 4);
    const mo = value.slice(4, 6);
    const d = value.slice(6, 8);
    const h = value.slice(9, 11);
    const mi = value.slice(11, 13);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`);
  }

  // Date-only: "YYYYMMDD"
  if (value.length === 8) {
    const y = value.slice(0, 4);
    const mo = value.slice(4, 6);
    const d = value.slice(6, 8);
    return new Date(`${y}-${mo}-${d}T00:00:00`);
  }

  // Local date-time: "YYYYMMDDTHHmmss"
  const y = value.slice(0, 4);
  const mo = value.slice(4, 6);
  const d = value.slice(6, 8);
  const h = value.slice(9, 11);
  const mi = value.slice(11, 13);
  // Treat as local time (browser locale), which is correct when
  // the server provides TZID=Europe/Paris times as local values.
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:00`);
}

/**
 * Format a Date to a human-readable time string, e.g. "8h30" or "14h00".
 * @param {Date} date
 * @returns {string}
 */
function formatHour(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/**
 * Guess the event type from the summary string.
 * Returns one of: 'cours', 'TD', 'TP', 'DS', 'Colle', 'Examen', or the matched keyword.
 * @param {string} summary
 * @returns {string}
 */
function guessType(summary) {
  const s = (summary || '').toUpperCase();
  if (/\bEXAMEN\b/.test(s)) return 'Examen';
  if (/\bDS\b/.test(s)) return 'DS';
  if (/\bCOLLE\b/.test(s)) return 'Colle';
  if (/\bTP\b/.test(s)) return 'TP';
  if (/\bTD\b/.test(s)) return 'TD';
  if (/\bCM\b|\bCOURS\b|\bAMPHI\b|\bLECTURE\b/.test(s)) return 'cours';
  return 'cours';
}

/**
 * Clean the subject name by removing type keywords and leading / trailing dashes.
 * @param {string} summary
 * @param {string} type - already-guessed type
 * @returns {string}
 */
function cleanSubject(summary, type) {
  if (!summary) return 'Cours';
  // Remove common type keywords from the label
  let s = summary
    .replace(/\b(CM|COURS|AMPHI|LECTURE|TD|TP|DS|COLLE|EXAMEN)\b/gi, '')
    .replace(/[-–—_]+/g, ' ')
    .trim();
  // Collapse multiple spaces
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s || summary.trim();
}

/**
 * French day names indexed by getDay() (0 = Dimanche, 1 = Lundi …)
 */
const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Parse a raw ICS string and return an array of course event objects.
 *
 * Each object has:
 *  {
 *    subject: string,
 *    time: string,        e.g. "8h-10h"
 *    type: string,        e.g. "cours" | "TD" | "TP" | "DS" | "Colle" | "Examen"
 *    room: string,
 *    startDate: Date,
 *    endDate: Date,
 *    dayName: string,     French day name, e.g. "Lundi"
 *    isoYear: number,
 *    isoWeek: number,
 *  }
 *
 * @param {string} icsText - Raw ICS content
 * @returns {Array<Object>}
 */
export function parseICS(icsText) {
  if (!icsText) return [];

  const text = unfold(icsText);
  const events = [];

  // Split on VEVENT boundaries
  const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;

  while ((match = veventRegex.exec(text)) !== null) {
    const block = match[1];

    // Extract properties
    const lines = block.split(/\r?\n/);
    const props = {};
    for (const line of lines) {
      if (!line) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;
      // Key may contain parameters, e.g. "DTSTART;TZID=Europe/Paris"
      const rawKey = line.slice(0, colonIdx).split(';')[0].toUpperCase();
      props[rawKey] = lineValue(line);
    }

    const startDate = parseDateTime(props['DTSTART']);
    const endDate = parseDateTime(props['DTEND']);

    if (!startDate) continue;

    const type = guessType(props['SUMMARY']);
    const subject = cleanSubject(props['SUMMARY'], type);
    const room = (props['LOCATION'] || '').trim();

    const timeStr = endDate
      ? `${formatHour(startDate)}-${formatHour(endDate)}`
      : formatHour(startDate);

    const dayName = FRENCH_DAYS[startDate.getDay()];
    const { year, week } = getISOWeekFromDate(startDate);

    events.push({
      subject,
      time: timeStr,
      type,
      room,
      startDate,
      endDate,
      dayName,
      isoYear: year,
      isoWeek: week
    });
  }

  return events;
}

/**
 * Compute the ISO 8601 week number and year for a given Date.
 * Extracted here to avoid a circular dependency with weekUtils.
 * @param {Date} date
 * @returns {{ year: number, week: number }}
 */
function getISOWeekFromDate(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday = 1 … Sunday = 7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}
