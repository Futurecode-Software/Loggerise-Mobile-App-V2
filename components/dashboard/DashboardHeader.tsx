/**
 * Premium Dashboard Header
 *
 * Full-screen gradient header with user info, notification badges,
 * and horizontal scrollable tab list
 */

import {
  DashboardBorderRadius,
  DashboardColors,
  DashboardFontSizes,
  DashboardSpacing,
} from '@/constants/dashboard-theme'
import { useAuth } from '@/context/auth-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect } from 'react'
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native'
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface DashboardHeaderProps {
  notificationCount?: number
  messageCount?: number
  onNotificationPress?: () => void
  onMessagePress?: () => void
  onAvatarPress?: () => void
}

export default function DashboardHeader({
  notificationCount = 0,
  messageCount = 0,
  onNotificationPress,
  onMessagePress,
  onAvatarPress,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  // Ambient glow animation
  const glowAnim = useSharedValue(0)

  useEffect(() => {
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )
  }, [glowAnim])

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [1, 1.1]) }],
  }))

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Günaydın'
    if (hour < 18) return 'İyi Günler'
    return 'İyi Akşamlar'
  }

  // Format date in Turkish
  const formatDate = () => {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }
    return date.toLocaleDateString('tr-TR', options)
  }

  const userName = user?.fullName?.split(' ')[0] || 'Kullanıcı'

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#022920', '#044134', '#065f4a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow orbs */}
      <Animated.View style={[styles.glowOrb1, glowStyle]} />
      <Animated.View style={[styles.glowOrb2, glowStyle]} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        {/* Top Row */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.topRow}
        >
          {/* Left: Avatar + Info */}
          <Pressable style={styles.userSection} onPress={onAvatarPress}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>
                {getGreeting()}, <Text style={styles.userName}>{userName}</Text>
              </Text>
              <Text style={styles.date}>{formatDate()}</Text>
            </View>
          </Pressable>

          {/* Right: Icons */}
          <View style={styles.iconsRow}>
            <Pressable
              style={styles.iconButton}
              onPress={onMessagePress}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color={DashboardColors.textOnPrimary}
              />
              {messageCount > 0 && (
                <View style={[styles.badge, styles.badgeMessage]}>
                  <Text style={styles.badgeText}>
                    {messageCount > 9 ? '9+' : messageCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={onNotificationPress}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={DashboardColors.textOnPrimary}
              />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Bottom curve */}
      <View style={styles.bottomCurve} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingBottom: 32,
  },
  glowOrb1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 20,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 70,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: DashboardSpacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textOnPrimary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: DashboardColors.accent,
    borderWidth: 2,
    borderColor: DashboardColors.primary,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: DashboardFontSizes.lg,
    color: DashboardColors.textOnPrimaryMuted,
    marginBottom: 2,
  },
  userName: {
    color: DashboardColors.textOnPrimary,
    fontWeight: '600',
  },
  date: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textOnPrimaryMuted,
    textTransform: 'capitalize',
  },
  iconsRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: DashboardColors.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeMessage: {
    backgroundColor: DashboardColors.warning,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DashboardColors.badgeText,
  },
  tabsContainer: {
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: DashboardSpacing.sm,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textOnPrimaryMuted,
  },
  tabLabelActive: {
    color: DashboardColors.textOnPrimary,
    fontWeight: '600',
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
