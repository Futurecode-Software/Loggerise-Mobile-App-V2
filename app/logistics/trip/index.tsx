/**
 * Seferler Liste Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern liste sayfası
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
  getDriverFullName,
  getTrips,
  getTripStatusLabel,
  getTripStatusVariant,
  getTripTypeLabel,
  getVehicleOwnerTypeLabel,
  Pagination,
  Trip,
  TripFilters,
  TripStatus,
} from '@/services/endpoints/trips'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS: { id: 'all' | TripStatus; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline', color: '#6B7280' },
  { id: 'planning', label: 'Planlama', icon: 'time-outline', color: '#F59E0B' },
  { id: 'active', label: 'Aktif', icon: 'pulse-outline', color: '#3B82F6' },
  { id: 'completed', label: 'Tamamlandı', icon: 'checkmark-circle-outline', color: '#10B981' },
  { id: 'cancelled', label: 'İptal', icon: 'close-circle-outline', color: '#EF4444' },
]

// Status renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  planning: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  active: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  completed: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

// Skeleton Component
function TripCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={140} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface TripCardProps {
  item: Trip
  onPress: () => void
}

function TripCard({ item, onPress }: TripCardProps) {
  const scale = useSharedValue(1)
  const statusColors = STATUS_COLORS[item.status || 'active'] || STATUS_COLORS.active

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  // Tarih formatlama
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

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
          <Ionicons name="car-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.trip_number || '-'}
          </Text>
          {item.trip_type && (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {getTripTypeLabel(item.trip_type)}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors.primary }]}>
            {getTripStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Transport Type Badges */}
      {(item.is_roro || item.is_train || item.is_mafi) && (
        <View style={styles.transportBadges}>
          {item.is_roro && (
            <View style={[styles.transportBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Ionicons name="boat-outline" size={12} color="#3B82F6" />
              <Text style={[styles.transportText, { color: '#3B82F6' }]}>RoRo</Text>
            </View>
          )}
          {item.is_train && (
            <View style={[styles.transportBadge, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
              <Ionicons name="train-outline" size={12} color="#8B5CF6" />
              <Text style={[styles.transportText, { color: '#8B5CF6' }]}>Tren</Text>
            </View>
          )}
          {item.is_mafi && (
            <View style={[styles.transportBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Ionicons name="cube-outline" size={12} color="#F59E0B" />
              <Text style={[styles.transportText, { color: '#F59E0B' }]}>Mafi</Text>
            </View>
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.cardInfo}>
        {item.route && (
          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.route}</Text>
          </View>
        )}
        {(item.truck_tractor || item.trailer) && (
          <View style={styles.infoRow}>
            <Ionicons name="car-sport-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>
              {item.truck_tractor?.plate || '-'}
              {item.trailer && ` → ${item.trailer.plate}`}
            </Text>
          </View>
        )}
        {item.driver && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>
              {getDriverFullName(item.driver)}
              {item.second_driver && ` + ${getDriverFullName(item.second_driver)}`}
            </Text>
          </View>
        )}
        {item.manual_location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={DashboardColors.success} />
            <Text style={styles.infoText} numberOfLines={1}>{item.manual_location}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.statItem}>
          <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.statText}>{getVehicleOwnerTypeLabel(item.vehicle_owner_type)}</Text>
        </View>
        {(item.loads?.length ?? 0) > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={14} color={DashboardColors.primary} />
            <Text style={[styles.statText, { color: DashboardColors.primary, fontWeight: '600' }]}>
              {item.loads.length} yük
            </Text>
          </View>
        )}
        {item.estimated_arrival_date && (
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.statText}>{formatDate(item.estimated_arrival_date)}</Text>
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
function EmptyState({ hasSearch, hasError, errorMessage, onRetry }: {
  hasSearch: boolean
  hasError: boolean
  errorMessage?: string
  onRetry?: () => void
}) {
  if (hasError) {
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        </View>
        <Text style={styles.emptyTitle}>Bir hata oluştu</Text>
        <Text style={styles.emptyText}>{errorMessage || 'Seferler yüklenemedi'}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="car-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasSearch ? 'Sonuç bulunamadı' : 'Henüz sefer yok'}
      </Text>
      <Text style={styles.emptyText}>
        {hasSearch
          ? 'Farklı bir arama terimi deneyin'
          : 'Seferler pozisyonlar aracılığıyla otomatik oluşturulur'}
      </Text>
    </View>
  )
}

export default function TripsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | TripStatus>('all')

  // API state
  const [trips, setTrips] = useState<Trip[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)
  const activeFilterRef = useRef(activeFilter)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (
      filter: 'all' | TripStatus,
      page: number = 1,
      append: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: TripFilters = {
          page,
          per_page: 20,
          is_active: true,
        }

        if (filter !== 'all') {
          filters.status = filter
        }

        const response = await getTrips(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setTrips((prev) => [...prev, ...response.trips])
          } else {
            setTrips(response.trips)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Trips fetch error:', err)
          setError(err instanceof Error ? err.message : 'Seferler yüklenemedi')
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
  }, [])

  // Filtre değişimi
  useEffect(() => {
    activeFilterRef.current = activeFilter
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(activeFilter, 1, false)
  }, [activeFilter])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(activeFilterRef.current, 1, false)
      }
    }, [executeFetch])
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

  const handleCardPress = (item: Trip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/logistics/trip/${item.id}`)
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
        title="Seferler"
        icon="car-outline"
        subtitle={pagination ? `${pagination.total} sefer` : undefined}
        showBackButton
        onBackPress={handleBackPress}
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
            <TripCardSkeleton />
            <TripCardSkeleton />
            <TripCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TripCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                hasSearch={false}
                hasError={!!error}
                errorMessage={error || undefined}
                onRetry={() => {
                  setIsLoading(true)
                  executeFetch(activeFilter, 1, false)
                }}
              />
            }
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

  // Transport Badges
  transportBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.sm
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm
  },
  transportText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500'
  },

  // Info
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

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    gap: DashboardSpacing.lg
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  statText: {
    fontSize: DashboardFontSizes.xs,
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
  },
  retryButton: {
    marginTop: DashboardSpacing.xl,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.primary
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  }
})
