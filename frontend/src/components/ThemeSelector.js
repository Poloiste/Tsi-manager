import React from 'react';

/**
 * Advanced theme selector component
 * Allows selection between light, dark, and system themes
 */
export function ThemeSelector({ currentTheme, onSelect }) {
  const options = [
    { value: 'light', label: '☀️ Clair', icon: '☀️' },
    { value: 'dark', label: '🌙 Sombre', icon: '🌙' },
    { value: 'system', label: '💻 Système', icon: '💻' }
  ];

  return (
    <div className="flex gap-2">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm
            transition-all duration-200
            ${currentTheme === option.value
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-slate-800/50 dark:bg-slate-800/50 light:bg-gray-200 text-slate-300 dark:text-slate-300 light:text-gray-700 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-gray-300'
            }
          `}
          aria-label={option.label}
          aria-pressed={currentTheme === option.value}
        >
          <span className="text-lg">{option.icon}</span>
          <span>{option.label.split(' ')[1]}</span>
        </button>
      ))}
    </div>
  );
}
