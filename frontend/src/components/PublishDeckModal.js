import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * Modal pour publier un deck de flashcards
 */
export function PublishDeckModal({ course, flashcards, onPublish, onClose, themeClasses }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Mathématiques',
    'Physique',
    'Chimie',
    'SI',
    'Informatique',
    'Anglais',
    'Français'
  ];

  useEffect(() => {
    // Pré-remplir avec le nom du cours
    if (course) {
      setTitle(`${course.subject} - ${course.chapter}`);
      setCategory(course.subject || '');
    }
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !category || !acceptTerms) {
      setError('Veuillez remplir tous les champs obligatoires et accepter les conditions.');
      return;
    }

    if (flashcards.length === 0) {
      setError('Ce cours ne contient aucune flashcard à publier.');
      return;
    }

    setIsPublishing(true);
    setError('');

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const metadata = {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagsArray
      };

      await onPublish(course.id, metadata);
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la publication');
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${themeClasses?.bg?.primary || 'bg-slate-900'} ${themeClasses?.border?.subtle || 'border-slate-700'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 border-b backdrop-blur-xl bg-slate-900/95 border-slate-700 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-3xl font-bold text-white mb-2">📤 Publier un deck</h2>
          <p className="text-slate-400">
            Partagez vos flashcards avec la communauté
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Titre du deck <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${themeClasses?.bg?.secondary || 'bg-slate-800'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
              placeholder="Ex: Maths - Analyse complexe"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border resize-none ${themeClasses?.bg?.secondary || 'bg-slate-800'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
              placeholder="Décrivez le contenu de vos flashcards..."
              rows="4"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Catégorie <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${themeClasses?.bg?.secondary || 'bg-slate-800'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
              required
            >
              <option value="">Sélectionnez une catégorie</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${themeClasses?.bg?.secondary || 'bg-slate-800'} ${themeClasses?.border?.subtle || 'border-slate-700'} text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
              placeholder="Ex: analyse, complexes, équations"
            />
            <p className="text-xs text-slate-500 mt-1">
              Ajoutez des mots-clés pour faciliter la recherche
            </p>
          </div>

          {/* Aperçu des cartes */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Cartes qui seront publiées ({flashcards.length})
            </h3>
            <div className={`max-h-48 overflow-y-auto rounded-lg border p-4 space-y-2 ${themeClasses?.bg?.secondary || 'bg-slate-800/50'} ${themeClasses?.border?.subtle || 'border-slate-700'}`}>
              {flashcards.slice(0, 5).map((card, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-indigo-300 font-medium">{idx + 1}.</span>{' '}
                  <span className="text-slate-300">{card.question}</span>
                </div>
              ))}
              {flashcards.length > 5 && (
                <div className="text-sm text-slate-500 italic">
                  ... et {flashcards.length - 5} autres cartes
                </div>
              )}
            </div>
          </div>

          {/* Conditions */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
            <label htmlFor="acceptTerms" className="text-sm text-slate-300">
              J'accepte de partager ce contenu avec la communauté et je confirme que 
              je dispose des droits nécessaires pour le publier.
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPublishing || !acceptTerms}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30"
            >
              {isPublishing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  🚀 Publier
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
