/**
 * Theme color definitions for dark and light modes
 * Each theme provides consistent color classes for backgrounds, text, borders, gradients, shadows, and rings
 * 
 * Light mode features:
 * - Subtle gradient backgrounds with blue/indigo tints
 * - High contrast text for accessibility (WCAG AA compliant)
 * - Soft shadows and borders for visual depth
 * - Cohesive color palette with indigo accents
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
    },
    shadow: {
      sm: 'shadow-sm shadow-slate-950/50',
      md: 'shadow-md shadow-slate-950/50',
      lg: 'shadow-lg shadow-slate-950/50',
    },
    ring: {
      default: 'ring-1 ring-slate-700/80',
      focus: 'focus:ring-2 focus:ring-indigo-500/50',
    }
  },
  light: {
    bg: {
      primary: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
      secondary: 'bg-white',
      tertiary: 'bg-slate-100/80',
      card: 'bg-white',
      hover: 'hover:bg-slate-50',
    },
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      muted: 'text-slate-500',
      accent: 'text-indigo-600',
    },
    border: {
      default: 'border-slate-200',
      subtle: 'border-slate-200/60',
    },
    gradient: {
      primary: 'from-indigo-500 to-purple-600',
      card: 'from-white via-slate-50/30 to-indigo-50/20',
    },
    shadow: {
      sm: 'shadow-sm shadow-slate-200/50',
      md: 'shadow-md shadow-slate-200/50',
      lg: 'shadow-lg shadow-slate-300/50',
    },
    ring: {
      default: 'ring-1 ring-slate-200/80',
      focus: 'focus:ring-2 focus:ring-indigo-500/50',
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
