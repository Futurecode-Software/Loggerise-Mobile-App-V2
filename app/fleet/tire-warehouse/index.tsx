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
  getTires,
  Tire,
  TireFilters,
  Pagination,
  getTireStatusLabel,
  getTireConditionLabel,
  getTireTypeLabel
} from '@/services/endpoints/tires'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'in_stock', label: 'Depoda', icon: 'cube-outline' as const },
  { id: 'assigned', label: 'Atanmış', icon: 'car-outline' as const },
  { id: 'maintenance', label: 'Bakımda', icon: 'construct-outline' as const },
  { id: 'retired', label: 'Hurdaya Çıkmış', icon: 'trash-outline' as const }
]

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  in_stock: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  assigned: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  maintenance: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  retired: { primary: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' }
}

// Kondisyon renkleri
const CONDITION_COLORS: Record<string, string> = {
  new: '#10B981',
  good: '#3B82F6',
  fair: '#F59E0B',
  worn: '#EF4444',
  damaged: '#DC2626'
}

// Skeleton Component
function TireCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface TireCardProps {
  item: Tire
  onPress: () => void
}

function TireCard({ item, onPress }: TireCardProps) {
  const scale = useSharedValue(1)
  const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.in_stock
  const conditionColor = CONDITION_COLORS[item.condition] || CONDITION_COLORS.good

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const brandModel = [item.brand, item.model].filter(Boolean).join(' ')
  const tireInfo = [item.size, getTireTypeLabel(item.tire_type)].filter(Boolean).join(' • ')

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: statusColors.bg }]}>
          <Ionicons name="disc-outline" size={20} color={statusColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.serial_number}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {brandModel}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.primary }]}>
            {getTireStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>{tireInfo}</Text>
        </View>
        {item.tread_depth !== null && (
          <View style={styles.infoRow}>
            <Ionicons name="speedometer-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={[
              styles.infoText,
              item.tread_depth <= 3.0 && { color: DashboardColors.danger, fontWeight: '600' }
            ]}>
              Diş Derinliği: {item.tread_depth} mm {item.tread_depth <= 3.0 && '⚠️'}
            </Text>
          </View>
        )}
        {item.warehouse_location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.warehouse_location}</Text>
          </View>
        )}
        {item.current_assignment?.vehicle && (
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.current_assignment.vehicle.plate}
              {item.current_assignment.position && ` (${item.current_assignment.position})`}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.conditionBadge}>
          <View style={[styles.conditionDot, { backgroundColor: conditionColor }]} />
          <Text style={styles.conditionText}>{getTireConditionLabel(item.condition)}</Text>
        </View>
        {item.purchase_date && (
          <Text style={styles.dateText}>
            {new Date(item.purchase_date).toLocaleDateString('tr-TR')}
          </Text>
        )}
      </View>

      {/* Status Dot */}
      <View style={[
        styles.statusDot,
        { backgroundColor: conditionColor }
      ]} />

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="disc-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasSearch ? 'Sonuç bulunamadı' : 'Henüz lastik yok'}
      </Text>
      <Text style={styles.emptyText}>
        {hasSearch
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni lastik eklemek için sağ üstteki + butonuna tıklayın.'
        }
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

export default function TireWarehouseScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], []);

  // API state
  const [tires, setTires] = useState<Tire[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (search: string, filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: TireFilters = {
          page,
          per_page: 20,
          sort_by: 'created_at',
          sort_order: 'desc'
        }

        if (search.trim()) {
          filters.search = search.trim()
        }

        if (filter !== 'all') {
          filters.status = filter as any
        }

        const response = await getTires(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setTires((prev) => [...prev, ...response.tires])
          } else {
            setTires(response.tires)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Tires fetch error:', err)
          setError(err instanceof Error ? err.message : 'Lastikler yüklenemedi')
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
    executeFetch(searchQuery, activeFilter, 1, false)

    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Arama debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true)
      executeFetch(searchQuery, activeFilter, 1, false)
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Filtre değişimi
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(searchQuery, activeFilter, 1, false)
  }, [activeFilter])

  // Ref to store executeFetch, searchQuery and activeFilter
  const executeFetchRef = useRef(executeFetch)
  const searchQueryRef = useRef(searchQuery)
  const activeFilterRef = useRef(activeFilter)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    searchQueryRef.current = searchQuery
    activeFilterRef.current = activeFilter
  }, [executeFetch, searchQuery, activeFilter])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(searchQueryRef.current, activeFilterRef.current, 1, false)
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(searchQuery, activeFilter, 1, false)
  }

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: Tire) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/fleet/tire-warehouse/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/fleet/tire-warehouse/new')
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
    const filter = STATUS_FILTERS.find(f => f.id === activeFilter)
    return filter?.label || 'Tümü'
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Lastik Deposu"
        icon="disc-outline"
        subtitle={pagination ? `${pagination.total} lastik` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Seri no, marka, model veya ebat ile ara..."
        rightActions={[
          {
            icon: 'funnel-outline',
            onPress: handleFilterPress
          },
          {
            icon: 'add',
            onPress: handleNewPress
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
            <TireCardSkeleton />
            <TireCardSkeleton />
            <TireCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={tires}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TireCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState hasSearch={!!searchQuery} />}
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
              const isActive = activeFilter === filter.id
              const colors = filter.id !== 'all' ? STATUS_COLORS[filter.id] : null

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
                    { backgroundColor: colors?.bg || DashboardColors.primaryGlow }
                  ]}>
                    <Ionicons
                      name={filter.icon}
                      size={20}
                      color={colors?.primary || DashboardColors.primary}
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

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
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
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardSubtitle: {
    fontSize: DashboardFontSizes.sm,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  conditionText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  dateText: {
    fontSize: DashboardFontSizes.xs,
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
