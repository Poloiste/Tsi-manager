/**
 * Integration test to demonstrate the schedule replacement functionality
 * This test simulates the real-world scenario described in the problem statement
 */

import { getDaySchedule } from './scheduleUtils';

describe('Schedule Replacement - Integration Test', () => {
  // Real base schedule from the application
  const baseScheduleLundi = [
    { time: '8h-10h', subject: 'Méca', type: 'cours', room: 'D123 TSI1' },
    { time: '10h-13h', subject: 'Elec', type: 'TD', room: 'D123 TSI1' },
    { time: '14h-15h', subject: 'Français', type: 'cours', room: 'D123 TSI1' },
    { time: '16h-18h', subject: 'Anglais', type: 'cours', room: 'D123 TSI1' }
  ];

  const baseScheduleMardi = [
    { time: '8h-10h', subject: 'Maths', type: 'cours', room: 'D123 TSI1' },
    { time: '10h-12h', subject: 'Physique', type: 'cours', room: 'D123 TSI1' },
    { time: '13h-14h', subject: 'Informatique', type: 'cours', room: 'B121' },
    { time: '14h-16h', subject: 'Maths', type: 'TD', room: 'D123 TSI1' },
    { time: '16h-18h', subject: 'Physique', type: 'TD', room: 'D123 TSI1' }
  ];

  test('Test 1: DS replaces Méca course at 8h-10h on Monday', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' }
    ];

    const schedule = getDaySchedule(baseScheduleLundi, customEvents, 10, 'Lundi');

    // Should have 4 items total (3 base courses + 1 DS, with Méca replaced)
    expect(schedule.length).toBe(4);

    // DS should be present
    const ds = schedule.find(item => item.type === 'DS');
    expect(ds).toBeDefined();
    expect(ds.subject).toBe('DS Méca');
    expect(ds.time).toBe('8h-10h');

    // Original Méca course should NOT be present
    const mecaCours = schedule.find(item => item.subject === 'Méca' && item.type === 'cours');
    expect(mecaCours).toBeUndefined();

    // Other courses should still be present
    expect(schedule.find(item => item.subject === 'Elec')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Français')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Anglais')).toBeDefined();

    console.log('\n✓ Test 1 passed: DS Méca replaced the Méca course at 8h-10h');
  });

  test('Test 2: DS replaces Maths TD at 14h-16h on Tuesday', () => {
    const customEvents = [
      { id: 2, week: 10, day: 'Mardi', time: '14h-16h', subject: 'DS Maths', type: 'DS' }
    ];

    const schedule = getDaySchedule(baseScheduleMardi, customEvents, 10, 'Mardi');

    // Should have 5 items total (4 base courses + 1 DS, with Maths TD replaced)
    expect(schedule.length).toBe(5);

    // DS should be present
    const ds = schedule.find(item => item.type === 'DS' && item.subject === 'DS Maths');
    expect(ds).toBeDefined();
    expect(ds.time).toBe('14h-16h');

    // Maths TD should NOT be present
    const mathsTD = schedule.find(item => item.subject === 'Maths' && item.type === 'TD' && item.time === '14h-16h');
    expect(mathsTD).toBeUndefined();

    // Maths cours at 8h should still be present (different time slot)
    const mathsCours = schedule.find(item => item.subject === 'Maths' && item.type === 'cours');
    expect(mathsCours).toBeDefined();

    // Other courses should still be present
    expect(schedule.find(item => item.subject === 'Physique')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Informatique')).toBeDefined();

    console.log('\n✓ Test 2 passed: DS Maths replaced the Maths TD at 14h-16h');
  });

  test('Test 3: Event added to empty time slot', () => {
    const customEvents = [
      { id: 3, week: 10, day: 'Lundi', time: '12h-13h', subject: 'Réunion', type: 'Autre' }
    ];

    const schedule = getDaySchedule(baseScheduleLundi, customEvents, 10, 'Lundi');

    // Should have 5 items total (4 base + 1 new event)
    expect(schedule.length).toBe(5);

    // New event should be present
    const reunion = schedule.find(item => item.subject === 'Réunion');
    expect(reunion).toBeDefined();

    // All base courses should still be present
    expect(schedule.find(item => item.subject === 'Méca')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Elec')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Français')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Anglais')).toBeDefined();

    console.log('\n✓ Test 3 passed: Event added to empty time slot without replacing any course');
  });

  test('Test 4: Removing custom event restores base course', () => {
    // First, add a DS
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' }
    ];

    let schedule = getDaySchedule(baseScheduleLundi, customEvents, 10, 'Lundi');
    
    // Méca course should be replaced
    let mecaCours = schedule.find(item => item.subject === 'Méca' && item.type === 'cours');
    expect(mecaCours).toBeUndefined();

    // Now simulate removing the custom event
    const noCustomEvents = [];
    schedule = getDaySchedule(baseScheduleLundi, noCustomEvents, 10, 'Lundi');

    // Méca course should be back
    mecaCours = schedule.find(item => item.subject === 'Méca' && item.type === 'cours');
    expect(mecaCours).toBeDefined();
    expect(mecaCours.time).toBe('8h-10h');

    // Should have exactly 4 courses (the original base schedule)
    expect(schedule.length).toBe(4);

    console.log('\n✓ Test 4 passed: Base course reappears when custom event is removed');
  });

  test('Test 5: Multiple custom events on the same day', () => {
    const customEvents = [
      { id: 1, week: 10, day: 'Lundi', time: '8h-10h', subject: 'DS Méca', type: 'DS' },
      { id: 2, week: 10, day: 'Lundi', time: '14h-15h', subject: 'Colle Français', type: 'Colle' }
    ];

    const schedule = getDaySchedule(baseScheduleLundi, customEvents, 10, 'Lundi');

    // Should have 4 items total (2 base + 2 custom)
    expect(schedule.length).toBe(4);

    // Custom events should be present
    expect(schedule.find(item => item.subject === 'DS Méca')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Colle Français')).toBeDefined();

    // Replaced courses should NOT be present
    expect(schedule.find(item => item.subject === 'Méca' && item.type === 'cours')).toBeUndefined();
    expect(schedule.find(item => item.subject === 'Français' && item.type === 'cours')).toBeUndefined();

    // Other courses should still be present
    expect(schedule.find(item => item.subject === 'Elec')).toBeDefined();
    expect(schedule.find(item => item.subject === 'Anglais')).toBeDefined();

    // Verify chronological order
    const startHours = schedule.map(item => {
      const match = item.time.match(/^(\d{1,2})/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    for (let i = 1; i < startHours.length; i++) {
      expect(startHours[i]).toBeGreaterThanOrEqual(startHours[i - 1]);
    }

    console.log('\n✓ Test 5 passed: Multiple custom events correctly replace multiple base courses');
  });
});
