import React, { useState } from 'react';
import { X, Users, Globe, Lock } from 'lucide-react';

/**
 * Composant CreateGroupModal - Formulaire de création de groupe
 * @param {Function} onClose - Callback pour fermer le modal
 * @param {Function} onCreate - Callback pour créer le groupe
 * @param {boolean} isDark - Mode sombre
 */
export function CreateGroupModal({ onClose, onCreate, isDark = true }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    maxMembers: 20
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom du groupe est requis');
      return;
    }

    if (formData.name.length > 100) {
      setError('Le nom du groupe est trop long (max 100 caractères)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du groupe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`
          w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden
          ${isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${isDark ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ➕ Créer un groupe
          </h2>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Erreur */}
          {error && (
            <div className={`
              p-4 rounded-lg border
              ${isDark 
                ? 'bg-red-900/20 border-red-500/50 text-red-300' 
                : 'bg-red-50 border-red-300 text-red-700'
              }
            `}>
              {error}
            </div>
          )}

          {/* Nom du groupe */}
          <div>
            <label className={`
              block text-sm font-semibold mb-2
              ${isDark ? 'text-slate-300' : 'text-gray-700'}
            `}>
              Nom du groupe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Groupe de révision TSI1"
              maxLength={100}
              className={`
                w-full px-4 py-3 rounded-lg border outline-none transition-colors
                ${isDark 
                  ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                }
              `}
              required
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {formData.name.length}/100 caractères
            </p>
          </div>

          {/* Description */}
          <div>
            <label className={`
              block text-sm font-semibold mb-2
              ${isDark ? 'text-slate-300' : 'text-gray-700'}
            `}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Groupe d'entraide pour réviser ensemble les cours de TSI1..."
              rows={3}
              maxLength={500}
              className={`
                w-full px-4 py-3 rounded-lg border outline-none transition-colors resize-none
                ${isDark 
                  ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                }
              `}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {formData.description.length}/500 caractères
            </p>
          </div>

          {/* Visibilité */}
          <div>
            <label className={`
              block text-sm font-semibold mb-3
              ${isDark ? 'text-slate-300' : 'text-gray-700'}
            `}>
              Visibilité
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: true })}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${formData.isPublic
                    ? isDark
                      ? 'border-green-500 bg-green-900/30'
                      : 'border-green-500 bg-green-50'
                    : isDark
                      ? 'border-slate-600 bg-slate-900/30 hover:border-slate-500'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Globe className={`w-5 h-5 ${formData.isPublic 
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : isDark ? 'text-slate-400' : 'text-gray-600'
                  }`} />
                  <span className={`font-semibold ${formData.isPublic
                    ? isDark ? 'text-green-300' : 'text-green-700'
                    : isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Public
                  </span>
                </div>
                <p className={`text-xs ${formData.isPublic
                  ? isDark ? 'text-green-400/80' : 'text-green-600/80'
                  : isDark ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  Visible par tous, rejoignable librement
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: false })}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${!formData.isPublic
                    ? isDark
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-purple-500 bg-purple-50'
                    : isDark
                      ? 'border-slate-600 bg-slate-900/30 hover:border-slate-500'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className={`w-5 h-5 ${!formData.isPublic 
                    ? isDark ? 'text-purple-400' : 'text-purple-600'
                    : isDark ? 'text-slate-400' : 'text-gray-600'
                  }`} />
                  <span className={`font-semibold ${!formData.isPublic
                    ? isDark ? 'text-purple-300' : 'text-purple-700'
                    : isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Privé
                  </span>
                </div>
                <p className={`text-xs ${!formData.isPublic
                  ? isDark ? 'text-purple-400/80' : 'text-purple-600/80'
                  : isDark ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  Sur invitation uniquement
                </p>
              </button>
            </div>
          </div>

          {/* Nombre max de membres */}
          <div>
            <label className={`
              block text-sm font-semibold mb-2
              ${isDark ? 'text-slate-300' : 'text-gray-700'}
            `}>
              <Users className="w-4 h-4 inline mr-1" />
              Nombre maximum de membres
            </label>
            <select
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
              className={`
                w-full px-4 py-3 rounded-lg border outline-none transition-colors
                ${isDark 
                  ? 'bg-slate-900/50 border-slate-600 text-white focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                }
              `}
            >
              <option value={5}>5 membres</option>
              <option value={10}>10 membres</option>
              <option value={20}>20 membres</option>
              <option value={50}>50 membres</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`
                flex-1 px-6 py-3 rounded-lg font-semibold transition-colors
                ${isDark 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className={`
                flex-1 px-6 py-3 rounded-lg font-semibold transition-all
                ${isSubmitting || !formData.name.trim()
                  ? isDark
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25'
                }
              `}
            >
              {isSubmitting ? 'Création...' : 'Créer le groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
