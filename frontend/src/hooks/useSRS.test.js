/**
 * Tests for useSRS hook - SRS validation and error handling
 * 
 * These tests focus on validation logic and UPSERT operations
 */
import { renderHook, act } from '@testing-library/react';
import { useSRS } from './useSRS';
import { supabase } from '../supabaseClient';
import * as srsAlgorithm from '../utils/srsAlgorithm';

// Mock supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('useSRS Hook - Validation Tests', () => {
  let mockFrom;
  let mockSelect;
  let mockEq;
  let mockSingle;
  let mockUpsert;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup basic mock chain
    mockSingle = jest.fn();
    mockEq = jest.fn(() => ({ 
      single: mockSingle,
      eq: mockEq,
      lte: jest.fn(() => ({ 
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }));
    mockSelect = jest.fn(() => ({ 
      eq: mockEq, 
      single: mockSingle,
      in: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }));
    mockUpsert = jest.fn(() => ({ select: mockSelect }));
    
    mockFrom = jest.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
      eq: mockEq
    }));
    
    supabase.from = mockFrom;
    
    // Mock calculateNextReview to return valid data
    jest.spyOn(srsAlgorithm, 'calculateNextReview').mockReturnValue({
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      nextReviewDate: '2024-01-02'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initializeSRS - Validation', () => {
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

    it('should use UPSERT with onConflict parameter', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        .mockResolvedValueOnce({ data: { user_id: userId, flashcard_id: flashcardId }, error: null });
      
      await act(async () => {
        await result.current.initializeSRS(flashcardId);
      });
      
      // Verify UPSERT was called with onConflict
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          flashcard_id: flashcardId,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0
        }),
        { onConflict: 'user_id,flashcard_id' }
      );
    });

    it('should set last_reviewed timestamp when initializing', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        .mockResolvedValueOnce({ data: { user_id: userId, flashcard_id: flashcardId }, error: null });
      
      await act(async () => {
        await result.current.initializeSRS(flashcardId);
      });
      
      const upsertCall = mockUpsert.mock.calls[0][0];
      expect(upsertCall).toHaveProperty('last_reviewed');
      expect(upsertCall).toHaveProperty('updated_at');
      expect(typeof upsertCall.last_reviewed).toBe('string');
      expect(typeof upsertCall.updated_at).toBe('string');
    });
  });

  describe('recordReview - Validation', () => {
    const userId = 'test-user-id';
    const flashcardId = 'test-flashcard-id';

    it('should validate user_id is provided', async () => {
      const { result } = renderHook(() => useSRS(null));
      
      await expect(
        result.current.recordReview(flashcardId, 'good')
      ).rejects.toThrow('User ID is required');
    });

    it('should validate flashcard_id is provided', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      await expect(
        result.current.recordReview(null, 'good')
      ).rejects.toThrow('Flashcard ID is required');
    });

    it('should validate that flashcard exists before recording', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard not found
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      
      await expect(
        result.current.recordReview(flashcardId, 'good')
      ).rejects.toThrow('Flashcard not found');
      
      expect(mockFrom).toHaveBeenCalledWith('shared_flashcards');
    });

    it('should use UPSERT for SRS data updates', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock flashcard exists, SRS data exists, upsert succeeds
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
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
        .mockResolvedValueOnce({ data: { user_id: userId }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });
      
      await act(async () => {
        await result.current.recordReview(flashcardId, 'good');
      });
      
      // Verify UPSERT was called for user_flashcard_srs
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

    it('should use UPSERT for stats to avoid duplicates', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
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
        .mockResolvedValueOnce({ data: { user_id: userId }, error: null })
        .mockResolvedValueOnce({ data: { correct_count: 5, incorrect_count: 2 }, error: null });
      
      await act(async () => {
        await result.current.recordReview(flashcardId, 'good');
      });
      
      // Should have called upsert twice: once for SRS, once for stats
      expect(mockUpsert).toHaveBeenCalledTimes(2);
      
      // Check stats upsert call
      const statsUpsert = mockUpsert.mock.calls[1];
      expect(statsUpsert[1]).toEqual({ onConflict: 'user_id,flashcard_id' });
    });

    it('should validate difficulty and throw for invalid values', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      mockSingle.mockResolvedValueOnce({ data: { id: flashcardId }, error: null });
      
      // responseToQuality should throw for invalid difficulty
      await expect(
        result.current.recordReview(flashcardId, 'invalid')
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    const userId = 'test-user-id';
    const flashcardId = 'test-flashcard-id';

    it('should handle network errors gracefully', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      const networkError = new Error('Network request failed');
      mockSingle.mockRejectedValueOnce(networkError);
      
      await expect(
        result.current.initializeSRS(flashcardId)
      ).rejects.toThrow('Network request failed');
    });

    it('should set error state when loading cards fails', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Mock error in the query chain
      mockEq.mockReturnValueOnce({ 
        lte: jest.fn(() => ({ 
          order: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Database error' } 
          }))
        }))
      });
      
      await act(async () => {
        await result.current.loadCardsToReview();
      });
      
      expect(result.current.error).toBe('Database error');
    });
  });

  describe('UPSERT Conflict Handling', () => {
    const userId = 'test-user-id';
    const flashcardId = 'test-flashcard-id';

    it('should handle concurrent inserts with UPSERT', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      // Simulate successful upsert even if record exists
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
        .mockResolvedValueOnce({ data: { user_id: userId, flashcard_id: flashcardId }, error: null });
      
      await act(async () => {
        await result.current.initializeSRS(flashcardId);
      });
      
      // UPSERT should have been used, not INSERT
      expect(mockUpsert).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('user_flashcard_srs');
    });

    it('should properly update last_reviewed on each review', async () => {
      const { result } = renderHook(() => useSRS(userId));
      
      const beforeTime = new Date().toISOString();
      
      mockSingle
        .mockResolvedValueOnce({ data: { id: flashcardId }, error: null })
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
        .mockResolvedValueOnce({ data: { user_id: userId }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });
      
      await act(async () => {
        await result.current.recordReview(flashcardId, 'good');
      });
      
      const upsertCall = mockUpsert.mock.calls[0][0];
      expect(upsertCall.last_reviewed).toBeDefined();
      expect(new Date(upsertCall.last_reviewed).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
    });
  });
});
