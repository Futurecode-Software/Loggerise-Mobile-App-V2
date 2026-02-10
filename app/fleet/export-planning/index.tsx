/**
 * İhracat Planlama - Liste Sayfası
 *
 * Depoya gönderilmemiş ihracat pozisyonlarını listeler.
 * Her pozisyon için sürücü/çekici/römork atama durumunu gösterir.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TouchableOpacity
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView
} from '@gorhom/bottom-sheet'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  getExportPlanningPositions,
  getAssignmentStatus,
  PlanningPosition,
  Pagination
} from '@/services/endpoints/export-planning'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Filtreler
const ASSIGNMENT_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'pending', label: 'Atama Bekleyen', icon: 'time-outline' as const },
  { id: 'ready', label: 'Hazır', icon: 'checkmark-circle-outline' as const }
]

// Skeleton Component
function PositionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={140} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={160} height={14} />
        <Skeleton width={120} height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={28} borderRadius={8} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={28} height={28} borderRadius={14} />
        </View>
      </View>
    </View>
  )
}

// Assignment Indicator
function AssignmentIndicator({ assigned, icon }: { assigned: boolean; icon: string }) {
  return (
    <View style={[
      styles.assignmentDot,
      { backgroundColor: assigned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(156, 163, 175, 0.12)' }
    ]}>
      <Ionicons
        name={assigned ? 'checkmark-circle' : (icon as keyof typeof Ionicons.glyphMap)}
        size={16}
        color={assigned ? DashboardColors.success : DashboardColors.textMuted}
      />
    </View>
  )
}

// Card Component
interface PositionCardProps {
  item: PlanningPosition
  onPress: () => void
}

function PositionCard({ item, onPress }: PositionCardProps) {
  const scale = useSharedValue(1)
  const status = getAssignmentStatus(item)
  const loadCount = item.loads?.length ?? 0
  const customerName = item.loads?.[0]?.customer?.name

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  return (
    <AnimatedPressable
      style={[
        styles.card,
        animStyle,
        status.allAssigned && styles.cardReady
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[
          styles.cardIcon,
          { backgroundColor: status.allAssigned ? 'rgba(16, 185, 129, 0.12)' : DashboardColors.primaryGlow }
        ]}>
          <Ionicons
            name="airplane-outline"
            size={20}
            color={status.allAssigned ? DashboardColors.success : DashboardColors.primary}
          />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.position_number}
          </Text>
          {item.name ? (
            <Text style={styles.cardSubtitle} numberOfLines={1}>{item.name}</Text>
          ) : null}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: status.allAssigned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)' }
        ]}>
          <Text style={[
            styles.statusBadgeText,
            { color: status.allAssigned ? DashboardColors.success : DashboardColors.warning }
          ]}>
            {status.assignedCount}/3
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {loadCount > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {loadCount} yük{customerName ? ` · ${customerName}` : ''}
            </Text>
          </View>
        )}
        {item.route ? (
          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.route}</Text>
          </View>
        ) : null}
        {item.garage_location ? (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.garage_location}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer: Assignment Indicators */}
      <View style={styles.cardFooter}>
        <View style={styles.assignmentRow}>
          <AssignmentIndicator assigned={status.driverAssigned} icon="person-outline" />
          <AssignmentIndicator assigned={status.truckAssigned} icon="bus-outline" />
          <AssignmentIndicator assigned={status.trailerAssigned} icon="trail-sign-outline" />
        </View>
        {status.allAssigned && (
          <View style={styles.readyBadge}>
            <Ionicons name="checkmark-circle" size={14} color={DashboardColors.success} />
            <Text style={styles.readyBadgeText}>Hazır</Text>
          </View>
        )}
      </View>

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
        <Ionicons name="airplane-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Pozisyon bulunamadı</Text>
      <Text style={styles.emptyText}>
        Atama bekleyen ihracat pozisyonu bulunmamaktadır.
      </Text>
    </View>
  )
}

// BottomSheet Backdrop
const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.5}
  />
)

export default function ExportPlanningScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], [])

  // API state
  const [positions, setPositions] = useState<PlanningPosition[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Filtreleme (client-side)
  const filteredPositions = useMemo(() => {
    if (activeFilter === 'all') return positions
    return positions.filter(p => {
      const status = getAssignmentStatus(p)
      if (activeFilter === 'pending') return !status.allAssigned
      if (activeFilter === 'ready') return status.allAssigned
      return true
    })
  }, [positions, activeFilter])

  // Veri çekme
  const executeFetch = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)
        const response = await getExportPlanningPositions(page, 20)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setPositions(prev => [...prev, ...response.positions])
          } else {
            setPositions(response.positions)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Export planning fetch error:', err)
          setError(err instanceof Error ? err.message : 'Pozisyonlar yüklenemedi')
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false)
          setIsLoadingMore(false)
          setRefreshing(false)
        }
      }
    },
    []
  )

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
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: PlanningPosition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/fleet/export-planning/${item.id}`)
  }

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    filterBottomSheetRef.current?.present()
  }

  const handleFilterSelect = (filterId: string) => {
    Haptics.selectionAsync()
    setActiveFilter(filterId)
    filterBottomSheetRef.current?.dismiss()
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Aktif filtre label
  const getActiveFilterLabel = () => {
    const filter = ASSIGNMENT_FILTERS.find(f => f.id === activeFilter)
    return filter?.label || 'Tümü'
  }

  // Summary stats
  const stats = useMemo(() => {
    const total = positions.length
    const ready = positions.filter(p => getAssignmentStatus(p).allAssigned).length
    const pending = total - ready
    return { total, ready, pending }
  }, [positions])

  // Summary header
  const renderSummaryHeader = () => {
    if (positions.length === 0) return null

    return (
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
            <Ionicons name="layers-outline" size={16} color={DashboardColors.primary} />
          </View>
          <Text style={styles.summaryValue}>{stats.total}</Text>
          <Text style={styles.summaryLabel}>Toplam</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <Ionicons name="time-outline" size={16} color={DashboardColors.warning} />
          </View>
          <Text style={styles.summaryValue}>{stats.pending}</Text>
          <Text style={styles.summaryLabel}>Bekleyen</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <View style={[styles.summaryIcon, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={DashboardColors.success} />
          </View>
          <Text style={styles.summaryValue}>{stats.ready}</Text>
          <Text style={styles.summaryLabel}>Hazır</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="İhracat Planlama"
        icon="airplane-outline"
        subtitle={pagination ? `${pagination.total} pozisyon` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'funnel-outline',
            onPress: handleFilterPress
          }
        ]}
      />

      <View style={styles.content}>
        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <View style={styles.activeFilterBar}>
            <View style={styles.activeFilterContent}>
              <Ionicons name="funnel" size={14} color={DashboardColors.primary} />
              <Text style={styles.activeFilterText}>
                Filtre: <Text style={styles.activeFilterValue}>{getActiveFilterLabel()}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              style={styles.clearFilterButton}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <PositionCardSkeleton />
            <PositionCardSkeleton />
            <PositionCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={filteredPositions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <PositionCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderSummaryHeader()}
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

      {/* Filter BottomSheet */}
      <BottomSheetModal
        ref={filterBottomSheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHeaderIcon}>
              <Ionicons name="funnel" size={20} color={DashboardColors.primary} />
            </View>
            <Text style={styles.bottomSheetTitle}>Atama Durumu</Text>
            <TouchableOpacity
              onPress={() => filterBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSheetBody}>
            {ASSIGNMENT_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id

              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    isActive && styles.filterOptionActive
                  ]}
                  onPress={() => handleFilterSelect(filter.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.filterOptionIcon,
                    { backgroundColor: isActive ? DashboardColors.primaryGlow : DashboardColors.background }
                  ]}>
                    <Ionicons
                      name={filter.icon}
                      size={20}
                      color={isActive ? DashboardColors.primary : DashboardColors.textMuted}
                    />
                  </View>
                  <Text style={[
                    styles.filterOptionLabel,
                    isActive && styles.filterOptionLabelActive
                  ]}>
                    {filter.label}
                  </Text>
                  {isActive && (
                    <View style={styles.filterOptionCheck}>
                      <Ionicons name="checkmark-circle" size={24} color={DashboardColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
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

  // Active Filter Bar
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primaryGlow,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  activeFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  activeFilterText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  activeFilterValue: {
    fontWeight: '600',
    color: DashboardColors.primary
  },
  clearFilterButton: {
    padding: DashboardSpacing.xs
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },
  summaryValue: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '800',
    color: DashboardColors.textPrimary
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: DashboardColors.borderLight,
    marginHorizontal: DashboardSpacing.sm
  },

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.lg,
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
  cardReady: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
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
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardSubtitle: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusBadgeText: {
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DashboardSpacing.md
  },
  assignmentRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm
  },
  assignmentDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  readyBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.success
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
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  },

  // BottomSheet
  bottomSheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 5,
    borderRadius: 3
  },
  bottomSheetBackground: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  bottomSheetContent: {
    flex: 1,
    paddingBottom: DashboardSpacing['3xl']
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  bottomSheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomSheetTitle: {
    flex: 1,
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md
  },
  bottomSheetCloseButton: {
    padding: DashboardSpacing.xs
  },
  bottomSheetBody: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.sm
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  filterOptionActive: {
    backgroundColor: DashboardColors.primaryGlow,
    borderColor: DashboardColors.primary
  },
  filterOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterOptionLabel: {
    flex: 1,
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md
  },
  filterOptionLabelActive: {
    color: DashboardColors.primary
  },
  filterOptionCheck: {
    marginLeft: DashboardSpacing.sm
  }
})
