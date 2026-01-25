/**
 * Loggerise Brand Theme Constants
 * Based on the design specifications
 */

import { Platform } from 'react-native';

// Brand Colors
export const Brand = {
  primary: '#13452d',      // Koyu yeşil - ana renk, CTA butonları
  primaryLight: '#227d53', // Hover, success
  secondary: '#5fbd92',    // Secondary actions
  accent: '#b4f25a',       // Highlights, focus
};

// Status Colors
export const Status = {
  success: '#227d53',
  warning: '#f5a623',
  danger: '#d0021b',
  info: '#3b82f6',
};

// Neutral Colors
export const Neutral = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
};

// Light and Dark Theme Colors
export const Colors = {
  light: {
    // Brand
    primary: Brand.primary,
    primaryLight: Brand.primaryLight,
    secondary: Brand.secondary,
    accent: Brand.accent,

    // Backgrounds
    background: Neutral.background,
    surface: Neutral.surface,
    card: '#FFFFFF',

    // Text
    text: Neutral.textPrimary,
    textSecondary: Neutral.textSecondary,
    textMuted: Neutral.textMuted,

    // UI Elements
    border: Neutral.border,
    separator: '#E5E7EB',
    icon: '#6B7280',
    placeholder: '#9CA3AF',

    // Status
    success: Status.success,
    successLight: '#DCFCE7',
    warning: Status.warning,
    warningLight: '#FEF3C7',
    danger: Status.danger,
    dangerLight: '#FEE2E2',
    info: Status.info,
    infoLight: '#DBEAFE',

    // Navigation
    tint: Brand.primary,
    tabIconDefault: '#6B7280',
    tabIconSelected: Brand.primary,
  },
  dark: {
    // Brand
    primary: Brand.primaryLight,
    primaryLight: Brand.secondary,
    secondary: Brand.secondary,
    accent: Brand.accent,

    // Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',

    // Text
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // UI Elements
    border: '#334155',
    separator: '#334155',
    icon: '#94A3B8',
    placeholder: '#64748B',

    // Status
    success: '#22C55E',
    successLight: '#166534',
    warning: '#F59E0B',
    warningLight: '#92400E',
    danger: '#EF4444',
    dangerLight: '#991B1B',
    info: '#3B82F6',
    infoLight: '#1E40AF',

    // Navigation
    tint: Brand.secondary,
    tabIconDefault: '#64748B',
    tabIconSelected: Brand.secondary,
  },
};

// Typography
export const Typography = {
  // Headings
  headingXL: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  headingLG: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  headingMD: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  headingSM: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },

  // Body
  bodyLG: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMD: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySM: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  bodyXS: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
  },

  // Buttons
  buttonLG: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  buttonMD: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  buttonSM: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// Shadows - Minimal, modern approach
export const Shadows = {
  // Subtle shadow for cards
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  // Default card shadow
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Elevated elements (modals, dropdowns)
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
};

// Fonts
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    mono: 'monospace',
  },
});
