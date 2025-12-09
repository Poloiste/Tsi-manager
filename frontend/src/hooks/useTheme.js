import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState('dark');
  
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setThemeState(saved);
      applyTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setThemeState('light');
      applyTheme('light');
    }
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return { theme, setTheme, toggleTheme, isDark };
}
