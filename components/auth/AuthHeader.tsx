/**
 * Premium Auth Header Component
 *
 * Glassmorphism efektleri ve zarif animasyonlarla
 * modern authentication deneyimi
 */

import React, { useEffect } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import {
  AuthColors,
  AuthSpacing,
  AuthSizes,
  AuthFontSizes,
  AuthAnimations,
} from '@/constants/auth-styles'

const LogoWhite = require('../../assets/images/logo-white.png')

type IconType = 'login' | 'register' | 'none'

interface AuthHeaderProps {
  title: string
  subtitle?: string
  iconType?: IconType
  showBackButton?: boolean
  onBackPress?: () => void
}

const getIconConfig = (iconType: IconType) => {
  switch (iconType) {
    case 'login':
      return {
        primary: 'key-outline',
        secondary: 'shield-checkmark-outline',
        tertiary: 'finger-print-outline',
      }
    case 'register':
      return {
        primary: 'person-add-outline',
        secondary: 'sparkles-outline',
        tertiary: 'rocket-outline',
      }
    default:
      return null
  }
}

export default function AuthHeader({
  title,
  subtitle,
  iconType = 'none',
  showBackButton = false,
  onBackPress,
}: AuthHeaderProps) {
  const iconConfig = getIconConfig(iconType)

  // Animated values
  const fadeIn = useSharedValue(0)
  const slideUp = useSharedValue(30)
  const floatAnim = useSharedValue(0)
  const pulseAnim = useSharedValue(1)
  const rotateAnim = useSharedValue(0)

  useEffect(() => {
    // Initial animations
    fadeIn.value = withTiming(1, {
      duration: AuthAnimations.timing.slow,
      easing: Easing.out(Easing.cubic),
    })
    slideUp.value = withTiming(0, {
      duration: AuthAnimations.timing.slow,
      easing: Easing.out(Easing.cubic),
    })

    // Floating animation for decorative icons
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )

    // Subtle pulse for glow effect
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )

    // Slow rotation for secondary icon
    rotateAnim.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    )
  }, [fadeIn, slideUp, floatAnim, pulseAnim, rotateAnim])

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }))

  const primaryIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnim.value, [0, 1], [0, -12]) },
      { rotate: `${interpolate(floatAnim.value, [0, 1], [-5, 5])}deg` },
    ],
    opacity: interpolate(floatAnim.value, [0, 0.5, 1], [0.15, 0.2, 0.15]),
  }))

  const secondaryIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnim.value, [0, 1], [0, 8]) },
      { rotate: `${rotateAnim.value}deg` },
    ],
    opacity: 0.08,
  }))

  const tertiaryIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(floatAnim.value, [0, 1], [0, 6]) },
      { scale: interpolate(pulseAnim.value, [1, 1.1], [1, 1.05]) },
    ],
    opacity: 0.1,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: interpolate(pulseAnim.value, [1, 1.1], [0.3, 0.5]),
  }))

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#022920', '#044134', '#054a3a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Elements */}
      {iconConfig && (
        <>
          {/* Ambient glow */}
          <Animated.View style={[styles.glowOrb, glowStyle]} />

          {/* Primary floating icon */}
          <Animated.View style={[styles.decorativePrimary, primaryIconStyle]}>
            <Ionicons
              name={iconConfig.primary as keyof typeof Ionicons.glyphMap}
              size={100}
              color={AuthColors.white}
            />
          </Animated.View>

          {/* Secondary rotating icon */}
          <Animated.View style={[styles.decorativeSecondary, secondaryIconStyle]}>
            <Ionicons
              name={iconConfig.secondary as keyof typeof Ionicons.glyphMap}
              size={60}
              color={AuthColors.white}
            />
          </Animated.View>

          {/* Tertiary pulsing icon */}
          <Animated.View style={[styles.decorativeTertiary, tertiaryIconStyle]}>
            <Ionicons
              name={iconConfig.tertiary as keyof typeof Ionicons.glyphMap}
              size={40}
              color={AuthColors.white}
            />
          </Animated.View>

          {/* Glass orbs for depth */}
          <View style={styles.glassOrb1} />
          <View style={styles.glassOrb2} />
        </>
      )}

      {/* Content */}
      <Animated.View style={[styles.content, contentAnimStyle]}>
        {/* Back Button */}
        {showBackButton && onBackPress && (
          <Animated.View style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={AuthColors.textOnDark}
              onPress={onBackPress}
            />
          </Animated.View>
        )}

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={LogoWhite}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Subtitle */}
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </Animated.View>

      {/* Bottom curve overlay for smooth transition */}
      <View style={styles.curveOverlay} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: AuthSpacing['4xl'],
    paddingHorizontal: AuthSpacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
    minHeight: 220,
  },
  content: {
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: -20,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: AuthSpacing.xl,
  },
  logo: {
    width: AuthSizes.logoWidth,
    height: AuthSizes.logoHeight,
    marginLeft: -12,
  },
  title: {
    fontSize: AuthFontSizes['5xl'],
    fontWeight: '700',
    color: AuthColors.textOnDark,
    marginBottom: AuthSpacing.sm,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: AuthFontSizes.lg,
    color: AuthColors.textOnDarkMuted,
    lineHeight: 22,
    maxWidth: '85%',
  },
  // Decorative elements
  glowOrb: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  decorativePrimary: {
    position: 'absolute',
    top: 30,
    right: 10,
  },
  decorativeSecondary: {
    position: 'absolute',
    top: 100,
    right: 80,
  },
  decorativeTertiary: {
    position: 'absolute',
    top: 60,
    right: 130,
  },
  glassOrb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassOrb2: {
    position: 'absolute',
    bottom: 20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: AuthColors.white,
    borderTopLeftRadius: AuthSpacing['3xl'],
    borderTopRightRadius: AuthSpacing['3xl'],
  },
})
