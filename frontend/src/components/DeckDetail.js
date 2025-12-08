import React, { useState, useEffect } from 'react';
import { X, Download, Star, User, FileText, Calendar, Heart } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * Component to display detailed view of a deck
 * 
 * @param {Object} deck - The deck object
 * @param {Function} onImport - Callback when import button is clicked
 * @param {Function} onClose - Callback to close the detail view
 * @param {string} userId - Current user ID
 */
export function DeckDetail({ deck, onImport, onClose, userId }) {
  const [flashcards, setFlashcards] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Load deck details
  useEffect(() => {
    loadDeckDetails();
    checkIfLiked();
    loadUserRating();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id, userId]);

  const loadDeckDetails = async () => {
    setIsLoading(true);
    try {
      // Load flashcards
      const { data: deckFlashcards, error: flashcardsError } = await supabase
        .from('deck_flashcards')
        .select(`
          position,
          shared_flashcards (
            id,
            question,
            answer
          )
        `)
        .eq('deck_id', deck.id)
        .order('position')
        .limit(5);

      if (flashcardsError) throw flashcardsError;

      setFlashcards(deckFlashcards?.map(df => df.shared_flashcards) || []);

      // Load ratings with user info
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('deck_ratings')
        .select('*')
        .eq('deck_id', deck.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ratingsError) throw ratingsError;

      setRatings(ratingsData || []);
    } catch (error) {
      console.error('Error loading deck details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('deck_likes')
        .select('id')
        .eq('deck_id', deck.id)
        .eq('user_id', userId)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      setIsLiked(false);
    }
  };

  const loadUserRating = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('deck_ratings')
        .select('*')
        .eq('deck_id', deck.id)
        .eq('user_id', userId)
        .single();

      if (data) {
        setUserRating(data);
        setNewRating(data.rating);
        setNewReview(data.review || '');
      }
    } catch (error) {
      // User hasn't rated yet
    }
  };

  const handleLike = async () => {
    if (!userId) return;

    try {
      if (isLiked) {
        await supabase
          .from('deck_likes')
          .delete()
          .eq('deck_id', deck.id)
          .eq('user_id', userId);
        setIsLiked(false);
      } else {
        await supabase
          .from('deck_likes')
          .insert([{ deck_id: deck.id, user_id: userId }]);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (!userId || newRating === 0) return;

    try {
      if (userRating) {
        // Update existing rating
        await supabase
          .from('deck_ratings')
          .update({
            rating: newRating,
            review: newReview,
            updated_at: new Date().toISOString()
          })
          .eq('id', userRating.id);
      } else {
        // Insert new rating
        await supabase
          .from('deck_ratings')
          .insert([{
            deck_id: deck.id,
            user_id: userId,
            rating: newRating,
            review: newReview
          }]);
      }

      // Reload ratings
      await loadDeckDetails();
      await loadUserRating();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-6 flex items-start justify-between z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 rounded-full text-sm font-semibold">
                {deck.category}
              </span>
              {deck.tags?.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{deck.title}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Par <span className="text-indigo-400 font-semibold">@{deck.author_name}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(deck.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">Description</h3>
            <p className="text-slate-300 whitespace-pre-wrap">
              {deck.description || 'Aucune description disponible'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <FileText className="w-5 h-5" />
                <span className="text-sm">Cartes</span>
              </div>
              <div className="text-2xl font-bold text-white">{deck.cards_count}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-yellow-400 mb-1">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-sm">Note</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {deck.average_rating > 0 ? deck.average_rating.toFixed(1) : 'N/A'}
                <span className="text-sm text-slate-400 ml-2">({deck.ratings_count})</span>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Download className="w-5 h-5" />
                <span className="text-sm">Téléchargements</span>
              </div>
              <div className="text-2xl font-bold text-white">{deck.downloads_count}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-pink-400 mb-1">
                <Heart className="w-5 h-5" />
                <span className="text-sm">Likes</span>
              </div>
              <div className="text-2xl font-bold text-white">{deck.likes_count}</div>
            </div>
          </div>

          {/* Preview Cards */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">Aperçu des cartes</h3>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Chargement...</div>
            ) : flashcards.length > 0 ? (
              <div className="space-y-3">
                {flashcards.map((card, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="mb-2">
                      <div className="text-xs text-indigo-400 font-semibold mb-1">Question</div>
                      <div className="text-white">{card.question}</div>
                    </div>
                    <div>
                      <div className="text-xs text-purple-400 font-semibold mb-1">Réponse</div>
                      <div className="text-slate-300">{card.answer}</div>
                    </div>
                  </div>
                ))}
                {deck.cards_count > 5 && (
                  <div className="text-center text-slate-400 text-sm py-2">
                    +{deck.cards_count - 5} autres cartes...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">Aucune carte à afficher</div>
            )}
          </div>

          {/* Rating Section */}
          {userId && (
            <div>
              <h3 className="text-xl font-bold text-white mb-3">Votre avis</h3>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewRating(star)}
                      className={`transition-colors ${
                        star <= newRating ? 'text-yellow-400' : 'text-slate-600'
                      }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Écrivez un commentaire (optionnel)..."
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none mb-3"
                  rows="3"
                />
                <button
                  onClick={handleSubmitRating}
                  disabled={newRating === 0}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {userRating ? 'Mettre à jour mon avis' : 'Publier mon avis'}
                </button>
              </div>
            </div>
          )}

          {/* Reviews */}
          {ratings.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-3">Avis de la communauté</h3>
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <div key={rating.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {rating.review && (
                      <p className="text-slate-300 text-sm">{rating.review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-6 flex gap-3">
          <button
            onClick={handleLike}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-semibold ${
              isLiked
                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            {isLiked ? 'Liké' : 'Liker'}
          </button>
          <button
            onClick={() => onImport(deck)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/50 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <Download className="w-5 h-5" />
            Importer ce deck
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeckDetail;
