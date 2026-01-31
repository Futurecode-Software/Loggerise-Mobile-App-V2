/**
 * Dashboard Theme Constants
 *
 * Refined Executive aesthetic - luxury fintech inspired
 * Deep forest green with crisp whites and subtle gold accents
 */

export const DashboardColors = {
  // Primary brand colors
  primary: '#044134',
  primaryLight: '#065f4a',
  primaryDark: '#022920',
  primaryGlow: 'rgba(4, 65, 52, 0.15)',

  // Accent colors
  accent: '#10B981', // Emerald for positive
  accentGold: '#D4AF37', // Subtle gold for premium feel
  accentMuted: 'rgba(16, 185, 129, 0.12)',

  // Surface colors
  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardPressed: '#F9FAFB',

  // Border colors
  border: '#E5E9EC',
  borderLight: '#F0F3F5',
  borderSubtle: 'rgba(0, 0, 0, 0.04)',

  // Text colors
  text: '#1A1D1F',
  textPrimary: '#1A1D1F',
  textSecondary: '#6F767E',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: 'rgba(255, 255, 255, 0.7)',

  // Status colors
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.1)',

  // Tab bar
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#F0F3F5',
  tabActive: '#044134',
  tabInactive: '#9CA3AF',

  // FAB
  fabBg: '#044134',
  fabGlow: 'rgba(4, 65, 52, 0.3)',
  fabRing: 'rgba(4, 65, 52, 0.1)',

  // Badge
  badgeBg: '#EF4444',
  badgeText: '#FFFFFF',
  badgeGlow: 'rgba(239, 68, 68, 0.3)',
} as const

export const DashboardSpacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const

export const DashboardBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const

export const DashboardFontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
} as const

export const DashboardShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: '#044134',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardInset: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0,
  },
} as const

export const DashboardAnimations = {
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  springBouncy: {
    damping: 12,
    stiffness: 400,
    mass: 0.6,
  },
  springGentle: {
    damping: 25,
    stiffness: 200,
    mass: 1,
  },
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
} as const
