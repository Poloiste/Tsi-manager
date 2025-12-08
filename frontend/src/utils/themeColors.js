/**
 * Theme color definitions for dark and light modes
 * Each theme provides consistent color classes for backgrounds, text, borders, and gradients
 */

export const themes = {
  dark: {
    bg: {
      primary: 'bg-slate-900',
      secondary: 'bg-slate-800',
      tertiary: 'bg-slate-800/50',
      card: 'bg-slate-800/50',
      hover: 'hover:bg-slate-700/50',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      muted: 'text-slate-400',
      accent: 'text-indigo-400',
    },
    border: {
      default: 'border-slate-700',
      subtle: 'border-slate-700/50',
    },
    gradient: {
      primary: 'from-indigo-500 to-purple-600',
      card: 'from-slate-800/80 to-slate-900/80',
    }
  },
  light: {
    bg: {
      primary: 'bg-gray-50',
      secondary: 'bg-white',
      tertiary: 'bg-gray-100',
      card: 'bg-white',
      hover: 'hover:bg-gray-100',
    },
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      muted: 'text-gray-500',
      accent: 'text-indigo-600',
    },
    border: {
      default: 'border-gray-200',
      subtle: 'border-gray-200/50',
    },
    gradient: {
      primary: 'from-indigo-500 to-purple-600',
      card: 'from-white to-gray-50',
    }
  }
};

/**
 * Get theme color classes based on current theme
 * @param {string} theme - 'dark' or 'light'
 * @returns {object} Theme color classes
 */
export function getThemeClasses(theme) {
  return themes[theme] || themes.dark;
}
