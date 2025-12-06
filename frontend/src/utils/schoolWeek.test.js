/**
 * Tests for getCurrentSchoolWeek function
 */

// Extract the getCurrentSchoolWeek function for testing
const getCurrentSchoolWeek = (today) => {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11 (0 = January, 8 = September)
  
  // Determine the start of the school year
  // If we're between January (0) and August (7), the school year started last September
  // If we're between September (8) and December (11), the school year started this September
  let schoolYearStart;
  if (currentMonth >= 8) { // September to December
    schoolYearStart = new Date(currentYear, 8, 2); // September 2 of this year
  } else { // January to August
    schoolYearStart = new Date(currentYear - 1, 8, 2); // September 2 of last year
  }
  
  // Calculate the number of weeks since the start of the school year
  const diffTime = today - schoolYearStart;
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  const diffWeeks = Math.floor(diffDays / 7);
  
  // Week 1 starts on September 2
  // Limit between 1 and 33
  return Math.max(1, Math.min(33, diffWeeks + 1));
};

describe('getCurrentSchoolWeek', () => {
  test('should return S1 in early September 2024', () => {
    const date = new Date(2024, 8, 2); // September 2, 2024
    expect(getCurrentSchoolWeek(date)).toBe(1);
  });

  test('should return S2 in second week of September 2024', () => {
    const date = new Date(2024, 8, 9); // September 9, 2024
    expect(getCurrentSchoolWeek(date)).toBe(2);
  });

  test('should return S4 at end of September 2024', () => {
    const date = new Date(2024, 8, 25); // September 25, 2024
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
