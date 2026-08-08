import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'leetcode-theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem(STORAGE_KEY) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/** Monaco theme matches app theme (LeetCode-style). */
export function useMonacoTheme() {
  const { theme } = useTheme();
  return theme === 'light' ? 'vs-light' : 'vs-dark';
}

/** Example / solution panels. */
export function useContrastPanelClass() {
  const { theme } = useTheme();
  return theme === 'light'
    ? 'bg-[#f7f8fa] text-base-content border border-base-300'
    : 'bg-base-300 text-base-content border border-white/15';
}

/** Editor surface background. */
export function useEditorSurfaceClass() {
  const { theme } = useTheme();
  return theme === 'light' ? 'bg-[#fffffe]' : 'bg-[#1e1e1e]';
}

/** Theme-aware border classes for form fields and cards. */
export function useThemedBorder() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    field: isDark
      ? 'border-white/25 hover:border-white/45 focus-within:border-white/60'
      : 'border-base-300 hover:border-base-content/40 focus-within:border-primary',
    fieldError: 'border-error hover:border-error focus-within:border-error',
    card: isDark
      ? 'border-white/20 hover:border-white/30'
      : 'border-base-300',
    divider: isDark ? 'border-white/15' : 'border-base-300',
  };
}
