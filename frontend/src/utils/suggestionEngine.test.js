import {
  DEFAULT_REVISION_SETTINGS_V2,
  SUGGESTION_ENGINE_MODES,
  createSuggestionContext,
  getSuggestedReviewsByMode,
  normalizeRevisionSettings,
  subjectsMatch
} from './suggestionEngine';

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const defaultDeps = {
  calculateReviewPriority: (course) => ({ priority: course.priority || 10 }),
  parseLocalDate: (value) => new Date(value),
  calculateDaysBetween: (start, end) => Math.floor((end - start) / (1000 * 60 * 60 * 24))
};

describe('suggestionEngine', () => {
  test('normalizeRevisionSettings applies defaults and valid mode', () => {
    const normalized = normalizeRevisionSettings({
      totalDuration: '0',
      sessionDuration: 'abc',
      prioritySubjects: [' Maths ', 'maths', ''],
      restDays: [' Vendredi ', 'vendredi'],
      suggestionEngineMode: 'unknown'
    });

    expect(normalized.totalDuration).toBe(DEFAULT_REVISION_SETTINGS_V2.totalDuration);
    expect(normalized.sessionDuration).toBe(DEFAULT_REVISION_SETTINGS_V2.sessionDuration);
    expect(normalized.prioritySubjects).toEqual(['Maths']);
    expect(normalized.restDays).toEqual(['Vendredi']);
    expect(normalized.suggestionEngineMode).toBe(SUGGESTION_ENGINE_MODES.V2);
  });

  test('subjectsMatch handles accents and spacing', () => {
    expect(subjectsMatch('Outils mathématiques', 'outils mathematiques')).toBe(true);
    expect(subjectsMatch('Informatique', 'Physique')).toBe(false);
  });

  test('createSuggestionContext unifies subjects and computes slots', () => {
    const context = createSuggestionContext({
      day: 'Lundi',
      weekNum: 10,
      currentWeek: 10,
      currentDayName: 'Lundi',
      days,
      subjects: ['Maths'],
      courses: [{ subject: 'Physique', chapter: 'Optique' }],
      revisionSettings: { totalDuration: 100, sessionDuration: 30 },
      upcomingTests: [],
      nextDayScheduleEvents: []
    });

    expect(context.totalSlots).toBe(3);
    expect(context.subjects).toEqual(expect.arrayContaining(['Maths', 'Physique']));
  });

  test('returns empty suggestions on rest day', () => {
    const context = createSuggestionContext({
      day: 'Vendredi',
      weekNum: 10,
      currentWeek: 10,
      currentDayName: 'Lundi',
      days,
      subjects: ['Maths'],
      courses: [{ id: 'c1', subject: 'Maths', chapter: 'Suites', mastery: 50, reviewCount: 0 }],
      revisionSettings: { ...DEFAULT_REVISION_SETTINGS_V2, restDays: ['Vendredi'] },
      upcomingTests: [],
      nextDayScheduleEvents: [{ subject: 'Maths' }]
    });

    const suggestions = getSuggestedReviewsByMode(context, defaultDeps);
    expect(suggestions).toEqual([]);
  });

  test('rest day matching is case-insensitive after normalization', () => {
    const context = createSuggestionContext({
      day: 'Vendredi',
      weekNum: 10,
      currentWeek: 10,
      currentDayName: 'Lundi',
      days,
      subjects: ['Maths'],
      courses: [{ id: 'c1', subject: 'Maths', chapter: 'Suites', mastery: 50, reviewCount: 0 }],
      revisionSettings: { ...DEFAULT_REVISION_SETTINGS_V2, restDays: ['vendredi'] },
      upcomingTests: [],
      nextDayScheduleEvents: [{ subject: 'Maths' }]
    });

    const suggestions = getSuggestedReviewsByMode(context, defaultDeps);
    expect(suggestions).toEqual([]);
  });

  test('v2 prioritizes test and keeps unified tomorrow contract', () => {
    const context = createSuggestionContext({
      day: 'Lundi',
      weekNum: 10,
      currentWeek: 10,
      currentDayName: 'Lundi',
      days,
      subjects: ['Maths'],
      courses: [{
        id: 'c1',
        subject: 'Maths',
        chapter: 'Suites',
        mastery: 20,
        reviewCount: 1,
        priority: 70,
        lastReviewed: '2026-09-01'
      }],
      revisionSettings: { ...DEFAULT_REVISION_SETTINGS_V2, suggestionEngineMode: SUGGESTION_ENGINE_MODES.V2 },
      upcomingTests: [{ subject: 'Maths', type: 'DS', day: 'Mardi', week: 10, daysUntil: 1 }],
      nextDayScheduleEvents: [{ subject: 'Maths' }]
    });

    const suggestions = getSuggestedReviewsByMode(context, defaultDeps);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].hasClassTomorrow).toBe(true);
    expect(suggestions[0].chapters[0].urgency).toBe('high');
    expect(suggestions[0].chapters[0].reason).toContain('DS');
    expect(suggestions[0].chapters[0].reason).toContain('demain');
  });

  test('fallback creates virtual chapter when no matching course exists', () => {
    const context = createSuggestionContext({
      day: 'Lundi',
      weekNum: 10,
      currentWeek: 10,
      currentDayName: 'Lundi',
      days,
      subjects: [],
      courses: [],
      revisionSettings: { ...DEFAULT_REVISION_SETTINGS_V2, suggestionEngineMode: SUGGESTION_ENGINE_MODES.V2 },
      upcomingTests: [],
      nextDayScheduleEvents: [{ subject: 'Maths' }]
    });

    const suggestions = getSuggestedReviewsByMode(context, defaultDeps);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].chapters[0].isVirtual).toBe(true);
    expect(suggestions[0].chapters[0].fromTomorrowCourse).toBe(true);
  });

  test('legacy mode still returns unified contract fields', () => {
    const context = createSuggestionContext({
      day: 'Lundi',
      weekNum: 10,
      currentWeek: 10,
      currentDayName: 'Lundi',
      days,
      subjects: ['Maths'],
      courses: [{ id: 'c1', subject: 'Maths', chapter: 'Suites', mastery: 40, reviewCount: 1, priority: 75 }],
      revisionSettings: { ...DEFAULT_REVISION_SETTINGS_V2, suggestionEngineMode: SUGGESTION_ENGINE_MODES.LEGACY },
      upcomingTests: [],
      nextDayScheduleEvents: [{ subject: 'Maths' }]
    });

    const suggestions = getSuggestedReviewsByMode(context, defaultDeps);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].hasClassTomorrow).toBe(true);
    expect(suggestions[0].chapters[0].fromTomorrowCourse).toBe(true);
  });
});
