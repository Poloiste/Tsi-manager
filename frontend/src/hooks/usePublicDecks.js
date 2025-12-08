/**
 * Custom React Hook for managing public decks
 * 
 * Provides functionality for browsing, publishing, and importing flashcard decks
 * from the community.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to manage public decks functionality
 * 
 * @param {string} userId - The authenticated user's ID
 * @returns {Object} Public decks state and functions
 */
export function usePublicDecks(userId) {
  const [publicDecks, setPublicDecks] = useState([]);
  const [myPublishedDecks, setMyPublishedDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    category: 'all', 
    sort: 'popular' 
  });

  /**
   * Load public decks with optional filters
   * 
   * @param {Object} filterOptions - Filter options
   * @param {string} filterOptions.category - Category filter ('all' or specific category)
   * @param {string} filterOptions.sort - Sort option ('popular', 'recent', 'rating', 'downloads')
   * @returns {Promise<Array>} Array of public decks
   */
  const loadPublicDecks = useCallback(async (filterOptions = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const activeFilters = filterOptions || filters;
      
      let query = supabase
        .from('public_decks')
        .select('*')
        .eq('is_active', true);

      // Apply category filter
      if (activeFilters.category && activeFilters.category !== 'all') {
        query = query.eq('category', activeFilters.category);
      }

      // Apply sorting
      switch (activeFilters.sort) {
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        case 'downloads':
          query = query.order('downloads_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPublicDecks(data || []);
      return data || [];
    } catch (err) {
      console.error('Error loading public decks:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Search decks by title or description
   * 
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching decks
   */
  const searchDecks = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      return loadPublicDecks();
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase
        .from('public_decks')
        .select('*')
        .eq('is_active', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('likes_count', { ascending: false });

      if (searchError) throw searchError;

      setPublicDecks(data || []);
      return data || [];
    } catch (err) {
      console.error('Error searching decks:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [loadPublicDecks]);

  /**
   * Publish a course as a public deck
   * 
   * @param {string} courseId - The course ID to publish
   * @param {Object} metadata - Deck metadata
   * @param {string} metadata.title - Deck title
   * @param {string} metadata.description - Deck description
   * @param {string} metadata.category - Deck category
   * @param {Array<string>} metadata.tags - Deck tags
   * @returns {Promise<Object>} The created public deck
   */
  const publishDeck = useCallback(async (courseId, metadata) => {
    if (!userId) {
      throw new Error('User must be authenticated to publish decks');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get course flashcards
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*')
        .eq('course_id', courseId);

      if (flashcardsError) throw flashcardsError;

      if (!flashcards || flashcards.length === 0) {
        throw new Error('Ce cours ne contient aucune flashcard à publier');
      }

      // Get course info
      const { data: course, error: courseError } = await supabase
        .from('shared_courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Get user info
      const { data: userData } = await supabase.auth.getUser();
      const authorName = userData?.user?.user_metadata?.name || 
                        userData?.user?.email?.split('@')[0] || 
                        'Anonyme';

      // Create public deck
      const { data: deck, error: deckError } = await supabase
        .from('public_decks')
        .insert([{
          title: metadata.title,
          description: metadata.description || '',
          category: metadata.category,
          author_id: userId,
          author_name: authorName,
          cards_count: flashcards.length,
          tags: metadata.tags || [],
          source_course_id: courseId
        }])
        .select()
        .single();

      if (deckError) throw deckError;

      // Link flashcards to deck
      const deckFlashcards = flashcards.map((fc, index) => ({
        deck_id: deck.id,
        flashcard_id: fc.id,
        position: index
      }));

      const { error: linkError } = await supabase
        .from('deck_flashcards')
        .insert(deckFlashcards);

      if (linkError) throw linkError;

      // Reload my published decks
      await loadMyPublishedDecks();

      return deck;
    } catch (err) {
      console.error('Error publishing deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Unpublish a deck (set as inactive)
   * 
   * @param {string} deckId - The deck ID to unpublish
   * @returns {Promise<void>}
   */
  const unpublishDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('public_decks')
        .update({ is_active: false })
        .eq('id', deckId)
        .eq('author_id', userId);

      if (updateError) throw updateError;

      // Reload decks
      await loadMyPublishedDecks();
      await loadPublicDecks();
    } catch (err) {
      console.error('Error unpublishing deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPublicDecks]);

  /**
   * Download and import a deck into user's flashcards
   * 
   * @param {string} deckId - The deck ID to download
   * @returns {Promise<Object>} The imported course
   */
  const downloadDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('User must be authenticated to download decks');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get deck info
      const { data: deck, error: deckError } = await supabase
        .from('public_decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (deckError) throw deckError;

      // Check if user already downloaded this deck
      const { data: existingDownload } = await supabase
        .from('deck_downloads')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      if (existingDownload) {
        throw new Error('Vous avez déjà importé ce deck');
      }

      // Get deck flashcards
      const { data: deckFlashcards, error: flashcardsError } = await supabase
        .from('deck_flashcards')
        .select(`
          flashcard_id,
          shared_flashcards (
            id,
            question,
            answer
          )
        `)
        .eq('deck_id', deckId)
        .order('position');

      if (flashcardsError) throw flashcardsError;

      // Create new course
      const { data: newCourse, error: courseError } = await supabase
        .from('shared_courses')
        .insert([{
          subject: deck.category,
          chapter: deck.title,
          content: `Importé depuis la communauté (@${deck.author_name})\n\n${deck.description || ''}`,
          difficulty: 3,
          created_by: userId
        }])
        .select()
        .single();

      if (courseError) throw courseError;

      // Copy flashcards to new course
      const flashcardsToInsert = deckFlashcards.map(df => ({
        course_id: newCourse.id,
        question: df.shared_flashcards.question,
        answer: df.shared_flashcards.answer,
        created_by: userId,
        created_by_name: deck.author_name,
        imported_from: `deck:${deckId}`
      }));

      const { error: insertError } = await supabase
        .from('shared_flashcards')
        .insert(flashcardsToInsert);

      if (insertError) throw insertError;

      // Record download
      const { error: downloadError } = await supabase
        .from('deck_downloads')
        .insert([{
          deck_id: deckId,
          user_id: userId,
          imported_course_id: newCourse.id
        }]);

      if (downloadError) throw downloadError;

      return newCourse;
    } catch (err) {
      console.error('Error downloading deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Rate a deck
   * 
   * @param {string} deckId - The deck ID to rate
   * @param {number} rating - Rating value (1-5)
   * @param {string} review - Optional review text
   * @returns {Promise<Object>} The created/updated rating
   */
  const rateDeck = useCallback(async (deckId, rating, review = null) => {
    if (!userId) {
      throw new Error('User must be authenticated to rate decks');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if user already rated this deck
      const { data: existingRating } = await supabase
        .from('deck_ratings')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      let result;
      if (existingRating) {
        // Update existing rating
        const { data, error: updateError } = await supabase
          .from('deck_ratings')
          .update({
            rating,
            review,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Insert new rating
        const { data, error: insertError } = await supabase
          .from('deck_ratings')
          .insert([{
            deck_id: deckId,
            user_id: userId,
            rating,
            review
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      // Reload decks to get updated stats
      await loadPublicDecks();

      return result;
    } catch (err) {
      console.error('Error rating deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPublicDecks]);

  /**
   * Like or unlike a deck
   * 
   * @param {string} deckId - The deck ID to like/unlike
   * @returns {Promise<boolean>} True if liked, false if unliked
   */
  const likeDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('User must be authenticated to like decks');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if user already liked this deck
      const { data: existingLike } = await supabase
        .from('deck_likes')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('deck_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;

        // Reload decks to get updated stats
        await loadPublicDecks();
        return false;
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('deck_likes')
          .insert([{
            deck_id: deckId,
            user_id: userId
          }]);

        if (insertError) throw insertError;

        // Reload decks to get updated stats
        await loadPublicDecks();
        return true;
      }
    } catch (err) {
      console.error('Error liking deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPublicDecks]);

  /**
   * Load user's published decks
   * 
   * @returns {Promise<Array>} Array of user's published decks
   */
  const loadMyPublishedDecks = useCallback(async () => {
    if (!userId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('public_decks')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMyPublishedDecks(data || []);
      return data || [];
    } catch (err) {
      console.error('Error loading my published decks:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Get user's like status for a deck
   * 
   * @param {string} deckId - The deck ID
   * @returns {Promise<boolean>} True if user liked the deck
   */
  const checkIfLiked = useCallback(async (deckId) => {
    if (!userId) return false;

    try {
      const { data } = await supabase
        .from('deck_likes')
        .select('id')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch (err) {
      return false;
    }
  }, [userId]);

  // Load public decks on mount
  useEffect(() => {
    if (userId) {
      loadPublicDecks();
      loadMyPublishedDecks();
    }
  }, [userId, loadPublicDecks, loadMyPublishedDecks]);

  return {
    // State
    publicDecks,
    myPublishedDecks,
    isLoading,
    error,
    filters,

    // Functions
    setFilters,
    loadPublicDecks,
    searchDecks,
    publishDeck,
    unpublishDeck,
    downloadDeck,
    rateDeck,
    likeDeck,
    loadMyPublishedDecks,
    checkIfLiked
  };
}

export default usePublicDecks;
