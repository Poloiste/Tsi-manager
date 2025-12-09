import React from 'react';
import { Star, Download, Heart, User } from 'lucide-react';

/**
 * Composant carte d'affichage d'un deck public
 * @param {Object} deck - Données du deck
 * @param {Function} onViewDetails - Callback pour voir les détails
 * @param {Function} onDownload - Callback pour télécharger
 * @param {boolean} isLiked - Si l'utilisateur a liké
 * @param {Function} onLike - Callback pour liker/unliker
 */
export function DeckCard({ deck, onViewDetails, onDownload, isLiked, onLike }) {
  // Couleurs par catégorie
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

  // Badge de catégorie avec couleur
  const categoryBadgeColor = (category) => {
    const colors = {
      'Mathématiques': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Physique': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Chimie': 'bg-green-500/20 text-green-300 border-green-500/30',
      'SI': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'Informatique': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      'Anglais': 'bg-red-500/20 text-red-300 border-red-500/30',
      'Français': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      'Autre': 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    };
    return colors[category] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  // Formater la note
  const formatRating = (rating) => {
    if (!rating || rating === 0) return '—';
    return rating.toFixed(1);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 overflow-hidden group">
      {/* En-tête avec gradient de catégorie */}
      <div className={`h-2 bg-gradient-to-r ${getCategoryColor(deck.category)}`}></div>
      
      <div className="p-6">
        {/* Badge catégorie */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryBadgeColor(deck.category)}`}>
            {deck.category}
          </span>
          {deck.tags && deck.tags.length > 0 && (
            <div className="flex gap-1">
              {deck.tags.slice(0, 2).map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs bg-slate-700/50 text-slate-300 border border-slate-600"
                >
                  #{tag}
                </span>
              ))}
              {deck.tags.length > 2 && (
                <span className="px-2 py-0.5 rounded-md text-xs bg-slate-700/50 text-slate-300 border border-slate-600">
                  +{deck.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Titre */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
          {deck.title}
        </h3>

        {/* Auteur */}
        <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
          <User className="w-4 h-4" />
          <span>{deck.author_name}</span>
        </div>

        {/* Description */}
        {deck.description && (
          <p className="text-sm text-slate-300 mb-4 line-clamp-2">
            {deck.description}
          </p>
        )}

        {/* Statistiques */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-4">
            {/* Nombre de cartes */}
            <div className="flex items-center gap-1 text-slate-300">
              <span className="font-bold">{deck.card_count}</span>
              <span>cartes</span>
            </div>

            {/* Note */}
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold">{formatRating(deck.average_rating)}</span>
              {deck.rating_count > 0 && (
                <span className="text-slate-400 text-xs">({deck.rating_count})</span>
              )}
            </div>

            {/* Téléchargements */}
            <div className="flex items-center gap-1 text-green-400">
              <Download className="w-4 h-4" />
              <span className="font-bold">{deck.download_count}</span>
            </div>
          </div>

          {/* Likes */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              isLiked 
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-500/30'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">{deck.like_count || 0}</span>
          </button>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails?.()}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold text-sm"
          >
            👁️ Aperçu
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.();
            }}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all font-semibold text-sm"
          >
            📥 Importer
          </button>
        </div>
      </div>
    </div>
  );
}
