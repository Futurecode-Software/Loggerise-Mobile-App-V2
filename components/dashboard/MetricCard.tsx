/**
 * Premium Metric Card Component
 *
 * Displays key metrics with icon, value, label, and optional growth indicator
 * Features subtle inset shadow effect and spring animations
 * Shadow is always visible - only content animates
 */

import React from 'react'
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations,
} from '@/constants/dashboard-theme'
import { formatNumber } from '@/utils/currency'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor?: string
  iconBgColor?: string
  label: string
  value: string | number
  growth?: number
  delay?: number
  onPress?: () => void
}

export default function MetricCard({
  icon,
  iconColor = DashboardColors.primary,
  iconBgColor = DashboardColors.primaryGlow,
  label,
  value,
  growth,
  delay = 0,
  onPress,
}: MetricCardProps) {
  const { width } = useWindowDimensions()
  const cardWidth = (width - DashboardSpacing['2xl'] * 2 - DashboardSpacing.md) / 2

  const scale = useSharedValue(1)
  const pressed = useSharedValue(0)
  const contentOpacity = useSharedValue(0)
  const contentTranslateY = useSharedValue(8)

  // İçerik animasyonu - kart hemen görünür, içerik fade in yapar
  React.useEffect(() => {
    contentOpacity.value = withDelay(
      delay,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) })
    )
    contentTranslateY.value = withDelay(
      delay,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
    )
  }, [delay, contentOpacity, contentTranslateY])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolate(
      pressed.value,
      [0, 1],
      [0, 1]
    ) === 1 ? DashboardColors.cardPressed : DashboardColors.card,
  }))

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.97, DashboardAnimations.springBouncy)
    pressed.value = withSpring(1, DashboardAnimations.spring)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
    pressed.value = withSpring(0, DashboardAnimations.spring)
  }

  const formattedValue = typeof value === 'number'
    ? formatNumber(value, 0)
    : value

  const hasGrowth = growth !== undefined && growth !== 0
  const isPositiveGrowth = growth && growth > 0

  return (
    <AnimatedPressable
      style={[styles.card, { width: cardWidth }, cardAnimatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {/* İçerik - animasyonlu */}
      <Animated.View style={contentAnimatedStyle}>
        {/* Top Row: Icon + Growth */}
        <View style={styles.topRow}>
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          {hasGrowth && (
            <View style={[
              styles.growthBadge,
              { backgroundColor: isPositiveGrowth ? DashboardColors.successBg : DashboardColors.dangerBg }
            ]}>
              <Ionicons
                name={isPositiveGrowth ? 'trending-up' : 'trending-down'}
                size={12}
                color={isPositiveGrowth ? DashboardColors.success : DashboardColors.danger}
              />
              <Text style={[
                styles.growthText,
                { color: isPositiveGrowth ? DashboardColors.success : DashboardColors.danger }
              ]}>
                {Math.abs(growth)}%
              </Text>
            </View>
          )}
        </View>

        {/* Value */}
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formattedValue}
        </Text>

        {/* Label */}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>

      {/* Subtle corner accent - sabit */}
      <View style={styles.cornerAccent} />
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DashboardColors.card,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderSubtle,
    position: 'relative',
    overflow: 'hidden',
    ...DashboardShadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DashboardSpacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full,
  },
  growthText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
  },
  value: {
    fontSize: DashboardFontSizes['3xl'],
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    fontWeight: '500',
  },
  cornerAccent: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 60,
    height: 60,
    backgroundColor: DashboardColors.primaryGlow,
    borderTopLeftRadius: 60,
    opacity: 0.5,
  },
})
