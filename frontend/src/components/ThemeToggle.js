import React from 'react';

/**
 * Simple theme toggle button component
 * Switches between dark and light mode with animated icon
 */
export function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark' || theme === 'system';
  
  return (
    <button 
      onClick={onToggle}
      className="p-2 rounded-lg transition-all duration-300 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-gray-200"
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <span className="text-2xl transition-transform duration-300 inline-block hover:rotate-12">
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
