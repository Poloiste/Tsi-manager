import {
  getPreparationDays,
  getUrgencyMultiplier,
  getSuggestedDuration,
  baseScoreByType,
  buildFallbackSuggestionsFromSchedule
} from './suggestionHelpers';

export const SUGGESTION_ENGINE_MODES = {
  LEGACY: 'legacy',
  V2: 'v2'
};

export const DEFAULT_REVISION_SETTINGS_V2 = {
  totalDuration: 120,
  sessionDuration: 45,
  prioritySubjects: [],
  restDays: ['Vendredi', 'Samedi'],
  suggestionEngineMode: SUGGESTION_ENGINE_MODES.V2
};

const MAX_SUBJECT_SCORE = 200;
const NEVER_REVIEWED_VALUE = Number.MAX_SAFE_INTEGER;

const V2_SCORING = {
  prioritySubjectBonus: 25,
  nextDayClassBonus: 30,
  masteryWeight: 0.25,
  staleReviewDailyBonus: 2,
  staleReviewBonusCap: 35,
  neverReviewedBonus: 35,
  minSubjectScore: 15,
  minCoursePriority: 20,
  maxChaptersPerSubject: 2
};

const normalizeNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeString = (value = '') => value.trim();

const normalizeText = (value = '') => normalizeString(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const uniqueStrings = (items) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => normalizeString(String(item || '')))
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeText(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const subjectsMatch = (left, right) => {
  const l = normalizeText(left);
  const r = normalizeText(right);
  if (!l || !r) return false;
  return l === r || l.includes(r) || r.includes(l);
};

export const normalizeRevisionSettings = (settings = {}) => {
  const safeSettings = settings && typeof settings === 'object' ? settings : {};
  const rawMode = safeSettings.suggestionEngineMode;
  const suggestionEngineMode = rawMode === SUGGESTION_ENGINE_MODES.LEGACY
    ? SUGGESTION_ENGINE_MODES.LEGACY
    : SUGGESTION_ENGINE_MODES.V2;

  return {
    totalDuration: normalizeNumber(safeSettings.totalDuration, DEFAULT_REVISION_SETTINGS_V2.totalDuration),
    sessionDuration: normalizeNumber(safeSettings.sessionDuration, DEFAULT_REVISION_SETTINGS_V2.sessionDuration),
    prioritySubjects: uniqueStrings(safeSettings.prioritySubjects),
    restDays: uniqueStrings(safeSettings.restDays),
    suggestionEngineMode
  };
};

const calculateDaysFromDayToTest = ({ fromDay, test, days, currentWeek, currentDayName, today = new Date(), parseLocalDate, calculateDaysBetween }) => {
  const dayIndex = days.indexOf(fromDay);
  const testDayIndex = days.indexOf(test.day);

  if (test.date && typeof parseLocalDate === 'function' && typeof calculateDaysBetween === 'function') {
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    const testDate = parseLocalDate(test.date);
    const totalDaysToTest = calculateDaysBetween(todayDate, testDate);

    const todayDayIndex = days.indexOf(currentDayName);
    if (dayIndex < 0 || todayDayIndex < 0) {
      return totalDaysToTest;
    }

    let daysToSpecifiedDay = dayIndex - todayDayIndex;
    if (daysToSpecifiedDay < 0) {
      daysToSpecifiedDay += 7;
    }

    return totalDaysToTest - daysToSpecifiedDay;
  }

  if (Number.isFinite(test.week) && dayIndex >= 0 && testDayIndex >= 0) {
    const weekOffset = test.week - currentWeek;
    return (weekOffset * 7) + (testDayIndex - dayIndex);
  }

  return Number.isFinite(test.daysUntil) ? test.daysUntil : -1;
};

const toUnifiedOutputContract = (suggestions = []) => suggestions.map((subjectGroup) => ({
  ...subjectGroup,
  hasClassTomorrow: Boolean(subjectGroup.hasClassTomorrow || subjectGroup.hasClassToday),
  chapters: (subjectGroup.chapters || []).map((chapter) => ({
    ...chapter,
    fromTomorrowCourse: Boolean(chapter.fromTomorrowCourse || chapter.fromTodayCourse)
  }))
}));

export const createSuggestionContext = ({
  day,
  weekNum,
  currentWeek,
  days,
  subjects,
  courses,
  revisionSettings,
  upcomingTests,
  nextDayScheduleEvents,
  currentDayName
}) => {
  const normalizedSettings = normalizeRevisionSettings(revisionSettings);
  const sessionDuration = Math.max(1, normalizedSettings.sessionDuration);
  const totalSlots = Math.max(0, Math.floor(normalizedSettings.totalDuration / sessionDuration));

  const courseList = Array.isArray(courses)
    ? courses
        .filter((course) => course && normalizeString(course.subject) && normalizeString(course.chapter))
        .map((course) => ({
          ...course,
          subject: normalizeString(course.subject),
          chapter: normalizeString(course.chapter)
        }))
    : [];

  const knownSubjects = uniqueStrings([
    ...(Array.isArray(subjects) ? subjects : []),
    ...courseList.map((course) => course.subject)
  ]);

  return {
    day,
    weekNum,
    currentWeek,
    currentDayName,
    days: Array.isArray(days) ? days : [],
    settings: normalizedSettings,
    totalSlots,
    subjects: knownSubjects,
    courses: courseList,
    upcomingTests: Array.isArray(upcomingTests) ? upcomingTests : [],
    nextDayScheduleEvents: Array.isArray(nextDayScheduleEvents) ? nextDayScheduleEvents : []
  };
};

const computeLegacySuggestions = (context, deps) => {
  if (context.settings.restDays.includes(context.day)) {
    return [];
  }

  const totalSlots = context.totalSlots;
  if (totalSlots <= 0) {
    return [];
  }

  const scheduledSubjects = context.nextDayScheduleEvents.map((event) => normalizeText(event.subject));
  const isScheduledNextDay = (subject) =>
    scheduledSubjects.some((scheduledSubject) => {
      const normalizedSubject = normalizeText(subject);
      return scheduledSubject && normalizedSubject && (
        scheduledSubject.includes(normalizedSubject) ||
        normalizedSubject.includes(scheduledSubject)
      );
    });

  const subjectScores = {};

  context.subjects.forEach((subject) => {
    let score = 0;

    if (context.settings.prioritySubjects.includes(subject)) {
      score += 20;
    }

    const subjectTests = context.upcomingTests.filter((test) => subjectsMatch(test.subject, subject));

    const relevantTests = [];
    subjectTests.forEach((test) => {
      const daysUntilFromThisDay = calculateDaysFromDayToTest({
        fromDay: context.day,
        test,
        days: context.days,
        currentWeek: context.currentWeek,
        currentDayName: context.currentDayName,
        parseLocalDate: deps.parseLocalDate,
        calculateDaysBetween: deps.calculateDaysBetween
      });

      const prepDays = getPreparationDays(test.type);
      if (daysUntilFromThisDay > 0 && daysUntilFromThisDay <= prepDays) {
        const baseScore = baseScoreByType[test.type] || 30;
        const urgencyMultiplier = getUrgencyMultiplier(daysUntilFromThisDay, test.type);
        score += baseScore * urgencyMultiplier;
        relevantTests.push({
          ...test,
          daysUntilFromThisDay,
          suggestedDuration: getSuggestedDuration(test.type, daysUntilFromThisDay)
        });
      }
    });

    const subjectCourses = context.courses.filter((course) => course.subject === subject);
    if (subjectCourses.length > 0) {
      const avgMastery = subjectCourses.reduce((sum, course) => sum + (course.mastery || 0), 0) / subjectCourses.length;
      score += (100 - avgMastery) * 0.2;

      const oldestReview = subjectCourses.reduce((oldest, course) => {
        if (!course.lastReviewed) return NEVER_REVIEWED_VALUE;
        const days = Math.floor((new Date() - new Date(course.lastReviewed)) / (1000 * 60 * 60 * 24));
        return Math.min(oldest, days);
      }, 0);

      score += Math.min(oldestReview * 2, 30);
    }

    if (isScheduledNextDay(subject)) {
      score += 25;
    }

    subjectScores[subject] = {
      score,
      tests: relevantTests,
      hasClassTomorrow: isScheduledNextDay(subject)
    };
  });

  const weekContext = { upcomingTests: context.upcomingTests };
  const coursesWithPriority = context.courses.map((course) => {
    const subjectData = subjectScores[course.subject];
    const hasRelevantTest = subjectData?.tests?.length > 0;
    const firstTest = hasRelevantTest ? subjectData.tests[0] : null;

    return {
      ...course,
      ...deps.calculateReviewPriority(course, weekContext),
      subjectScore: subjectData?.score || 0,
      relevantTest: firstTest,
      suggestedDuration: firstTest?.suggestedDuration || '30min - 45min'
    };
  });

  const coursesBySubject = {};
  coursesWithPriority.forEach((course) => {
    if (!coursesBySubject[course.subject]) {
      coursesBySubject[course.subject] = [];
    }
    coursesBySubject[course.subject].push(course);
  });

  const sortedSubjects = Object.keys(coursesBySubject).sort((a, b) => {
    const scoreA = subjectScores[a]?.score || 0;
    const scoreB = subjectScores[b]?.score || 0;
    return scoreB - scoreA;
  });

  const suggestionsBySubject = [];
  let totalChaptersSelected = 0;

  for (const subject of sortedSubjects) {
    if (totalChaptersSelected >= totalSlots) break;

    const subjectData = subjectScores[subject];
    const subjectCourses = coursesBySubject[subject];

    const sortedChapters = [...subjectCourses].sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyA = a.relevantTest ? (
        a.relevantTest.daysUntilFromThisDay <= 2 ? 'high' :
        a.relevantTest.daysUntilFromThisDay <= 3 ? 'medium' : 'low'
      ) : (a.priority > 80 ? 'medium' : 'low');
      const urgencyB = b.relevantTest ? (
        b.relevantTest.daysUntilFromThisDay <= 2 ? 'high' :
        b.relevantTest.daysUntilFromThisDay <= 3 ? 'medium' : 'low'
      ) : (b.priority > 80 ? 'medium' : 'low');

      if (urgencyOrder[urgencyA] !== urgencyOrder[urgencyB]) {
        return urgencyOrder[urgencyB] - urgencyOrder[urgencyA];
      }

      return b.priority - a.priority;
    });

    const chaptersToInclude = sortedChapters.slice(0, Math.min(2, totalSlots - totalChaptersSelected));

    if (chaptersToInclude.length > 0 && (subjectData?.score > 20 || chaptersToInclude[0].priority > 25)) {
      const enrichedChapters = chaptersToInclude.map((course) => {
        const hasTest = course.relevantTest != null;
        const test = course.relevantTest;

        let urgency = 'low';
        let reasonText = 'Révision recommandée';

        if (hasTest) {
          const daysUntil = test.daysUntilFromThisDay;
          if (daysUntil <= 1) {
            urgency = 'high';
            reasonText = `🎯 ${test.type} dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} - Révision ${test.type === 'DS' || test.type === 'Examen' ? 'approfondie' : 'intensive'}`;
          } else if (daysUntil <= 2) {
            urgency = 'high';
            reasonText = `🎯 ${test.type} dans ${daysUntil} jours`;
          } else if (daysUntil <= 3) {
            urgency = 'medium';
            reasonText = `🎯 ${test.type} dans ${daysUntil} jours`;
          } else {
            urgency = 'low';
            reasonText = `🎯 ${test.type} dans ${daysUntil} jours - Préparation progressive`;
          }
        } else if (subjectData?.hasClassTomorrow) {
          urgency = 'medium';
          reasonText = '🏫 Cours demain - Consolidez avant le cours';
        } else if (course.priority > 80) {
          urgency = 'medium';
          reasonText = 'Révision urgente';
        }

        return {
          ...course,
          reason: reasonText,
          urgency,
          fromTomorrowCourse: !hasTest && !!subjectData?.hasClassTomorrow
        };
      });

      suggestionsBySubject.push({
        subject,
        subjectScore: subjectData?.score || 0,
        relevantTests: subjectData?.tests || [],
        hasClassTomorrow: !!subjectData?.hasClassTomorrow,
        chapters: enrichedChapters
      });

      totalChaptersSelected += enrichedChapters.length;
    }
  }

  if (suggestionsBySubject.length > 0) {
    return suggestionsBySubject;
  }

  const fallback = buildFallbackSuggestionsFromSchedule(context.nextDayScheduleEvents, coursesWithPriority, totalSlots);
  return fallback.map((subjectGroup) => ({
    ...subjectGroup,
    hasClassTomorrow: true,
    chapters: (subjectGroup.chapters || []).map((chapter) => ({
      ...chapter,
      fromTomorrowCourse: true
    }))
  }));
};

const buildSubjectScoresV2 = (context) => {
  const scheduleSubjects = context.nextDayScheduleEvents.map((event) => normalizeText(event.subject));
  const isScheduledNextDay = (subject) => scheduleSubjects.some((scheduledSubject) => {
    const normalizedSubject = normalizeText(subject);
    return scheduledSubject && normalizedSubject && (
      scheduledSubject === normalizedSubject ||
      scheduledSubject.includes(normalizedSubject) ||
      normalizedSubject.includes(scheduledSubject)
    );
  });

  const subjectScores = {};

  context.subjects.forEach((subject) => {
    let score = 0;

    if (context.settings.prioritySubjects.some((prioritySubject) => subjectsMatch(prioritySubject, subject))) {
      score += V2_SCORING.prioritySubjectBonus;
    }

    const relevantTests = context.upcomingTests
      .filter((test) => subjectsMatch(test.subject, subject))
      .map((test) => {
        const daysUntilFromThisDay = calculateDaysFromDayToTest({
          fromDay: context.day,
          test,
          days: context.days,
          currentWeek: context.currentWeek,
          currentDayName: context.currentDayName,
          parseLocalDate: context.parseLocalDate,
          calculateDaysBetween: context.calculateDaysBetween
        });

        const prepDays = getPreparationDays(test.type);
        if (daysUntilFromThisDay <= 0 || daysUntilFromThisDay > prepDays) {
          return null;
        }

        const baseScore = baseScoreByType[test.type] || 30;
        const urgencyMultiplier = getUrgencyMultiplier(daysUntilFromThisDay, test.type);
        const scoreContribution = baseScore * urgencyMultiplier;

        return {
          ...test,
          daysUntilFromThisDay,
          suggestedDuration: getSuggestedDuration(test.type, daysUntilFromThisDay),
          scoreContribution
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysUntilFromThisDay - b.daysUntilFromThisDay);

    score += relevantTests.reduce((sum, test) => sum + test.scoreContribution, 0);

    const subjectCourses = context.courses.filter((course) => subjectsMatch(course.subject, subject));
    if (subjectCourses.length > 0) {
      const avgMastery = subjectCourses.reduce((sum, course) => sum + (course.mastery || 0), 0) / subjectCourses.length;
      score += (100 - avgMastery) * V2_SCORING.masteryWeight;

      const reviewAges = subjectCourses.map((course) => {
        if (!course.lastReviewed) return NEVER_REVIEWED_VALUE;
        const age = Math.floor((new Date() - new Date(course.lastReviewed)) / (1000 * 60 * 60 * 24));
        return Number.isFinite(age) ? Math.max(0, age) : 0;
      });

      const hasNeverReviewed = reviewAges.includes(NEVER_REVIEWED_VALUE);
      const maxReviewAge = reviewAges.reduce((max, value) => {
        if (value === NEVER_REVIEWED_VALUE) return max;
        return Math.max(max, value);
      }, 0);

      score += Math.min(maxReviewAge * V2_SCORING.staleReviewDailyBonus, V2_SCORING.staleReviewBonusCap);
      if (hasNeverReviewed) {
        score += V2_SCORING.neverReviewedBonus;
      }
    }

    const hasClassTomorrow = isScheduledNextDay(subject);
    if (hasClassTomorrow) {
      score += V2_SCORING.nextDayClassBonus;
    }

    subjectScores[subject] = {
      score: Math.max(0, Math.min(MAX_SUBJECT_SCORE, score)),
      tests: relevantTests,
      hasClassTomorrow
    };
  });

  return subjectScores;
};

const buildSuggestionsFromScoresV2 = (context, subjectScores, calculateReviewPriority) => {
  const weekContext = { upcomingTests: context.upcomingTests };

  const coursesWithPriority = context.courses.map((course) => {
    const subjectData = subjectScores[course.subject] || { score: 0, tests: [] };
    const firstRelevantTest = subjectData.tests?.[0] || null;

    return {
      ...course,
      ...calculateReviewPriority(course, weekContext),
      subjectScore: subjectData.score || 0,
      relevantTest: firstRelevantTest,
      suggestedDuration: firstRelevantTest?.suggestedDuration || '30min - 45min'
    };
  });

  const coursesBySubject = coursesWithPriority.reduce((acc, course) => {
    if (!acc[course.subject]) acc[course.subject] = [];
    acc[course.subject].push(course);
    return acc;
  }, {});

  const sortedSubjects = Object.keys(coursesBySubject)
    .sort((left, right) => (subjectScores[right]?.score || 0) - (subjectScores[left]?.score || 0));

  const suggestionsBySubject = [];
  let selectedChaptersCount = 0;

  for (const subject of sortedSubjects) {
    if (selectedChaptersCount >= context.totalSlots) break;

    const subjectData = subjectScores[subject] || { score: 0, tests: [], hasClassTomorrow: false };
    const remainingSlots = context.totalSlots - selectedChaptersCount;
    const subjectCourses = [...coursesBySubject[subject]].sort((a, b) => {
      const urgencyRank = { high: 3, medium: 2, low: 1 };

      const urgencyForCourse = (course) => {
        if (course.relevantTest) {
          if (course.relevantTest.daysUntilFromThisDay <= 2) return 'high';
          if (course.relevantTest.daysUntilFromThisDay <= 4) return 'medium';
          return 'low';
        }
        if (course.priority > 80) return 'medium';
        return 'low';
      };

      const urgencyA = urgencyForCourse(a);
      const urgencyB = urgencyForCourse(b);

      if (urgencyRank[urgencyA] !== urgencyRank[urgencyB]) {
        return urgencyRank[urgencyB] - urgencyRank[urgencyA];
      }

      return (b.priority || 0) - (a.priority || 0);
    });

    const chapterLimit = Math.min(V2_SCORING.maxChaptersPerSubject, remainingSlots);
    const chaptersToInclude = subjectCourses.slice(0, chapterLimit);

    if (
      chaptersToInclude.length === 0 ||
      (subjectData.score < V2_SCORING.minSubjectScore && (chaptersToInclude[0]?.priority || 0) < V2_SCORING.minCoursePriority)
    ) {
      continue;
    }

    const chapters = chaptersToInclude.map((course) => {
      const test = course.relevantTest;
      const hasTest = Boolean(test);
      let urgency = 'low';
      let reason = 'Révision recommandée';

      if (hasTest) {
        if (test.daysUntilFromThisDay <= 1) {
          urgency = 'high';
          reason = `🎯 ${test.type} demain - Révision intensive`;
        } else if (test.daysUntilFromThisDay <= 2) {
          urgency = 'high';
          reason = `🎯 ${test.type} dans ${test.daysUntilFromThisDay} jours`;
        } else if (test.daysUntilFromThisDay <= 4) {
          urgency = 'medium';
          reason = `🎯 ${test.type} dans ${test.daysUntilFromThisDay} jours`;
        } else {
          urgency = 'low';
          reason = `🎯 ${test.type} dans ${test.daysUntilFromThisDay} jours - Préparation progressive`;
        }
      } else if (subjectData.hasClassTomorrow) {
        urgency = 'medium';
        reason = '🏫 Cours demain - Consolidation conseillée';
      } else if ((course.priority || 0) > 80) {
        urgency = 'medium';
        reason = 'Révision prioritaire';
      }

      return {
        ...course,
        urgency,
        reason,
        fromTomorrowCourse: !hasTest && subjectData.hasClassTomorrow
      };
    });

    suggestionsBySubject.push({
      subject,
      subjectScore: subjectData.score,
      relevantTests: subjectData.tests,
      hasClassTomorrow: subjectData.hasClassTomorrow,
      chapters
    });

    selectedChaptersCount += chapters.length;
  }

  if (suggestionsBySubject.length > 0) {
    return suggestionsBySubject;
  }

  const fallback = buildFallbackSuggestionsFromSchedule(context.nextDayScheduleEvents, coursesWithPriority, context.totalSlots);
  return fallback.map((subjectGroup) => ({
    ...subjectGroup,
    hasClassTomorrow: true,
    chapters: (subjectGroup.chapters || []).map((chapter) => ({
      ...chapter,
      fromTomorrowCourse: true
    }))
  }));
};

const computeV2Suggestions = (context, deps) => {
  if (context.settings.restDays.includes(context.day)) {
    return [];
  }

  if (context.totalSlots <= 0) {
    return [];
  }

  const withDateDeps = {
    ...context,
    parseLocalDate: deps.parseLocalDate,
    calculateDaysBetween: deps.calculateDaysBetween
  };

  const subjectScores = buildSubjectScoresV2(withDateDeps);
  return buildSuggestionsFromScoresV2(withDateDeps, subjectScores, deps.calculateReviewPriority);
};

export const getSuggestedReviewsByMode = (context, deps) => {
  const mode = context.settings.suggestionEngineMode;

  if (mode === SUGGESTION_ENGINE_MODES.LEGACY) {
    return toUnifiedOutputContract(computeLegacySuggestions(context, deps));
  }

  return toUnifiedOutputContract(computeV2Suggestions(context, deps));
};
