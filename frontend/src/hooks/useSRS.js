/**
 * Custom React Hook for Spaced Repetition System (SRS)
 * 
 * Manages SRS data and interactions with the database for flashcard reviews.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { calculateNextReview, responseToQuality, getCardStatus, isDifficultyCorrect } from '../utils/srsAlgorithm';

/**
 * Hook to manage SRS functionality for a user
 * 
 * @param {string} userId - The authenticated user's ID
 * @returns {Object} SRS state and functions
 */
export function useSRS(userId) {
  const [cardsToReview, setCardsToReview] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    due: 0,
    learning: 0,
    mastered: 0,
    new: 0
  });
  const [error, setError] = useState(null);

  /**
   * Initialize SRS data for a new flashcard
   * 
   * @param {string} flashcardId - The flashcard ID
   * @returns {Promise<Object>} The created SRS data
   */
  const initializeSRS = useCallback(async (flashcardId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!flashcardId) {
      throw new Error('Flashcard ID is required');
    }

    try {
      // Validate that the flashcard exists
      const { data: flashcard, error: flashcardError } = await supabase
        .from('shared_flashcards')
        .select('id')
        .eq('id', flashcardId)
        .single();

      if (flashcardError || !flashcard) {
        throw new Error('Flashcard not found');
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      
      // Use UPSERT to handle both insert and update cases
      const { data, error } = await supabase
        .from('user_flashcard_srs')
        .upsert({
          user_id: userId,
          flashcard_id: flashcardId,
          ease_factor: 2.5,
          interval_days: 0,
          repetitions: 0,
          next_review_date: today,
          quality_history: [],
          last_reviewed: now,
          updated_at: now
        }, {
          onConflict: 'user_id,flashcard_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error initializing SRS:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error initializing SRS:', err);
      throw err;
    }
  }, [userId]);

  /**
   * Load cards that are due for review (next_review_date <= today)
   * 
   * @returns {Promise<Array>} Array of flashcards with SRS data
   */
  const loadCardsToReview = useCallback(async () => {
    if (!userId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all SRS data for the user where next_review_date <= today
      const { data: srsData, error: srsError } = await supabase
        .from('user_flashcard_srs')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true });

      if (srsError) throw srsError;

      if (!srsData || srsData.length === 0) {
        setCardsToReview([]);
        return [];
      }

      // Get the flashcard details for these cards
      const flashcardIds = srsData.map(s => s.flashcard_id);
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*, shared_courses(subject, chapter)')
        .in('id', flashcardIds);

      if (flashcardsError) throw flashcardsError;

      // Combine flashcard data with SRS data
      const cardsWithSRS = flashcards.map(card => {
        const srs = srsData.find(s => s.flashcard_id === card.id);
        return {
          ...card,
          srsData: srs,
          course: card.shared_courses
        };
      });

      setCardsToReview(cardsWithSRS);
      return cardsWithSRS;
    } catch (err) {
      console.error('Error loading cards to review:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Load cards by specific category/status
   * 
   * @param {string} category - Category: 'due', 'learning', 'mastered', 'new'
   * @returns {Promise<Array>} Array of flashcards matching the category
   */
  const loadCardsByCategory = useCallback(async (category) => {
    if (!userId) return [];

    console.log(`[useSRS] Loading cards for category: ${category}`);
    setIsLoading(true);
    setError(null);

    try {
      // const today = new Date().toISOString().split('T')[0]; // Unused for now

      if (category === 'new') {
        // Load flashcards that don't have SRS data yet
        const { data: allFlashcards, error: allError } = await supabase
          .from('shared_flashcards')
          .select('*, shared_courses(subject, chapter)');

        if (allError) throw allError;

        const { data: userSRS, error: srsError } = await supabase
          .from('user_flashcard_srs')
          .select('flashcard_id')
          .eq('user_id', userId);

        if (srsError) throw srsError;

        const reviewedIds = new Set(userSRS.map(s => s.flashcard_id));
        const newCards = allFlashcards
          .filter(card => !reviewedIds.has(card.id))
          .map(card => ({
            ...card,
            srsData: null,
            course: card.shared_courses
          }));

        console.log(`[useSRS] Found ${newCards.length} new cards`);
        return newCards;
      }

      // Get all SRS data for the user
      const { data: srsData, error: srsError } = await supabase
        .from('user_flashcard_srs')
        .select('*')
        .eq('user_id', userId);

      if (srsError) throw srsError;

      if (!srsData || srsData.length === 0) {
        console.log(`[useSRS] No SRS data found for user`);
        return [];
      }

      // Filter by category based on card status
      const filteredSRS = srsData.filter(srs => {
        const status = getCardStatus(srs);
        return status === category;
      });

      console.log(`[useSRS] Filtered to ${filteredSRS.length} cards for category ${category}`);

      if (filteredSRS.length === 0) {
        return [];
      }

      // Get the flashcard details
      const flashcardIds = filteredSRS.map(s => s.flashcard_id);
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*, shared_courses(subject, chapter)')
        .in('id', flashcardIds);

      if (flashcardsError) throw flashcardsError;

      // Combine flashcard data with SRS data
      const cardsWithSRS = flashcards.map(card => {
        const srs = filteredSRS.find(s => s.flashcard_id === card.id);
        return {
          ...card,
          srsData: srs,
          course: card.shared_courses
        };
      });

      console.log(`[useSRS] Returning ${cardsWithSRS.length} cards with details`);
      return cardsWithSRS;
    } catch (err) {
      console.error('Error loading cards by category:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Record a review and update SRS data
   * 
   * @param {string} flashcardId - The flashcard ID
   * @param {string} difficulty - User's response: 'again', 'hard', 'good', 'easy'
   * @returns {Promise<Object>} Updated SRS data
   */
  const recordReview = useCallback(async (flashcardId, difficulty) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!flashcardId) {
      throw new Error('Flashcard ID is required');
    }

    try {
      // Validate that the flashcard exists before proceeding
      const { data: flashcard, error: flashcardError } = await supabase
        .from('shared_flashcards')
        .select('id')
        .eq('id', flashcardId)
        .single();

      if (flashcardError || !flashcard) {
        throw new Error('Flashcard not found');
      }

      // Convert difficulty to quality score (validates difficulty)
      const quality = responseToQuality(difficulty);

      // Get current SRS data or create if doesn't exist
      let { data: srsData, error: fetchError } = await supabase
        .from('user_flashcard_srs')
        .select('*')
        .eq('user_id', userId)
        .eq('flashcard_id', flashcardId)
        .single();

      // If no SRS data exists, initialize it first
      if (fetchError && fetchError.code === 'PGRST116') {
        srsData = await initializeSRS(flashcardId);
      } else if (fetchError) {
        console.error('Error fetching SRS data:', fetchError);
        throw fetchError;
      }

      // Calculate next review using SM-2 algorithm
      const nextReview = calculateNextReview(
        quality,
        srsData.ease_factor,
        srsData.interval_days,
        srsData.repetitions
      );

      // Update quality history
      const qualityHistory = [...(srsData.quality_history || []), quality];

      const now = new Date().toISOString();

      // Use UPSERT to handle both insert and update cases seamlessly
      const { data: updatedData, error: updateError } = await supabase
        .from('user_flashcard_srs')
        .upsert({
          user_id: userId,
          flashcard_id: flashcardId,
          ease_factor: nextReview.easeFactor,
          interval_days: nextReview.interval,
          repetitions: nextReview.repetitions,
          next_review_date: nextReview.nextReviewDate,
          quality_history: qualityHistory,
          last_reviewed: now,
          updated_at: now
        }, {
          onConflict: 'user_id,flashcard_id'
        })
        .select()
        .single();

      if (updateError) {
        console.error('Error updating SRS data:', updateError);
        throw updateError;
      }

      // Also update the user_flashcard_stats table for backward compatibility
      // Use UPSERT for stats to avoid duplicate key errors
      const isCorrect = isDifficultyCorrect(difficulty);
      
      // First get current stats to calculate increments properly
      const { data: existingStats } = await supabase
        .from('user_flashcard_stats')
        .select('correct_count, incorrect_count')
        .eq('user_id', userId)
        .eq('flashcard_id', flashcardId)
        .single();

      // Calculate new counts based on existing stats and current response
      const newCorrectCount = existingStats 
        ? (isCorrect ? existingStats.correct_count + 1 : existingStats.correct_count)
        : (isCorrect ? 1 : 0);
      
      const newIncorrectCount = existingStats
        ? (!isCorrect ? existingStats.incorrect_count + 1 : existingStats.incorrect_count)
        : (!isCorrect ? 1 : 0);

      const { error: statsError } = await supabase
        .from('user_flashcard_stats')
        .upsert({
          user_id: userId,
          flashcard_id: flashcardId,
          correct_count: newCorrectCount,
          incorrect_count: newIncorrectCount,
          last_reviewed: now
        }, {
          onConflict: 'user_id,flashcard_id'
        });

      if (statsError) {
        console.error('Error updating flashcard stats:', statsError);
      }

      return updatedData;
    } catch (err) {
      console.error('Error recording review:', err);
      throw err;
    }
  }, [userId, initializeSRS]);

  /**
   * Get review statistics for the user
   * 
   * @returns {Promise<Object>} Statistics object with counts
   */
  const getReviewStats = useCallback(async () => {
    if (!userId) return stats;

    try {
      // Get all SRS data for the user
      const { data: allSRS, error } = await supabase
        .from('user_flashcard_srs')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Count cards by status
      const newStats = {
        due: 0,
        learning: 0,
        mastered: 0,
        new: 0
      };

      allSRS.forEach(srs => {
        const status = getCardStatus(srs);
        if (status === 'due') {
          newStats.due++;
        } else if (status === 'mastered') {
          newStats.mastered++;
        } else if (status === 'new') {
          newStats.new++;
        } else {
          newStats.learning++;
        }
      });

      // Get count of flashcards without SRS data (new cards)
      const { count: totalFlashcards } = await supabase
        .from('shared_flashcards')
        .select('*', { count: 'exact', head: true });

      if (totalFlashcards) {
        newStats.new = totalFlashcards - allSRS.length;
      }

      setStats(newStats);
      return newStats;
    } catch (err) {
      console.error('Error getting review stats:', err);
      return stats;
    }
  }, [userId, stats]);

  /**
   * Get cards due for review in the next X days
   * 
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Array of upcoming reviews grouped by date
   */
  const getUpcomingReviews = useCallback(async (days = 7) => {
    if (!userId) return [];

    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);

      const { data: srsData, error } = await supabase
        .from('user_flashcard_srs')
        .select('*, shared_flashcards(question, shared_courses(subject, chapter))')
        .eq('user_id', userId)
        .gte('next_review_date', today.toISOString().split('T')[0])
        .lte('next_review_date', endDate.toISOString().split('T')[0])
        .order('next_review_date', { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedByDate = {};
      srsData.forEach(item => {
        const date = item.next_review_date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push({
          ...item.shared_flashcards,
          srsData: item
        });
      });

      // Convert to array format
      return Object.entries(groupedByDate).map(([date, cards]) => ({
        date,
        count: cards.length,
        cards
      }));
    } catch (err) {
      console.error('Error getting upcoming reviews:', err);
      return [];
    }
  }, [userId]);

  // Load stats on mount and when userId changes
  useEffect(() => {
    if (userId) {
      getReviewStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only re-run when userId changes, not when getReviewStats changes

  return {
    cardsToReview,
    isLoading,
    error,
    stats,
    loadCardsToReview,
    loadCardsByCategory,
    recordReview,
    getReviewStats,
    getUpcomingReviews,
    initializeSRS
  };
}
