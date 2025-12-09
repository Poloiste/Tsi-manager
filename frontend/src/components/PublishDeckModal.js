import React, { useState } from 'react';
import { X, Tag, Eye } from 'lucide-react';

/**
 * Modal de publication d'un deck
 * @param {Array} courses - Liste des cours disponibles
 * @param {Array} flashcards - Liste des flashcards pour aperçu
 * @param {Function} onPublish - Callback pour publier
 * @param {Function} onClose - Callback pour fermer
 */
export function PublishDeckModal({ courses, flashcards, onPublish, onClose }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Catégories disponibles
  const categories = [
    'Mathématiques',
    'Physique',
    'Chimie',
    'SI',
    'Informatique',
    'Anglais',
    'Français',
    'Autre'
  ];

  // Flashcards du cours sélectionné pour l'aperçu
  const courseFlashcards = selectedCourseId 
    ? flashcards.filter(fc => fc.courseId === selectedCourseId).slice(0, 5)
    : [];

  // Nombre de cartes
  const cardCount = selectedCourseId 
    ? flashcards.filter(fc => fc.courseId === selectedCourseId).length
    : 0;

  // Ajouter un tag
  const addTag = () => {
    if (newTag.trim() && tags.length < 5 && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Retirer un tag
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Gérer la touche Enter dans le champ de tag
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Valider et publier
  const handlePublish = () => {
    if (!selectedCourseId || !title.trim() || !category || !acceptTerms) {
      return;
    }

    onPublish?.({
      courseId: selectedCourseId,
      metadata: {
        title: title.trim(),
        description: description.trim(),
        category,
        tags
      }
    });
  };

  // Auto-remplir le titre avec le cours sélectionné
  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    const course = courses.find(c => c.id === courseId);
    if (course && !title) {
      setTitle(`${course.subject} - ${course.chapter}`);
      setCategory(course.subject === 'Maths' ? 'Mathématiques' : course.subject);
    }
  };

  const isValid = selectedCourseId && title.trim() && category && acceptTerms && cardCount > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-indigo-500/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">📤 Publier un deck</h2>
            <p className="text-indigo-100 text-sm">Partagez vos flashcards avec la communauté</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Sélection du cours */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              📚 Cours à publier <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Sélectionner un cours...</option>
              {courses.map(course => {
                const count = flashcards.filter(fc => fc.courseId === course.id).length;
                return (
                  <option key={course.id} value={course.id}>
                    {course.subject} - {course.chapter} ({count} cartes)
                  </option>
                );
              })}
            </select>
            {selectedCourseId && cardCount === 0 && (
              <p className="text-red-400 text-xs mt-1">
                ⚠️ Ce cours ne contient aucune flashcard
              </p>
            )}
            {selectedCourseId && cardCount > 0 && (
              <p className="text-green-400 text-xs mt-1">
                ✓ {cardCount} carte{cardCount > 1 ? 's' : ''} à publier
              </p>
            )}
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              📝 Titre du deck <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Équations différentielles - L1"
              maxLength={100}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">{title.length}/100 caractères</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              📄 Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement le contenu de ce deck..."
              maxLength={500}
              rows="3"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{description.length}/500 caractères</p>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              🏷️ Catégorie <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Sélectionner une catégorie...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-indigo-300 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags (max 5)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Ajouter un tag..."
                maxLength={20}
                disabled={tags.length >= 5}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim() || tags.length >= 5}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-900/30 text-indigo-300 rounded-full border border-indigo-500/30 text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Aperçu des cartes */}
          {selectedCourseId && courseFlashcards.length > 0 && (
            <div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 mb-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Masquer' : 'Voir'} l'aperçu des cartes ({courseFlashcards.length}/{cardCount})
              </button>
              {showPreview && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {courseFlashcards.map((card, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm"
                    >
                      <div className="mb-1">
                        <span className="text-xs text-indigo-400 font-semibold">Q:</span>
                        <span className="text-white ml-2">{card.question}</span>
                      </div>
                      <div>
                        <span className="text-xs text-purple-400 font-semibold">R:</span>
                        <span className="text-slate-300 ml-2">{card.answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conditions d'acceptation */}
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-indigo-600 border-slate-700 rounded focus:ring-indigo-500"
              />
              <div className="text-sm text-yellow-200">
                <p className="font-semibold mb-1">✓ J'accepte les conditions de partage</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-yellow-300/80">
                  <li>Ce deck sera accessible à tous les utilisateurs</li>
                  <li>Le contenu doit être de bonne qualité et sans erreurs majeures</li>
                  <li>Je m'engage à ne pas publier de contenu offensant ou inapproprié</li>
                  <li>Je comprends que d'autres utilisateurs pourront le télécharger et l'utiliser</li>
                </ul>
              </div>
            </label>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={handlePublish}
              disabled={!isValid}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📤 Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
