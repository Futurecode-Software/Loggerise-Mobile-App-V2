/**
 * Dashboard Theme Constants
 *
 * Corporate light theme with single accent color for dashboard screens.
 * Based on Loggerise brand guidelines.
 */

import { Brand, Status, Neutral } from './theme';

export const DashboardTheme = {
  // Background layers - clean white with subtle depth
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Border - very subtle
  border: '#EBEDF0',
  borderLight: '#F4F5F7',

  // Brand Green - single accent color (Loggerise brand)
  accent: Brand.primary,
  accentLight: Brand.primaryLight,
  accentMuted: 'rgba(19, 69, 45, 0.08)',
  accentGlow: 'rgba(19, 69, 45, 0.04)',

  // Text hierarchy
  textPrimary: Neutral.textPrimary,
  textSecondary: Neutral.textSecondary,
  textMuted: Neutral.textMuted,
  textAccent: Brand.primary,

  // Minimal status colors
  success: Status.success,
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',

  // Status backgrounds - very subtle
  successBg: 'rgba(34, 125, 83, 0.08)',
  warningBg: 'rgba(217, 119, 6, 0.08)',
  dangerBg: 'rgba(220, 38, 38, 0.08)',
  infoBg: 'rgba(37, 99, 235, 0.08)',
} as const;

export type DashboardThemeType = typeof DashboardTheme;
