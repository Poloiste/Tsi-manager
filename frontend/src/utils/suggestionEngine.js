import { calculateDaysBetween, normalizeToMidnight, parseLocalDate } from './dateUtils';
import {
  baseScoreByType,
  buildFallbackSuggestionsFromSchedule,
  getPreparationDays,
  getSuggestedDuration,
  getUrgencyMultiplier,
  subjectsMatch
} from './suggestionHelpers';

const EVALUATION_TYPES = new Set(['DS', 'DM', 'Colle', 'Examen', 'TP Noté']);
const DEFAULT_DURATION = '30min - 45min';
const DEFAULT_REVISION_SETTINGS = {
  totalDuration: 120,
  sessionDuration: 45,
  prioritySubjects: [],
  restDays: []
};

const urgencyRank = { high: 3, medium: 2, low: 1 };

const buildCourseEntries = (courseCatalog = [], courseProgress = {}) => (
  courseCatalog.map(course => {
    const progress = courseProgress[course.id] || {};

    return {
      ...course,
      mastery: progress.mastery ?? course.mastery ?? 0,
      reviewCount: progress.reviewCount ?? course.reviewCount ?? 0,
      lastReviewed: progress.lastReviewed ?? course.lastReviewed ?? null,
      reviewHistory: progress.reviewHistory ?? course.reviewHistory ?? [],
      oneDriveLinks: progress.oneDriveLinks ?? course.oneDriveLinks ?? []
    };
  })
);

const getUniqueSubjects = (...sources) => {
  const unique = [];

  sources.flat().forEach(subject => {
    if (!subject?.trim()) {
      return;
    }

    if (!unique.some(existing => subjectsMatch(existing, subject))) {
      unique.push(subject.trim());
    }
  });

  return unique;
};

const getMatchingSubject = (subject, candidates = []) => (
  candidates.find(candidate => subjectsMatch(candidate, subject)) || null
);

const getDaysSinceReview = (lastReviewed, today) => {
  if (!lastReviewed) {
    return null;
  }

  const reviewedAt = /^\d{4}-\d{2}-\d{2}$/.test(lastReviewed)
    ? parseLocalDate(lastReviewed)
    : new Date(lastReviewed);

  return calculateDaysBetween(normalizeToMidnight(reviewedAt), normalizeToMidnight(today));
};

const getReviewStalenessBonus = (subjectCourses, today) => {
  if (subjectCourses.length === 0) {
    return 0;
  }

  if (subjectCourses.some(course => !course.lastReviewed)) {
    return 30;
  }

  const maxDaysSinceReview = subjectCourses.reduce((maxValue, course) => (
    Math.max(maxValue, getDaysSinceReview(course.lastReviewed, today) || 0)
  ), 0);

  return Math.min(maxDaysSinceReview * 2, 30);
};

const getCourseUrgency = (course) => {
  if (course.relevantTest) {
    if (course.relevantTest.daysUntilFromSelectedDay <= 2) return 'high';
    if (course.relevantTest.daysUntilFromSelectedDay <= 3) return 'medium';
    return 'low';
  }

  if (course.origin === 'maintenance' && course.score > 80) {
    return 'medium';
  }

  return 'low';
};

const getOriginLabel = (origin) => {
  switch (origin) {
    case 'assessment':
      return 'Évaluation proche';
    case 'anticipation':
      return 'Cours demain';
    case 'fallback':
      return 'Anticipation';
    default:
      return 'Entretien';
  }
};

const getChapterReason = (course, subjectData) => {
  if (course.relevantTest) {
    const { type, daysUntilFromSelectedDay } = course.relevantTest;

    if (daysUntilFromSelectedDay <= 1) {
      return `🎯 ${type} dans ${daysUntilFromSelectedDay} jour - Révision prioritaire`;
    }

    if (daysUntilFromSelectedDay <= 3) {
      return `🎯 ${type} dans ${daysUntilFromSelectedDay} jours`;
    }

    return `🎯 ${type} dans ${daysUntilFromSelectedDay} jours - Préparation progressive`;
  }

  if (subjectData.hasScheduledClassNextDay) {
    return '🏫 Cours demain - Anticipez pour arriver prêt en classe';
  }

  return '📘 Entretien recommandé pour conserver la maîtrise';
};

const computeNextDayContext = ({ day, weekNum, year, days }) => {
  const dayIndex = days.indexOf(day);
  const nextDayIndex = (dayIndex + 1) % days.length;
  let nextWeekNum = weekNum;
  let nextYear = year;

  if (nextDayIndex === 0) {
    const weeksInYear = (() => {
      const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay() || 7;
      const dec31Day = new Date(Date.UTC(year, 11, 31)).getUTCDay() || 7;
      return (jan1Day === 4 || dec31Day === 4) ? 53 : 52;
    })();

    if (weekNum >= weeksInYear) {
      nextWeekNum = 1;
      nextYear = year + 1;
    } else {
      nextWeekNum = weekNum + 1;
    }
  }

  return {
    nextDay: days[nextDayIndex],
    nextWeekNum,
    nextYear
  };
};

export const getNextDayScheduleContext = computeNextDayContext;

export const getUpcomingTests = ({
  evaluationEvents = [],
  currentWeek,
  days,
  currentDayName,
  daysAhead = 14,
  today = new Date()
}) => {
  const todayNormalized = normalizeToMidnight(today);

  return evaluationEvents
    .filter(event => EVALUATION_TYPES.has(event?.type))
    .map(event => {
      let daysUntil = 0;

      if (event.date) {
        const eventDate = parseLocalDate(event.date);
        daysUntil = calculateDaysBetween(todayNormalized, eventDate);
      } else {
        const weekOffset = (event.week || currentWeek) - currentWeek;
        const dayIndex = days.indexOf(event.day);
        const currentDayIndex = days.indexOf(currentDayName);
        daysUntil = (weekOffset * 7) + dayIndex - (currentDayIndex >= 0 ? currentDayIndex : 0);
      }

      return {
        subject: event.subject,
        type: event.type,
        day: event.day,
        week: event.week,
        date: event.date,
        daysUntil,
        time: event.time
      };
    })
    .filter(test => test.daysUntil >= 0 && test.daysUntil <= daysAhead)
    .sort((left, right) => left.daysUntil - right.daysUntil);
};

export const calculateReviewPriority = ({
  course,
  upcomingTests = [],
  today = new Date()
}) => {
  if (!course.lastReviewed) {
    return { priority: 100, reason: 'Jamais révisé', daysUntilReview: 0, daysSinceReview: 0 };
  }

  const daysSinceReview = getDaysSinceReview(course.lastReviewed, today) || 0;
  const intervals = [1, 3, 7, 14, 30, 60];
  const reviewCount = course.reviewHistory?.length || 0;
  const optimalInterval = intervals[Math.min(reviewCount, intervals.length - 1)];
  const daysUntilReview = optimalInterval - daysSinceReview;

  let priority = daysSinceReview >= optimalInterval
    ? 100 - (course.mastery || 0) + (daysSinceReview - optimalInterval) * 5
    : (daysSinceReview / optimalInterval) * (100 - (course.mastery || 0));

  const testForThisSubject = upcomingTests.find(test => subjectsMatch(test.subject, course.subject));

  if (testForThisSubject) {
    if (testForThisSubject.daysUntil <= 1) priority += 50;
    else if (testForThisSubject.daysUntil <= 3) priority += 35;
    else if (testForThisSubject.daysUntil <= 7) priority += 20;
  }

  let reason = '';
  if (testForThisSubject && testForThisSubject.daysUntil <= 7) {
    reason = `🎯 ${testForThisSubject.type} dans ${testForThisSubject.daysUntil}j !`;
  } else if (daysSinceReview >= optimalInterval * 1.5) {
    reason = '⚠️ Révision urgente !';
  } else if (daysSinceReview >= optimalInterval) {
    reason = '📌 À réviser maintenant';
  } else if (daysUntilReview <= 1) {
    reason = '📜 Bientôt à réviser';
  } else {
    reason = `✔ OK (${daysUntilReview}j)`;
  }

  return {
    priority: Math.max(0, Math.min(150, priority)),
    reason,
    daysUntilReview,
    daysSinceReview
  };
};

export const calculateDaysFromDayToTest = ({
  fromDay,
  test,
  days,
  currentWeek,
  today = new Date(),
  currentDayName
}) => {
  const dayIndex = days.indexOf(fromDay);
  const testDayIndex = days.indexOf(test.day);

  if (test.date) {
    const testDate = parseLocalDate(test.date);
    const todayNormalized = normalizeToMidnight(today);
    const totalDaysToTest = calculateDaysBetween(todayNormalized, testDate);
    const todayDayIndex = days.indexOf(currentDayName);
    let daysToSelectedDay = dayIndex - todayDayIndex;

    if (daysToSelectedDay < 0) {
      daysToSelectedDay += 7;
    }

    return totalDaysToTest - daysToSelectedDay;
  }

  return ((test.week || currentWeek) - currentWeek) * 7 + (testDayIndex - dayIndex);
};

export const buildSuggestionPlan = ({
  selectedDay,
  currentWeek,
  currentYear,
  currentDayName,
  days,
  courseCatalog = [],
  courseProgress = {},
  evaluationEvents = [],
  nextDayScheduleEvents = [],
  revisionSettings = DEFAULT_REVISION_SETTINGS,
  today = new Date()
}) => {
  const settings = { ...DEFAULT_REVISION_SETTINGS, ...revisionSettings };

  if (settings.restDays.includes(selectedDay)) {
    return {
      mode: 'rest',
      isRestDay: true,
      suggestionsBySubject: [],
      totalSlots: 0,
      upcomingTests: [],
      nextDayScheduleEvents,
      nextDayContext: computeNextDayContext({ day: selectedDay, weekNum: currentWeek, year: currentYear, days })
    };
  }

  const totalSlots = Math.max(1, Math.floor(settings.totalDuration / settings.sessionDuration));
  const upcomingTests = getUpcomingTests({
    evaluationEvents,
    currentWeek,
    days,
    currentDayName,
    daysAhead: 14,
    today
  });

  const nextDaySubjects = getUniqueSubjects(nextDayScheduleEvents.map(event => event.subject));
  const allCourses = buildCourseEntries(courseCatalog, courseProgress);
  const availableSubjects = getUniqueSubjects(
    allCourses.map(course => course.subject),
    settings.prioritySubjects,
    upcomingTests.map(test => test.subject),
    nextDaySubjects
  );

  const subjectScores = availableSubjects.reduce((acc, subject) => {
    const matchingCourses = allCourses.filter(course => subjectsMatch(course.subject, subject));
    const relevantTests = upcomingTests
      .filter(test => subjectsMatch(test.subject, subject))
      .map(test => {
        const daysUntilFromSelectedDay = calculateDaysFromDayToTest({
          fromDay: selectedDay,
          test,
          days,
          currentWeek,
          today,
          currentDayName
        });

        return {
          ...test,
          daysUntilFromSelectedDay,
          suggestedDuration: getSuggestedDuration(test.type, daysUntilFromSelectedDay)
        };
      })
      .filter(test => test.daysUntilFromSelectedDay > 0 && test.daysUntilFromSelectedDay <= getPreparationDays(test.type));

    const scoreBreakdown = {
      manualPriority: settings.prioritySubjects.some(prioritySubject => subjectsMatch(prioritySubject, subject)) ? 20 : 0,
      evaluationUrgency: relevantTests.reduce((sum, test) => (
        sum + ((baseScoreByType[test.type] || 30) * getUrgencyMultiplier(test.daysUntilFromSelectedDay, test.type))
      ), 0),
      masteryGap: 0,
      reviewStaleness: getReviewStalenessBonus(matchingCourses, today),
      scheduleProximity: nextDaySubjects.some(scheduleSubject => subjectsMatch(scheduleSubject, subject)) ? 25 : 0
    };

    if (matchingCourses.length > 0) {
      const avgMastery = matchingCourses.reduce((sum, course) => sum + (course.mastery || 0), 0) / matchingCourses.length;
      scoreBreakdown.masteryGap = (100 - avgMastery) * 0.2;
    }

    acc[subject] = {
      score: Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0),
      scoreBreakdown,
      tests: relevantTests,
      hasScheduledClassNextDay: nextDaySubjects.some(scheduleSubject => subjectsMatch(scheduleSubject, subject)),
      canonicalSubject: getMatchingSubject(subject, matchingCourses.map(course => course.subject)) || subject
    };

    return acc;
  }, {});

  const coursesWithPriority = allCourses.map(course => {
    const subjectKey = availableSubjects.find(subject => subjectsMatch(subject, course.subject)) || course.subject;
    const subjectData = subjectScores[subjectKey];
    const basePriority = calculateReviewPriority({ course, upcomingTests, today });
    const relevantTest = subjectData?.tests?.[0] || null;
    let origin = 'maintenance';

    if (relevantTest) {
      origin = 'assessment';
    } else if (subjectData?.hasScheduledClassNextDay) {
      origin = 'anticipation';
    }

    const score = Math.max(basePriority.priority, subjectData?.score || 0);

    return {
      ...course,
      ...basePriority,
      score,
      priority: score,
      subjectScore: subjectData?.score || 0,
      relevantTest,
      suggestedDuration: relevantTest?.suggestedDuration || (subjectData?.hasScheduledClassNextDay ? '20min - 30min' : DEFAULT_DURATION),
      origin,
      originLabel: getOriginLabel(origin)
    };
  });

  const coursesBySubject = availableSubjects.reduce((acc, subject) => {
    const canonical = subjectScores[subject]?.canonicalSubject || subject;
    const subjectCourses = coursesWithPriority.filter(course => subjectsMatch(course.subject, subject));

    if (subjectCourses.length > 0) {
      acc[canonical] = [...(acc[canonical] || []), ...subjectCourses];
    }

    return acc;
  }, {});

  const getSubjectData = (subject) => (
    subjectScores[subject] || subjectScores[getMatchingSubject(subject, Object.keys(subjectScores))] || null
  );

  const sortedSubjects = Object.keys(coursesBySubject).sort((left, right) => (
    (getSubjectData(right)?.score || 0) - (getSubjectData(left)?.score || 0)
  ));

  const suggestionsBySubject = [];
  let totalChaptersSelected = 0;

  for (const subject of sortedSubjects) {
    if (totalChaptersSelected >= totalSlots) break;

    const subjectData = getSubjectData(subject);
    const subjectCourses = coursesBySubject[subject] || [];

    const sortedChapters = [...subjectCourses].sort((left, right) => {
      const leftUrgency = urgencyRank[getCourseUrgency(left)];
      const rightUrgency = urgencyRank[getCourseUrgency(right)];

      if (leftUrgency !== rightUrgency) {
        return rightUrgency - leftUrgency;
      }

      return right.score - left.score;
    });

    const chaptersToInclude = sortedChapters.slice(0, Math.min(2, totalSlots - totalChaptersSelected));

    if (chaptersToInclude.length === 0) {
      continue;
    }

    const enrichedChapters = chaptersToInclude.map(course => {
      const urgency = getCourseUrgency(course);

      return {
        ...course,
        urgency,
        reason: getChapterReason(course, subjectData || {}),
        originLabel: getOriginLabel(course.origin),
        hasScheduledClassNextDay: !!subjectData?.hasScheduledClassNextDay,
        score: course.score,
        priority: course.score
      };
    });

    const groupMode = enrichedChapters.some(chapter => chapter.origin === 'assessment')
      ? 'assessment'
      : enrichedChapters.some(chapter => chapter.origin === 'anticipation')
        ? 'anticipation'
        : 'maintenance';

    if ((subjectData?.score || 0) > 20 || enrichedChapters[0].score > 25) {
      suggestionsBySubject.push({
        subject,
        subjectScore: subjectData?.score || 0,
        relevantTests: subjectData?.tests || [],
        hasScheduledClassNextDay: !!subjectData?.hasScheduledClassNextDay,
        mode: groupMode,
        chapters: enrichedChapters
      });

      totalChaptersSelected += enrichedChapters.length;
    }
  }

  if (suggestionsBySubject.length > 0) {
    const mode = suggestionsBySubject.some(group => group.mode === 'assessment')
      ? 'assessment'
      : suggestionsBySubject.some(group => group.mode === 'anticipation')
        ? 'anticipation'
        : 'maintenance';

    return {
      mode,
      isRestDay: false,
      suggestionsBySubject,
      totalSlots,
      upcomingTests,
      nextDayScheduleEvents,
      nextDayContext: computeNextDayContext({ day: selectedDay, weekNum: currentWeek, year: currentYear, days })
    };
  }

  const fallbackSuggestions = buildFallbackSuggestionsFromSchedule(nextDayScheduleEvents, coursesWithPriority, totalSlots)
    .map(group => ({
      ...group,
      mode: 'anticipation',
      hasScheduledClassNextDay: true,
      chapters: group.chapters.map(chapter => ({
        ...chapter,
        score: chapter.priority,
        priority: chapter.priority,
        origin: 'fallback',
        originLabel: getOriginLabel('fallback')
      }))
    }));

  return {
    mode: fallbackSuggestions.length > 0 ? 'anticipation' : 'empty',
    isRestDay: false,
    suggestionsBySubject: fallbackSuggestions,
    totalSlots,
    upcomingTests,
    nextDayScheduleEvents,
    nextDayContext: computeNextDayContext({ day: selectedDay, weekNum: currentWeek, year: currentYear, days })
  };
};
