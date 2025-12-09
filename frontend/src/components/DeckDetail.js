import React, { useState } from 'react';
import { X, Star, Download, Heart, User, Calendar, MessageCircle } from 'lucide-react';

/**
 * Modal de détail d'un deck public
 * @param {Object} deck - Données du deck
 * @param {Array} flashcards - Cartes du deck (aperçu)
 * @param {Array} reviews - Avis utilisateurs
 * @param {boolean} isLiked - Si l'utilisateur a liké
 * @param {Function} onClose - Callback pour fermer
 * @param {Function} onDownload - Callback pour télécharger
 * @param {Function} onLike - Callback pour liker
 * @param {Function} onRate - Callback pour noter
 */
export function DeckDetail({ 
  deck, 
  flashcards = [], 
  reviews = [], 
  isLiked,
  onClose, 
  onDownload, 
  onLike,
  onRate 
}) {
  const [showReviews, setShowReviews] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  // Limiter l'aperçu à 5 cartes
  const previewCards = flashcards.slice(0, 5);

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Gérer la notation
  const handleRatingSubmit = () => {
    if (userRating > 0) {
      onRate?.(userRating, userReview);
      setUserRating(0);
      setUserReview('');
    }
  };

  // Couleur de catégorie
  const getCategoryColor = (category) => {
    const colors = {
      'Mathématiques': 'from-blue-600 to-cyan-600',
      'Physique': 'from-purple-600 to-pink-600',
      'Chimie': 'from-green-600 to-emerald-600',
      'SI': 'from-orange-600 to-red-600',
      'Informatique': 'from-slate-600 to-gray-700',
      'Anglais': 'from-red-600 to-rose-600',
      'Français': 'from-indigo-600 to-violet-600',
      'Autre': 'from-slate-600 to-slate-700'
    };
    return colors[category] || 'from-slate-600 to-slate-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-indigo-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className={`bg-gradient-to-r ${getCategoryColor(deck.category)} p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  {deck.category}
                </span>
                {deck.tags && deck.tags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 rounded-md text-xs bg-white/10 text-white border border-white/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{deck.title}</h2>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <User className="w-4 h-4" />
                <span>{deck.author_name}</span>
                <span>•</span>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(deck.published_at)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{deck.card_count}</span>
              <span className="text-sm opacity-80">cartes</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-current text-yellow-300" />
              <span className="text-xl font-bold">{deck.average_rating?.toFixed(1) || '—'}</span>
              <span className="text-sm opacity-80">({deck.rating_count || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-300" />
              <span className="text-xl font-bold">{deck.download_count || 0}</span>
            </div>
            <button
              onClick={onLike}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
                isLiked 
                  ? 'bg-white/20 border border-white/30' 
                  : 'bg-white/10 border border-white/20 hover:bg-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-pink-300' : 'text-white'}`} />
              <span className="font-bold">{deck.like_count || 0}</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Description */}
          {deck.description && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">📝 Description</h3>
              <p className="text-slate-300">{deck.description}</p>
            </div>
          )}

          {/* Aperçu des cartes */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">
              👁️ Aperçu des cartes ({previewCards.length}/{deck.card_count})
            </h3>
            <div className="space-y-3">
              {previewCards.map((card, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="mb-2">
                    <span className="text-xs text-indigo-400 font-semibold">Question:</span>
                    <p className="text-white mt-1">{card.question}</p>
                  </div>
                  <div>
                    <span className="text-xs text-purple-400 font-semibold">Réponse:</span>
                    <p className="text-slate-300 mt-1">{card.answer}</p>
                  </div>
                </div>
              ))}
              {deck.card_count > 5 && (
                <p className="text-center text-slate-400 text-sm">
                  + {deck.card_count - 5} autres cartes dans ce deck
                </p>
              )}
            </div>
          </div>

          {/* Section de notation */}
          <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">⭐ Noter ce deck</h3>
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      star <= (hoverRating || userRating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              {userRating > 0 && (
                <span className="text-white font-bold ml-2">{userRating}/5</span>
              )}
            </div>
            <textarea
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              placeholder="Laissez un avis (optionnel)..."
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none mb-2"
              rows="3"
            />
            <button
              onClick={handleRatingSubmit}
              disabled={userRating === 0}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer ma note
            </button>
          </div>

          {/* Avis utilisateurs */}
          {reviews.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="flex items-center gap-2 text-lg font-bold text-white mb-3 hover:text-indigo-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Avis ({reviews.length})
              </button>
              {showReviews && (
                <div className="space-y-3">
                  {reviews.map((review, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-slate-300 text-sm">{review.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold"
            >
              Fermer
            </button>
            <button
              onClick={onDownload}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Importer ce deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
