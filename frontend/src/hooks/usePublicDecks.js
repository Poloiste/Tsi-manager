import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook pour gérer les decks publics et le système de partage
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Object} État et fonctions pour gérer les decks publics
 */
export function usePublicDecks(userId) {
  const [publicDecks, setPublicDecks] = useState([]);
  const [myPublishedDecks, setMyPublishedDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ 
    category: 'all', 
    sort: 'popular' 
  });

  /**
   * Charger les decks publics avec filtres
   * @param {Object} customFilters - Filtres personnalisés (category, sort)
   */
  const loadPublicDecks = useCallback(async (customFilters = null) => {
    setIsLoading(true);
    try {
      const activeFilters = customFilters || filters;
      
      let query = supabase
        .from('public_decks')
        .select('*')
        .eq('is_published', true);

      // Appliquer le filtre de catégorie
      if (activeFilters.category && activeFilters.category !== 'all') {
        query = query.eq('category', activeFilters.category);
      }

      // Appliquer le tri
      switch (activeFilters.sort) {
        case 'popular':
          query = query.order('downloads_count', { ascending: false });
          break;
        case 'likes':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('downloads_count', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setPublicDecks(data || []);
    } catch (error) {
      console.error('Error loading public decks:', error);
      setPublicDecks([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Rechercher des decks par titre ou description
   * @param {string} query - Texte de recherche
   */
  const searchDecks = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      loadPublicDecks();
      return;
    }

    setIsLoading(true);
    try {
      const searchTerm = `%${query}%`;
      
      const { data, error } = await supabase
        .from('public_decks')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('downloads_count', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublicDecks(data || []);
    } catch (error) {
      console.error('Error searching decks:', error);
      setPublicDecks([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadPublicDecks]);

  /**
   * Publier un cours comme deck public
   * @param {string} courseId - ID du cours à publier
   * @param {Object} metadata - Métadonnées du deck (titre, description, catégorie, tags)
   * @returns {Promise<Object>} Le deck créé
   */
  const publishDeck = useCallback(async (courseId, metadata) => {
    if (!userId) {
      throw new Error('User must be authenticated to publish a deck');
    }

    try {
      // Récupérer le cours et ses flashcards
      const { data: course, error: courseError } = await supabase
        .from('shared_courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      const { data: flashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*')
        .eq('course_id', courseId);

      if (flashcardsError) throw flashcardsError;

      // Récupérer le nom de l'utilisateur
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData?.user?.email?.split('@')[0] || 'Anonyme';

      // Créer le deck public
      const { data: newDeck, error: deckError } = await supabase
        .from('public_decks')
        .insert({
          author_id: userId,
          author_name: userName,
          course_id: courseId,
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          tags: metadata.tags || [],
          card_count: flashcards.length,
          is_published: true
        })
        .select()
        .single();

      if (deckError) throw deckError;

      // Recharger les decks publiés par l'utilisateur
      await loadMyPublishedDecks();

      return newDeck;
    } catch (error) {
      console.error('Error publishing deck:', error);
      throw error;
    }
  }, [userId]);

  /**
   * Retirer un deck public
   * @param {string} deckId - ID du deck à retirer
   */
  const unpublishDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      const { error } = await supabase
        .from('public_decks')
        .delete()
        .eq('id', deckId)
        .eq('author_id', userId);

      if (error) throw error;

      // Recharger les decks publiés par l'utilisateur
      await loadMyPublishedDecks();
    } catch (error) {
      console.error('Error unpublishing deck:', error);
      throw error;
    }
  }, [userId]);

  /**
   * Importer un deck dans ses flashcards
   * @param {string} deckId - ID du deck à importer
   * @returns {Promise<Object>} Le cours créé et les flashcards importées
   */
  const downloadDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('User must be authenticated to download a deck');
    }

    try {
      // Récupérer le deck
      const { data: deck, error: deckError } = await supabase
        .from('public_decks')
        .select('*, shared_courses(*)')
        .eq('id', deckId)
        .single();

      if (deckError) throw deckError;

      // Récupérer les flashcards du cours original
      const { data: originalFlashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*')
        .eq('course_id', deck.course_id);

      if (flashcardsError) throw flashcardsError;

      // Créer un nouveau cours pour l'utilisateur
      const { data: newCourse, error: courseError } = await supabase
        .from('shared_courses')
        .insert({
          subject: deck.shared_courses.subject,
          chapter: `${deck.title} (importé)`,
          content: deck.description,
          difficulty: deck.shared_courses.difficulty || 3,
          created_by: userId
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Copier les flashcards
      const flashcardsToInsert = originalFlashcards.map(fc => ({
        course_id: newCourse.id,
        question: fc.question,
        answer: fc.answer,
        created_by: userId,
        created_by_name: deck.author_name,
        imported_from: deck.title
      }));

      const { error: insertError } = await supabase
        .from('shared_flashcards')
        .insert(flashcardsToInsert);

      if (insertError) throw insertError;

      // Enregistrer le téléchargement
      await supabase
        .from('deck_downloads')
        .insert({
          deck_id: deckId,
          user_id: userId
        });

      return { course: newCourse, flashcardsCount: flashcardsToInsert.length };
    } catch (error) {
      console.error('Error downloading deck:', error);
      throw error;
    }
  }, [userId]);

  /**
   * Noter un deck
   * @param {string} deckId - ID du deck à noter
   * @param {number} rating - Note de 1 à 5
   * @param {string} review - Avis optionnel
   */
  const rateDeck = useCallback(async (deckId, rating, review = '') => {
    if (!userId) {
      throw new Error('User must be authenticated to rate a deck');
    }

    try {
      // Récupérer le nom de l'utilisateur
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData?.user?.email?.split('@')[0] || 'Anonyme';

      const { error } = await supabase
        .from('deck_ratings')
        .upsert({
          deck_id: deckId,
          user_id: userId,
          user_name: userName,
          rating: rating,
          review: review
        }, {
          onConflict: 'deck_id,user_id'
        });

      if (error) throw error;

      // Recharger les decks pour mettre à jour les notes
      await loadPublicDecks();
    } catch (error) {
      console.error('Error rating deck:', error);
      throw error;
    }
  }, [userId, loadPublicDecks]);

  /**
   * Liker ou unliker un deck
   * @param {string} deckId - ID du deck
   */
  const likeDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('User must be authenticated to like a deck');
    }

    try {
      // Vérifier si l'utilisateur a déjà liké
      const { data: existingLike } = await supabase
        .from('deck_likes')
        .select('id')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unliker
        await supabase
          .from('deck_likes')
          .delete()
          .eq('deck_id', deckId)
          .eq('user_id', userId);
      } else {
        // Liker
        await supabase
          .from('deck_likes')
          .insert({
            deck_id: deckId,
            user_id: userId
          });
      }

      // Recharger les decks pour mettre à jour les likes
      await loadPublicDecks();
    } catch (error) {
      console.error('Error liking deck:', error);
      throw error;
    }
  }, [userId, loadPublicDecks]);

  /**
   * Vérifier si l'utilisateur a liké un deck
   * @param {string} deckId - ID du deck
   * @returns {Promise<boolean>}
   */
  const hasLikedDeck = useCallback(async (deckId) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('deck_likes')
        .select('id')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      return !error && data !== null;
    } catch (error) {
      return false;
    }
  }, [userId]);

  /**
   * Charger les decks publiés par l'utilisateur
   */
  const loadMyPublishedDecks = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('public_decks')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPublishedDecks(data || []);
    } catch (error) {
      console.error('Error loading my published decks:', error);
      setMyPublishedDecks([]);
    }
  }, [userId]);

  // Charger les decks publics au montage
  useEffect(() => {
    loadPublicDecks();
  }, [filters]);

  // Charger les decks de l'utilisateur au montage
  useEffect(() => {
    if (userId) {
      loadMyPublishedDecks();
    }
  }, [userId, loadMyPublishedDecks]);

  return {
    publicDecks,
    myPublishedDecks,
    isLoading,
    filters,
    setFilters,
    loadPublicDecks,
    searchDecks,
    publishDeck,
    unpublishDeck,
    downloadDeck,
    rateDeck,
    likeDeck,
    hasLikedDeck,
    loadMyPublishedDecks
  };
}
