import React from 'react';
import { Download, Eye, Star, User, FileText } from 'lucide-react';

/**
 * Component to display a public deck card
 * 
 * @param {Object} deck - The deck object
 * @param {Function} onImport - Callback when import button is clicked
 * @param {Function} onView - Callback when view button is clicked
 */
export function DeckCard({ deck, onImport, onView }) {
  // Get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      'Mathématiques': 'bg-blue-600/20 text-blue-300 border-blue-500/50',
      'Physique': 'bg-purple-600/20 text-purple-300 border-purple-500/50',
      'Chimie': 'bg-green-600/20 text-green-300 border-green-500/50',
      'SI': 'bg-orange-600/20 text-orange-300 border-orange-500/50',
      'Informatique': 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50',
      'Anglais': 'bg-red-600/20 text-red-300 border-red-500/50',
      'Français': 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
    };
    return colors[category] || 'bg-slate-600/20 text-slate-300 border-slate-500/50';
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 hover:border-indigo-500/50 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10">
      {/* Category Badge */}
      <div className="flex items-start justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(deck.category)}`}>
          {deck.category}
        </span>
        {deck.tags && deck.tags.length > 0 && (
          <div className="flex gap-1">
            {deck.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-slate-700/50 text-slate-400 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
        {deck.title}
      </h3>

      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-slate-400" />
        <p className="text-sm text-slate-400">
          Par <span className="text-indigo-400 font-semibold">@{deck.author_name}</span>
        </p>
      </div>

      {/* Description */}
      <p className="text-slate-300 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
        {deck.description || 'Aucune description'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <FileText className="w-4 h-4" />
          <span className="font-semibold">{deck.cards_count}</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-semibold">
            {deck.average_rating > 0 ? deck.average_rating.toFixed(1) : 'N/A'}
          </span>
          <span className="text-slate-500 text-xs">({deck.ratings_count})</span>
        </div>
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <Download className="w-4 h-4" />
          <span className="font-semibold">{deck.downloads_count}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(deck)}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm"
        >
          <Eye className="w-4 h-4" />
          Aperçu
        </button>
        <button
          onClick={() => onImport(deck)}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/50 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm"
        >
          <Download className="w-4 h-4" />
          Importer
        </button>
      </div>
    </div>
  );
}

export default DeckCard;
