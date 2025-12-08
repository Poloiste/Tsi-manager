import React, { useState } from 'react';
import { X, Upload, FileText, Tag } from 'lucide-react';

/**
 * Modal component for publishing a deck
 * 
 * @param {Object} course - The course to publish
 * @param {Array} flashcards - Flashcards in the course
 * @param {Function} onPublish - Callback when publish is confirmed
 * @param {Function} onClose - Callback to close modal
 */
export function PublishDeckModal({ course, flashcards, onPublish, onClose }) {
  const [formData, setFormData] = useState({
    title: `${course.subject} - ${course.chapter}`,
    description: course.content || '',
    category: course.subject,
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Mathématiques',
    'Physique',
    'Chimie',
    'SI',
    'Informatique',
    'Anglais',
    'Français'
  ];

  const handleAddTag = () => {
    if (newTag.trim() && formData.tags.length < 5) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !acceptTerms) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onPublish(course.id, formData);
      onClose();
    } catch (error) {
      console.error('Error publishing deck:', error);
      alert('Erreur lors de la publication: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-indigo-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Upload className="w-6 h-6 text-indigo-400" />
            Publier un deck
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Course Info */}
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-300 mb-2">
              <FileText className="w-5 h-5" />
              <span className="font-semibold">Cours sélectionné</span>
            </div>
            <p className="text-white font-bold">{course.subject} - {course.chapter}</p>
            <p className="text-sm text-slate-400 mt-1">
              {flashcards.length} carte{flashcards.length > 1 ? 's' : ''} sera{flashcards.length > 1 ? 'ont' : ''} incluse{flashcards.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              Titre du deck *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Ex: Analyse - Suites et séries"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              rows="4"
              placeholder="Décrivez le contenu de ce deck, son niveau, et ce qu'il couvre..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Une bonne description aide les autres utilisateurs à trouver votre deck
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              Catégorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags (max 5)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Ajouter un tag..."
                disabled={formData.tags.length >= 5}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags.length >= 5}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 bg-slate-700 text-white rounded-full text-sm flex items-center gap-2"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Les tags aident à catégoriser et trouver votre deck
            </p>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">
              Aperçu des cartes qui seront publiées ({flashcards.length})
            </h3>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 max-h-48 overflow-y-auto">
              {flashcards.slice(0, 3).map((card, idx) => (
                <div key={idx} className="mb-3 last:mb-0">
                  <div className="text-xs text-indigo-400 mb-1">Q: {card.question}</div>
                  <div className="text-xs text-slate-400">R: {card.answer}</div>
                  {idx < 2 && idx < flashcards.length - 1 && (
                    <div className="border-t border-slate-700 my-2"></div>
                  )}
                </div>
              ))}
              {flashcards.length > 3 && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  +{flashcards.length - 3} autres cartes...
                </p>
              )}
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-300">
                J'accepte de partager ce contenu avec la communauté. Je confirme que ce deck ne contient pas de contenu inapproprié ou protégé par des droits d'auteur.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!formData.title || !formData.category || !acceptTerms || isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Publication...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Publier
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublishDeckModal;
