import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Clock, Star, Upload, Sparkles } from 'lucide-react';
import { DeckCard } from './DeckCard';
import { DeckDetail } from './DeckDetail';
import { PublishDeckModal } from './PublishDeckModal';
import { usePublicDecks } from '../hooks/usePublicDecks';
import { supabase } from '../supabaseClient';

/**
 * Bibliothèque publique de decks
 * @param {string} userId - ID de l'utilisateur connecté
 * @param {Array} courses - Cours de l'utilisateur (pour publication)
 * @param {Array} flashcards - Flashcards de l'utilisateur (pour publication)
 * @param {Function} onImportSuccess - Callback après import réussi
 */
export function PublicLibrary({ userId, courses, flashcards, onImportSuccess }) {
  const publicDecksHook = usePublicDecks(userId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('discover'); // 'discover' | 'my-decks'
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckFlashcards, setDeckFlashcards] = useState([]);
  const [deckReviews, setDeckReviews] = useState([]);
  const [likedDecks, setLikedDecks] = useState(new Set());

  // Catégories disponibles
  const categories = [
    { id: 'all', label: 'Toutes', emoji: '🌐' },
    { id: 'Mathématiques', label: 'Maths', emoji: '📐' },
    { id: 'Physique', label: 'Physique', emoji: '⚛️' },
    { id: 'Chimie', label: 'Chimie', emoji: '🧪' },
    { id: 'SI', label: 'SI', emoji: '⚙️' },
    { id: 'Informatique', label: 'Info', emoji: '💻' },
    { id: 'Anglais', label: 'Anglais', emoji: '🇬🇧' },
    { id: 'Français', label: 'Français', emoji: '📚' },
    { id: 'Autre', label: 'Autre', emoji: '📦' }
  ];

  // Options de tri
  const sortOptions = [
    { id: 'newest', label: 'Plus récents', icon: Clock },
    { id: 'rating', label: 'Mieux notés', icon: Star },
    { id: 'downloads', label: 'Plus téléchargés', icon: TrendingUp }
  ];

  // Charger les likes de l'utilisateur au montage
  useEffect(() => {
    const loadUserLikes = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('deck_likes')
          .select('deck_id')
          .eq('user_id', userId);
        
        if (error) throw error;
        
        const likedSet = new Set(data.map(like => like.deck_id));
        setLikedDecks(likedSet);
      } catch (error) {
        console.error('Error loading user likes:', error);
      }
    };
    
    loadUserLikes();
  }, [userId]);

  // Appliquer les filtres et le tri
  useEffect(() => {
    if (searchQuery.trim()) {
      publicDecksHook.searchDecks(searchQuery);
    } else {
      publicDecksHook.loadPublicDecks({
        category: selectedCategory,
        sortBy: sortBy
      });
    }
  }, [selectedCategory, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gérer la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      publicDecksHook.searchDecks(searchQuery);
    } else {
      publicDecksHook.loadPublicDecks({
        category: selectedCategory,
        sortBy: sortBy
      });
    }
  };

  // Ouvrir le détail d'un deck
  const handleViewDetails = async (deck) => {
    setSelectedDeck(deck);
    
    // Charger les flashcards du cours
    try {
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*')
        .eq('course_id', deck.course_id)
        .limit(5);
      
      if (flashcardsError) throw flashcardsError;
      setDeckFlashcards(flashcards || []);
      
      // Charger les avis
      const reviews = await publicDecksHook.getDeckReviews(deck.id);
      setDeckReviews(reviews);
    } catch (error) {
      console.error('Error loading deck details:', error);
    }
  };

  // Télécharger un deck
  const handleDownload = async (deckId) => {
    try {
      await publicDecksHook.downloadDeck(deckId);
      alert('✅ Deck importé avec succès dans votre bibliothèque !');
      onImportSuccess?.();
      
      // Rafraîchir les decks pour mettre à jour le compteur
      publicDecksHook.loadPublicDecks({
        category: selectedCategory,
        sortBy: sortBy
      });
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // Liker/unliker un deck
  const handleLike = async (deckId) => {
    try {
      const liked = await publicDecksHook.likeDeck(deckId);
      
      // Mettre à jour l'état local
      setLikedDecks(prev => {
        const newSet = new Set(prev);
        if (liked) {
          newSet.add(deckId);
        } else {
          newSet.delete(deckId);
        }
        return newSet;
      });
      
      // Rafraîchir les decks
      publicDecksHook.loadPublicDecks({
        category: selectedCategory,
        sortBy: sortBy
      });
    } catch (error) {
      console.error('Error liking deck:', error);
    }
  };

  // Noter un deck
  const handleRate = async (rating, review) => {
    if (!selectedDeck) return;
    
    try {
      await publicDecksHook.rateDeck(selectedDeck.id, rating, review);
      alert('✅ Merci pour votre avis !');
      
      // Recharger les avis
      const reviews = await publicDecksHook.getDeckReviews(selectedDeck.id);
      setDeckReviews(reviews);
      
      // Rafraîchir les decks
      publicDecksHook.loadPublicDecks({
        category: selectedCategory,
        sortBy: sortBy
      });
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // Publier un deck
  const handlePublish = async ({ courseId, metadata }) => {
    try {
      await publicDecksHook.publishDeck(courseId, metadata);
      setShowPublishModal(false);
      alert('✅ Deck publié avec succès !');
      
      // Passer en mode "Mes decks"
      setViewMode('my-decks');
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // Decks à afficher
  const displayedDecks = viewMode === 'discover' 
    ? publicDecksHook.publicDecks 
    : publicDecksHook.myPublishedDecks;

  return (
    <div className="w-full">
      {/* En-tête */}
      <div className="mb-8 text-center">
        <h2 className="text-5xl font-bold text-white mb-3">🌐 Bibliothèque Communautaire</h2>
        <p className="text-indigo-300 text-lg">Découvrez et partagez des decks de flashcards</p>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Toggle Découvrir / Mes decks */}
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode('discover')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'discover'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Découvrir
          </button>
          <button
            onClick={() => setViewMode('my-decks')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'my-decks'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Mes decks ({publicDecksHook.myPublishedDecks.length})
          </button>
        </div>

        {/* Bouton publier */}
        <button
          onClick={() => setShowPublishModal(true)}
          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all font-semibold flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Publier un deck
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      {viewMode === 'discover' && (
        <div className="mb-6 space-y-4">
          {/* Recherche */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des decks..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold"
            >
              Rechercher
            </button>
          </form>

          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Catégories */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">Catégorie</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tri */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">Trier par</span>
              </div>
              <div className="flex gap-2">
                {sortOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${
                      sortBy === option.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grille de decks */}
      {publicDecksHook.isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      ) : displayedDecks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {viewMode === 'discover' ? '🔍' : '📦'}
          </div>
          <p className="text-xl text-white mb-2">
            {viewMode === 'discover' ? 'Aucun deck trouvé' : 'Aucun deck publié'}
          </p>
          <p className="text-slate-400">
            {viewMode === 'discover' 
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Publiez votre premier deck pour le partager avec la communauté'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDecks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              isLiked={likedDecks.has(deck.id)}
              onViewDetails={() => handleViewDetails(deck)}
              onDownload={() => handleDownload(deck.id)}
              onLike={() => handleLike(deck.id)}
            />
          ))}
        </div>
      )}

      {/* Mes decks - actions supplémentaires */}
      {viewMode === 'my-decks' && displayedDecks.length > 0 && (
        <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <p className="text-sm text-slate-400">
            💡 <strong>Astuce:</strong> Vous pouvez retirer un deck en cliquant sur "Aperçu" puis en utilisant les options
          </p>
        </div>
      )}

      {/* Modal de détail */}
      {selectedDeck && (
        <DeckDetail
          deck={selectedDeck}
          flashcards={deckFlashcards}
          reviews={deckReviews}
          isLiked={likedDecks.has(selectedDeck.id)}
          onClose={() => {
            setSelectedDeck(null);
            setDeckFlashcards([]);
            setDeckReviews([]);
          }}
          onDownload={() => handleDownload(selectedDeck.id)}
          onLike={() => handleLike(selectedDeck.id)}
          onRate={handleRate}
        />
      )}

      {/* Modal de publication */}
      {showPublishModal && (
        <PublishDeckModal
          courses={courses}
          flashcards={flashcards}
          onPublish={handlePublish}
          onClose={() => setShowPublishModal(false)}
        />
      )}
    </div>
  );
}
