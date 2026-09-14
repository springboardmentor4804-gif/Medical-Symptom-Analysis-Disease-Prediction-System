'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, useSyncExternalStore } from 'react';

const ThemeContext = createContext(null);
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export const ThemeProvider = ({ children }) => {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('medassist-theme-mode') || localStorage.getItem('vitals-theme-mode');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.toggle('dark', themeMode === 'dark');
    root.style.colorScheme = themeMode;
    root.dataset.themeMode = themeMode;
    localStorage.setItem('medassist-theme-mode', themeMode);
  }, [mounted, themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const resolvedTheme = themeMode;

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
