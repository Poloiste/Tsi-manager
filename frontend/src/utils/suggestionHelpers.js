/**
 * Helper functions for the adaptive suggestion system
 */

/**
 * Get preparation days based on test type
 * DS and Examen require the most preparation time (7 days)
 * DM requires moderate preparation (4 days)
 * Colle and TP Noté require shorter preparation (3 days)
 * 
 * @param {string} type - The type of test (DS, Examen, DM, Colle, TP Noté)
 * @returns {number} - Number of days to start preparation before the test
 */
export const getPreparationDays = (type) => {
  switch(type) {
    case 'DS':
    case 'Examen':
      return 7; // Start 7 days before
    case 'DM':
      return 4; // Start 4 days before
    case 'Colle':
    case 'TP Noté':
      return 3; // Start 3 days before
    default:
      return 3;
  }
};

/**
 * Get urgency multiplier based on days until test and type
 * The multiplier increases as the test approaches
 * DS/Examen have more progressive urgency over a longer period
 * 
 * @param {number} daysUntil - Days remaining until the test
 * @param {string} type - The type of test
 * @returns {number} - Multiplier to apply to the priority score
 */
export const getUrgencyMultiplier = (daysUntil, type) => {
  if (type === 'DS' || type === 'Examen') {
    // DS: progressive urgency over 7 days
    if (daysUntil <= 1) return 2.5;
    if (daysUntil <= 2) return 2.0;
    if (daysUntil <= 3) return 1.7;
    if (daysUntil <= 5) return 1.4;
    return 1.2;
  } else if (type === 'DM') {
    // DM: urgency over 4 days
    if (daysUntil <= 1) return 2.0;
    if (daysUntil <= 2) return 1.6;
    return 1.3;
  } else {
    // Colle/TP: urgency over 3 days
    if (daysUntil <= 1) return 2.0;
    if (daysUntil <= 2) return 1.5;
    return 1.2;
  }
};

/**
 * Get suggested study duration based on test type and days until test
 * DS/Examen require longer study sessions, especially as the test approaches
 * Colle requires shorter, more focused sessions
 * 
 * @param {string} type - The type of test
 * @param {number} daysUntil - Days remaining until the test
 * @returns {string} - Suggested duration as a string (e.g., "45min - 1h")
 */
export const getSuggestedDuration = (type, daysUntil) => {
  if (type === 'DS' || type === 'Examen') {
    if (daysUntil <= 1) return '1h - 1h30';
    if (daysUntil <= 3) return '45min - 1h';
    return '30min - 45min';
  } else if (type === 'DM') {
    if (daysUntil <= 1) return '45min - 1h';
    return '30min - 45min';
  } else {
    // Colle/TP
    if (daysUntil <= 1) return '30min - 45min';
    return '20min - 30min';
  }
};

/**
 * Base score by test type
 * Used as the foundation for calculating review priority
 */
export const baseScoreByType = {
  'DS': 60,
  'Examen': 60,
  'DM': 40,
  'Colle': 35,
  'TP Noté': 30
};

const normalizeSubject = (subject = '') => subject.trim().toLowerCase();

const subjectsMatch = (left, right) => {
  const normalizedLeft = normalizeSubject(left);
  const normalizedRight = normalizeSubject(right);

  return normalizedLeft && normalizedRight && (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
};

/**
 * Build fallback suggestions from the next day's schedule when no urgent review exists.
 *
 * @param {Array} scheduleEvents - Schedule events for the next day
 * @param {Array} courses - Existing courses, optionally enriched with priority data
 * @param {number} totalSlots - Maximum number of suggestions to return
 * @returns {Array} - Suggestions grouped by subject
 */
export const buildFallbackSuggestionsFromSchedule = (scheduleEvents = [], courses = [], totalSlots = 0) => {
  if (!Array.isArray(scheduleEvents) || scheduleEvents.length === 0 || totalSlots <= 0) {
    return [];
  }

  const uniqueSubjects = scheduleEvents.reduce((acc, event) => {
    const subject = event?.subject?.trim();
    if (!subject) return acc;

    if (!acc.some(existingSubject => subjectsMatch(existingSubject, subject))) {
      acc.push(subject);
    }

    return acc;
  }, []);

  const suggestions = [];
  let usedSlots = 0;

  uniqueSubjects.forEach((subject, subjectIndex) => {
    if (usedSlots >= totalSlots) return;

    const matchingCourses = courses
      .filter(course => subjectsMatch(course?.subject, subject))
      .sort((a, b) => (b?.priority || 0) - (a?.priority || 0));

    const chapters = matchingCourses.length > 0
      ? matchingCourses
          .slice(0, Math.min(2, totalSlots - usedSlots))
          .map(course => ({
            ...course,
            reason: '🏫 Cours demain - Anticipez pour arriver prêt en classe',
            urgency: 'low',
            fromTomorrowCourse: true,
            suggestedDuration: course?.suggestedDuration || '20min - 30min',
            isFallbackSuggestion: true
          }))
      : [{
          id: `schedule-fallback-${subjectIndex}`,
          subject,
          chapter: 'Préparer le cours de demain',
          mastery: 0,
          reviewCount: 0,
          priority: 35,
          reason: '🏫 Cours demain - Relisez rapidement les bases avant le cours',
          urgency: 'low',
          fromTomorrowCourse: true,
          suggestedDuration: '20min - 30min',
          oneDriveLinks: [],
          isFallbackSuggestion: true,
          isVirtual: true
        }];

    suggestions.push({
      subject,
      subjectScore: matchingCourses[0]?.priority || 25,
      relevantTests: [],
      hasClassToday: false,
      chapters
    });

    usedSlots += chapters.length;
  });

  return suggestions;
};
