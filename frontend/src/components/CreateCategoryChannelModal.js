import React, { useState } from 'react';
import { X, Hash, Lock, Globe } from 'lucide-react';

/**
 * CreateCategoryChannelModal - Modal for creating categories or channels
 * @param {boolean} show - Whether to show the modal
 * @param {function} onClose - Callback to close the modal
 * @param {function} onCreate - Callback when creating (name, type, visibility, parentId)
 * @param {string} mode - 'category' or 'channel'
 * @param {string} parentCategoryId - Parent category ID (for channel mode)
 * @param {boolean} isDark - Dark mode flag
 */
export function CreateCategoryChannelModal({ 
  show, 
  onClose, 
  onCreate,
  mode = 'category',
  parentCategoryId = null,
  isDark = true 
}) {
  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState('text'); // 'text' or 'voice'
  const [visibility, setVisibility] = useState('public'); // 'public' or 'private'
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const isCategory = mode === 'category';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (name.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCreate({
        name: name.trim(),
        type: isCategory ? 'category' : channelType,
        visibility,
        parentId: parentCategoryId
      });
      
      // Reset form and close
      setName('');
      setChannelType('text');
      setVisibility('public');
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setChannelType('text');
      setVisibility('public');
      setError('');
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`
        w-full max-w-md rounded-2xl shadow-2xl
        ${isDark ? 'bg-slate-800' : 'bg-white'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${isDark ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <h2 className={`
            text-2xl font-bold
            ${isDark ? 'text-white' : 'text-gray-900'}
          `}>
            {isCategory ? 'Créer une catégorie' : 'Créer un canal'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-slate-700 text-slate-400' 
                : 'hover:bg-gray-200 text-gray-600'
              }
              ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label className={`
              block text-sm font-semibold mb-2
              ${isDark ? 'text-slate-300' : 'text-gray-700'}
            `}>
              Nom {isCategory ? 'de la catégorie' : 'du canal'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCategory ? 'Études générales' : 'général'}
              disabled={isCreating}
              className={`
                w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${isDark
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
                ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Channel Type (only for channels) */}
          {!isCategory && (
            <div>
              <label className={`
                block text-sm font-semibold mb-2
                ${isDark ? 'text-slate-300' : 'text-gray-700'}
              `}>
                Type de canal
              </label>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setChannelType('text')}
                  disabled={isCreating}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all font-semibold flex-1
                    ${channelType === 'text'
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                      : isDark
                        ? 'border-slate-600 hover:border-slate-500 text-slate-400'
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                    }
                    ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Hash className="w-5 h-5" />
                  Texte
                </button>
              </div>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className={`
              block text-sm font-semibold mb-2
              ${isDark ? 'text-slate-300' : 'text-gray-700'}
            `}>
              Visibilité
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                disabled={isCreating}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all font-semibold
                  ${visibility === 'public'
                    ? 'border-green-500 bg-green-600/20 text-green-300'
                    : isDark
                      ? 'border-slate-600 hover:border-slate-500 text-slate-400'
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }
                  ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Globe className="w-5 h-5" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                disabled={isCreating}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all font-semibold
                  ${visibility === 'private'
                    ? 'border-orange-500 bg-orange-600/20 text-orange-300'
                    : isDark
                      ? 'border-slate-600 hover:border-slate-500 text-slate-400'
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }
                  ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Lock className="w-5 h-5" />
                Privé
              </button>
            </div>
            <p className={`
              text-xs mt-2
              ${isDark ? 'text-slate-400' : 'text-gray-600'}
            `}>
              {visibility === 'public' 
                ? 'Accessible à tous les utilisateurs authentifiés'
                : 'Accessible uniquement aux membres invités'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`
              p-3 rounded-lg border
              ${isDark 
                ? 'bg-red-900/20 border-red-500/30 text-red-400' 
                : 'bg-red-100 border-red-300 text-red-700'
              }
            `}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className={`
                flex-1 px-4 py-3 rounded-lg font-semibold transition-all
                ${isDark
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
                ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className={`
                flex-1 px-4 py-3 rounded-lg font-semibold transition-all
                ${!name.trim() || isCreating
                  ? isDark
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
                }
              `}
            >
              {isCreating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
