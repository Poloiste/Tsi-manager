import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, Trash2, Crown, Shield, User } from 'lucide-react';

/**
 * ManageChannelMembersModal - Modal for managing private channel members
 * @param {object} channel - The channel to manage
 * @param {string} userId - Current user's ID
 * @param {function} onClose - Callback to close the modal
 * @param {boolean} isDark - Dark mode flag
 */
export function ManageChannelMembersModal({ channel, userId, onClose, isDark = true }) {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Load channel members
  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/channels/${channel.id}/memberships?user_id=${userId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load members');
      }
      
      const data = await response.json();
      setMembers(data);
      
      // Find current user's role
      const userMembership = data.find(m => m.user_id === userId);
      setCurrentUserRole(userMembership?.role || null);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Impossible de charger les membres');
      setIsLoading(false);
    }
  }, [API_URL, channel.id, userId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Search users with debouncing
  const searchUsers = useCallback(async () => {
    try {
      setIsSearching(true);
      const response = await fetch(
        `${API_URL}/api/users/search?query=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      
      // Filter out users who are already members
      const memberIds = members.map(m => m.user_id);
      const filteredResults = data.filter(user => !memberIds.includes(user.id));
      
      setSearchResults(filteredResults);
      setIsSearching(false);
    } catch (err) {
      console.error('Error searching users:', err);
      setIsSearching(false);
    }
  }, [API_URL, searchQuery, members]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const addMember = async (targetUserId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/channels/${channel.id}/memberships`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            target_user_id: targetUserId,
            role: 'member'
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add member');
      }

      // Reload members
      await loadMembers();
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Impossible d\'ajouter ce membre');
    }
  };

  const removeMember = async (targetUserId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/channels/${channel.id}/memberships/${targetUserId}?user_id=${userId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      // Reload members
      await loadMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Impossible de retirer ce membre');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'moderator':
        return 'Modérateur';
      default:
        return 'Membre';
    }
  };

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'moderator';
  const canRemoveMember = (memberRole) => {
    if (currentUserRole === 'owner') return memberRole !== 'owner';
    if (currentUserRole === 'moderator') return memberRole === 'member';
    return false;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`
          w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col
          ${isDark ? 'bg-slate-800' : 'bg-white'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${isDark ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <div>
            <h2 className={`
              text-2xl font-bold
              ${isDark ? 'text-white' : 'text-gray-900'}
            `}>
              Gérer les membres
            </h2>
            <p className={`
              text-sm mt-1
              ${isDark ? 'text-slate-400' : 'text-gray-600'}
            `}>
              {channel.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-slate-700 text-slate-400' 
                : 'hover:bg-gray-100 text-gray-600'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search and Add Members */}
          {canManageMembers && (
            <div className="space-y-3">
              <h3 className={`
                font-semibold
                ${isDark ? 'text-white' : 'text-gray-900'}
              `}>
                Inviter un membre
              </h3>
              
              <div className="relative">
                <Search className={`
                  absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                  ${isDark ? 'text-slate-400' : 'text-gray-400'}
                `} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className={`
                    w-full pl-10 pr-4 py-2 rounded-lg border
                    ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                  `}
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className={`
                  rounded-lg border max-h-48 overflow-y-auto
                  ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}
                `}>
                  {isSearching ? (
                    <div className={`
                      p-4 text-center text-sm
                      ${isDark ? 'text-slate-400' : 'text-gray-600'}
                    `}>
                      Recherche...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-600">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={`
                            flex items-center justify-between p-3
                            ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-100'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                              ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}
                            `}>
                              {(user.full_name || user.email)?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className={`
                                font-medium text-sm
                                ${isDark ? 'text-white' : 'text-gray-900'}
                              `}>
                                {user.full_name || 'Sans nom'}
                              </div>
                              <div className={`
                                text-xs
                                ${isDark ? 'text-slate-400' : 'text-gray-600'}
                              `}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => addMember(user.id)}
                            className={`
                              p-2 rounded-lg transition-colors
                              ${isDark 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                              }
                            `}
                            title="Ajouter"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`
                      p-4 text-center text-sm
                      ${isDark ? 'text-slate-400' : 'text-gray-600'}
                    `}>
                      Aucun utilisateur trouvé
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Current Members */}
          <div className="space-y-3">
            <h3 className={`
              font-semibold
              ${isDark ? 'text-white' : 'text-gray-900'}
            `}>
              Membres ({members.length})
            </h3>

            {isLoading ? (
              <div className={`
                p-4 text-center text-sm
                ${isDark ? 'text-slate-400' : 'text-gray-600'}
              `}>
                Chargement...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-red-500">
                {error}
              </div>
            ) : members.length > 0 ? (
              <div className={`
                rounded-lg border divide-y
                ${isDark 
                  ? 'bg-slate-700 border-slate-600 divide-slate-600' 
                  : 'bg-gray-50 border-gray-200 divide-gray-200'
                }
              `}>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                        ${isDark ? 'bg-slate-600 text-white' : 'bg-gray-200 text-gray-700'}
                      `}>
                        {member.user_id.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className={`
                          text-sm font-medium
                          ${isDark ? 'text-white' : 'text-gray-900'}
                        `}>
                          {member.user_id === userId ? 'Vous' : member.user_id}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleIcon(member.role)}
                          <span className={`
                            text-xs
                            ${isDark ? 'text-slate-400' : 'text-gray-600'}
                          `}>
                            {getRoleLabel(member.role)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {canManageMembers && canRemoveMember(member.role) && member.user_id !== userId && (
                      <button
                        onClick={() => removeMember(member.user_id)}
                        className={`
                          p-2 rounded-lg transition-colors
                          ${isDark 
                            ? 'hover:bg-red-600/20 text-red-400' 
                            : 'hover:bg-red-100 text-red-600'
                          }
                        `}
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`
                p-4 text-center text-sm
                ${isDark ? 'text-slate-400' : 'text-gray-600'}
              `}>
                Aucun membre
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`
          flex justify-end p-6 border-t
          ${isDark ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <button
            onClick={onClose}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${isDark 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }
            `}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
