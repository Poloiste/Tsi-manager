import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

/**
 * Modal de déblocage de badge avec animation de célébration
 * @param {Object} badge - Badge débloqué
 * @param {number} xpEarned - XP gagné avec ce badge
 * @param {Function} onClose - Callback pour fermer le modal
 */
export function BadgeUnlockModal({ badge, xpEarned, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [confetti, setConfetti] = useState([]);

  // Animation d'entrée
  useEffect(() => {
    setIsVisible(true);
    
    // Générer les confettis
    const confettiArray = [];
    for (let i = 0; i < 50; i++) {
      confettiArray.push({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
        size: Math.random() * 10 + 5,
        duration: Math.random() * 3 + 2
      });
    }
    setConfetti(confettiArray);
  }, []);

  // Couleurs de bordure selon la rareté
  const rarityColors = {
    common: 'border-slate-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500'
  };

  const rarityBgGradient = {
    common: 'from-slate-700 to-slate-800',
    rare: 'from-blue-700 to-blue-900',
    epic: 'from-purple-700 to-purple-900',
    legendary: 'from-yellow-600 to-orange-700'
  };

  const rarityGlow = {
    common: 'shadow-slate-500/50',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-500/50'
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      bg-black/70 backdrop-blur-sm
      transition-opacity duration-300
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      {/* Confetti Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map(piece => (
          <div
            key={piece.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              animationDuration: `${piece.duration}s`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Modal Content */}
      <div className={`
        relative
        bg-gradient-to-br from-slate-800 to-slate-900
        border-4
        ${rarityColors[badge.rarity]}
        rounded-3xl
        p-8
        max-w-md
        w-full
        mx-4
        shadow-2xl
        ${rarityGlow[badge.rarity]}
        transform
        transition-all
        duration-500
        ${isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-12'}
      `}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4 animate-bounce">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="font-bold text-white">BADGE DÉBLOQUÉ !</span>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Badge Display */}
        <div className="flex flex-col items-center mb-6">
          <div className={`
            w-40 h-40
            relative
            rounded-3xl
            border-4
            ${rarityColors[badge.rarity]}
            bg-gradient-to-br
            ${rarityBgGradient[badge.rarity]}
            flex
            items-center
            justify-center
            mb-4
            animate-pulse-scale
            shadow-2xl
            ${rarityGlow[badge.rarity]}
          `}>
            <div className="text-8xl animate-wiggle">
              {badge.icon}
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine-move"></div>
            </div>
          </div>

          {/* Badge Info */}
          <h3 className="text-3xl font-bold text-white mb-2 animate-fade-in">
            {badge.name}
          </h3>
          <p className="text-slate-300 text-center mb-4 animate-fade-in-delay">
            {badge.description}
          </p>

          {/* Rarity Badge */}
          <div className={`
            inline-block
            px-4 py-1
            rounded-full
            text-sm
            font-semibold
            uppercase
            ${badge.rarity === 'common' ? 'bg-slate-600 text-slate-200' : ''}
            ${badge.rarity === 'rare' ? 'bg-blue-600 text-blue-100' : ''}
            ${badge.rarity === 'epic' ? 'bg-purple-600 text-purple-100' : ''}
            ${badge.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : ''}
            animate-fade-in-delay-2
          `}>
            {badge.rarity}
          </div>
        </div>

        {/* XP Earned */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl animate-bounce-slow">
            <span className="text-2xl font-bold text-white">+{xpEarned} XP</span>
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
        >
          Super ! 🎉
        </button>
      </div>
    </div>
  );
}

export default BadgeUnlockModal;
