import React, { useState } from 'react';
import { X, Key } from 'lucide-react';

/**
 * Composant JoinGroupModal - Modal pour rejoindre un groupe par code
 * @param {Function} onClose - Callback pour fermer le modal
 * @param {Function} onJoin - Callback pour rejoindre le groupe
 * @param {boolean} isDark - Mode sombre
 */
export function JoinGroupModal({ onClose, onJoin, isDark = true }) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Veuillez entrer un code d\'invitation');
      return;
    }

    if (cleanCode.length !== 6) {
      setError('Le code doit contenir exactement 6 caractères');
      return;
    }

    setIsSubmitting(true);
    try {
      await onJoin(cleanCode);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Code invalide ou expiré');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e) => {
    // Garder seulement les caractères alphanumériques valides (excluant 0, 1, I, O) et limiter à 6
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`
          w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden
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
            🔗 Rejoindre un groupe
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
          {/* Info */}
          <div className={`
            p-4 rounded-lg border
            ${isDark 
              ? 'bg-indigo-900/20 border-indigo-500/30 text-indigo-300' 
              : 'bg-indigo-50 border-indigo-300 text-indigo-700'
            }
          `}>
            <p className="text-sm">
              Entrez le code d'invitation à 6 caractères pour rejoindre un groupe privé.
            </p>
          </div>

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

          {/* Succès */}
          {success && (
            <div className={`
              p-4 rounded-lg border
              ${isDark 
                ? 'bg-green-900/20 border-green-500/50 text-green-300' 
                : 'bg-green-50 border-green-300 text-green-700'
              }
            `}>
              ✓ Groupe rejoint avec succès !
            </div>
          )}

          {/* Code d'invitation */}
          <div>
            <label className={`
              block text-sm font-semibold mb-2
              ${isDark ? 'text-slate-300' : 'text-gray-700'}
            `}>
              <Key className="w-4 h-4 inline mr-1" />
              Code d'invitation
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              maxLength={6}
              className={`
                w-full px-4 py-3 rounded-lg border outline-none transition-colors
                text-center text-2xl font-bold tracking-widest uppercase
                ${isDark 
                  ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                }
              `}
              required
              autoFocus
              disabled={isSubmitting || success}
            />
            <p className={`text-xs mt-2 text-center ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {code.length}/6 caractères
            </p>
          </div>

          {/* Exemple */}
          <div className={`
            p-3 rounded-lg
            ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}
          `}>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              💡 <strong>Astuce :</strong> Le code vous est fourni par l'administrateur du groupe.
              Il est valide pendant 7 jours après sa génération.
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`
                flex-1 px-6 py-3 rounded-lg font-semibold transition-colors
                ${isDark 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6 || success}
              className={`
                flex-1 px-6 py-3 rounded-lg font-semibold transition-all
                ${isSubmitting || code.length !== 6 || success
                  ? isDark
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25'
                }
              `}
            >
              {isSubmitting ? 'Vérification...' : success ? 'Rejoint !' : 'Rejoindre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
