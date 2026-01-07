import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Hash, Volume2, Plus, Lock, Users } from 'lucide-react';

/**
 * CategoryChannelSidebar - Discord-style sidebar with collapsible categories and groups
 * @param {Array} categories - List of categories with their channels
 * @param {Array} orphanChannels - Channels without categories
 * @param {Array} groups - List of study groups
 * @param {string} activeChannelId - Currently active channel ID
 * @param {string} activeGroupId - Currently active group ID
 * @param {function} onChannelSelect - Callback when a channel is selected
 * @param {function} onGroupSelect - Callback when a group is selected
 * @param {function} onCreateChannel - Callback to create a new channel
 * @param {function} onCreateCategory - Callback to create a new category
 * @param {function} onCreateGroup - Callback to create a new group
 * @param {boolean} isAdmin - Whether the current user is an admin
 * @param {boolean} isDark - Dark mode flag
 */
export function CategoryChannelSidebar({ 
  categories = [], 
  orphanChannels = [],
  groups = [],
  activeChannelId, 
  activeGroupId,
  onChannelSelect, 
  onGroupSelect,
  onCreateChannel,
  onCreateCategory,
  onCreateGroup,
  isAdmin = false,
  isDark = true 
}) {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState(
    new Set(categories.map(cat => cat.id))
  );
  
  // Track if groups section is expanded (default: true)
  const [groupsExpanded, setGroupsExpanded] = useState(true);

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };
  
  const toggleGroups = () => {
    setGroupsExpanded(prev => !prev);
  };

  const renderChannel = (channel) => {
    const isActive = activeChannelId === channel.id;
    const isPrivate = channel.visibility === 'private';
    const isVoice = channel.channel_type === 'voice';
    
    return (
      <button
        key={channel.id}
        onClick={() => onChannelSelect(channel)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left group
          ${isActive
            ? isDark
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-500 text-white'
            : isDark
              ? 'hover:bg-slate-700 text-slate-300'
              : 'hover:bg-gray-200 text-gray-700'
          }
        `}
      >
        {isVoice ? (
          <Volume2 className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Hash className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="truncate font-medium">{channel.name}</span>
        {isPrivate && (
          <Lock className="w-3 h-3 flex-shrink-0 ml-auto opacity-60" />
        )}
      </button>
    );
  };
  
  const renderGroup = (group) => {
    const isActive = activeGroupId === group.id;
    const isPrivate = !group.is_public;
    
    return (
      <button
        key={group.id}
        onClick={() => onGroupSelect(group)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left group
          ${isActive
            ? isDark
              ? 'bg-purple-600 text-white'
              : 'bg-purple-500 text-white'
            : isDark
              ? 'hover:bg-slate-700 text-slate-300'
              : 'hover:bg-gray-200 text-gray-700'
          }
        `}
      >
        <Users className="w-4 h-4 flex-shrink-0" />
        <span className="truncate font-medium">{group.name}</span>
        {isPrivate && (
          <Lock className="w-3 h-3 flex-shrink-0 ml-auto opacity-60" />
        )}
        {group.memberCount !== undefined && (
          <span className={`text-xs ml-auto ${isActive ? 'text-white' : 'text-slate-400'}`}>
            {group.memberCount}
          </span>
        )}
      </button>
    );
  };

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
          Discussions
        </h3>
        {isAdmin && (
          <button
            onClick={onCreateCategory}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-gray-200 text-gray-700'
              }
            `}
            title="Créer une catégorie"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Categories and Channels */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const channels = category.children || [];
          
          return (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <div className="flex items-center gap-1 mb-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`
                    flex items-center gap-1 flex-1 px-2 py-1 rounded transition-colors text-xs font-semibold uppercase tracking-wider
                    ${isDark 
                      ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50' 
                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span className="truncate">{category.name}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onCreateChannel(category.id)}
                    className={`
                      p-1 rounded transition-colors
                      ${isDark 
                        ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200'
                      }
                    `}
                    title="Créer un canal"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Channels */}
              {isExpanded && (
                <div className="ml-2 space-y-1">
                  {channels.length > 0 ? (
                    channels.map(renderChannel)
                  ) : (
                    <div className={`
                      px-3 py-2 text-xs italic
                      ${isDark ? 'text-slate-500' : 'text-gray-500'}
                    `}>
                      Aucun canal
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Orphan Channels (channels without a category) */}
        {orphanChannels.length > 0 && (
          <div className={`
            mt-4 pt-4 border-t
            ${isDark ? 'border-slate-700' : 'border-gray-300'}
          `}>
            <div className={`
              px-2 py-1 text-xs font-semibold uppercase tracking-wider mb-1
              ${isDark ? 'text-slate-400' : 'text-gray-600'}
            `}>
              Autres canaux
            </div>
            <div className="space-y-1">
              {orphanChannels.map(renderChannel)}
            </div>
          </div>
        )}

        {/* Groups Section */}
        {groups.length > 0 && (
          <div className={`
            mt-4 pt-4 border-t
            ${isDark ? 'border-slate-700' : 'border-gray-300'}
          `}>
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={toggleGroups}
                className={`
                  flex items-center gap-1 flex-1 px-2 py-1 rounded transition-colors text-xs font-semibold uppercase tracking-wider
                  ${isDark 
                    ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50' 
                    : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {groupsExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span className="truncate">Groupes d'étude</span>
                <span className={`ml-auto text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {groups.length}
                </span>
              </button>
              {onCreateGroup && (
                <button
                  onClick={onCreateGroup}
                  className={`
                    p-1 rounded transition-colors
                    ${isDark 
                      ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-200'
                    }
                  `}
                  title="Créer un groupe"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
            {groupsExpanded && (
              <div className="ml-2 space-y-1">
                {groups.map(renderGroup)}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {categories.length === 0 && orphanChannels.length === 0 && groups.length === 0 && (
          <div className={`
            text-center py-8 px-4
            ${isDark ? 'text-slate-400' : 'text-gray-600'}
          `}>
            <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune discussion</p>
            {isAdmin && (
              <p className="text-xs mt-1">Cliquez sur + pour créer une catégorie</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
