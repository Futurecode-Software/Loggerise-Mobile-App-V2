import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  getTractorTrailerAssignments,
  TractorTrailerAssignment,
  TractorTrailerAssignmentFilters,
  Pagination,
  deleteTractorTrailerAssignment,
  toggleTractorTrailerAssignment
} from '@/services/endpoints/fleet'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Skeleton Component
function AssignmentCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  )
}

// Card Component
interface AssignmentCardProps {
  item: TractorTrailerAssignment
  onPress: () => void
}

function AssignmentCard({ item, onPress }: AssignmentCardProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const tractorInfo = item.tractor
    ? `${item.tractor.plate}${
        item.tractor.brand || item.tractor.model
          ? ` • ${[item.tractor.brand, item.tractor.model].filter(Boolean).join(' ')}`
          : ''
      }`
    : 'Çekici bilgisi yok'

  const trailerInfo = item.trailer
    ? `${item.trailer.plate}${
        item.trailer.brand || item.trailer.model
          ? ` • ${[item.trailer.brand, item.trailer.model].filter(Boolean).join(' ')}`
          : ''
      }`
    : 'Römork bilgisi yok'

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
          <Ionicons name="git-branch-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.tractor?.plate || 'Çekici'} - {item.trailer?.plate || 'Römork'}
          </Text>
          <Text style={styles.cardCode}>Eşleştirme #{item.id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.is_active
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(107, 114, 128, 0.12)'
            }
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.is_active ? DashboardColors.success : DashboardColors.textMuted }
            ]}
          >
            {item.is_active ? 'Aktif' : 'Pasif'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {tractorInfo}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cart-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {trailerInfo}
          </Text>
        </View>
        {item.assigned_at && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>
              {new Date(item.assigned_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        )}
      </View>

      {/* Status Dot */}
      <View
        style={[
          styles.statusDot,
          { backgroundColor: item.is_active ? DashboardColors.success : DashboardColors.textMuted }
        ]}
      />

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="git-branch-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz eşleştirme yok</Text>
      <Text style={styles.emptyText}>
        Yeni eşleştirme eklemek için sağ üstteki + butonuna tıklayın.
      </Text>
    </View>
  )
}

export default function TractorTrailerAssignmentsScreen() {
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [assignments, setAssignments] = useState<TractorTrailerAssignment[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<TractorTrailerAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(async (page: number = 1, append: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current

    try {
      setError(null)

      const filters: TractorTrailerAssignmentFilters = {
        page,
        per_page: 20
      }

      const response = await getTractorTrailerAssignments(filters)

      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (append) {
          setAssignments((prev) => [...prev, ...response.assignments])
        } else {
          setAssignments(response.assignments)
        }
        setPagination(response.pagination)
        hasInitialFetchRef.current = true
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        console.error('Assignments fetch error:', err)
        setError(err instanceof Error ? err.message : 'Eşleştirmeler yüklenemedi')
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
        setRefreshing(false)
      }
    }
  }, [])

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(1, false)

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Ref to store executeFetch to avoid useFocusEffect re-triggering
  const executeFetchRef = useRef(executeFetch)
  useEffect(() => {
    executeFetchRef.current = executeFetch
  }, [executeFetch])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(1, false)
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(1, false)
  }

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true)
      executeFetch(pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: TractorTrailerAssignment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/fleet/tractor-trailer/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/fleet/tractor-trailer/new')
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Çekici-Römork Eşleştirme"
        icon="git-branch-outline"
        subtitle={pagination ? `${pagination.total} eşleştirme` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'add',
            onPress: handleNewPress
          }
        ]}
      />

      <View style={styles.content}>
        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <AssignmentCardSkeleton />
            <AssignmentCardSkeleton />
            <AssignmentCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <AssignmentCard item={item} onPress={() => handleCardPress(item)} />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.xl
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    position: 'relative',
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md
  },
  cardName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardCode: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700'
  },
  cardInfo: {
    gap: DashboardSpacing.xs,
    paddingBottom: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  statusDot: {
    position: 'absolute',
    top: DashboardSpacing.lg,
    right: DashboardSpacing.lg,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    bottom: DashboardSpacing.lg + 8
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  }
})
