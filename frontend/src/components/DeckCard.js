import React from 'react';
import { Download, Star, Eye, Heart } from 'lucide-react';

/**
 * Composant pour afficher une carte de deck public
 */
export function DeckCard({ deck, onImport, onView, themeClasses }) {
  // Obtenir la couleur du badge selon la catégorie
  const getCategoryColor = (category) => {
    const colors = {
      'Mathématiques': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Physique': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Chimie': 'bg-green-500/20 text-green-300 border-green-500/30',
      'SI': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'Informatique': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      'Anglais': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      'Français': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <div className={`group relative rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20 ${themeClasses?.bg?.secondary || 'bg-slate-800/50'} ${themeClasses?.border?.subtle || 'border-slate-700/50'}`}>
      {/* Badge de catégorie */}
      <div className="absolute top-3 right-3">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getCategoryColor(deck.category)}`}>
          {deck.category}
        </span>
      </div>

      {/* Contenu principal */}
      <div className="mb-4 pr-24">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
          {deck.title}
        </h3>
        <p className="text-sm text-slate-400 mb-3">
          par <span className="text-indigo-300 font-medium">{deck.author_name}</span>
        </p>
        <p className="text-sm text-slate-300 line-clamp-3">
          {deck.description || 'Aucune description disponible'}
        </p>
      </div>

      {/* Statistiques */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-slate-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          <span>{deck.card_count} cartes</span>
        </div>
        
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-4 h-4 fill-current" />
          <span>{deck.average_rating > 0 ? deck.average_rating.toFixed(1) : '-'}</span>
        </div>
        
        <div className="flex items-center gap-1 text-slate-400">
          <Download className="w-4 h-4" />
          <span>{deck.downloads_count}</span>
        </div>

        <div className="flex items-center gap-1 text-red-400">
          <Heart className="w-4 h-4" />
          <span>{deck.likes_count}</span>
        </div>
      </div>

      {/* Tags */}
      {deck.tags && deck.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {deck.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(deck)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 transition-all duration-200 text-sm font-medium border border-slate-600/50 hover:border-slate-500"
        >
          <Eye className="w-4 h-4" />
          Aperçu
        </button>
        <button
          onClick={() => onImport(deck)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-200 text-sm font-medium shadow-lg shadow-indigo-500/30"
        >
          <Download className="w-4 h-4" />
          Importer
        </button>
      </div>
    </div>
  );
}
