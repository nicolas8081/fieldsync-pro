/**
 * Theme colors: same shape for light (Claude) and dark (FieldSync prototype).
 */
export type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  text: string;
  textSecondary: string;
  muted: string;
  green: string;
  greenLight: string;
  red: string;
  redLight: string;
  yellow: string;
  yellowLight: string;
  orange: string;
  panel: string;
  deep: string;
  soft: string;
  navy: string;
};

/** Light theme — Claude AI style (warm ivory, clay) */
export const lightThemeColors: ThemeColors = {
  background: '#F5F0E8',
  surface: '#FAF8F5',
  card: '#FFFFFF',
  border: '#E8E2DA',
  borderStrong: '#DDD6CC',
  accent: '#C4673A',
  accentLight: 'rgba(196, 103, 58, 0.12)',
  accentBorder: 'rgba(196, 103, 58, 0.25)',
  text: '#1A1612',
  textSecondary: '#5C5248',
  muted: '#6B5B4F',
  green: '#2D7D5E',
  greenLight: 'rgba(45, 125, 94, 0.12)',
  red: '#B54A3A',
  redLight: 'rgba(181, 74, 58, 0.12)',
  yellow: '#B8860B',
  yellowLight: 'rgba(184, 134, 11, 0.12)',
  orange: '#C4673A',
  panel: '#F5F0E8',
  deep: '#EDE8E0',
  soft: '#F0EBE3',
  navy: '#1A1612',
};

/** Dark theme — FieldSync prototype (navy, cyan) */
export const darkThemeColors: ThemeColors = {
  background: '#111827',
  surface: '#0d1528',
  card: '#1a2235',
  border: '#1e2d47',
  borderStrong: '#2a3a56',
  accent: '#00d4ff',
  accentLight: 'rgba(0, 212, 255, 0.12)',
  accentBorder: 'rgba(0, 212, 255, 0.25)',
  text: '#e8eef8',
  textSecondary: '#6b7fa3',
  muted: '#6b7fa3',
  green: '#00e676',
  greenLight: 'rgba(0, 230, 118, 0.15)',
  red: '#ff4757',
  redLight: 'rgba(255, 71, 87, 0.15)',
  yellow: '#ffd60a',
  yellowLight: 'rgba(255, 214, 10, 0.15)',
  orange: '#ff6b35',
  panel: '#111827',
  deep: '#0d1528',
  soft: '#2a3a56',
  navy: '#0a0f1e',
};

/** Base spacing; scaled ~1.3x for larger touch targets and readability */
export const spacing = {
  xs: 5,
  sm: 10,
  md: 16,
  lg: 21,
  xl: 31,
  xxl: 42,
} as const;

/** Default export for components that don't use context yet (e.g. ThemeProvider itself) */
export const colors = lightThemeColors;
