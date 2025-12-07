/**
 * Tests for getCurrentSchoolWeek function
 */
import { getCurrentSchoolWeek, getDefaultDay, schoolCalendar2025_2026 } from './schoolWeek';

describe('getCurrentSchoolWeek', () => {
  test('should work with current date (no parameter)', () => {
    const week = getCurrentSchoolWeek();
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(33);
  });

  test('should return S1 on September 1, 2025 (first day)', () => {
    const date = new Date(2025, 8, 1); // September 1, 2025
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S1 on September 7, 2025 (last day of S1)', () => {
    const date = new Date(2025, 8, 7); // September 7, 2025
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S2 on September 8, 2025 (first day of S2)', () => {
    const date = new Date(2025, 8, 8); // September 8, 2025
    expect(getCurrentSchoolWeek(date)).toBe(2);
  });

  test('should return S4 on September 25, 2025', () => {
    const date = new Date(2025, 8, 25); // September 25, 2025
    expect(getCurrentSchoolWeek(date)).toBe(4);
  });

  test('should return S12 on December 7, 2025', () => {
    const date = new Date(2025, 11, 7); // December 7, 2025
    // According to calendar: S12 is Dec 1-7
    expect(getCurrentSchoolWeek(date)).toBe(12);
  });

  test('should return S8 during Toussaint vacation (returns next week)', () => {
    const date = new Date(2025, 9, 25); // October 25, 2025 (during Toussaint vacation)
    // Should return S8 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(8);
  });

  test('should return S15 during Christmas vacation (returns next week)', () => {
    const date = new Date(2025, 11, 25); // December 25, 2025 (during Christmas vacation)
    // Should return S15 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(15);
  });

  test('should return S15 on January 5, 2026 (first day after Christmas)', () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(getCurrentSchoolWeek(date)).toBe(15);
  });

  test('should return S16 on January 15, 2026', () => {
    const date = new Date(2026, 0, 15); // January 15, 2026
    // S16 is Jan 12-18
    expect(getCurrentSchoolWeek(date)).toBe(16);
  });

  test('should return S21 during winter vacation (returns next week)', () => {
    const date = new Date(2026, 1, 20); // February 20, 2026 (during winter vacation)
    // Should return S21 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(21);
  });

  test('should return S27 during spring vacation (returns next week)', () => {
    const date = new Date(2026, 3, 20); // April 20, 2026 (during spring vacation)
    // Should return S27 (next week after vacation)
    expect(getCurrentSchoolWeek(date)).toBe(27);
  });

  test('should return S33 on June 10, 2026', () => {
    const date = new Date(2026, 5, 10); // June 10, 2026
    // S33 is June 8-14
    expect(getCurrentSchoolWeek(date)).toBe(33);
  });

  test('should return S1 after summer vacation', () => {
    const date = new Date(2026, 7, 1); // August 1, 2026 (summer vacation)
    // Should return S1 (default for dates after S33)
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S1 before school year starts', () => {
    const date = new Date(2025, 7, 31); // August 31, 2025 (day before school starts)
    // Should return S1 (next upcoming week)
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should handle weekend within school week correctly', () => {
    const date = new Date(2025, 8, 6); // September 6, 2025 (Saturday of S1)
    // Weekend is part of S1 week (Monday-Sunday range)
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should handle weekend between school weeks correctly', () => {
    const date = new Date(2025, 8, 7); // September 7, 2025 (Sunday, last day of S1)
    // Should return S1 (still within S1 range)
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });
});

describe('getDefaultDay', () => {
  test('should return day name in French', () => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const date = new Date(2025, 11, 1); // December 1, 2025 (Monday)
    const dayName = getDefaultDay(date);
    expect(days).toContain(dayName);
  });

  test('should work with current date (no parameter)', () => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = getDefaultDay();
    expect(days).toContain(dayName);
  });
});

describe('schoolCalendar2025_2026', () => {
  test('should have all 33 weeks', () => {
    expect(Object.keys(schoolCalendar2025_2026).length).toBe(33);
  });

  test('should have valid date ranges', () => {
    Object.entries(schoolCalendar2025_2026).forEach(([weekNum, dates]) => {
      expect(dates.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dates.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(dates.start) <= new Date(dates.end)).toBe(true);
    });
  });
});
