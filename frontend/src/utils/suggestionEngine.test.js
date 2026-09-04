import {
  buildSuggestionPlan,
  calculateDaysFromDayToTest,
  getNextDayScheduleContext,
  getUpcomingTests
} from './suggestionEngine';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TODAY = new Date('2026-09-07T10:00:00');

describe('suggestion engine', () => {
  test('computes upcoming tests from exact dates and week/day context', () => {
    const tests = getUpcomingTests({
      evaluationEvents: [
        { subject: 'Maths', type: 'DS', date: '2026-09-09', day: 'Mercredi', week: 37, time: '08:00' },
        { subject: 'Physique', type: 'Colle', day: 'Jeudi', week: 37, time: '10:00' }
      ],
      currentWeek: 37,
      currentDayName: 'Lundi',
      days: DAYS,
      today: TODAY,
      daysAhead: 7
    });

    expect(tests).toHaveLength(2);
    expect(tests[0]).toMatchObject({ subject: 'Maths', daysUntil: 2 });
    expect(tests[1]).toMatchObject({ subject: 'Physique', daysUntil: 3 });
  });

  test('computes days from selected day to an exact-date test', () => {
    const daysUntil = calculateDaysFromDayToTest({
      fromDay: 'Mardi',
      test: { type: 'DS', date: '2026-09-11', day: 'Vendredi', week: 37 },
      currentWeek: 37,
      currentDayName: 'Lundi',
      days: DAYS,
      today: TODAY
    });

    expect(daysUntil).toBe(3);
  });

  test('returns assessment suggestions with standardized fields', () => {
    const plan = buildSuggestionPlan({
      selectedDay: 'Lundi',
      currentWeek: 37,
      currentYear: 2026,
      currentDayName: 'Lundi',
      days: DAYS,
      courseCatalog: [
        { id: 'course-1', subject: 'Mathématiques', chapter: 'Suites', content: '' },
        { id: 'course-2', subject: 'Physique', chapter: 'Mécanique', content: '' }
      ],
      courseProgress: {
        'course-1': { mastery: 20, reviewCount: 1, lastReviewed: '2026-09-01', reviewHistory: [{ at: '2026-09-01' }] },
        'course-2': { mastery: 75, reviewCount: 2, lastReviewed: '2026-09-06', reviewHistory: [{}, {}] }
      },
      evaluationEvents: [
        { subject: 'Maths', type: 'DS', date: '2026-09-09', day: 'Mercredi', week: 37, time: '08:00' }
      ],
      nextDayScheduleEvents: [],
      revisionSettings: {
        totalDuration: 120,
        sessionDuration: 45,
        prioritySubjects: [],
        restDays: []
      },
      today: TODAY
    });

    expect(plan.mode).toBe('assessment');
    expect(plan.suggestionsBySubject).toHaveLength(1);
    expect(plan.suggestionsBySubject[0].subject).toBe('Mathématiques');
    expect(plan.suggestionsBySubject[0].chapters[0]).toMatchObject({
      chapter: 'Suites',
      origin: 'assessment',
      urgency: 'high',
      originLabel: 'Évaluation proche'
    });
    expect(plan.suggestionsBySubject[0].chapters[0].score).toBeGreaterThan(0);
    expect(plan.suggestionsBySubject[0].chapters[0].suggestedDuration).toBe('45min - 1h');
  });

  test('falls back to anticipation suggestions when no urgent review exists', () => {
    const plan = buildSuggestionPlan({
      selectedDay: 'Lundi',
      currentWeek: 37,
      currentYear: 2026,
      currentDayName: 'Lundi',
      days: DAYS,
      courseCatalog: [],
      courseProgress: {},
      evaluationEvents: [],
      nextDayScheduleEvents: [{ subject: 'Maths', type: 'Cours', time: '08:00' }],
      revisionSettings: {
        totalDuration: 60,
        sessionDuration: 30,
        prioritySubjects: [],
        restDays: []
      },
      today: TODAY
    });

    expect(plan.mode).toBe('anticipation');
    expect(plan.suggestionsBySubject).toHaveLength(1);
    expect(plan.suggestionsBySubject[0].chapters[0]).toMatchObject({
      isVirtual: true,
      origin: 'fallback',
      originLabel: 'Anticipation'
    });
  });

  test('returns an empty rest-day plan when the selected day is disabled', () => {
    const plan = buildSuggestionPlan({
      selectedDay: 'Vendredi',
      currentWeek: 37,
      currentYear: 2026,
      currentDayName: 'Lundi',
      days: DAYS,
      courseCatalog: [],
      courseProgress: {},
      evaluationEvents: [],
      nextDayScheduleEvents: [{ subject: 'Maths', type: 'Cours', time: '08:00' }],
      revisionSettings: {
        totalDuration: 60,
        sessionDuration: 30,
        prioritySubjects: [],
        restDays: ['Vendredi']
      },
      today: TODAY
    });

    expect(plan.isRestDay).toBe(true);
    expect(plan.mode).toBe('rest');
    expect(plan.suggestionsBySubject).toEqual([]);
  });

  test('computes next day schedule context across ISO week boundaries', () => {
    const context = getNextDayScheduleContext({
      day: 'Dimanche',
      weekNum: 53,
      year: 2026,
      days: DAYS
    });

    expect(context).toEqual({
      nextDay: 'Lundi',
      nextWeekNum: 1,
      nextYear: 2027
    });
  });
});
