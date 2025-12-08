/**
 * Tests for schedule utilities
 */
import { getStartHour, getDaySchedule } from './scheduleUtils';

describe('getStartHour', () => {
  test('should extract start hour from "8h-10h" format', () => {
    expect(getStartHour('8h-10h')).toBe(8);
  });

  test('should extract start hour from "14h-16h" format', () => {
    expect(getStartHour('14h-16h')).toBe(14);
  });

  test('should extract start hour from "8h00-10h00" format', () => {
    expect(getStartHour('8h00-10h00')).toBe(8);
  });

  test('should extract start hour from "13h30-18h" format', () => {
    expect(getStartHour('13h30-18h')).toBe(13);
  });

  test('should extract start hour from single digit hour', () => {
    expect(getStartHour('9h-10h')).toBe(9);
  });

  test('should return null for empty string', () => {
    expect(getStartHour('')).toBeNull();
  });

  test('should return null for null input', () => {
    expect(getStartHour(null)).toBeNull();
  });

  test('should return null for undefined input', () => {
    expect(getStartHour(undefined)).toBeNull();
  });

  test('should return null for invalid time format', () => {
    expect(getStartHour('invalid')).toBeNull();
  });
});

describe('getDaySchedule', () => {
  const baseSchedule = [
    { time: '8h-10h', subject: 'Méca', type: 'cours', room: 'D123 TSI1' },
    { time: '10h-13h', subject: 'Elec', type: 'TD', room: 'D123 TSI1' },
    { time: '14h-15h', subject: 'Français', type: 'cours', room: 'D123 TSI1' },
    { time: '16h-18h', subject: 'Anglais', type: 'cours', room: 'D123 TSI1' }
  ];

  test('should return base schedule when no custom events for the day', () => {
    const customEvents = [];
    const result = getDaySchedule(baseSchedule, customEvents, 10, 'Lundi');
    
    expect(result).toEqual(baseSchedule);
    expect(result.length).toBe(4);
  });

  test('should replace base course when custom event has same start hour', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' }
    ];
    
    const result = getDaySchedule(baseSchedule, customEvents, 10, 'Lundi');
    
    // Should have 4 items (3 base + 1 custom, with Méca replaced)
    expect(result.length).toBe(4);
    
    // DS should be present
    const ds = result.find(item => item.type === 'DS');
    expect(ds).toBeDefined();
    expect(ds.subject).toBe('DS Méca');
    
    // Méca cours should not be present
    const mecaCours = result.find(item => item.subject === 'Méca' && item.type === 'cours');
    expect(mecaCours).toBeUndefined();
    
    // Other courses should still be present
    expect(result.find(item => item.subject === 'Elec')).toBeDefined();
    expect(result.find(item => item.subject === 'Français')).toBeDefined();
    expect(result.find(item => item.subject === 'Anglais')).toBeDefined();
  });

  test('should add custom event when no base course at that time', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '12h-13h', subject: 'Réunion', type: 'Autre' }
    ];
    
    const result = getDaySchedule(baseSchedule, customEvents, 10, 'Lundi');
    
    // Should have 5 items (4 base + 1 custom)
    expect(result.length).toBe(5);
    
    // Custom event should be present
    const reunion = result.find(item => item.subject === 'Réunion');
    expect(reunion).toBeDefined();
    
    // All base courses should still be present
    expect(result.find(item => item.subject === 'Méca')).toBeDefined();
    expect(result.find(item => item.subject === 'Elec')).toBeDefined();
    expect(result.find(item => item.subject === 'Français')).toBeDefined();
    expect(result.find(item => item.subject === 'Anglais')).toBeDefined();
  });

  test('should replace multiple base courses with multiple custom events', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' },
      { id: 2, week: 10, day: 'Lundi', time: '14h-15h', subject: 'Colle Français', type: 'Colle' }
    ];
    
    const result = getDaySchedule(baseSchedule, customEvents, 10, 'Lundi');
    
    // Should have 4 items (2 base + 2 custom)
    expect(result.length).toBe(4);
    
    // Custom events should be present
    expect(result.find(item => item.subject === 'DS Méca')).toBeDefined();
    expect(result.find(item => item.subject === 'Colle Français')).toBeDefined();
    
    // Replaced courses should not be present
    expect(result.find(item => item.subject === 'Méca' && item.type === 'cours')).toBeUndefined();
    expect(result.find(item => item.subject === 'Français' && item.type === 'cours')).toBeUndefined();
    
    // Other courses should still be present
    expect(result.find(item => item.subject === 'Elec')).toBeDefined();
    expect(result.find(item => item.subject === 'Anglais')).toBeDefined();
  });

  test('should filter custom events by week and day', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' },
      { id: 2, week: 11, day: 'Lundi', time: '8h-10h', subject: 'DS Physique', type: 'DS' },
      { id: 3, week: 10, day: 'Mardi', time: '8h-10h', subject: 'DM Maths', type: 'DM' }
    ];
    
    const result = getDaySchedule(baseSchedule, customEvents, 10, 'Lundi');
    
    // Should only include the custom event for week 10, Lundi
    const customItems = result.filter(item => item.id !== undefined);
    expect(customItems.length).toBe(1);
    expect(customItems[0].subject).toBe('DS Méca');
  });

  test('should sort schedule by start hour chronologically', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '16h-18h', subject: 'DS Anglais', type: 'DS' },
      { id: 2, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' }
    ];
    
    const result = getDaySchedule(baseSchedule, customEvents, 10, 'Lundi');
    
    // First item should be at 8h
    expect(getStartHour(result[0].time)).toBe(8);
    
    // Verify chronological order
    for (let i = 1; i < result.length; i++) {
      const prevHour = getStartHour(result[i - 1].time) || 0;
      const currHour = getStartHour(result[i].time) || 0;
      expect(currHour).toBeGreaterThanOrEqual(prevHour);
    }
  });

  test('should handle empty base schedule', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' }
    ];
    
    const result = getDaySchedule([], customEvents, 10, 'Lundi');
    
    expect(result.length).toBe(1);
    expect(result[0].subject).toBe('DS Méca');
  });

  test('should handle null base schedule', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' }
    ];
    
    const result = getDaySchedule(null, customEvents, 10, 'Lundi');
    
    expect(result.length).toBe(1);
    expect(result[0].subject).toBe('DS Méca');
  });

  test('should handle undefined base schedule', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' }
    ];
    
    const result = getDaySchedule(undefined, customEvents, 10, 'Lundi');
    
    expect(result.length).toBe(1);
    expect(result[0].subject).toBe('DS Méca');
  });

  test('should handle courses with different time formats', () => {
    const baseScheduleVaried = [
      { time: '8h-10h', subject: 'Course1', type: 'cours', room: 'A' },
      { time: '10h00-12h00', subject: 'Course2', type: 'cours', room: 'B' },
      { time: '14h30-16h', subject: 'Course3', type: 'cours', room: 'C' }
    ];
    
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '10h-12h', subject: 'Event', type: 'DS' }
    ];
    
    const result = getDaySchedule(baseScheduleVaried, customEvents, 10, 'Lundi');
    
    // Course2 should be replaced (both start at 10h)
    expect(result.length).toBe(3);
    expect(result.find(item => item.subject === 'Course2')).toBeUndefined();
    expect(result.find(item => item.subject === 'Event')).toBeDefined();
    expect(result.find(item => item.subject === 'Course1')).toBeDefined();
    expect(result.find(item => item.subject === 'Course3')).toBeDefined();
  });

  test('should handle courses without valid time format', () => {
    const baseScheduleInvalid = [
      { time: '8h-10h', subject: 'Course1', type: 'cours', room: 'A' },
      { time: 'invalid', subject: 'Course2', type: 'cours', room: 'B' },
      { time: null, subject: 'Course3', type: 'cours', room: 'C' }
    ];
    
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'Event', type: 'DS' }
    ];
    
    const result = getDaySchedule(baseScheduleInvalid, customEvents, 10, 'Lundi');
    
    // Course1 should be replaced, Course2 and Course3 should remain (invalid times don't match)
    expect(result.length).toBe(3);
    expect(result.find(item => item.subject === 'Course1')).toBeUndefined();
    expect(result.find(item => item.subject === 'Course2')).toBeDefined();
    expect(result.find(item => item.subject === 'Course3')).toBeDefined();
    expect(result.find(item => item.subject === 'Event')).toBeDefined();
  });
});
