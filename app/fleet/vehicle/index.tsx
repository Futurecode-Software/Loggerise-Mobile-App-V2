/**
 * Araçlar Liste Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern liste sayfası
 * Referans: app/crm/customers/index.tsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  getVehicles,
  Vehicle,
  VehicleFilters,
  Pagination,
  getStatusLabel
} from '@/services/endpoints/vehicles'
import { formatNumber } from '@/utils/formatters'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Araç tipi etiketleri
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  truck_tractor: 'Çekici',
  trailer: 'Römork',
  truck: 'Kamyon',
  light_truck: 'Hafif Kamyon',
  car: 'Otomobil',
  minibus: 'Minibüs',
  bus: 'Otobüs',
  tractor: 'Traktör',
  motorcycle: 'Motosiklet',
  construction_machine: 'İş Makinesi',
  van: 'Kamyonet',
  pickup: 'Pikap',
  other: 'Diğer',
}

// Durum filtreleri
const STATUS_FILTERS: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline', color: '#6B7280' },
  { id: 'available', label: 'Müsait', icon: 'checkmark-circle-outline', color: '#10B981' },
  { id: 'in_use', label: 'Kullanımda', icon: 'car-outline', color: '#3B82F6' },
  { id: 'in_maintenance', label: 'Bakımda', icon: 'construct-outline', color: '#F59E0B' },
  { id: 'out_of_service', label: 'Hizmet Dışı', icon: 'close-circle-outline', color: '#EF4444' },
]

// Status renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  available: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  in_use: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  in_maintenance: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  maintenance: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  out_of_service: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

// Skeleton Component
function VehicleCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={100} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={140} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface VehicleCardProps {
  item: Vehicle
  onPress: () => void
}

function VehicleCard({ item, onPress }: VehicleCardProps) {
  const scale = useSharedValue(1)
  const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.available

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const vehicleTypeLabel = VEHICLE_TYPE_LABELS[item.vehicle_type] || item.vehicle_type
  const brandModel = [item.brand, item.model].filter(Boolean).join(' ')

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
          <Ionicons name="car-sport-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardPlate} numberOfLines={1}>
            {item.plate}
          </Text>
          <Text style={styles.cardType} numberOfLines={1}>
            {vehicleTypeLabel}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors.primary }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {brandModel && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>
              {brandModel} {item.model_year ? `(${item.model_year})` : ''}
            </Text>
          </View>
        )}
        {Number(item.total_km) > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="speedometer-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>
              {formatNumber(Number(item.total_km), 'km')}
            </Text>
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
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="car-sport-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasFilter ? 'Araç bulunamadı' : 'Henüz araç yok'}
      </Text>
      <Text style={styles.emptyText}>
        {hasFilter
          ? 'Filtre kriterlerinize uygun araç bulunamadı'
          : 'Yeni araç eklemek için sağ üstteki + butonuna tıklayın'}
      </Text>
    </View>
  )
}

export default function VehicleListScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // API state
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (
      filter: string,
      page: number = 1,
      append: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: VehicleFilters = {
          page,
          per_page: 20,
          is_active: true,
        }

        if (filter !== 'all') {
          filters.status = filter as any
        }

        const response = await getVehicles(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setVehicles((prev) => [...prev, ...response.vehicles])
          } else {
            setVehicles(response.vehicles)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Vehicles fetch error:', err)
          setError(err instanceof Error ? err.message : 'Araçlar yüklenemedi')
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

  // Ref to avoid useFocusEffect re-triggering
  const executeFetchRef = useRef(executeFetch)
  const activeFilterRef = useRef(activeFilter)

  useEffect(() => {
    executeFetchRef.current = executeFetch
  }, [executeFetch])

  useEffect(() => {
    activeFilterRef.current = activeFilter
  }, [activeFilter])

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

  const handleCardPress = (item: Vehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/fleet/vehicle/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/fleet/vehicle/new')
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Aktif filtre sayısı
  const activeFilterCount = activeFilter !== 'all' ? 1 : 0

  // Filter Chips render
  const renderFilterChips = () => (
    <View style={styles.filterChipsContainer}>
      {STATUS_FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id
        return (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              isActive && styles.filterChipActive
            ]}
            onPress={() => {
              Haptics.selectionAsync()
              setActiveFilter(filter.id)
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon}
              size={14}
              color={isActive ? '#fff' : DashboardColors.textSecondary}
            />
            <Text style={[
              styles.filterChipText,
              isActive && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  return (
    <View style={styles.container}>
      <PageHeader
        title="Araçlar"
        icon="car-sport-outline"
        subtitle={pagination ? `${pagination.total} araç` : undefined}
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
        {/* Filter Chips */}
        {renderFilterChips()}

        {/* Active Filter Indicator */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFilterBar}>
            <View style={styles.activeFilterContent}>
              <Ionicons name="funnel" size={14} color={DashboardColors.primary} />
              <Text style={styles.activeFilterText}>
                {activeFilterCount} filtre aktif
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
            <VehicleCardSkeleton />
            <VehicleCardSkeleton />
            <VehicleCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <VehicleCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState hasFilter={activeFilter !== 'all'} />}
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

  // Filter Chips
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  filterChipActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  filterChipText: {
    fontSize: DashboardFontSizes.xs,
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
    color: DashboardColors.primary,
    fontWeight: '500'
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
  cardPlate: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardType: {
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
    gap: DashboardSpacing.xs
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
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    bottom: DashboardSpacing.lg + 4
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
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  }
})
