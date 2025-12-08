import React from 'react';

/**
 * Simple theme toggle button component
 * Switches between dark and light mode with animated icon
 */
export function ThemeToggle({ theme, onToggle }) {
  // For display purposes, treat 'system' as dark since we can't detect system preference in this component
  const isDark = theme === 'dark' || theme === 'system';
  
  return (
    <button 
      onClick={onToggle}
      className="p-2 rounded-lg transition-all duration-300 hover:bg-slate-700/30 dark:hover:bg-slate-700/30 light:hover:bg-gray-200/50"
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <span className="text-2xl transition-transform duration-300 inline-block hover:rotate-12">
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
