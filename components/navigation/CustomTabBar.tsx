/**
 * Premium Custom Tab Bar
 *
 * Bottom tab navigation with floating action button for messages
 * Features haptic feedback, badges, and smooth animations
 */

import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations,
} from '@/constants/dashboard-theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface TabConfig {
  name: string
  icon: keyof typeof Ionicons.glyphMap
  iconFocused: keyof typeof Ionicons.glyphMap
  label: string
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    name: 'index',
    icon: 'grid-outline',
    iconFocused: 'grid',
    label: 'Ana Sayfa',
  },
  loads: {
    name: 'loads',
    icon: 'cube-outline',
    iconFocused: 'cube',
    label: 'Yükler',
  },
  contacts: {
    name: 'contacts',
    icon: 'people-outline',
    iconFocused: 'people',
    label: 'Cariler',
  },
  more: {
    name: 'more',
    icon: 'menu-outline',
    iconFocused: 'menu',
    label: 'Daha Fazla',
  },
}

interface CustomTabBarProps extends BottomTabBarProps {
  messageCount?: number
  onMessagePress?: () => void
}

function TabButton({
  route,
  isFocused,
  onPress,
  onLongPress,
}: {
  route: { name: string; key: string }
  isFocused: boolean
  onPress: () => void
  onLongPress: () => void
}) {
  const scale = useSharedValue(1)
  const iconScale = useSharedValue(isFocused ? 1.1 : 1)

  const config = TAB_CONFIG[route.name]

  useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1.1 : 1, DashboardAnimations.springBouncy)
  }, [isFocused, iconScale])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }))

  if (!config) return null

  const handlePressIn = () => {
    scale.value = withSpring(0.9, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onPress()
  }

  return (
    <AnimatedPressable
      style={[styles.tabButton, animStyle]}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={iconAnimStyle}>
        <Ionicons
          name={isFocused ? config.iconFocused : config.icon}
          size={24}
          color={isFocused ? DashboardColors.tabActive : DashboardColors.tabInactive}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? DashboardColors.tabActive : DashboardColors.tabInactive },
          isFocused && styles.tabLabelActive,
        ]}
      >
        {config.label}
      </Text>
      {isFocused && <View style={styles.activeIndicator} />}
    </AnimatedPressable>
  )
}

function FloatingMessageButton({
  messageCount = 0,
  onPress,
}: {
  messageCount?: number
  onPress?: () => void
}) {
  const scale = useSharedValue(1)
  const glowScale = useSharedValue(1)

  // Pulsing glow animation
  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )
  }, [glowScale])

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: interpolate(glowScale.value, [1, 1.3], [0.6, 0]),
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.9, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    onPress?.()
  }

  return (
    <View style={styles.fabContainer}>
      {/* Outer glow ring */}
      <Animated.View style={[styles.fabGlow, glowAnimStyle]} />

      {/* Outer ring */}
      <View style={styles.fabOuterRing}>
        {/* Inner button */}
        <AnimatedPressable
          style={[styles.fabButton, buttonAnimStyle]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={26}
            color={DashboardColors.textOnPrimary}
          />
        </AnimatedPressable>
      </View>

      {/* Badge */}
      {messageCount > 0 && (
        <View style={styles.fabBadge}>
          <Text style={styles.fabBadgeText}>
            {messageCount > 99 ? '99+' : messageCount}
          </Text>
        </View>
      )}
    </View>
  )
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  messageCount = 0,
  onMessagePress,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets()

  // Filter routes to only show configured tabs
  const visibleRoutes = state.routes.filter((route) => TAB_CONFIG[route.name])

  // Split routes for left and right sides of FAB
  const leftRoutes = visibleRoutes.slice(0, 2)
  const rightRoutes = visibleRoutes.slice(2, 4)

  const handleMessagePress = () => {
    if (onMessagePress) {
      onMessagePress()
    } else {
      // Navigate to messages
      navigation.navigate('messages')
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Tab bar background */}
      <View style={styles.tabBar}>
        {/* Left tabs */}
        <View style={styles.tabGroup}>
          {leftRoutes.map((route) => {
            const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key)

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              })
            }

            return (
              <TabButton
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            )
          })}
        </View>

        {/* FAB spacer */}
        <View style={styles.fabSpacer} />

        {/* Right tabs */}
        <View style={styles.tabGroup}>
          {rightRoutes.map((route) => {
            const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key)

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              })
            }

            return (
              <TabButton
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            )
          })}
        </View>
      </View>

      {/* Floating Message Button */}
      <FloatingMessageButton
        messageCount={messageCount}
        onPress={handleMessagePress}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: DashboardColors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.tabBarBorder,
    ...DashboardShadows.md,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.lg,
  },
  tabGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  fabSpacer: {
    width: 80,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.md,
    minWidth: 64,
    position: 'relative',
  },
  tabLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    marginTop: 4,
  },
  tabLabelActive: {
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    backgroundColor: DashboardColors.tabActive,
    borderRadius: 1.5,
  },
  // FAB styles
  fabContainer: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DashboardColors.fabGlow,
  },
  fabOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: DashboardColors.fabRing,
    alignItems: 'center',
    justifyContent: 'center',
    ...DashboardShadows.lg,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DashboardColors.fabBg,
    alignItems: 'center',
    justifyContent: 'center',
    ...DashboardShadows.glow,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DashboardColors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: DashboardColors.tabBarBg,
  },
  fabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DashboardColors.badgeText,
  },
})
