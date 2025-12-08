import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Composant Badge - Affiche un badge (débloqué ou verrouillé)
 * @param {Object} badge - Données du badge
 * @param {boolean} unlocked - Badge débloqué ou non
 * @param {string} size - Taille du badge ('sm', 'md', 'lg')
 * @param {Date} unlockedAt - Date de déblocage (si débloqué)
 */
export function Badge({ badge, unlocked = false, size = 'md', unlockedAt = null }) {
  // Tailles en pixels
  const sizes = {
    sm: { container: 'w-16 h-16', icon: 'text-3xl', name: 'text-xs' },
    md: { container: 'w-24 h-24', icon: 'text-5xl', name: 'text-sm' },
    lg: { container: 'w-32 h-32', icon: 'text-7xl', name: 'text-base' }
  };

  // Couleurs de bordure selon la rareté
  const rarityColors = {
    common: 'border-slate-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500'
  };

  // Couleurs de fond selon la rareté (débloqué)
  const rarityBgColors = {
    common: 'from-slate-700 to-slate-800',
    rare: 'from-blue-700 to-blue-900',
    epic: 'from-purple-700 to-purple-900',
    legendary: 'from-yellow-600 to-orange-700'
  };

  const sizeClass = sizes[size] || sizes.md;
  const borderColor = unlocked ? rarityColors[badge.rarity] : 'border-slate-700';
  const bgGradient = unlocked ? rarityBgColors[badge.rarity] : 'from-slate-800 to-slate-900';

  return (
    <div className="relative group">
      {/* Badge Container */}
      <div
        className={`
          ${sizeClass.container}
          relative
          rounded-2xl
          border-4
          ${borderColor}
          bg-gradient-to-br
          ${bgGradient}
          flex
          flex-col
          items-center
          justify-center
          transition-all
          duration-300
          ${unlocked ? 'hover:scale-110 hover:shadow-xl hover:shadow-' + badge.rarity + '-500/50' : 'opacity-40'}
          ${unlocked && size !== 'sm' ? 'animate-shine' : ''}
        `}
      >
        {/* Icon */}
        <div className={`${sizeClass.icon} ${unlocked ? '' : 'grayscale'}`}>
          {badge.icon}
        </div>

        {/* Lock overlay si verrouillé */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
        )}

        {/* Animation shine si débloqué */}
        {unlocked && size !== 'sm' && (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine-move"></div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="
        absolute
        bottom-full
        left-1/2
        transform
        -translate-x-1/2
        mb-2
        px-4
        py-2
        bg-slate-900
        border
        border-slate-700
        rounded-lg
        text-white
        text-sm
        whitespace-nowrap
        opacity-0
        group-hover:opacity-100
        pointer-events-none
        transition-opacity
        duration-200
        z-50
      ">
        <div className="font-bold text-center mb-1">{badge.name}</div>
        <div className="text-xs text-slate-400 text-center mb-1">{badge.description}</div>
        {unlocked ? (
          <>
            <div className="text-xs text-green-400 text-center">✓ Débloqué</div>
            {unlockedAt && (
              <div className="text-xs text-slate-500 text-center">
                {new Date(unlockedAt).toLocaleDateString('fr-FR')}
              </div>
            )}
            <div className="text-xs text-yellow-400 text-center mt-1">+{badge.xp_reward} XP</div>
          </>
        ) : (
          <div className="text-xs text-red-400 text-center">🔒 Verrouillé</div>
        )}
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
      </div>

      {/* Badge name below (optional for md and lg) */}
      {size !== 'sm' && (
        <div className={`${sizeClass.name} text-center mt-2 ${unlocked ? 'text-white' : 'text-slate-600'} font-semibold`}>
          {badge.name}
        </div>
      )}
    </div>
  );
}

export default Badge;
