/**
 * Premium Quick Action Button
 *
 * Animated action button with icon, label, and optional badge
 * Features scale animation and subtle glow effect on press
 */

import React from 'react'
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations,
} from '@/constants/dashboard-theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  badge?: number
  disabled?: boolean
  delay?: number
}

export default function QuickActionButton({
  icon,
  label,
  onPress,
  badge,
  disabled = false,
  delay = 0,
}: QuickActionButtonProps) {
  const { width } = useWindowDimensions()
  const buttonWidth = (width - DashboardSpacing['2xl'] * 2 - DashboardSpacing.md) / 2

  const scale = useSharedValue(1)
  const pressed = useSharedValue(0)

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const iconContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      [DashboardColors.primaryGlow, DashboardColors.primary]
    ),
    transform: [{ scale: 1 + pressed.value * 0.1 }],
  }))

  const iconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      pressed.value,
      [0, 1],
      [DashboardColors.primary, DashboardColors.textOnPrimary]
    ),
  }))

  const handlePressIn = () => {
    if (disabled) return
    scale.value = withSpring(0.95, DashboardAnimations.springBouncy)
    pressed.value = withSpring(1, DashboardAnimations.spring)
  }

  const handlePressOut = () => {
    if (disabled) return
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
    pressed.value = withSpring(0, DashboardAnimations.spring)
  }

  const handlePress = () => {
    if (disabled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <AnimatedPressable
      style={[
        styles.button,
        { width: buttonWidth },
        cardAnimStyle,
        disabled && styles.disabled,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
    >
      {/* Icon Container */}
      <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
        <Animated.Text style={iconStyle}>
          <Ionicons name={icon} size={24} />
        </Animated.Text>
      </Animated.View>

      {/* Label */}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}

      {/* Arrow indicator */}
      <View style={styles.arrowContainer}>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={DashboardColors.textMuted}
        />
      </View>

      {/* Corner accent */}
      <View style={styles.cornerAccent} />
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: DashboardColors.card,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    minHeight: 110,
    borderWidth: 1,
    borderColor: DashboardColors.borderSubtle,
    position: 'relative',
    overflow: 'hidden',
    ...DashboardShadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.md,
  },
  label: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    lineHeight: 20,
  },
  badge: {
    position: 'absolute',
    top: DashboardSpacing.md,
    right: DashboardSpacing.md,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: DashboardColors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
    color: DashboardColors.badgeText,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: DashboardSpacing.md,
    right: DashboardSpacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DashboardColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: 40,
    opacity: 0.3,
  },
})
