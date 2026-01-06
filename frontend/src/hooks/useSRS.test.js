/**
 * Tests for useSRS hook - SRS validation and error handling
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSRS } from './useSRS';
import { supabase } from '../supabaseClient';

// Mock supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock SRS algorithm functions
jest.mock('../utils/srsAlgorithm', () => ({
  calculateNextReview: jest.fn(() => ({
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReviewDate: '2024-01-02'
  })),
  responseToQuality: jest.fn((difficulty) => {
    const map = { 'again': 1, 'hard': 2, 'good': 3, 'easy': 5 };
    if (!map[difficulty]) throw new Error('Invalid difficulty');
    return map[difficulty];
  }),
  getCardStatus: jest.fn(() => 'learning'),
  isDifficultyCorrect: jest.fn((difficulty) => difficulty === 'good' || difficulty === 'easy')
}));

describe('useSRS Hook', () => {
  let mockFrom;
  let mockSelect;
  let mockEq;
  let mockSingle;
  let mockUpsert;
  let mockInsert;
  let mockLte;
  let mockOrder;
  let mockIn;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn(() => ({ single: mockSingle, eq: mockEq }));
    mockSelect = jest.fn(() => ({ eq: mockEq, single: mockSingle }));
    mockUpsert = jest.fn(() => ({ select: mockSelect }));
    mockInsert = jest.fn(() => ({ select: mockSelect }));
    mockLte = jest.fn(() => ({ order: mockOrder }));
    mockOrder = jest.fn(() => ({ data: [], error: null }));
    mockIn = jest.fn(() => ({ data: [], error: null }));
    
    mockFrom = jest.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
      insert: mockInsert,
      eq: mockEq,
      lte: mockLte,
      in: mockIn
    }));
    
    supabase.from = mockFrom;
  });

  describe('initializeSRS', () => {
    const userId = 'test-user-id';
    const flashcardId = 'test-flashcard-id';

    it('should validate user_id is provided', async () => {
      const { result } = renderHook(() => useSRS(null));
      
      await expect(
        result.current.initializeSRS(flashcardId)
      ).rejects.toThrow('User ID is required');
    });

    it('should validate flashcard_id is provided', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      await expect(
        result.current.initializeSRS(null)
      ).rejects.toThrow('Flashcard ID is required');
    });

    it('should validate that flashcard exists before initializing', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard not found
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      
      await expect(
        result.current.initializeSRS(flashcardId)
      ).rejects.toThrow('Flashcard not found');
      
      expect(mockFrom).toHaveBeenCalledWith('shared_flashcards');
    });

    it('should use UPSERT to initialize SRS data', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle.mockResolvedValueOnce({ 
        data: { id: flashcardId }, 
        error: null 
      });
      
      // Mock upsert success
      mockSingle.mockResolvedValueOnce({ 
        data: { 
          user_id: userId, 
          flashcard_id: flashcardId,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0
        }, 
        error: null 
      });
      
      await act(async () => {
        await result.current.initializeSRS(flashcardId);
      });
      
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          flashcard_id: flashcardId,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          quality_history: [],
          last_reviewed: expect.any(String),
          updated_at: expect.any(String)
        }),
        { onConflict: 'user_id,flashcard_id' }
      );
    });

    it('should set last_reviewed and updated_at timestamps', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle.mockResolvedValueOnce({ 
        data: { id: flashcardId }, 
        error: null 
      });
      
      // Mock upsert success
      mockSingle.mockResolvedValueOnce({ 
        data: { user_id: userId, flashcard_id: flashcardId }, 
        error: null 
      });
      
      await act(async () => {
        await result.current.initializeSRS(flashcardId);
      });
      
      const upsertCall = mockUpsert.mock.calls[0][0];
      expect(upsertCall.last_reviewed).toBeDefined();
      expect(upsertCall.updated_at).toBeDefined();
      expect(new Date(upsertCall.last_reviewed).getTime()).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle.mockResolvedValueOnce({ 
        data: { id: flashcardId }, 
        error: null 
      });
      
      // Mock upsert error
      const dbError = new Error('Database connection failed');
      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: dbError 
      });
      
      await expect(
        result.current.initializeSRS(flashcardId)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('recordReview', () => {
    const userId = 'test-user-id';
    const flashcardId = 'test-flashcard-id';
    const difficulty = 'good';

    it('should validate user_id is provided', async () => {
      const { result } = renderHook(() => useSRS(null));
      
      await expect(
        result.current.recordReview(flashcardId, difficulty)
      ).rejects.toThrow('User ID is required');
    });

    it('should validate flashcard_id is provided', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      await expect(
        result.current.recordReview(null, difficulty)
      ).rejects.toThrow('Flashcard ID is required');
    });

    it('should validate that flashcard exists before recording review', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard not found
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      
      await expect(
        result.current.recordReview(flashcardId, difficulty)
      ).rejects.toThrow('Flashcard not found');
    });

    it('should validate difficulty parameter', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle.mockResolvedValueOnce({ 
        data: { id: flashcardId }, 
        error: null 
      });
      
      await expect(
        result.current.recordReview(flashcardId, 'invalid')
      ).rejects.toThrow('Invalid difficulty');
    });

    it('should use UPSERT to update SRS data', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        // Mock existing SRS data
        .mockResolvedValueOnce({ 
          data: { 
            user_id: userId,
            flashcard_id: flashcardId,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            quality_history: []
          }, 
          error: null 
        })
        // Mock upsert success for SRS
        .mockResolvedValueOnce({ 
          data: { user_id: userId, flashcard_id: flashcardId }, 
          error: null 
        })
        // Mock stats query
        .mockResolvedValueOnce({ data: null, error: null });
      
      await act(async () => {
        await result.current.recordReview(flashcardId, difficulty);
      });
      
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          flashcard_id: flashcardId,
          last_reviewed: expect.any(String),
          updated_at: expect.any(String)
        }),
        { onConflict: 'user_id,flashcard_id' }
      );
    });

    it('should use UPSERT for user_flashcard_stats to avoid duplicates', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        // Mock existing SRS data
        .mockResolvedValueOnce({ 
          data: { 
            user_id: userId,
            flashcard_id: flashcardId,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            quality_history: []
          }, 
          error: null 
        })
        // Mock upsert success for SRS
        .mockResolvedValueOnce({ 
          data: { user_id: userId, flashcard_id: flashcardId }, 
          error: null 
        })
        // Mock existing stats
        .mockResolvedValueOnce({ 
          data: { correct_count: 5, incorrect_count: 2 }, 
          error: null 
        });
      
      await act(async () => {
        await result.current.recordReview(flashcardId, difficulty);
      });
      
      // Should have called upsert for stats table
      expect(mockUpsert).toHaveBeenCalledTimes(2); // Once for SRS, once for stats
    });

    it('should properly increment stats based on difficulty', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        // Mock existing SRS data
        .mockResolvedValueOnce({ 
          data: { 
            user_id: userId,
            flashcard_id: flashcardId,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            quality_history: []
          }, 
          error: null 
        })
        // Mock upsert success for SRS
        .mockResolvedValueOnce({ 
          data: { user_id: userId, flashcard_id: flashcardId }, 
          error: null 
        })
        // Mock existing stats
        .mockResolvedValueOnce({ 
          data: { correct_count: 5, incorrect_count: 2 }, 
          error: null 
        });
      
      await act(async () => {
        await result.current.recordReview(flashcardId, 'good');
      });
      
      // Should increment correct_count for 'good' difficulty
      const statsUpsert = mockUpsert.mock.calls[1][0];
      expect(statsUpsert.correct_count).toBe(6); // 5 + 1
      expect(statsUpsert.incorrect_count).toBe(2); // unchanged
    });

    it('should handle 409 conflict errors gracefully with UPSERT', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        // Mock existing SRS data
        .mockResolvedValueOnce({ 
          data: { 
            user_id: userId,
            flashcard_id: flashcardId,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0,
            quality_history: []
          }, 
          error: null 
        })
        // Mock upsert success (UPSERT should handle conflicts)
        .mockResolvedValueOnce({ 
          data: { user_id: userId, flashcard_id: flashcardId }, 
          error: null 
        })
        .mockResolvedValueOnce({ data: null, error: null });
      
      // Should not throw error
      await act(async () => {
        await result.current.recordReview(flashcardId, difficulty);
      });
      
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should initialize SRS if no data exists', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        // Mock no existing SRS data (PGRST116 is "no rows returned" error)
        .mockResolvedValueOnce({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        })
        // Mock initialization (flashcard check)
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        // Mock upsert for initialization
        .mockResolvedValueOnce({ 
          data: { 
            user_id: userId,
            flashcard_id: flashcardId,
            ease_factor: 2.5,
            interval_days: 0,
            repetitions: 0
          }, 
          error: null 
        })
        // Mock upsert for the review
        .mockResolvedValueOnce({ 
          data: { user_id: userId, flashcard_id: flashcardId }, 
          error: null 
        })
        .mockResolvedValueOnce({ data: null, error: null });
      
      await act(async () => {
        await result.current.recordReview(flashcardId, difficulty);
      });
      
      // Should have called upsert multiple times (init + review + stats)
      expect(mockUpsert.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    const userId = 'test-user-id';
    const flashcardId = 'test-flashcard-id';

    it('should handle 400 bad request errors', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock 400 error
      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: { 
          code: '400',
          message: 'Bad request: Invalid data format' 
        } 
      });
      
      await expect(
        result.current.initializeSRS(flashcardId)
      ).rejects.toThrow();
    });

    it('should set error state on load failure', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      mockOrder.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      
      await act(async () => {
        await result.current.loadCardsToReview();
      });
      
      expect(result.current.error).toBe('Database error');
    });

    it('should handle network errors gracefully', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      const networkError = new Error('Network request failed');
      mockSingle.mockRejectedValueOnce(networkError);
      
      await expect(
        result.current.initializeSRS(flashcardId)
      ).rejects.toThrow('Network request failed');
    });
  });
});
