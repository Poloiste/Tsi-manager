import React, { useState } from 'react';
import { Search, Filter, TrendingUp, Clock } from 'lucide-react';
import { DeckCard } from './DeckCard';

/**
 * Composant de bibliothèque publique pour parcourir les decks
 */
export function PublicLibrary({ 
  decks, 
  isLoading, 
  onImport, 
  onView, 
  filters, 
  onFilterChange, 
  onSearch,
  themeClasses 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');

  const categories = [
    { id: 'all', label: 'Toutes' },
    { id: 'Mathématiques', label: '📐 Mathématiques' },
    { id: 'Physique', label: '⚛️ Physique' },
    { id: 'Chimie', label: '🧪 Chimie' },
    { id: 'SI', label: '⚙️ SI' },
    { id: 'Informatique', label: '💻 Informatique' },
    { id: 'Anglais', label: '🇬🇧 Anglais' },
    { id: 'Français', label: '📚 Français' }
  ];

  const sortOptions = [
    { id: 'popular', label: '🔥 Plus téléchargés', icon: TrendingUp },
    { id: 'likes', label: '❤️ Plus aimés', icon: TrendingUp },
    { id: 'rating', label: '⭐ Mieux notés', icon: TrendingUp },
    { id: 'recent', label: '🆕 Plus récents', icon: Clock }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      onSearch(query);
    } else {
      onFilterChange({ category: selectedCategory, sort: selectedSort });
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    onFilterChange({ category, sort: selectedSort });
  };

  const handleSortChange = (sort) => {
    setSelectedSort(sort);
    onFilterChange({ category: selectedCategory, sort });
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche */}
      <div className={`rounded-xl border p-6 ${themeClasses?.bg?.secondary || 'bg-slate-800/50'} ${themeClasses?.border?.subtle || 'border-slate-700'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher des decks..."
              className={`w-full pl-12 pr-4 py-3 rounded-lg border ${themeClasses?.bg?.primary || 'bg-slate-900'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
            />
          </div>

          {/* Tri */}
          <div className="flex gap-2">
            {sortOptions.map(option => (
              <button
                key={option.id}
                onClick={() => handleSortChange(option.id)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all whitespace-nowrap ${
                  selectedSort === option.id
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : `${themeClasses?.bg?.primary || 'bg-slate-900'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-slate-300 hover:border-indigo-500/50`
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtres de catégories */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent text-white shadow-lg shadow-indigo-500/30'
                : `${themeClasses?.bg?.secondary || 'bg-slate-800/50'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-slate-300 hover:border-indigo-500/50`
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grille de decks */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Chargement des decks...</p>
          </div>
        </div>
      ) : decks.length === 0 ? (
        <div className={`text-center py-20 rounded-xl border ${themeClasses?.bg?.secondary || 'bg-slate-800/50'} ${themeClasses?.border?.subtle || 'border-slate-700'}`}>
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">Aucun deck trouvé</h3>
          <p className="text-slate-400">
            {searchQuery 
              ? 'Essayez avec des mots-clés différents' 
              : 'Soyez le premier à publier un deck dans cette catégorie !'}
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-400 mb-2">
            {decks.length} deck{decks.length > 1 ? 's' : ''} trouvé{decks.length > 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onImport={onImport}
                onView={onView}
                themeClasses={themeClasses}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
