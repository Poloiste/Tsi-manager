/**
 * Tests for date utilities
 */
import { parseLocalDate, normalizeToMidnight, calculateDaysBetween } from './dateUtils';

describe('parseLocalDate', () => {
  test('should parse date string correctly in local timezone', () => {
    const date = parseLocalDate('2025-12-08');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(11); // December is month 11 (0-indexed)
    expect(date.getDate()).toBe(8);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  test('should handle different months correctly', () => {
    const jan = parseLocalDate('2025-01-15');
    expect(jan.getMonth()).toBe(0); // January
    expect(jan.getDate()).toBe(15);

    const jun = parseLocalDate('2025-06-30');
    expect(jun.getMonth()).toBe(5); // June
    expect(jun.getDate()).toBe(30);
  });

  test('should handle year transitions', () => {
    const newYear = parseLocalDate('2026-01-01');
    expect(newYear.getFullYear()).toBe(2026);
    expect(newYear.getMonth()).toBe(0);
    expect(newYear.getDate()).toBe(1);
  });
});

describe('normalizeToMidnight', () => {
  test('should normalize date to midnight', () => {
    const date = new Date(2025, 11, 8, 14, 30, 45, 123);
    const normalized = normalizeToMidnight(date);
    
    expect(normalized.getFullYear()).toBe(2025);
    expect(normalized.getMonth()).toBe(11);
    expect(normalized.getDate()).toBe(8);
    expect(normalized.getHours()).toBe(0);
    expect(normalized.getMinutes()).toBe(0);
    expect(normalized.getSeconds()).toBe(0);
    expect(normalized.getMilliseconds()).toBe(0);
  });

  test('should not modify the original date', () => {
    const original = new Date(2025, 11, 8, 14, 30, 45, 123);
    const originalTime = original.getTime();
    
    normalizeToMidnight(original);
    
    expect(original.getTime()).toBe(originalTime);
  });

  test('should handle already normalized dates', () => {
    const midnight = new Date(2025, 11, 8, 0, 0, 0, 0);
    const normalized = normalizeToMidnight(midnight);
    
    expect(normalized.getTime()).toBe(midnight.getTime());
  });
});

describe('calculateDaysBetween', () => {
  test('should calculate 0 days for same date', () => {
    const date1 = new Date(2025, 11, 7, 10, 0, 0);
    const date2 = new Date(2025, 11, 7, 18, 30, 0);
    
    expect(calculateDaysBetween(date1, date2)).toBe(0);
  });

  test('should calculate 1 day difference correctly', () => {
    const today = new Date(2025, 11, 7, 10, 0, 0);
    const tomorrow = new Date(2025, 11, 8, 10, 0, 0);
    
    expect(calculateDaysBetween(today, tomorrow)).toBe(1);
  });

  test('should calculate multiple days difference', () => {
    const start = new Date(2025, 11, 1);
    const end = new Date(2025, 11, 8);
    
    expect(calculateDaysBetween(start, end)).toBe(7);
  });

  test('should handle negative differences (past dates)', () => {
    const today = new Date(2025, 11, 8);
    const yesterday = new Date(2025, 11, 7);
    
    expect(calculateDaysBetween(today, yesterday)).toBe(-1);
  });

  test('should handle dates across month boundaries', () => {
    const nov30 = new Date(2025, 10, 30); // November 30
    const dec5 = new Date(2025, 11, 5);   // December 5
    
    expect(calculateDaysBetween(nov30, dec5)).toBe(5);
  });

  test('should handle dates across year boundaries', () => {
    const dec28 = new Date(2025, 11, 28);
    const jan3 = new Date(2026, 0, 3);
    
    expect(calculateDaysBetween(dec28, jan3)).toBe(6);
  });

  test('should not be affected by time of day', () => {
    // Test the specific bug: events at midnight UTC vs local time
    const today = new Date(2025, 11, 7, 23, 59, 59); // 11:59:59 PM on Dec 7
    const tomorrow = new Date(2025, 11, 8, 0, 0, 1);  // 00:00:01 AM on Dec 8
    
    // Even though there's only 2 seconds difference, it should still be 1 day
    expect(calculateDaysBetween(today, tomorrow)).toBe(1);
  });
});

describe('Integration: Date parsing with calculation', () => {
  test('should correctly calculate days from today to a future date string', () => {
    // Simulate: today is December 7, 2025, and we have a DS on December 8, 2025
    const today = new Date(2025, 11, 7, 15, 30, 0); // 3:30 PM on Dec 7
    const eventDateString = '2025-12-08';
    const eventDate = parseLocalDate(eventDateString);
    
    const days = calculateDaysBetween(today, eventDate);
    
    // Should be 1 day (tomorrow), not 0 (today)
    expect(days).toBe(1);
  });

  test('should correctly calculate days for today', () => {
    // Simulate: today is December 7, 2025, and we have a DS on December 7, 2025
    const today = new Date(2025, 11, 7, 15, 30, 0); // 3:30 PM on Dec 7
    const eventDateString = '2025-12-07';
    const eventDate = parseLocalDate(eventDateString);
    
    const days = calculateDaysBetween(today, eventDate);
    
    // Should be 0 days (today)
    expect(days).toBe(0);
  });

  test('should handle events a week away', () => {
    const today = new Date(2025, 11, 1);
    const eventDateString = '2025-12-08';
    const eventDate = parseLocalDate(eventDateString);
    
    const days = calculateDaysBetween(today, eventDate);
    
    expect(days).toBe(7);
  });

  test('should correctly identify past events', () => {
    const today = new Date(2025, 11, 8);
    const eventDateString = '2025-12-07';
    const eventDate = parseLocalDate(eventDateString);
    
    const days = calculateDaysBetween(today, eventDate);
    
    // Should be -1 (yesterday)
    expect(days).toBe(-1);
  });
});
