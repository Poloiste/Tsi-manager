import React from 'react';
import { Trophy, Flame, Zap, Crown } from 'lucide-react';

/**
 * Composant GroupLeaderboard - Classement des membres du groupe
 * @param {Array} leaderboard - Données du classement
 * @param {boolean} isDark - Mode sombre
 * @param {string} currentUserId - ID de l'utilisateur actuel
 */
export function GroupLeaderboard({ leaderboard = [], isDark = true, currentUserId = null }) {
  // Emoji pour le top 3
  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  // Couleur de fond selon le rang
  const getRankBgColor = (rank, isCurrentUser) => {
    if (isCurrentUser) {
      return isDark 
        ? 'bg-indigo-900/40 border-indigo-500/50' 
        : 'bg-indigo-100 border-indigo-400';
    }

    if (rank === 1) {
      return isDark 
        ? 'bg-yellow-900/20 border-yellow-500/30' 
        : 'bg-yellow-50 border-yellow-300';
    }
    if (rank === 2) {
      return isDark 
        ? 'bg-slate-700/40 border-slate-500/30' 
        : 'bg-gray-100 border-gray-300';
    }
    if (rank === 3) {
      return isDark 
        ? 'bg-orange-900/20 border-orange-500/30' 
        : 'bg-orange-50 border-orange-300';
    }

    return isDark 
      ? 'bg-slate-800/50 border-slate-700' 
      : 'bg-white border-gray-200';
  };

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className={`
        text-center py-12
        ${isDark ? 'text-slate-400' : 'text-gray-600'}
      `}>
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Aucune statistique disponible pour le moment</p>
        <p className="text-sm mt-2">Les membres apparaîtront ici une fois qu'ils auront commencé à réviser</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((member, index) => {
        const rank = index + 1;
        const isCurrentUser = member.user_id === currentUserId;
        const isAdmin = member.role === 'admin';

        return (
          <div
            key={member.user_id}
            className={`
              relative p-4 rounded-xl border transition-all duration-300
              ${getRankBgColor(rank, isCurrentUser)}
              ${isCurrentUser ? 'ring-2 ring-indigo-500' : ''}
              hover:scale-[1.02]
            `}
          >
            {/* Indicateur utilisateur actuel */}
            {isCurrentUser && (
              <div className={`
                absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold
                ${isDark 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-indigo-500 text-white'
                }
              `}>
                Vous
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Rang */}
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                font-bold text-lg
                ${rank <= 3 
                  ? 'text-2xl' 
                  : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'
                }
              `}>
                {getRankEmoji(rank)}
              </div>

              {/* Avatar et info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Avatar */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-xl
                    ${isDark 
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    }
                  `}>
                    👤
                  </div>

                  {/* Nom (on pourrait récupérer le vrai nom depuis auth.users si besoin) */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`
                        font-semibold truncate
                        ${isDark ? 'text-white' : 'text-gray-900'}
                      `}>
                        Membre #{member.user_id.slice(0, 8)}
                      </span>
                      {isAdmin && (
                        <Crown className={`
                          w-4 h-4 flex-shrink-0
                          ${isDark ? 'text-yellow-400' : 'text-yellow-600'}
                        `} />
                      )}
                    </div>
                    {isCurrentUser && (
                      <p className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        C'est vous !
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                {/* XP */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <span className={`
                      font-bold text-lg
                      ${isDark ? 'text-white' : 'text-gray-900'}
                    `}>
                      {member.total_xp || 0}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    XP
                  </p>
                </div>

                {/* Streak */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    <span className={`
                      font-bold text-lg
                      ${isDark ? 'text-white' : 'text-gray-900'}
                    `}>
                      {member.current_streak || 0}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Jours
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de progression XP (relative au premier si pas premier) */}
            {rank > 1 && leaderboard[0] && (
              <div className="mt-3">
                <div className={`
                  h-1.5 rounded-full overflow-hidden
                  ${isDark ? 'bg-slate-700' : 'bg-gray-300'}
                `}>
                  <div 
                    className={`
                      h-full transition-all duration-500
                      ${rank === 2 
                        ? 'bg-gradient-to-r from-slate-400 to-slate-600'
                        : rank === 3
                          ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }
                    `}
                    style={{ 
                      width: `${Math.max(10, (member.total_xp / leaderboard[0].total_xp) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
