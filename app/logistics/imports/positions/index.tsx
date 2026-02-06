import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations,
} from '@/constants/dashboard-theme'
import {
  getPositions,
  Position,
  PositionFilters,
  Pagination,
  PositionStatus,
  getVehicleOwnerTypeLabel,
  getDriverFullName,
} from '@/services/endpoints/positions'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Pozisyon durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  active: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  completed: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  draft: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
}

// Durum etiketleri
const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  draft: 'Taslak',
}

// Skeleton Component
function PositionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface PositionCardProps {
  item: Position
  onPress: () => void
}

function PositionCard({ item, onPress }: PositionCardProps) {
  const scale = useSharedValue(1)
  const colors = STATUS_COLORS[item.status || 'active'] || STATUS_COLORS.active

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const driverName = getDriverFullName(item.driver)
  const vehicleInfo = item.truck_tractor
    ? `${item.truck_tractor.plate}${item.trailer ? ' / ' + item.trailer.plate : ''}`
    : item.trailer?.plate || '-'

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.position_number || 'Taslak Pozisyon'}
          </Text>
          <Text style={styles.cardCode}>
            {item.name || getVehicleOwnerTypeLabel(item.vehicle_owner_type)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {STATUS_LABELS[item.status || 'active']}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {item.route && (
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.route}</Text>
          </View>
        )}
        {vehicleInfo && vehicleInfo !== '-' && (
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{vehicleInfo}</Text>
          </View>
        )}
        {driverName && driverName !== '-' && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{driverName}</Text>
          </View>
        )}
        {item.loads_count !== undefined && item.loads_count > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>{item.loads_count} yük</Text>
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
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="location-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz pozisyon yok'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Dispozisyon ekranından yeni pozisyon oluşturabilirsiniz.'}
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

export default function ImportPositionsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [positions, setPositions] = useState<Position[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Filter state
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], []);

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitialFetchRef = useRef(false)

  // Core fetch function
  const executeFetch = useCallback(async (search: string, page: number = 1, append: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current

    try {
      const filters: PositionFilters = {
        page,
        per_page: 20,
        position_type: 'import',
        is_active: true,
      }

      if (search.trim()) {
        filters.search = search.trim()
      }

      if (activeStatusFilter !== 'all') {
        filters.status = activeStatusFilter as PositionStatus
      }

      const response = await getPositions(filters)

      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (append) {
          setPositions((prev) => [...prev, ...response.positions])
        } else {
          setPositions(response.positions)
        }
        setPagination(response.pagination)
        hasInitialFetchRef.current = true
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        console.error('Positions fetch error:', err)
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
        setRefreshing(false)
      }
    }
  }, [activeStatusFilter])

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(searchQuery, 1, false)

    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true)
      executeFetch(searchQuery, 1, false)
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery, executeFetch])

  // Filter change
  useEffect(() => {
    if (!hasInitialFetchRef.current) return
    setIsLoading(true)
    executeFetch(searchQuery, 1, false)
  }, [activeStatusFilter, executeFetch])

  // Refs for useFocusEffect to avoid re-triggering
  const executeFetchRef = useRef(executeFetch)
  const searchQueryRef = useRef(searchQuery)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    searchQueryRef.current = searchQuery
  }, [executeFetch, searchQuery])

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(searchQueryRef.current, 1, false)
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(searchQuery, 1, false)
  }

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true)
      executeFetch(searchQuery, pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: Position) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/logistics/imports/positions/${item.id}` as any)
  }

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    filterBottomSheetRef.current?.present()
  }

  const handleFilterSelect = (status: string) => {
    Haptics.selectionAsync()
    setActiveStatusFilter(status)
    filterBottomSheetRef.current?.dismiss()
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Status filtre seçenekleri
  const STATUS_FILTERS = [
    { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
    { id: 'active', label: 'Aktif', icon: 'checkmark-circle-outline' as const },
    { id: 'completed', label: 'Tamamlandı', icon: 'flag-outline' as const },
    { id: 'draft', label: 'Taslak', icon: 'document-outline' as const },
    { id: 'cancelled', label: 'İptal', icon: 'close-circle-outline' as const },
  ]

  // Aktif filtre label
  const getActiveFilterLabel = () => {
    const filter = STATUS_FILTERS.find((f) => f.id === activeStatusFilter)
    return filter?.label || 'Tümü'
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="İthalat Pozisyonları"
        icon="location-outline"
        subtitle={pagination ? `${pagination.total} pozisyon` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Pozisyon numarası, plaka veya sürücü ara...',
        }}
        rightActions={[
          {
            icon: 'funnel-outline',
            onPress: handleFilterPress,
          },
        ]}
      />

      <View style={styles.content}>
        {/* Active Filter Indicator */}
        {activeStatusFilter !== 'all' && (
          <View style={styles.activeFilterBar}>
            <View style={styles.activeFilterContent}>
              <Ionicons name="funnel" size={14} color={DashboardColors.primary} />
              <Text style={styles.activeFilterText}>
                Filtre: <Text style={styles.activeFilterValue}>{getActiveFilterLabel()}</Text>
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveStatusFilter('all')}
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
            data={positions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <PositionCard item={item} onPress={() => handleCardPress(item)} />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
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
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHeaderIcon}>
              <Ionicons name="funnel" size={20} color={DashboardColors.primary} />
            </View>
            <Text style={styles.bottomSheetTitle}>Durum Filtresi</Text>
            <TouchableOpacity
              onPress={() => filterBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Options */}
          <View style={styles.bottomSheetBody}>
            {STATUS_FILTERS.map((filter) => {
              const isActive = activeStatusFilter === filter.id
              const colors = filter.id !== 'all' ? STATUS_COLORS[filter.id] : null

              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    isActive && styles.filterOptionActive,
                  ]}
                  onPress={() => handleFilterSelect(filter.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.filterOptionIcon,
                      { backgroundColor: colors?.bg || DashboardColors.primaryGlow },
                    ]}
                  >
                    <Ionicons
                      name={filter.icon}
                      size={20}
                      color={colors?.primary || DashboardColors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterOptionLabel,
                      isActive && styles.filterOptionLabelActive,
                    ]}
                  >
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
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
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
    borderBottomColor: DashboardColors.borderLight,
  },
  activeFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  activeFilterText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
  },
  activeFilterValue: {
    fontWeight: '600',
    color: DashboardColors.primary,
  },
  clearFilterButton: {
    padding: DashboardSpacing.xs,
  },

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.xl,
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    position: 'relative',
    ...DashboardShadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md,
  },
  cardName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  cardCode: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
  },
  cardInfo: {
    gap: DashboardSpacing.xs,
    paddingTop: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    bottom: DashboardSpacing.lg,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },

  // BottomSheet - iOS Modal Style
  bottomSheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  bottomSheetBackground: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bottomSheetContent: {
    flex: 1,
    paddingBottom: DashboardSpacing['3xl'],
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  bottomSheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetTitle: {
    flex: 1,
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md,
  },
  bottomSheetCloseButton: {
    padding: DashboardSpacing.xs,
  },
  bottomSheetBody: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
  },
  filterOptionActive: {
    backgroundColor: DashboardColors.primaryGlow,
    borderColor: DashboardColors.primary,
  },
  filterOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionLabel: {
    flex: 1,
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md,
  },
  filterOptionLabelActive: {
    color: DashboardColors.primary,
  },
  filterOptionCheck: {
    marginLeft: DashboardSpacing.sm,
  },
})
