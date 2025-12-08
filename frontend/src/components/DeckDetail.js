import React, { useState, useEffect } from 'react';
import { X, Download, Star, Heart, User, Calendar, BookOpen } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * Composant pour afficher les détails d'un deck public
 */
export function DeckDetail({ deck, onImport, onClose, userId, themeClasses }) {
  const [flashcards, setFlashcards] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    loadDeckDetails();
  }, [deck.id, userId]);

  const loadDeckDetails = async () => {
    setIsLoading(true);
    try {
      // Charger les flashcards (aperçu de 5 cartes)
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('shared_flashcards')
        .select('*')
        .eq('course_id', deck.course_id)
        .limit(5);

      if (!flashcardsError) {
        setFlashcards(flashcardsData || []);
      }

      // Charger les avis
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('deck_ratings')
        .select('*')
        .eq('deck_id', deck.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!ratingsError) {
        setRatings(ratingsData || []);
        
        // Trouver l'avis de l'utilisateur
        const myRating = ratingsData?.find(r => r.user_id === userId);
        if (myRating) {
          setUserRating(myRating.rating);
          setUserReview(myRating.review || '');
        }
      }

      // Vérifier si l'utilisateur a liké
      if (userId) {
        const { data: likeData } = await supabase
          .from('deck_likes')
          .select('id')
          .eq('deck_id', deck.id)
          .eq('user_id', userId)
          .single();

        setHasLiked(!!likeData);
      }
    } catch (error) {
      console.error('Error loading deck details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!userId) return;

    try {
      if (hasLiked) {
        await supabase
          .from('deck_likes')
          .delete()
          .eq('deck_id', deck.id)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('deck_likes')
          .insert({
            deck_id: deck.id,
            user_id: userId
          });
      }
      setHasLiked(!hasLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (!userId || userRating === 0) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData?.user?.email?.split('@')[0] || 'Anonyme';

      await supabase
        .from('deck_ratings')
        .upsert({
          deck_id: deck.id,
          user_id: userId,
          user_name: userName,
          rating: userRating,
          review: userReview
        }, {
          onConflict: 'deck_id,user_id'
        });

      // Recharger les avis
      await loadDeckDetails();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${themeClasses?.bg?.primary || 'bg-slate-900'} ${themeClasses?.border?.subtle || 'border-slate-700'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 border-b backdrop-blur-xl bg-slate-900/95 border-slate-700 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-3xl font-bold text-white mb-2 pr-12">{deck.title}</h2>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>par <span className="text-indigo-300 font-medium">{deck.author_name}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(deck.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{deck.card_count} cartes</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Description</h3>
            <p className="text-slate-300 leading-relaxed">
              {deck.description || 'Aucune description disponible'}
            </p>
          </div>

          {/* Statistiques et actions */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-white font-medium">
                {deck.average_rating > 0 ? deck.average_rating.toFixed(1) : '-'}
              </span>
              <span className="text-slate-400 text-sm">/ 5</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <Download className="w-5 h-5 text-slate-400" />
              <span className="text-white font-medium">{deck.downloads_count}</span>
              <span className="text-slate-400 text-sm">téléchargements</span>
            </div>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                hasLiked
                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-red-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{deck.likes_count}</span>
            </button>
          </div>

          {/* Aperçu des flashcards */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Aperçu des cartes ({flashcards.length} sur {deck.card_count})
            </h3>
            {isLoading ? (
              <div className="text-center py-8 text-slate-400">Chargement...</div>
            ) : (
              <div className="space-y-3">
                {flashcards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${themeClasses?.bg?.secondary || 'bg-slate-800/50'} ${themeClasses?.border?.subtle || 'border-slate-700'}`}
                  >
                    <div className="font-semibold text-indigo-300 mb-2">Q: {card.question}</div>
                    <div className="text-slate-300 text-sm">R: {card.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section de notation */}
          {userId && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Votre avis</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Note:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= userRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Partagez votre avis (optionnel)..."
                  className={`w-full px-4 py-3 rounded-lg border resize-none ${themeClasses?.bg?.secondary || 'bg-slate-800'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                  rows="3"
                />
                
                <button
                  onClick={handleSubmitRating}
                  disabled={userRating === 0}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors"
                >
                  Publier l'avis
                </button>
              </div>
            </div>
          )}

          {/* Avis des utilisateurs */}
          {ratings.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Avis ({ratings.length})
              </h3>
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <div
                    key={rating.id}
                    className={`p-4 rounded-lg border ${themeClasses?.bg?.secondary || 'bg-slate-800/50'} ${themeClasses?.border?.subtle || 'border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{rating.user_name}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(rating.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    {rating.review && (
                      <p className="text-slate-300 text-sm">{rating.review}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(rating.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer avec bouton d'import */}
        <div className="sticky bottom-0 border-t backdrop-blur-xl bg-slate-900/95 border-slate-700 p-6">
          <button
            onClick={() => onImport(deck)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-indigo-500/30"
          >
            <Download className="w-6 h-6" />
            Importer ce deck dans mes flashcards
          </button>
        </div>
      </div>
    </div>
  );
}
