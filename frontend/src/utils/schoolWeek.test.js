/**
 * Tests for getCurrentSchoolWeek function
 */
import { getCurrentSchoolWeek } from './schoolWeek';

describe('getCurrentSchoolWeek', () => {
  test('should work with current date (no parameter)', () => {
    const week = getCurrentSchoolWeek();
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(33);
  });

  test('should return S1 in early September 2024', () => {
    const date = new Date(2024, 8, 2); // September 2, 2024
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S2 in second week of September 2024', () => {
    const date = new Date(2024, 8, 9); // September 9, 2024 (7 days after Sept 2)
    // Sept 2-8 is week 1, Sept 9-15 is week 2
    expect(getCurrentSchoolWeek(date)).toBe(2);
  });

  test('should return S4 at end of September 2024', () => {
    const date = new Date(2024, 8, 25); // September 25, 2024 (23 days after Sept 2)
    // Sept 2-8: S1, Sept 9-15: S2, Sept 16-22: S3, Sept 23-29: S4
    expect(getCurrentSchoolWeek(date)).toBe(4);
  });

  test('should return correct week in December 2024', () => {
    const date = new Date(2024, 11, 6); // December 6, 2024
    const week = getCurrentSchoolWeek(date);
    // From Sept 2 to Dec 6 is about 13-14 weeks
    expect(week).toBeGreaterThanOrEqual(13);
    expect(week).toBeLessThanOrEqual(15);
  });

  test('should return correct week in December 2025 (new school year)', () => {
    const date = new Date(2025, 11, 6); // December 6, 2025
    const week = getCurrentSchoolWeek(date);
    // From Sept 2, 2025 to Dec 6, 2025 is about 13-14 weeks
    expect(week).toBeGreaterThanOrEqual(13);
    expect(week).toBeLessThanOrEqual(15);
  });

  test('should return correct week in January (previous school year)', () => {
    const date = new Date(2025, 0, 15); // January 15, 2025
    const week = getCurrentSchoolWeek(date);
    // From Sept 2, 2024 to Jan 15, 2025 is about 18-19 weeks
    expect(week).toBeGreaterThanOrEqual(18);
    expect(week).toBeLessThanOrEqual(20);
  });

  test('should return correct week in June (end of school year)', () => {
    const date = new Date(2025, 5, 10); // June 10, 2025
    const week = getCurrentSchoolWeek(date);
    // From Sept 2, 2024 to June 10, 2025 is about 31-32 weeks
    expect(week).toBeGreaterThanOrEqual(31);
    expect(week).toBeLessThanOrEqual(33);
  });

  test('should not exceed S33', () => {
    const date = new Date(2025, 7, 1); // August 1, 2025 (summer vacation)
    const week = getCurrentSchoolWeek(date);
    expect(week).toBeLessThanOrEqual(33);
  });

  test('should not be less than S1', () => {
    const date = new Date(2024, 8, 1); // September 1, 2024 (day before school starts)
    const week = getCurrentSchoolWeek(date);
    expect(week).toBeGreaterThanOrEqual(1);
  });

  test('should handle September 2025 correctly (new school year)', () => {
    const date = new Date(2025, 8, 5); // September 5, 2025
    const week = getCurrentSchoolWeek(date);
    // Should be S1 since it's early September 2025
    expect(week).toBe(1);
  });

  test('should handle September 2026 correctly (another new school year)', () => {
    const date = new Date(2026, 8, 10); // September 10, 2026
    const week = getCurrentSchoolWeek(date);
    // Should be S2 since it's second week of September 2026
    expect(week).toBe(2);
  });
});
