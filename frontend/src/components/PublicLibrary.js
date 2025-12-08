import React, { useState } from 'react';
import { Search, Filter, TrendingUp, Clock, Star, Download } from 'lucide-react';
import { DeckCard } from './DeckCard';

/**
 * Component for browsing and searching public decks
 * 
 * @param {Array} decks - Array of public decks
 * @param {Object} filters - Current filter settings
 * @param {Function} onFilterChange - Callback when filters change
 * @param {Function} onSearch - Callback for search
 * @param {Function} onImport - Callback when import button is clicked
 * @param {Function} onView - Callback when view button is clicked
 * @param {boolean} isLoading - Loading state
 */
export function PublicLibrary({ 
  decks, 
  filters, 
  onFilterChange, 
  onSearch, 
  onImport, 
  onView,
  isLoading 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'all', label: 'Toutes' },
    { value: 'Mathématiques', label: 'Mathématiques' },
    { value: 'Physique', label: 'Physique' },
    { value: 'Chimie', label: 'Chimie' },
    { value: 'SI', label: 'SI' },
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Anglais', label: 'Anglais' },
    { value: 'Français', label: 'Français' }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Plus populaires', icon: TrendingUp },
    { value: 'recent', label: 'Plus récents', icon: Clock },
    { value: 'rating', label: 'Mieux notés', icon: Star },
    { value: 'downloads', label: 'Plus téléchargés', icon: Download }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const getSortIcon = (sortValue) => {
    const option = sortOptions.find(o => o.value === sortValue);
    return option?.icon || TrendingUp;
  };

  const SortIcon = getSortIcon(filters.sort);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <span className="text-4xl">🌐</span>
          Bibliothèque Publique
        </h2>
        <p className="text-indigo-300 text-lg">
          Découvrez et importez des decks créés par la communauté
        </p>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/30 p-6 shadow-2xl">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un deck par titre ou description..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold"
                >
                  Rechercher
                </button>
              )}
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Catégorie
              </label>
              <select
                value={filters.category}
                onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                <SortIcon className="w-4 h-4" />
                Trier par
              </label>
              <select
                value={filters.sort}
                onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.category !== 'all' || searchQuery) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.category !== 'all' && (
                <div className="px-3 py-1 bg-indigo-600/20 text-indigo-300 rounded-full text-sm flex items-center gap-2">
                  <span>Catégorie: {filters.category}</span>
                  <button
                    onClick={() => onFilterChange({ ...filters, category: 'all' })}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    ×
                  </button>
                </div>
              )}
              {searchQuery && (
                <div className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm flex items-center gap-2">
                  <span>Recherche: "{searchQuery}"</span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      onSearch('');
                    }}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decks Grid */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400 text-lg">Chargement des decks...</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-slate-400 text-xl mb-2">Aucun deck trouvé</p>
            <p className="text-slate-500">
              {searchQuery 
                ? 'Essayez une autre recherche ou modifiez vos filtres'
                : 'Soyez le premier à publier un deck !'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6 text-slate-400 text-sm">
              {decks.length} deck{decks.length > 1 ? 's' : ''} trouvé{decks.length > 1 ? 's' : ''}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onImport={onImport}
                  onView={onView}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PublicLibrary;
