import React, { useState } from 'react';
import { Copy, Check, X, AlertCircle, Users, Crown, LogOut, Trash2, RefreshCw } from 'lucide-react';
import { GroupLeaderboard } from './GroupLeaderboard';

/**
 * GroupDetail Component
 * 
 * Displays group details and provides group management functionality
 * Features:
 * - Enhanced copy button for private group invitation codes
 * - Visual feedback for copy actions
 * - Accessibility features
 * - Responsive design
 * - Browser compatibility fallbacks
 */
export function GroupDetail({ 
  group,
  onClose,
  onLeave,
  onDelete,
  onGenerateCode,
  onShareDecks,
  leaderboard = [],
  availableDecks = [],
  isDark = true,
  currentUserId = null,
  isCreator = false
}) {
  const [copySuccess, setCopySuccess] = useState(null); // Track which button ('code' or 'link')
  const [copyError, setCopyError] = useState(null);
  
  /**
   * Enhanced copy to clipboard with accessibility and fallback support
   * @param {string} text - Text to copy
   * @param {string} type - Type of copy action ('code' or 'link')
   * @param {string} label - Label for user feedback
   */
  const handleCopyToClipboard = async (text, type, label = 'code') => {
    try {
      // Modern Clipboard API (preferred)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          textArea.remove();
          throw err;
        }
      }
      
      // Show success feedback
      setCopySuccess(type);
      setCopyError(null);
      
      // Reset feedback after 2 seconds
      setTimeout(() => {
        setCopySuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyError(`Impossible de copier le ${label}`);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setCopyError(null);
      }, 3000);
    }
  };
  
  /**
   * Generate full invitation link for sharing
   */
  const getInvitationLink = () => {
    if (!group?.invite_code) return '';
    return `${window.location.origin}/join-group/${group.invite_code}`;
  };
  
  /**
   * Handle generating a new invite code
   */
  const handleGenerateNewCode = async () => {
    if (onGenerateCode && group?.id) {
      await onGenerateCode(group.id);
    }
  };

  if (!group) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div 
        className={`
          relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl
          ${isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-300'
          }
        `}
      >
        {/* Header */}
        <div className={`
          sticky top-0 z-10 flex items-center justify-between p-6 border-b
          ${isDark 
            ? 'bg-slate-800/95 backdrop-blur border-slate-700' 
            : 'bg-white/95 backdrop-blur border-gray-200'
          }
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-lg
              ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}
            `}>
              <Users className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {group.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${group.is_public 
                    ? isDark 
                      ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
                      : 'bg-green-100 text-green-700 border border-green-300'
                    : isDark
                      ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30'
                      : 'bg-purple-100 text-purple-700 border border-purple-300'
                  }
                `}>
                  {group.is_public ? '🌍 Public' : '🔒 Privé'}
                </span>
                {isCreator && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1
                    ${isDark 
                      ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30' 
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    }
                  `}>
                    <Crown className="w-3 h-3" />
                    Créateur
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }
            `}
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Group Description */}
          {group.description && (
            <div className={`
              p-4 rounded-lg
              ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}
            `}>
              <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                {group.description}
              </p>
            </div>
          )}

          {/* Private Group Invitation Section - ENHANCED COPY BUTTON */}
          {!group.is_public && isCreator && (
            <div className={`
              p-6 rounded-xl border
              ${isDark 
                ? 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30' 
                : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
              }
            `}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`
                  p-2 rounded-lg
                  ${isDark ? 'bg-purple-900/40' : 'bg-purple-200'}
                `}>
                  <Copy className={`w-5 h-5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Invitation au groupe privé
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Partagez ce code ou ce lien pour inviter des membres
                  </p>
                </div>
              </div>

              {/* Invite Code Display with Copy Button */}
              {group.invite_code ? (
                <div className="space-y-3">
                  {/* Code d'invitation */}
                  <div>
                    <label className={`
                      block text-sm font-semibold mb-2
                      ${isDark ? 'text-purple-300' : 'text-purple-700'}
                    `}>
                      Code d'invitation
                    </label>
                    <div className="flex items-center gap-2">
                      <div className={`
                        flex-1 px-4 py-3 rounded-lg font-mono text-lg font-bold
                        ${isDark 
                          ? 'bg-slate-800 text-purple-300 border border-slate-700' 
                          : 'bg-white text-purple-700 border border-purple-200'
                        }
                      `}>
                        {group.invite_code}
                      </div>
                      <button
                        onClick={() => handleCopyToClipboard(group.invite_code, 'code', 'code')}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all
                          ${copySuccess === 'code' 
                            ? isDark
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                            : isDark
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          }
                          focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${isDark ? 'focus:ring-indigo-500' : 'focus:ring-indigo-400'}
                        `}
                        aria-label={copySuccess === 'code' ? "Code copié" : "Copier le code d'invitation"}
                        title={copySuccess === 'code' ? "Code copié !" : "Copier le code"}
                      >
                        {copySuccess === 'code' ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Lien d'invitation complet */}
                  <div>
                    <label className={`
                      block text-sm font-semibold mb-2
                      ${isDark ? 'text-purple-300' : 'text-purple-700'}
                    `}>
                      Lien d'invitation (recommandé)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className={`
                        flex-1 px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto
                        ${isDark 
                          ? 'bg-slate-800 text-indigo-300 border border-slate-700' 
                          : 'bg-white text-indigo-700 border border-indigo-200'
                        }
                      `}>
                        {getInvitationLink()}
                      </div>
                      <button
                        onClick={() => handleCopyToClipboard(getInvitationLink(), 'link', 'lien')}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all whitespace-nowrap
                          ${copySuccess === 'link' 
                            ? isDark
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                            : isDark
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                          }
                          focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${isDark ? 'focus:ring-purple-500' : 'focus:ring-purple-400'}
                        `}
                        aria-label={copySuccess === 'link' ? "Lien copié" : "Copier le lien d'invitation"}
                        title={copySuccess === 'link' ? "Lien copié !" : "Copier le lien"}
                      >
                        {copySuccess === 'link' ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            <span>Copier le lien</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Copy Error Message */}
                  {copyError && (
                    <div className={`
                      flex items-center gap-2 p-3 rounded-lg
                      ${isDark 
                        ? 'bg-red-900/30 border border-red-500/30 text-red-300' 
                        : 'bg-red-50 border border-red-200 text-red-700'
                      }
                    `}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{copyError}</span>
                    </div>
                  )}

                  {/* Regenerate Code Button */}
                  <button
                    onClick={handleGenerateNewCode}
                    className={`
                      w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                      ${isDark 
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${isDark ? 'focus:ring-slate-500' : 'focus:ring-gray-400'}
                    `}
                    aria-label="Générer un nouveau code"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Générer un nouveau code</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateNewCode}
                  className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all
                    ${isDark 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${isDark ? 'focus:ring-indigo-500' : 'focus:ring-indigo-400'}
                  `}
                  aria-label="Générer le premier code d'invitation"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Générer un code d'invitation</span>
                </button>
              )}
            </div>
          )}

          {/* Group Stats */}
          <div className={`
            grid grid-cols-2 gap-4 p-4 rounded-lg
            ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}
          `}>
            <div>
              <div className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Membres
              </div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {group.memberCount || 0}
              </div>
            </div>
            <div>
              <div className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Créé le
              </div>
              <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {group.created_at ? new Date(group.created_at).toLocaleDateString('fr-FR') : 'N/A'}
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard && leaderboard.length > 0 && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🏆 Classement
              </h3>
              <GroupLeaderboard 
                leaderboard={leaderboard}
                isDark={isDark}
                currentUserId={currentUserId}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            {!isCreator && onLeave && (
              <button
                onClick={() => onLeave(group.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all
                  ${isDark 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }
                `}
              >
                <LogOut className="w-4 h-4" />
                Quitter le groupe
              </button>
            )}
            {isCreator && onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
                    onDelete(group.id);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer le groupe
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
