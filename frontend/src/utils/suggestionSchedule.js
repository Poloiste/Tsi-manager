import { isoWeeksInYear } from './weekUtils';

const DEFAULT_DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const WEEKEND_DAYS = new Set(['Vendredi', 'Samedi', 'Dimanche']);

const incrementIsoWeek = (week, year) => {
  const maxWeeks = isoWeeksInYear(year);
  if (week >= maxWeeks) {
    return { week: 1, year: year + 1 };
  }

  return { week: week + 1, year };
};

export const getSuggestionScheduleTarget = ({
  day,
  week,
  year,
  days = DEFAULT_DAYS
}) => {
  if (WEEKEND_DAYS.has(day)) {
    const nextWeek = incrementIsoWeek(week, year);
    return {
      targetDay: 'Lundi',
      targetWeek: nextWeek.week,
      targetYear: nextWeek.year,
      isWeekendBridge: true
    };
  }

  const dayIndex = days.indexOf(day);
  if (dayIndex === -1) {
    return {
      targetDay: 'Lundi',
      targetWeek: week,
      targetYear: year,
      isWeekendBridge: false
    };
  }

  const nextDayIndex = (dayIndex + 1) % days.length;
  const crossesWeekBoundary = nextDayIndex === 0;
  const nextWeek = crossesWeekBoundary ? incrementIsoWeek(week, year) : { week, year };

  return {
    targetDay: days[nextDayIndex],
    targetWeek: nextWeek.week,
    targetYear: nextWeek.year,
    isWeekendBridge: false
  };
};
