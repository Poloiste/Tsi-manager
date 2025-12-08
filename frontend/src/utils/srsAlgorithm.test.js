/**
 * Tests for SRS Algorithm (SM-2)
 */
import {
  calculateNextReview,
  responseToQuality,
  getCardStatus,
  getStatusEmoji,
  getStatusLabel
} from './srsAlgorithm';

describe('calculateNextReview', () => {
  describe('First review', () => {
    test('should set interval to 1 day on first successful review (quality 3)', () => {
      const result = calculateNextReview(3, 2.5, 0, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    test('should set interval to 1 day on first successful review (quality 5)', () => {
      const result = calculateNextReview(5, 2.5, 0, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    test('should reset to 1 day on failed first review (quality 2)', () => {
      const result = calculateNextReview(2, 2.5, 0, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('Second review', () => {
    test('should set interval to 6 days on second successful review', () => {
      const result = calculateNextReview(3, 2.5, 1, 1);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    test('should reset on failed second review', () => {
      const result = calculateNextReview(2, 2.5, 1, 1);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('Subsequent reviews', () => {
    test('should multiply interval by ease factor after rep 2', () => {
      const result = calculateNextReview(3, 2.5, 6, 2);
      // Quality 3 reduces ease factor to 2.36, so 6 * 2.36 = 14.16, rounds to 14
      expect(result.interval).toBe(14);
      expect(result.repetitions).toBe(3);
    });

    test('should continue multiplying by ease factor', () => {
      const result = calculateNextReview(4, 2.5, 15, 3);
      expect(result.interval).toBe(38); // 15 * 2.5 = 37.5, rounded to 38
      expect(result.repetitions).toBe(4);
    });

    test('should reset on failure at any stage', () => {
      const result = calculateNextReview(1, 2.5, 15, 3);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('Ease Factor calculation', () => {
    test('should increase ease factor on quality 5', () => {
      const result = calculateNextReview(5, 2.5, 6, 2);
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.easeFactor).toBe(2.6); // 2.5 + 0.1
    });

    test('should keep ease factor relatively stable on quality 4', () => {
      const result = calculateNextReview(4, 2.5, 6, 2);
      expect(result.easeFactor).toBeCloseTo(2.5, 1);
    });

    test('should decrease ease factor on quality 3', () => {
      const result = calculateNextReview(3, 2.5, 6, 2);
      expect(result.easeFactor).toBeLessThan(2.5);
      expect(result.easeFactor).toBe(2.36); // 2.5 - 0.14
    });

    test('should not go below 1.3', () => {
      const result1 = calculateNextReview(0, 1.3, 1, 0);
      expect(result1.easeFactor).toBe(1.3);

      const result2 = calculateNextReview(1, 1.35, 1, 0);
      expect(result2.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    test('should round to 2 decimal places', () => {
      const result = calculateNextReview(3, 2.5, 6, 2);
      const decimalPlaces = (result.easeFactor.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('Next review date', () => {
    test('should return date in YYYY-MM-DD format', () => {
      const result = calculateNextReview(3, 2.5, 0, 0);
      expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should set date for tomorrow on interval 1', () => {
      const result = calculateNextReview(3, 2.5, 0, 0);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const resultDate = new Date(result.nextReviewDate);
      expect(resultDate.toDateString()).toBe(tomorrow.toDateString());
    });

    test('should set date correctly for longer intervals', () => {
      const result = calculateNextReview(3, 2.5, 6, 2);
      const expectedDate = new Date();
      // Quality 3 reduces ease factor to 2.36, so 6 * 2.36 = 14.16, rounds to 14
      expectedDate.setDate(expectedDate.getDate() + 14);
      expectedDate.setHours(0, 0, 0, 0);
      
      const resultDate = new Date(result.nextReviewDate);
      expect(resultDate.toDateString()).toBe(expectedDate.toDateString());
    });
  });

  describe('Input validation', () => {
    test('should throw error for quality < 0', () => {
      expect(() => calculateNextReview(-1, 2.5, 0, 0)).toThrow('Quality must be between 0 and 5');
    });

    test('should throw error for quality > 5', () => {
      expect(() => calculateNextReview(6, 2.5, 0, 0)).toThrow('Quality must be between 0 and 5');
    });

    test('should handle quality 0', () => {
      const result = calculateNextReview(0, 2.5, 0, 0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });
});

describe('responseToQuality', () => {
  test('should convert "again" to quality 1', () => {
    expect(responseToQuality('again')).toBe(1);
  });

  test('should convert "hard" to quality 2', () => {
    expect(responseToQuality('hard')).toBe(2);
  });

  test('should convert "good" to quality 3', () => {
    expect(responseToQuality('good')).toBe(3);
  });

  test('should convert "easy" to quality 5', () => {
    expect(responseToQuality('easy')).toBe(5);
  });

  test('should throw error for invalid difficulty', () => {
    expect(() => responseToQuality('invalid')).toThrow('Invalid difficulty');
    expect(() => responseToQuality('medium')).toThrow('Invalid difficulty');
    expect(() => responseToQuality('')).toThrow('Invalid difficulty');
  });
});

describe('getCardStatus', () => {
  test('should return "new" for null SRS data', () => {
    expect(getCardStatus(null)).toBe('new');
  });

  test('should return "new" for undefined SRS data', () => {
    expect(getCardStatus(undefined)).toBe('new');
  });

  test('should return "new" for SRS data without next_review_date', () => {
    expect(getCardStatus({})).toBe('new');
  });

  test('should return "due" for past review date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const srsData = {
      next_review_date: yesterday.toISOString().split('T')[0],
      interval_days: 1
    };
    expect(getCardStatus(srsData)).toBe('due');
  });

  test('should return "due" for today review date', () => {
    const today = new Date();
    const srsData = {
      next_review_date: today.toISOString().split('T')[0],
      interval_days: 1
    };
    expect(getCardStatus(srsData)).toBe('due');
  });

  test('should return "soon" for review in 1-3 days', () => {
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    const srsData = {
      next_review_date: inTwoDays.toISOString().split('T')[0],
      interval_days: 6
    };
    expect(getCardStatus(srsData)).toBe('soon');
  });

  test('should return "mastered" for interval > 21 days', () => {
    const inMonth = new Date();
    inMonth.setDate(inMonth.getDate() + 30);
    const srsData = {
      next_review_date: inMonth.toISOString().split('T')[0],
      interval_days: 30
    };
    expect(getCardStatus(srsData)).toBe('mastered');
  });

  test('should return "learning" for future date with interval <= 21', () => {
    const inWeek = new Date();
    inWeek.setDate(inWeek.getDate() + 7);
    const srsData = {
      next_review_date: inWeek.toISOString().split('T')[0],
      interval_days: 7
    };
    expect(getCardStatus(srsData)).toBe('learning');
  });
});

describe('getStatusEmoji', () => {
  test('should return correct emojis for all statuses', () => {
    expect(getStatusEmoji('new')).toBe('🔵');
    expect(getStatusEmoji('due')).toBe('🔴');
    expect(getStatusEmoji('soon')).toBe('🟡');
    expect(getStatusEmoji('mastered')).toBe('🟢');
    expect(getStatusEmoji('learning')).toBe('⚪');
  });

  test('should return default emoji for unknown status', () => {
    expect(getStatusEmoji('unknown')).toBe('⚪');
  });
});

describe('getStatusLabel', () => {
  test('should return correct labels for all statuses', () => {
    expect(getStatusLabel('new')).toBe('Nouvelle');
    expect(getStatusLabel('due')).toBe('À réviser');
    expect(getStatusLabel('soon')).toBe('Bientôt');
    expect(getStatusLabel('mastered')).toBe('Maîtrisée');
    expect(getStatusLabel('learning')).toBe('En apprentissage');
  });

  test('should return default label for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('Inconnue');
  });
});
