import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook de gestion des decks publics et système de partage
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Object} État et fonctions de gestion des decks publics
 */
export function usePublicDecks(userId) {
  // États
  const [publicDecks, setPublicDecks] = useState([]);
  const [myPublishedDecks, setMyPublishedDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger les decks publics avec filtres optionnels
   * @param {Object} filters - Filtres de recherche
   * @param {string} filters.category - Catégorie à filtrer
   * @param {string} filters.sortBy - Champ de tri ('downloads', 'rating', 'newest')
   * @param {number} filters.limit - Nombre max de résultats
   */
  const loadPublicDecks = useCallback(async (filters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('public_decks')
        .select(`
          *,
          shared_courses!inner(subject, chapter)
        `)
        .eq('is_published', true);

      // Appliquer les filtres
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Appliquer le tri
      switch (filters.sortBy) {
        case 'downloads':
          query = query.order('download_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        case 'likes':
          query = query.order('like_count', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('published_at', { ascending: false });
          break;
      }

      // Limiter les résultats
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPublicDecks(data || []);
      return data || [];
    } catch (err) {
      console.error('Error loading public decks:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charger les decks publiés par l'utilisateur
   */
  const loadMyPublishedDecks = useCallback(async () => {
    if (!userId) return [];

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('public_decks')
        .select(`
          *,
          shared_courses!inner(subject, chapter)
        `)
        .eq('author_id', userId)
        .order('published_at', { ascending: false });

      if (error) throw error;

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
   * Rechercher des decks par titre ou description
   * @param {string} query - Terme de recherche
   */
  const searchDecks = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      return await loadPublicDecks();
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const { data, error } = await supabase
        .from('public_decks')
        .select(`
          *,
          shared_courses!inner(subject, chapter)
        `)
        .eq('is_published', true)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('published_at', { ascending: false });

      if (error) throw error;

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
   * Publier un cours comme deck public
   * @param {string} courseId - ID du cours à publier
   * @param {Object} metadata - Métadonnées du deck
   * @param {string} metadata.title - Titre du deck
   * @param {string} metadata.description - Description
   * @param {string} metadata.category - Catégorie
   * @param {Array<string>} metadata.tags - Tags (max 5)
   */
  const publishDeck = useCallback(async (courseId, metadata) => {
    if (!userId) {
      throw new Error('Vous devez être connecté pour publier un deck');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Vérifier que le cours existe et obtenir le nombre de flashcards
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('id')
        .eq('course_id', courseId);

      if (flashcardsError) throw flashcardsError;

      if (!flashcards || flashcards.length === 0) {
        throw new Error('Ce cours ne contient aucune flashcard. Ajoutez des flashcards avant de publier.');
      }

      // Obtenir le nom de l'utilisateur
      const { data: userData } = await supabase.auth.getUser();
      const authorName = userData?.user?.user_metadata?.name || 
                         userData?.user?.email?.split('@')[0] || 
                         'Anonyme';

      // Limiter les tags à 5
      const tags = metadata.tags ? metadata.tags.slice(0, 5) : [];

      // Insérer le deck public
      const { data, error } = await supabase
        .from('public_decks')
        .insert([{
          course_id: courseId,
          author_id: userId,
          author_name: authorName,
          title: metadata.title,
          description: metadata.description || '',
          category: metadata.category,
          tags: tags,
          card_count: flashcards.length,
          is_published: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Recharger les decks
      await loadMyPublishedDecks();
      
      return data;
    } catch (err) {
      console.error('Error publishing deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadMyPublishedDecks]);

  /**
   * Retirer un deck de la publication
   * @param {string} deckId - ID du deck à retirer
   */
  const unpublishDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('Vous devez être connecté');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Option 1: Supprimer complètement le deck
      const { error } = await supabase
        .from('public_decks')
        .delete()
        .eq('id', deckId)
        .eq('author_id', userId);

      if (error) throw error;

      // Mettre à jour l'état local
      setMyPublishedDecks(prev => prev.filter(deck => deck.id !== deckId));
      setPublicDecks(prev => prev.filter(deck => deck.id !== deckId));

      return true;
    } catch (err) {
      console.error('Error unpublishing deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Importer un deck public dans sa bibliothèque
   * @param {string} deckId - ID du deck à télécharger
   */
  const downloadDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('Vous devez être connecté pour importer un deck');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Récupérer le deck
      const { data: deck, error: deckError } = await supabase
        .from('public_decks')
        .select('*, shared_courses!inner(*)')
        .eq('id', deckId)
        .single();

      if (deckError) throw deckError;

      // Récupérer les flashcards du cours
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*')
        .eq('course_id', deck.course_id);

      if (flashcardsError) throw flashcardsError;

      // Créer un nouveau cours dans la bibliothèque de l'utilisateur
      const { data: newCourse, error: courseError } = await supabase
        .from('shared_courses')
        .insert([{
          subject: deck.shared_courses.subject,
          chapter: `${deck.title} (importé)`,
          content: deck.description || deck.shared_courses.content,
          difficulty: deck.shared_courses.difficulty,
          created_by: userId
        }])
        .select()
        .single();

      if (courseError) throw courseError;

      // Copier les flashcards
      const flashcardsToInsert = flashcards.map(fc => ({
        course_id: newCourse.id,
        question: fc.question,
        answer: fc.answer,
        created_by: userId,
        created_by_name: userData?.user?.user_metadata?.name || 
                         userData?.user?.email?.split('@')[0] || 
                         'Anonyme',
        imported_from: `deck:${deckId}`
      }));

      const { error: insertError } = await supabase
        .from('shared_flashcards')
        .insert(flashcardsToInsert);

      if (insertError) throw insertError;

      // Enregistrer le téléchargement
      const { error: downloadError } = await supabase
        .from('deck_downloads')
        .insert([{
          deck_id: deckId,
          user_id: userId
        }]);

      // Ne pas échouer si c'est un doublon (UNIQUE constraint)
      if (downloadError && !downloadError.message.includes('duplicate')) {
        console.error('Error recording download:', downloadError);
      }

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
   * Noter un deck
   * @param {string} deckId - ID du deck
   * @param {number} rating - Note (1-5)
   * @param {string} review - Avis optionnel
   */
  const rateDeck = useCallback(async (deckId, rating, review = '') => {
    if (!userId) {
      throw new Error('Vous devez être connecté pour noter un deck');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('La note doit être entre 1 et 5');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Insérer ou mettre à jour la note
      const { error } = await supabase
        .from('deck_ratings')
        .upsert([{
          deck_id: deckId,
          user_id: userId,
          rating: rating,
          review: review,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'deck_id,user_id'
        });

      if (error) throw error;

      // Recharger les decks pour avoir les stats à jour
      await loadPublicDecks();

      return true;
    } catch (err) {
      console.error('Error rating deck:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPublicDecks]);

  /**
   * Liker ou unliker un deck
   * @param {string} deckId - ID du deck
   */
  const likeDeck = useCallback(async (deckId) => {
    if (!userId) {
      throw new Error('Vous devez être connecté pour liker un deck');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Vérifier si déjà liké
      const { data: existingLike, error: checkError } = await supabase
        .from('deck_likes')
        .select('id')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('deck_likes')
          .delete()
          .eq('deck_id', deckId)
          .eq('user_id', userId);

        if (error) throw error;
        return false; // unliked
      } else {
        // Like
        const { error } = await supabase
          .from('deck_likes')
          .insert([{
            deck_id: deckId,
            user_id: userId
          }]);

        if (error) throw error;
        return true; // liked
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Vérifier si l'utilisateur a liké un deck
   * @param {string} deckId - ID du deck
   */
  const hasLiked = useCallback(async (deckId) => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('deck_likes')
        .select('id')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking like status:', err);
      return false;
    }
  }, [userId]);

  /**
   * Obtenir les avis d'un deck
   * @param {string} deckId - ID du deck
   */
  const getDeckReviews = useCallback(async (deckId) => {
    try {
      const { data, error } = await supabase
        .from('deck_ratings')
        .select('*')
        .eq('deck_id', deckId)
        .not('review', 'is', null)
        .not('review', 'eq', '')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return [];
    }
  }, []);

  // Charger les decks publics au montage
  useEffect(() => {
    loadPublicDecks();
  }, [loadPublicDecks]);

  // Charger les decks de l'utilisateur si connecté
  useEffect(() => {
    if (userId) {
      loadMyPublishedDecks();
    }
  }, [userId, loadMyPublishedDecks]);

  return {
    publicDecks,
    myPublishedDecks,
    isLoading,
    error,
    loadPublicDecks,
    loadMyPublishedDecks,
    searchDecks,
    publishDeck,
    unpublishDeck,
    downloadDeck,
    rateDeck,
    likeDeck,
    hasLiked,
    getDeckReviews
  };
}
