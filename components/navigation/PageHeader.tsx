/**
 * Page Header Bileşeni
 *
 * Tüm tab sayfaları için tutarlı yeşil gradient header
 * Dashboard ile görsel bütünlük sağlar
 */

import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardAnimations,
} from '@/constants/dashboard-theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface PageHeaderAction {
  icon?: keyof typeof Ionicons.glyphMap
  label?: string
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
  badge?: number
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: keyof typeof Ionicons.glyphMap
  showBackButton?: boolean
  onBackPress?: () => void
  leftAction?: PageHeaderAction
  rightAction?: PageHeaderAction
  rightActions?: PageHeaderAction[]
  variant?: 'default' | 'compact'
}

interface HeaderButtonProps {
  icon?: keyof typeof Ionicons.glyphMap
  label?: string
  onPress: () => void
  isBack?: boolean
  isLoading?: boolean
  disabled?: boolean
  badge?: number
}

function HeaderButton({ icon, label, onPress, isBack = false, isLoading = false, disabled = false, badge }: HeaderButtonProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    if (!disabled && !isLoading) {
      scale.value = withSpring(0.92, DashboardAnimations.springBouncy)
    }
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const handlePress = () => {
    if (!disabled && !isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress()
    }
  }

  return (
    <View>
      <AnimatedPressable
        style={[styles.headerButton, animStyle, (disabled || isLoading) && styles.headerButtonDisabled]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={DashboardColors.textOnPrimary} />
        ) : icon ? (
          <Ionicons
            name={isBack ? 'chevron-back' : icon}
            size={isBack ? 24 : 20}
            color={DashboardColors.textOnPrimary}
          />
        ) : label ? (
          <Text style={styles.headerButtonText}>{label}</Text>
        ) : null}
      </AnimatedPressable>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  )
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  showBackButton = false,
  onBackPress,
  leftAction,
  rightAction,
  rightActions,
  variant = 'default',
}: PageHeaderProps) {
  const insets = useSafeAreaInsets()
  const isCompact = variant === 'compact'

  const actions = rightActions || (rightAction ? [rightAction] : [])

  // Animasyonlu daireler
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  useEffect(() => {
    // Orb 1 - Yukarı aşağı hareket + pulse
    orb1TranslateY.value = withRepeat(
      withTiming(15, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
    orb1Scale.value = withRepeat(
      withTiming(1.1, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )

    // Orb 2 - Sağa sola hareket + pulse
    orb2TranslateX.value = withRepeat(
      withTiming(20, {
        duration: 5000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
    orb2Scale.value = withRepeat(
      withTiming(1.15, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
  }, [])

  const orb1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: orb1TranslateY.value },
      { scale: orb1Scale.value },
    ],
  }))

  const orb2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2TranslateX.value },
      { scale: orb2Scale.value },
    ],
  }))

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#022920', '#044134', '#065f4a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dekoratif ışık efektleri - Animasyonlu */}
      <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
      <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

      {/* Header içeriği */}
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 16 },
          isCompact && styles.contentCompact
        ]}
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.headerRow}
        >
          {/* Sol taraf: Geri butonu, leftAction veya boşluk */}
          <View style={styles.leftSection}>
            {showBackButton && onBackPress ? (
              <HeaderButton
                icon="chevron-back"
                onPress={onBackPress}
                isBack
              />
            ) : leftAction ? (
              <HeaderButton
                icon={leftAction.icon}
                label={leftAction.label}
                onPress={leftAction.onPress}
                isLoading={leftAction.isLoading}
                disabled={leftAction.disabled}
              />
            ) : (
              <View style={styles.spacer} />
            )}
          </View>

          {/* Orta: Başlık ve ikon */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              {icon && (
                <View style={styles.titleIconContainer}>
                  <Ionicons
                    name={icon}
                    size={isCompact ? 20 : 24}
                    color={DashboardColors.textOnPrimary}
                  />
                </View>
              )}
              <Text style={[styles.title, isCompact && styles.titleCompact]}>
                {title}
              </Text>
            </View>
            {subtitle && !isCompact && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>

          {/* Sağ taraf: Aksiyon butonları veya boşluk */}
          <View style={styles.rightSection}>
            {actions.length > 0 ? (
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <HeaderButton
                    key={index}
                    icon={action.icon}
                    label={action.label}
                    onPress={action.onPress}
                    isLoading={action.isLoading}
                    disabled={action.disabled}
                    badge={action.badge}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.spacer} />
            )}
          </View>
        </Animated.View>
      </View>

      {/* Alt eğri - içerik ile yumuşak geçiş */}
      <View style={styles.bottomCurve} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: DashboardSpacing.lg
  },
  contentCompact: {},
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  rightSection: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },
  spacer: {
    width: 44,
    height: 44,
  },
  titleSection: {
    flex: 1,
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  titleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.textOnPrimary,
    letterSpacing: -0.5,
  },
  titleCompact: {
    fontSize: DashboardFontSizes.xl,
  },
  subtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textOnPrimaryMuted,
    marginTop: DashboardSpacing.xs,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textOnPrimary,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: DashboardColors.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl'],
  },
})
