import { getSuggestionScheduleTarget } from './suggestionSchedule';
import { isoWeeksInYear } from './weekUtils';

describe('getSuggestionScheduleTarget', () => {
  test('uses the following day during the school week', () => {
    expect(getSuggestionScheduleTarget({
      day: 'Jeudi',
      week: 12,
      year: 2026
    })).toEqual({
      targetDay: 'Vendredi',
      targetWeek: 12,
      targetYear: 2026,
      isWeekendBridge: false
    });
  });

  test('uses Monday of the next week from Friday evening', () => {
    expect(getSuggestionScheduleTarget({
      day: 'Vendredi',
      week: 12,
      year: 2026
    })).toEqual({
      targetDay: 'Lundi',
      targetWeek: 13,
      targetYear: 2026,
      isWeekendBridge: true
    });
  });

  test('rolls over the ISO year when weekend suggestions target next Monday', () => {
    const lastWeekOfYear = isoWeeksInYear(2026);

    expect(getSuggestionScheduleTarget({
      day: 'Dimanche',
      week: lastWeekOfYear,
      year: 2026
    })).toEqual({
      targetDay: 'Lundi',
      targetWeek: 1,
      targetYear: 2027,
      isWeekendBridge: true
    });
  });
});
