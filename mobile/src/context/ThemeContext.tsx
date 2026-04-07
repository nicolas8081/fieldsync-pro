import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkThemeColors, lightThemeColors, ThemeColors } from '../theme';
import { fonts } from '../typography/fonts';
import { FIELD_SYNC_THEME_KEY as THEME_KEY } from '../utils/appLocalStorage';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  fonts: typeof fonts;
  isDark: boolean;
  toggleTheme: () => void;
  resetToDefaultTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const colors = mode === 'dark' ? darkThemeColors : lightThemeColors;

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') setMode(stored);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const resetToDefaultTheme = useCallback(() => {
    setMode('light');
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors,
        fonts,
        isDark: mode === 'dark',
        toggleTheme,
        resetToDefaultTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
