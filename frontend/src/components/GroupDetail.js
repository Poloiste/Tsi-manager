import React, { useState } from 'react';
import { X, Users, Trophy, BookOpen, Copy, Check, LogOut, Trash2, RefreshCw, Share2 } from 'lucide-react';
import { GroupLeaderboard } from './GroupLeaderboard';

/**
 * Composant GroupDetail - Page/Modal de détail d'un groupe
 * @param {Object} group - Données du groupe
 * @param {Function} onClose - Callback pour fermer
 * @param {Function} onLeave - Callback pour quitter le groupe
 * @param {Function} onDelete - Callback pour supprimer le groupe
 * @param {Function} onGenerateCode - Callback pour générer un nouveau code
 * @param {Function} onShareDecks - Callback pour partager des decks
 * @param {Array} leaderboard - Classement du groupe
 * @param {Array} availableDecks - Decks disponibles pour partage
 * @param {boolean} isDark - Mode sombre
 * @param {string} currentUserId - ID de l'utilisateur actuel
 * @param {boolean} isAdmin - L'utilisateur est-il admin
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
  isAdmin = false
}) {
  const [activeSection, setActiveSection] = useState('members');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareDecks, setShowShareDecks] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState([]);

  const copyInviteCode = () => {
    if (group.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareDecks = async () => {
    if (selectedDecks.length > 0) {
      await onShareDecks(group.id, selectedDecks);
      setSelectedDecks([]);
      setShowShareDecks(false);
    }
  };

  // Sections disponibles
  const sections = [
    { id: 'members', label: '👥 Membres', icon: Users },
    { id: 'leaderboard', label: '🏆 Classement', icon: Trophy },
    { id: 'decks', label: '📚 Decks', icon: BookOpen }
  ];

  if (!group) return null;

  const isMember = group.members?.some(m => m.user_id === currentUserId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`
          w-full max-w-4xl rounded-2xl border shadow-2xl my-8
          ${isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`
          relative p-6 border-b
          ${isDark ? 'border-slate-700' : 'border-gray-200'}
        `}>
          <button
            onClick={onClose}
            className={`
              absolute top-4 right-4 p-2 rounded-lg transition-colors
              ${isDark 
                ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }
            `}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="pr-12">
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {group.name}
            </h2>
            {group.description && (
              <p className={`text-base ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {group.description}
              </p>
            )}

            {/* Code d'invitation (si membre) */}
            {isMember && group.invite_code && (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <div className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border
                  ${isDark 
                    ? 'bg-slate-900/50 border-slate-600' 
                    : 'bg-gray-50 border-gray-300'
                  }
                `}>
                  <span className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Code :
                  </span>
                  <code className={`
                    text-xl font-bold tracking-wider
                    ${isDark ? 'text-indigo-400' : 'text-indigo-600'}
                  `}>
                    {group.invite_code}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    className={`
                      p-1.5 rounded transition-colors
                      ${isDark 
                        ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                        : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                      }
                    `}
                    title="Copier le code"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => onGenerateCode(group.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-semibold
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regénérer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className={`
          flex border-b overflow-x-auto
          ${isDark ? 'border-slate-700' : 'border-gray-200'}
        `}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center gap-2 px-6 py-4 font-semibold text-sm whitespace-nowrap transition-colors
                ${activeSection === section.id
                  ? isDark
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-indigo-600 border-b-2 border-indigo-500'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-300'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Section Membres */}
          {activeSection === 'members' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Membres ({group.members?.length || 0}/{group.max_members})
                </h3>
              </div>

              {group.members && group.members.length > 0 ? (
                <div className="grid gap-3">
                  {group.members.map(member => (
                    <div
                      key={member.user_id}
                      className={`
                        p-4 rounded-lg border flex items-center gap-3
                        ${isDark 
                          ? 'bg-slate-900/50 border-slate-700' 
                          : 'bg-gray-50 border-gray-200'
                        }
                      `}
                    >
                      {/* Avatar */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl
                        ${isDark 
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                          : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                        }
                      `}>
                        👤
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Membre #{member.user_id.slice(0, 8)}
                          </span>
                          {member.role === 'admin' && (
                            <span className={`
                              px-2 py-0.5 rounded-full text-xs font-bold
                              ${isDark 
                                ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' 
                                : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                              }
                            `}>
                              👑 Admin
                            </span>
                          )}
                          {member.user_id === currentUserId && (
                            <span className={`
                              px-2 py-0.5 rounded-full text-xs font-bold
                              ${isDark 
                                ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30' 
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                              }
                            `}>
                              Vous
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                          Rejoint le {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Aucun membre pour le moment
                </p>
              )}
            </div>
          )}

          {/* Section Leaderboard */}
          {activeSection === 'leaderboard' && (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Classement du groupe
              </h3>
              <GroupLeaderboard 
                leaderboard={leaderboard} 
                isDark={isDark}
                currentUserId={currentUserId}
              />
            </div>
          )}

          {/* Section Decks */}
          {activeSection === 'decks' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Decks partagés ({group.sharedDecks?.length || 0})
                </h3>
                {isMember && (
                  <button
                    onClick={() => setShowShareDecks(!showShareDecks)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                      ${isDark 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                      }
                    `}
                  >
                    <Share2 className="w-4 h-4" />
                    Partager un deck
                  </button>
                )}
              </div>

              {/* Formulaire de partage de deck */}
              {showShareDecks && (
                <div className={`
                  mb-4 p-4 rounded-lg border
                  ${isDark 
                    ? 'bg-slate-900/50 border-slate-700' 
                    : 'bg-gray-50 border-gray-200'
                  }
                `}>
                  <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Sélectionnez les decks à partager
                  </h4>
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {availableDecks.map(deck => (
                      <label
                        key={deck.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                          ${isDark 
                            ? 'hover:bg-slate-800 border border-slate-700' 
                            : 'hover:bg-gray-100 border border-gray-200'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDecks.includes(deck.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDecks([...selectedDecks, deck.id]);
                            } else {
                              setSelectedDecks(selectedDecks.filter(id => id !== deck.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {deck.subject}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            {deck.chapter}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowShareDecks(false)}
                      className={`
                        flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors
                        ${isDark 
                          ? 'bg-slate-700 text-white hover:bg-slate-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }
                      `}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleShareDecks}
                      disabled={selectedDecks.length === 0}
                      className={`
                        flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                        ${selectedDecks.length === 0
                          ? isDark
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
                        }
                      `}
                    >
                      Partager ({selectedDecks.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des decks partagés */}
              {group.sharedDecks && group.sharedDecks.length > 0 ? (
                <div className="grid gap-3">
                  {group.sharedDecks.map(shared => (
                    <div
                      key={shared.id}
                      className={`
                        p-4 rounded-lg border
                        ${isDark 
                          ? 'bg-slate-900/50 border-slate-700' 
                          : 'bg-gray-50 border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {shared.shared_courses?.subject}
                          </h4>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            {shared.shared_courses?.chapter}
                          </p>
                          <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            Partagé le {new Date(shared.shared_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className={`
                          px-2 py-1 rounded text-xs font-semibold
                          ${isDark 
                            ? 'bg-indigo-900/30 text-indigo-400' 
                            : 'bg-indigo-100 text-indigo-700'
                          }
                        `}>
                          Difficulté {shared.shared_courses?.difficulty || 3}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Aucun deck partagé pour le moment
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        {isMember && (
          <div className={`
            p-6 border-t flex gap-3
            ${isDark ? 'border-slate-700' : 'border-gray-200'}
          `}>
            <button
              onClick={() => onLeave(group.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors
                ${isDark 
                  ? 'bg-orange-900/30 text-orange-300 border border-orange-500/30 hover:bg-orange-900/50' 
                  : 'bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200'
                }
              `}
            >
              <LogOut className="w-4 h-4" />
              Quitter le groupe
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors
                  ${isDark 
                    ? 'bg-red-900/30 text-red-300 border border-red-500/30 hover:bg-red-900/50' 
                    : 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200'
                  }
                `}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer le groupe
              </button>
            )}
          </div>
        )}

        {/* Confirmation de suppression */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
            <div className={`
              max-w-md p-6 rounded-xl border
              ${isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-gray-200'
              }
            `}>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Confirmer la suppression
              </h3>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`
                    flex-1 px-4 py-2 rounded-lg font-semibold transition-colors
                    ${isDark 
                      ? 'bg-slate-700 text-white hover:bg-slate-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onDelete(group.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
