import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
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
  getExportWarehouses,
  ExportWarehouse,
  ExportWarehouseFilters,
  ExportWarehouseStats,
  Pagination
} from '@/services/endpoints/export-warehouses'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'active', label: 'Aktif', icon: 'checkmark-circle-outline' as const },
  { id: 'passive', label: 'Pasif', icon: 'close-circle-outline' as const }
]

// Skeleton Component
function WarehouseCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface WarehouseCardProps {
  item: ExportWarehouse
  onPress: () => void
}

function WarehouseCard({ item, onPress }: WarehouseCardProps) {
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

  const locationParts = [
    item.country?.name,
    item.state?.name,
    item.city?.name
  ].filter(Boolean)

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="business-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardCode}>{item.code}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.15)' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.is_active ? DashboardColors.success : DashboardColors.textMuted }
          ]}>
            {item.is_active ? 'Aktif' : 'Pasif'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {locationParts.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{locationParts.join(' / ')}</Text>
          </View>
        )}
        {item.address && (
          <View style={styles.infoRow}>
            <Ionicons name="map-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.address}</Text>
          </View>
        )}
        {item.contact_person && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.contact_person}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.phone}</Text>
          </View>
        )}
      </View>

      {/* Footer - Items count */}
      {item.items_count !== undefined && item.items_count > 0 && (
        <View style={styles.cardFooter}>
          <View style={styles.itemsCountContainer}>
            <Ionicons name="cube-outline" size={14} color={DashboardColors.primary} />
            <Text style={styles.itemsCountText}>{item.items_count} mal</Text>
          </View>
        </View>
      )}

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Stats Summary Card
function StatsSummaryCard({ stats }: { stats: ExportWarehouseStats }) {
  return (
    <View style={styles.statsCard}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="business" size={18} color={DashboardColors.success} />
          </View>
          <Text style={styles.statValue}>{stats.active_warehouses}</Text>
          <Text style={styles.statLabel}>Aktif Depo</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="cube" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{stats.total_items}</Text>
          <Text style={styles.statLabel}>Toplam Mal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="checkmark-done" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{stats.items_ready}</Text>
          <Text style={styles.statLabel}>Hazır</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="car" size={18} color="#8B5CF6" />
          </View>
          <Text style={styles.statValue}>{stats.items_loaded}</Text>
          <Text style={styles.statLabel}>Yüklendi</Text>
        </View>
      </View>
    </View>
  )
}

// Empty State
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="business-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz depo yok</Text>
      <Text style={styles.emptyText}>
        Yeni depo eklemek için sağ üstteki + butonuna tıklayın.
      </Text>
    </View>
  )
}

export default function ExportWarehousesScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // API state
  const [warehouses, setWarehouses] = useState<ExportWarehouse[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<ExportWarehouseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme
  const executeFetch = useCallback(
    async (filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        const filters: ExportWarehouseFilters = {
          page,
          per_page: 20
        }

        if (filter === 'active') {
          filters.status = true
        } else if (filter === 'passive') {
          filters.status = false
        }

        const response = await getExportWarehouses(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setWarehouses((prev) => [...prev, ...response.warehouses])
          } else {
            setWarehouses(response.warehouses)
          }
          setPagination(response.pagination)
          setStats(response.stats)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Export warehouses fetch error:', err)
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
    executeFetch(activeFilter, 1, false)

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtre değişimi
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(activeFilter, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter])

  // Refs for useFocusEffect
  const executeFetchRef = useRef(executeFetch)
  const activeFilterRef = useRef(activeFilter)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    activeFilterRef.current = activeFilter
  }, [executeFetch, activeFilter])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(activeFilterRef.current, 1, false)
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(activeFilter, 1, false)
  }

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(activeFilter, pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: ExportWarehouse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/export-warehouse/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/export-warehouse/new')
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

  // Stats Header
  const renderStatsHeader = () => {
    if (!stats) return null

    return (
      <View style={styles.statsSection}>
        <StatsSummaryCard stats={stats} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="İhracat Depoları"
        icon="business-outline"
        subtitle={pagination ? `${pagination.total} depo` : undefined}
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
        {/* Filtre Chips */}
        <View style={styles.filterBar}>
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id
            return (
              <Pressable
                key={filter.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => {
                  Haptics.selectionAsync()
                  setActiveFilter(filter.id)
                }}
              >
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={isActive ? '#fff' : DashboardColors.textSecondary}
                />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <View style={styles.activeFilterBar}>
            <View style={styles.activeFilterContent}>
              <Ionicons name="funnel" size={14} color={DashboardColors.primary} />
              <Text style={styles.activeFilterText}>
                Filtre: <Text style={styles.activeFilterValue}>{getActiveFilterLabel()}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={styles.clearFilterButton}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* Liste */}
        {isLoading ? (
          <View style={styles.listContent}>
            <WarehouseCardSkeleton />
            <WarehouseCardSkeleton />
            <WarehouseCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={warehouses}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <WarehouseCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderStatsHeader()}
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

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.surface,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  filterChipActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  filterChipText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  filterChipTextActive: {
    color: '#fff'
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

  // Stats Section
  statsSection: {
    marginBottom: DashboardSpacing.lg
  },
  statsCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xs
  },
  statValue: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  statLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: DashboardColors.borderLight,
    marginHorizontal: DashboardSpacing.xs
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
    backgroundColor: DashboardColors.primaryGlow,
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
    fontWeight: '500',
    fontFamily: undefined
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
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
    paddingTop: DashboardSpacing.sm
  },
  itemsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  itemsCountText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
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
