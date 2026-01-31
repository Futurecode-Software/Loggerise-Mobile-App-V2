/**
 * Auth Sayfaları İçin Premium Stil Konstantları
 *
 * Modern, lüks ve profesyonel authentication deneyimi
 * Glassmorphism, gradients ve refined typography
 */

export const AuthColors = {
  // Primary palette - Deep forest greens
  primary: '#044134',
  primaryDark: '#022920',
  primaryLight: '#065847',
  primaryGlow: 'rgba(4, 65, 52, 0.4)',

  // Accent colors
  accent: '#10B981', // Emerald accent
  accentGlow: 'rgba(16, 185, 129, 0.3)',
  gold: '#D4AF37', // Premium gold accent
  goldGlow: 'rgba(212, 175, 55, 0.2)',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',

  // Text hierarchy
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',
  textPlaceholder: '#B0B0B0',
  textOnDark: 'rgba(255, 255, 255, 0.95)',
  textOnDarkMuted: 'rgba(255, 255, 255, 0.6)',

  // Glassmorphism backgrounds
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassLight: 'rgba(255, 255, 255, 0.95)',

  // Input states
  inputBackground: '#F8F9FA',
  inputBackgroundFocused: '#FFFFFF',
  inputBorder: '#E8E8E8',
  inputBorderFocused: '#044134',

  // Status colors
  error: '#DC2626',
  errorLight: 'rgba(220, 38, 38, 0.08)',
  errorBorder: 'rgba(220, 38, 38, 0.3)',
  success: '#059669',
  successLight: 'rgba(5, 150, 105, 0.08)',
  successBorder: 'rgba(5, 150, 105, 0.3)',
  warning: '#D97706',
  warningLight: 'rgba(217, 119, 6, 0.08)',

  // Dividers & borders
  divider: '#E5E5E5',
  dividerDark: 'rgba(255, 255, 255, 0.1)',

  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  shadowColorDark: 'rgba(0, 0, 0, 0.25)',

  // Icon colors
  iconDefault: '#6B7280',
  iconActive: '#044134',
} as const

export const AuthGradients = {
  // Premium background gradient
  primaryBackground: ['#022920', '#044134', '#065847'],

  // Button gradients
  buttonPrimary: ['#044134', '#065847'],
  buttonAccent: ['#059669', '#10B981'],

  // Card overlays
  cardOverlay: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.02)'],

  // Glow effects
  glowPrimary: ['rgba(4, 65, 52, 0)', 'rgba(4, 65, 52, 0.15)'],
} as const

export const AuthSpacing = {
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
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const

export const AuthBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  full: 9999,
} as const

export const AuthFontSizes = {
  '2xs': 10,
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  '2xl': 18,
  '3xl': 20,
  '4xl': 24,
  '5xl': 28,
  '6xl': 32,
  '7xl': 36,
} as const

export const AuthFontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

export const AuthSizes = {
  inputHeight: 56,
  inputHeightLarge: 60,
  buttonHeight: 56,
  buttonHeightSmall: 48,
  iconSize: 20,
  iconSizeLarge: 24,
  logoWidth: 160,
  logoHeight: 40,
  checkboxSize: 22,
  stepIndicatorSize: 32,
  socialButtonHeight: 52,
} as const

export const AuthShadows = {
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
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#044134',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const

export const AuthAnimations = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const
