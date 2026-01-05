import React, { useState } from 'react';
import { Hash, Plus, Loader } from 'lucide-react';

/**
 * ChannelList component - Display and manage channels in a group
 * @param {Array} channels - List of channels
 * @param {string} activeChannelId - Currently active channel ID
 * @param {function} onChannelSelect - Callback when a channel is selected
 * @param {function} onCreateChannel - Callback to create a new channel
 * @param {boolean} isAdmin - Whether the current user is an admin
 * @param {boolean} isLoading - Loading state
 * @param {boolean} isDark - Dark mode flag
 */
export function ChannelList({ 
  channels = [], 
  activeChannelId, 
  onChannelSelect, 
  onCreateChannel,
  isAdmin = false,
  isLoading = false,
  isDark = true 
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    
    if (!newChannelName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateChannel(newChannelName);
      setNewChannelName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading && channels.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className={`w-6 h-6 animate-spin ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
      </div>
    );
  }

  return (
    <div className={`
      h-full flex flex-col
      ${isDark ? 'bg-slate-800' : 'bg-gray-100'}
    `}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-4 border-b
        ${isDark ? 'border-slate-700' : 'border-gray-300'}
      `}>
        <h3 className={`
          font-semibold text-lg
          ${isDark ? 'text-white' : 'text-gray-900'}
        `}>
          Canaux
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-gray-200 text-gray-700'
              }
            `}
            title="Créer un canal"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Create channel form */}
      {showCreateForm && (
        <div className={`
          p-4 border-b
          ${isDark ? 'border-slate-700 bg-slate-750' : 'border-gray-300 bg-gray-50'}
        `}>
          <form onSubmit={handleCreateChannel} className="space-y-2">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Nom du canal..."
              disabled={isCreating}
              className={`
                w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${isDark
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
                ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              maxLength={100}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newChannelName.trim() || isCreating}
                className={`
                  flex-1 px-4 py-2 rounded-lg font-semibold transition-all text-sm
                  ${!newChannelName.trim() || isCreating
                    ? isDark
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }
                `}
              >
                {isCreating ? 'Création...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewChannelName('');
                }}
                disabled={isCreating}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-all text-sm
                  ${isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                  ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <div className={`
            text-center py-8 px-4
            ${isDark ? 'text-slate-400' : 'text-gray-600'}
          `}>
            <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun canal</p>
            {isAdmin && (
              <p className="text-xs mt-1">Cliquez sur + pour créer un canal</p>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left
                  ${activeChannelId === channel.id
                    ? isDark
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-500 text-white'
                    : isDark
                      ? 'hover:bg-slate-700 text-slate-300'
                      : 'hover:bg-gray-200 text-gray-700'
                  }
                `}
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="truncate font-medium">{channel.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
