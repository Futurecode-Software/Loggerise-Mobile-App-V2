/**
 * Skeleton Loading Component
 *
 * İçerik yüklenirken placeholder gösterimi
 */

import React, { useEffect } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate
} from 'react-native-reanimated'
import {
  DashboardColors,
  DashboardBorderRadius,
  DashboardSpacing,
  DashboardShadows
} from '@/constants/dashboard-theme'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = DashboardBorderRadius.md,
  style
}: SkeletonProps) {
  const shimmer = useSharedValue(0)

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    )
  }, [shimmer])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3])
  }))

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        animatedStyle,
        style
      ]}
    />
  )
}

// Yük Kartı Skeleton
export function LoadCardSkeleton() {
  return (
    <View style={styles.loadCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Skeleton width={28} height={28} borderRadius={8} />
          <Skeleton width={100} height={16} />
        </View>
        <View style={styles.badgeRow}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={70} height={24} borderRadius={12} />
        </View>
      </View>
      <Skeleton width="70%" height={20} style={styles.cargoName} />
      <View style={styles.routeRow}>
        <Skeleton width={14} height={14} borderRadius={7} />
        <Skeleton width="80%" height={14} />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Skeleton width={80} height={14} />
          <Skeleton width={60} height={14} />
        </View>
        <Skeleton width={100} height={24} borderRadius={8} />
      </View>
    </View>
  )
}

// Yük Listesi Skeleton
export function LoadListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadCardSkeleton key={index} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: DashboardColors.border
  },
  loadCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DashboardSpacing.sm
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  badgeRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.xs
  },
  cargoName: {
    marginBottom: DashboardSpacing.sm
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.md
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  footerLeft: {
    flexDirection: 'row',
    gap: DashboardSpacing.lg
  },
  listContainer: {}
})
