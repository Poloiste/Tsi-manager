/**
 * Tests for suggestion helper functions
 * These test the logic used in the adaptive suggestion system
 */
import { 
  getPreparationDays, 
  getUrgencyMultiplier, 
  getSuggestedDuration 
} from './suggestionHelpers';

describe('Suggestion System Helper Functions', () => {
  describe('getPreparationDays', () => {
    test('should return 7 days for DS', () => {
      expect(getPreparationDays('DS')).toBe(7);
    });

    test('should return 7 days for Examen', () => {
      expect(getPreparationDays('Examen')).toBe(7);
    });

    test('should return 4 days for DM', () => {
      expect(getPreparationDays('DM')).toBe(4);
    });

    test('should return 3 days for Colle', () => {
      expect(getPreparationDays('Colle')).toBe(3);
    });

    test('should return 3 days for TP Noté', () => {
      expect(getPreparationDays('TP Noté')).toBe(3);
    });

    test('should return 3 days for unknown type', () => {
      expect(getPreparationDays('Unknown')).toBe(3);
    });
  });

  describe('getUrgencyMultiplier', () => {
    describe('for DS/Examen', () => {
      test('should return 2.5 for 1 day until', () => {
        expect(getUrgencyMultiplier(1, 'DS')).toBe(2.5);
        expect(getUrgencyMultiplier(1, 'Examen')).toBe(2.5);
      });

      test('should return 2.0 for 2 days until', () => {
        expect(getUrgencyMultiplier(2, 'DS')).toBe(2.0);
      });

      test('should return 1.7 for 3 days until', () => {
        expect(getUrgencyMultiplier(3, 'DS')).toBe(1.7);
      });

      test('should return 1.4 for 4-5 days until', () => {
        expect(getUrgencyMultiplier(4, 'DS')).toBe(1.4);
        expect(getUrgencyMultiplier(5, 'DS')).toBe(1.4);
      });

      test('should return 1.2 for 6+ days until', () => {
        expect(getUrgencyMultiplier(6, 'DS')).toBe(1.2);
        expect(getUrgencyMultiplier(7, 'DS')).toBe(1.2);
      });
    });

    describe('for DM', () => {
      test('should return 2.0 for 1 day until', () => {
        expect(getUrgencyMultiplier(1, 'DM')).toBe(2.0);
      });

      test('should return 1.6 for 2 days until', () => {
        expect(getUrgencyMultiplier(2, 'DM')).toBe(1.6);
      });

      test('should return 1.3 for 3+ days until', () => {
        expect(getUrgencyMultiplier(3, 'DM')).toBe(1.3);
        expect(getUrgencyMultiplier(4, 'DM')).toBe(1.3);
      });
    });

    describe('for Colle/TP Noté', () => {
      test('should return 2.0 for 1 day until', () => {
        expect(getUrgencyMultiplier(1, 'Colle')).toBe(2.0);
        expect(getUrgencyMultiplier(1, 'TP Noté')).toBe(2.0);
      });

      test('should return 1.5 for 2 days until', () => {
        expect(getUrgencyMultiplier(2, 'Colle')).toBe(1.5);
      });

      test('should return 1.2 for 3+ days until', () => {
        expect(getUrgencyMultiplier(3, 'Colle')).toBe(1.2);
      });
    });
  });

  describe('getSuggestedDuration', () => {
    describe('for DS/Examen', () => {
      test('should suggest 1h-1h30 for 1 day until', () => {
        expect(getSuggestedDuration('DS', 1)).toBe('1h - 1h30');
        expect(getSuggestedDuration('Examen', 1)).toBe('1h - 1h30');
      });

      test('should suggest 45min-1h for 2-3 days until', () => {
        expect(getSuggestedDuration('DS', 2)).toBe('45min - 1h');
        expect(getSuggestedDuration('DS', 3)).toBe('45min - 1h');
      });

      test('should suggest 30min-45min for 4+ days until', () => {
        expect(getSuggestedDuration('DS', 4)).toBe('30min - 45min');
        expect(getSuggestedDuration('DS', 7)).toBe('30min - 45min');
      });
    });

    describe('for DM', () => {
      test('should suggest 45min-1h for 1 day until', () => {
        expect(getSuggestedDuration('DM', 1)).toBe('45min - 1h');
      });

      test('should suggest 30min-45min for 2+ days until', () => {
        expect(getSuggestedDuration('DM', 2)).toBe('30min - 45min');
        expect(getSuggestedDuration('DM', 4)).toBe('30min - 45min');
      });
    });

    describe('for Colle/TP Noté', () => {
      test('should suggest 30min-45min for 1 day until', () => {
        expect(getSuggestedDuration('Colle', 1)).toBe('30min - 45min');
        expect(getSuggestedDuration('TP Noté', 1)).toBe('30min - 45min');
      });

      test('should suggest 20min-30min for 2+ days until', () => {
        expect(getSuggestedDuration('Colle', 2)).toBe('20min - 30min');
        expect(getSuggestedDuration('Colle', 3)).toBe('20min - 30min');
      });
    });
  });

  describe('Integration: Complete flow', () => {
    test('DS scenario: should suggest proper preparation window and duration', () => {
      const testType = 'DS';
      
      // DS should have 7 day preparation window
      expect(getPreparationDays(testType)).toBe(7);
      
      // Day 7: Low urgency, shorter duration
      expect(getUrgencyMultiplier(7, testType)).toBe(1.2);
      expect(getSuggestedDuration(testType, 7)).toBe('30min - 45min');
      
      // Day 3: Medium urgency, longer duration
      expect(getUrgencyMultiplier(3, testType)).toBe(1.7);
      expect(getSuggestedDuration(testType, 3)).toBe('45min - 1h');
      
      // Day 1: High urgency, longest duration
      expect(getUrgencyMultiplier(1, testType)).toBe(2.5);
      expect(getSuggestedDuration(testType, 1)).toBe('1h - 1h30');
    });

    test('Colle scenario: should suggest proper preparation window and duration', () => {
      const testType = 'Colle';
      
      // Colle should have 3 day preparation window
      expect(getPreparationDays(testType)).toBe(3);
      
      // Day 3: Low urgency, shorter duration
      expect(getUrgencyMultiplier(3, testType)).toBe(1.2);
      expect(getSuggestedDuration(testType, 3)).toBe('20min - 30min');
      
      // Day 2: Medium urgency
      expect(getUrgencyMultiplier(2, testType)).toBe(1.5);
      expect(getSuggestedDuration(testType, 2)).toBe('20min - 30min');
      
      // Day 1: High urgency
      expect(getUrgencyMultiplier(1, testType)).toBe(2.0);
      expect(getSuggestedDuration(testType, 1)).toBe('30min - 45min');
    });

    test('DM scenario: should suggest proper preparation window and duration', () => {
      const testType = 'DM';
      
      // DM should have 4 day preparation window
      expect(getPreparationDays(testType)).toBe(4);
      
      // Day 4: Low urgency, shorter duration
      expect(getUrgencyMultiplier(4, testType)).toBe(1.3);
      expect(getSuggestedDuration(testType, 4)).toBe('30min - 45min');
      
      // Day 2: Medium urgency
      expect(getUrgencyMultiplier(2, testType)).toBe(1.6);
      expect(getSuggestedDuration(testType, 2)).toBe('30min - 45min');
      
      // Day 1: High urgency
      expect(getUrgencyMultiplier(1, testType)).toBe(2.0);
      expect(getSuggestedDuration(testType, 1)).toBe('45min - 1h');
    });
  });

  describe('Edge cases', () => {
    test('should handle 0 days until', () => {
      // Same day as test - treat as 1 day
      expect(getUrgencyMultiplier(0, 'DS')).toBe(2.5);
      expect(getSuggestedDuration('DS', 0)).toBe('1h - 1h30');
    });

    test('should handle negative days (past tests)', () => {
      // Tests that have already passed - still treated as urgent
      expect(getUrgencyMultiplier(-1, 'DS')).toBe(2.5);
    });
  });
});
