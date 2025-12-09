import React from 'react';
import { Users, Lock, Globe } from 'lucide-react';

/**
 * Composant GroupCard - Carte d'affichage d'un groupe
 * @param {Object} group - Données du groupe
 * @param {Function} onAction - Callback pour l'action principale (Rejoindre/Voir)
 * @param {string} actionLabel - Label du bouton d'action
 * @param {boolean} isDark - Mode sombre
 */
export function GroupCard({ group, onAction, actionLabel = 'Voir', isDark = true }) {
  const memberCount = group.memberCount || 0;
  const maxMembers = group.max_members || 20;
  const isFull = memberCount >= maxMembers;
  
  // Calculer le pourcentage de remplissage
  const fillPercentage = Math.min(100, (memberCount / maxMembers) * 100);

  return (
    <div 
      className={`
        group relative p-5 rounded-xl border transition-all duration-300 cursor-pointer
        ${isDark 
          ? 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/70' 
          : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-lg'
        }
      `}
      onClick={onAction}
    >
      {/* Badge Public/Privé */}
      <div className="flex items-center justify-between mb-3">
        <div className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
          ${group.is_public 
            ? isDark 
              ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
              : 'bg-green-100 text-green-700 border border-green-300'
            : isDark
              ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30'
              : 'bg-purple-100 text-purple-700 border border-purple-300'
          }
        `}>
          {group.is_public ? (
            <>
              <Globe className="w-3 h-3" />
              Public
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              Privé
            </>
          )}
        </div>

        {/* Badge Complet */}
        {isFull && (
          <span className={`
            px-2.5 py-1 rounded-full text-xs font-semibold
            ${isDark 
              ? 'bg-red-900/30 text-red-300 border border-red-500/30' 
              : 'bg-red-100 text-red-700 border border-red-300'
            }
          `}>
            Complet
          </span>
        )}

        {/* Badge Admin (si c'est mon groupe et je suis admin) */}
        {group.myRole === 'admin' && (
          <span className={`
            px-2.5 py-1 rounded-full text-xs font-semibold
            ${isDark 
              ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30' 
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            }
          `}>
            👑 Admin
          </span>
        )}
      </div>

      {/* Nom du groupe */}
      <h3 className={`
        text-lg font-bold mb-2 line-clamp-1
        ${isDark ? 'text-white' : 'text-gray-900'}
      `}>
        {group.name}
      </h3>

      {/* Description */}
      {group.description && (
        <p className={`
          text-sm mb-4 line-clamp-2
          ${isDark ? 'text-slate-400' : 'text-gray-600'}
        `}>
          {group.description}
        </p>
      )}

      {/* Statistiques du groupe */}
      <div className="space-y-3">
        {/* Membres */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {memberCount} / {maxMembers} membres
            </span>
          </div>
        </div>

        {/* Barre de progression des membres */}
        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
          <div 
            className={`
              h-full transition-all duration-500
              ${isFull 
                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }
            `}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      {/* Bouton d'action */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
        disabled={isFull && actionLabel === 'Rejoindre'}
        className={`
          w-full mt-4 px-4 py-2.5 rounded-lg font-semibold text-sm
          transition-all duration-300
          ${isFull && actionLabel === 'Rejoindre'
            ? isDark
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : isDark
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md'
          }
        `}
      >
        {isFull && actionLabel === 'Rejoindre' ? 'Groupe complet' : actionLabel}
      </button>

      {/* Date de création (si disponible) */}
      {group.created_at && (
        <p className={`
          text-xs mt-3 text-center
          ${isDark ? 'text-slate-500' : 'text-gray-400'}
        `}>
          Créé le {new Date(group.created_at).toLocaleDateString('fr-FR')}
        </p>
      )}

      {/* Date d'adhésion (si disponible) */}
      {group.joinedAt && (
        <p className={`
          text-xs mt-2 text-center
          ${isDark ? 'text-slate-500' : 'text-gray-400'}
        `}>
          Rejoint le {new Date(group.joinedAt).toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  );
}
