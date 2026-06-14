/**
 * Wakhar WMS — Enhanced theme with agriculture-inspired design tokens.
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Core
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    background: '#F8FAF5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8F5E9',
    card: '#FFFFFF',

    // Primary — Forest Green
    primary: '#2E7D32',
    primaryDark: '#1B5E20',
    primaryLight: '#4CAF50',
    primarySurface: '#E8F5E9',
    onPrimary: '#FFFFFF',

    // Secondary — Earth Gold
    secondary: '#F57C00',
    secondaryDark: '#E65100',
    secondaryLight: '#FF9800',
    secondarySurface: '#FFF3E0',
    onSecondary: '#FFFFFF',

    // Semantic
    success: '#2E7D32',
    successSurface: '#E8F5E9',
    warning: '#F57F17',
    warningSurface: '#FFFDE7',
    error: '#C62828',
    errorSurface: '#FFEBEE',
    info: '#1565C0',
    infoSurface: '#E3F2FD',

    // Grade Colors
    gradeA: '#2E7D32',
    gradeASurface: '#E8F5E9',
    gradeB: '#F57F17',
    gradeBSurface: '#FFFDE7',
    gradeC: '#E65100',
    gradeCSurface: '#FFF3E0',
    rejected: '#C62828',
    rejectedSurface: '#FFEBEE',

    // Surface
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F0',
    border: '#E5E7EB',
    divider: '#F0F0F0',
    shadow: 'rgba(0,0,0,0.08)',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarActive: '#2E7D32',
    tabBarInactive: '#9CA3AF',
  },
  dark: {
    // Core
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    background: '#0F1A12',
    backgroundElement: '#1A2E1D',
    backgroundSelected: '#2E4230',
    card: '#1A2E1D',

    // Primary — Forest Green
    primary: '#66BB6A',
    primaryDark: '#43A047',
    primaryLight: '#81C784',
    primarySurface: '#1B3A1E',
    onPrimary: '#0F1A12',

    // Secondary — Earth Gold
    secondary: '#FFB74D',
    secondaryDark: '#FFA726',
    secondaryLight: '#FFCC80',
    secondarySurface: '#3E2A10',
    onSecondary: '#0F1A12',

    // Semantic
    success: '#66BB6A',
    successSurface: '#1B3A1E',
    warning: '#FFD54F',
    warningSurface: '#3E3510',
    error: '#EF5350',
    errorSurface: '#3A1515',
    info: '#42A5F5',
    infoSurface: '#15253A',

    // Grade Colors
    gradeA: '#66BB6A',
    gradeASurface: '#1B3A1E',
    gradeB: '#FFD54F',
    gradeBSurface: '#3E3510',
    gradeC: '#FFB74D',
    gradeCSurface: '#3E2A10',
    rejected: '#EF5350',
    rejectedSurface: '#3A1515',

    // Surface
    surface: '#1A2E1D',
    surfaceVariant: '#243828',
    border: '#2E4230',
    divider: '#243828',
    shadow: 'rgba(0,0,0,0.3)',

    // Tab bar
    tabBar: '#1A2E1D',
    tabBarActive: '#66BB6A',
    tabBarInactive: '#6B7280',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 48,
  '6xl': 64,

  // Legacy compat
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 34,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Helper to get colors based on current scheme.
 */
export function getColors(scheme: string | null | undefined) {
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
