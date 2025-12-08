/**
 * Utility functions for schedule management
 */

/**
 * Normalizes time strings to extract the start hour
 * Handles formats like "8h-10h", "8h00-10h00", "8h", "08:00", etc.
 * @param {string} timeStr - The time string to parse
 * @returns {number|null} - The start hour as an integer, or null if parsing fails
 */
export const getStartHour = (timeStr) => {
  if (!timeStr) return null;
  // Extract the first number in the string (start hour)
  const match = timeStr.match(/^(\d{1,2})/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Combines base schedule courses with custom events for a specific day and week.
 * Custom events replace base schedule courses that occur at the same time.
 * 
 * @param {Array} baseSchedule - Array of base course objects with time, subject, type, room
 * @param {Array} customEvents - Array of custom event objects with time, subject, type, and other properties
 * @param {number} week - The week number to filter custom events
 * @param {string} day - The day of the week to filter custom events
 * @returns {Array} - Combined and sorted array of courses and events
 */
export const getDaySchedule = (baseSchedule, customEvents, week, day) => {
  const base = baseSchedule || [];
  const custom = customEvents.filter(e => e.week === week && e.day === day);
  
  // If no custom events, return just the base schedule
  if (custom.length === 0) {
    return base;
  }
  
  // Create a Set of start hours for custom events
  const customStartHours = new Set(
    custom.map(e => getStartHour(e.time)).filter(h => h !== null)
  );
  
  // Filter base courses to exclude those that have the same start hour as custom events
  const filteredBase = base.filter(course => {
    const courseStartHour = getStartHour(course.time);
    // If the start hour of the course matches a custom event, exclude it
    return courseStartHour === null || !customStartHours.has(courseStartHour);
  });
  
  // Combine filtered base courses with custom events
  const combined = [...filteredBase, ...custom];
  
  // Sort by start hour for chronological display
  combined.sort((a, b) => {
    const hourA = getStartHour(a.time) || 0;
    const hourB = getStartHour(b.time) || 0;
    return hourA - hourB;
  });
  
  return combined;
};
