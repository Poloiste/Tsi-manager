/**
 * Tests for getCurrentSchoolWeek function
 */
import { getCurrentSchoolWeek, getDefaultDay, schoolCalendar2024_2025 } from './schoolWeek';

describe('getCurrentSchoolWeek', () => {
  test('should work with current date (no parameter)', () => {
    const week = getCurrentSchoolWeek();
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(33);
  });

  test('should return S1 on September 2, 2024 (first day)', () => {
    const date = new Date(2024, 8, 2); // September 2, 2024
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S1 on September 6, 2024 (last day of S1)', () => {
    const date = new Date(2024, 8, 6); // September 6, 2024
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S2 on September 9, 2024 (first day of S2)', () => {
    const date = new Date(2024, 8, 9); // September 9, 2024
    expect(getCurrentSchoolWeek(date)).toBe(2);
  });

  test('should return S4 on September 25, 2024', () => {
    const date = new Date(2024, 8, 25); // September 25, 2024
    expect(getCurrentSchoolWeek(date)).toBe(4);
  });

  test('should return S12 on December 6, 2024', () => {
    const date = new Date(2024, 11, 6); // December 6, 2024
    // According to calendar: S12 is Dec 2-6
    expect(getCurrentSchoolWeek(date)).toBe(12);
  });

  test('should return S8 during Toussaint vacation (returns next week)', () => {
    const date = new Date(2024, 9, 25); // October 25, 2024 (during Toussaint vacation)
    // Should return S8 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(8);
  });

  test('should return S15 during Christmas vacation (returns next week)', () => {
    const date = new Date(2024, 11, 25); // December 25, 2024 (during Christmas vacation)
    // Should return S15 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(15);
  });

  test('should return S15 on January 6, 2025 (first day after Christmas)', () => {
    const date = new Date(2025, 0, 6); // January 6, 2025
    expect(getCurrentSchoolWeek(date)).toBe(15);
  });

  test('should return S16 on January 15, 2025', () => {
    const date = new Date(2025, 0, 15); // January 15, 2025
    // S16 is Jan 13-17
    expect(getCurrentSchoolWeek(date)).toBe(16);
  });

  test('should return S21 during winter vacation (returns next week)', () => {
    const date = new Date(2025, 1, 20); // February 20, 2025 (during winter vacation)
    // Should return S21 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(21);
  });

  test('should return S27 during spring vacation (returns next week)', () => {
    const date = new Date(2025, 3, 20); // April 20, 2025 (during spring vacation)
    // Should return S27 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(27);
  });

  test('should return S33 on June 10, 2025', () => {
    const date = new Date(2025, 5, 10); // June 10, 2025
    // S33 is June 9-13
    expect(getCurrentSchoolWeek(date)).toBe(33);
  });

  test('should return S1 after summer vacation', () => {
    const date = new Date(2025, 7, 1); // August 1, 2025 (summer vacation)
    // Should return S1 (default for dates after S33)
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S1 before school year starts', () => {
    const date = new Date(2024, 8, 1); // September 1, 2024 (day before school starts)
    // Should return S1 (next upcoming week)
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should handle weekend within school week correctly', () => {
    const date = new Date(2024, 8, 7); // September 7, 2024 (Saturday of S1)
    // Weekend is still part of S1 week, but returns S2 (next school week)
    expect(getCurrentSchoolWeek(date)).toBe(2);
  });

  test('should handle weekend between school weeks correctly', () => {
    const date = new Date(2024, 8, 8); // September 8, 2024 (Sunday between S1 and S2)
    // Should return S2 (next upcoming week)
    expect(getCurrentSchoolWeek(date)).toBe(2);
  });
});

describe('getDefaultDay', () => {
  test('should return day name in French', () => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const date = new Date(2024, 11, 2); // December 2, 2024 (Monday)
    const dayName = getDefaultDay(date);
    expect(days).toContain(dayName);
  });

  test('should work with current date (no parameter)', () => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = getDefaultDay();
    expect(days).toContain(dayName);
  });
});

describe('schoolCalendar2024_2025', () => {
  test('should have all 33 weeks', () => {
    expect(Object.keys(schoolCalendar2024_2025).length).toBe(33);
  });

  test('should have valid date ranges', () => {
    Object.entries(schoolCalendar2024_2025).forEach(([weekNum, dates]) => {
      expect(dates.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dates.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(dates.start) <= new Date(dates.end)).toBe(true);
    });
  });
});
