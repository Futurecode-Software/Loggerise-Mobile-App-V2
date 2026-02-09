/**
 * Domestic Transport Orders List Screen
 *
 * Lists all domestic transport orders with search and filter functionality.
 * Matches web version at /yurtici-tasimacilik
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge, Input } from '@/components/ui'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  getDomesticOrders,
  DomesticTransportOrder,
  DomesticOrderStatus,
  DomesticOrderFilters,
  Pagination,
  getOrderStatusLabel,
  getOrderStatusVariant,
  getOrderTypeLabel,
  getOrderTypeColor,
  getDriverFullName,
  formatDate
} from '@/services/endpoints/domestic-orders'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'draft', label: 'Taslak', icon: 'document-text-outline' as const },
  { id: 'planned', label: 'Planlandı', icon: 'clipboard-outline' as const },
  { id: 'assigned', label: 'Atandı', icon: 'person-outline' as const },
  { id: 'in_transit', label: 'Yolda', icon: 'car-outline' as const },
  { id: 'completed', label: 'Tamamlandı', icon: 'checkmark-circle-outline' as const },
  { id: 'cancelled', label: 'İptal', icon: 'close-circle-outline' as const }
]

// Skeleton Component
function DomesticOrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Skeleton width={120} height={18} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={12} />
        <Skeleton width={100} height={12} />
      </View>
    </View>
  )
}

// Card Component
interface DomesticOrderCardProps {
  item: DomesticTransportOrder
  onPress: () => void
}

function DomesticOrderCard({ item, onPress }: DomesticOrderCardProps) {
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

  return (
    <AnimatedPressable
      style={[styles.orderCard, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderTop}>
          <Text style={styles.orderNumber} numberOfLines={1}>{item.order_number}</Text>
          <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
        </View>
        <View style={styles.orderBadgeRow}>
          <View style={[styles.orderTypeBadge, { backgroundColor: getOrderTypeColor(item.order_type) + '20' }]}>
            <Text style={[styles.orderTypeText, { color: getOrderTypeColor(item.order_type) }]}>
              {getOrderTypeLabel(item.order_type)}
            </Text>
          </View>
          <Badge label={getOrderStatusLabel(item.status)} variant={getOrderStatusVariant(item.status) as any} size="sm" />
        </View>
      </View>

      {/* Customer */}
      {item.customer && (
        <View style={styles.customerContainer}>
          <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.customerText} numberOfLines={1}>{item.customer.name}</Text>
          {item.customer.code && (
            <Text style={styles.customerCode}>({item.customer.code})</Text>
          )}
        </View>
      )}

      {/* Addresses */}
      <View style={styles.addressContainer}>
        {item.pickup_address && (
          <View style={styles.addressRow}>
            <View style={[styles.addressDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickup_address.title || item.pickup_address.address || 'Alım Adresi'}
            </Text>
          </View>
        )}
        {item.delivery_address && (
          <View style={styles.addressRow}>
            <View style={[styles.addressDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.delivery_address.title || item.delivery_address.address || 'Teslimat Adresi'}
            </Text>
          </View>
        )}
      </View>

      {/* Vehicle & Driver */}
      {(item.vehicle || item.driver) && (
        <View style={styles.assignmentContainer}>
          {item.vehicle && (
            <View style={styles.assignmentItem}>
              <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.assignmentText}>{item.vehicle.plate}</Text>
            </View>
          )}
          {item.driver && (
            <View style={styles.assignmentItem}>
              <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.assignmentText}>{getDriverFullName(item.driver)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Alım:</Text>
          <Text style={styles.dateValue}>{formatDate(item.pickup_expected_date)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={14} color={DashboardColors.textMuted} />
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Teslimat:</Text>
          <Text style={styles.dateValue}>{formatDate(item.delivery_expected_date)}</Text>
        </View>
        {item.is_delayed && (
          <View style={styles.delayedBadge}>
            <Ionicons name="alert-circle" size={12} color="#ef4444" />
            <Text style={styles.delayedText}>Gecikmiş</Text>
          </View>
        )}
      </View>

    </AnimatedPressable>
  )
}

// Empty State
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cube-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz iş emri eklenmemiş'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni iş emri eklemek için + butonuna tıklayın'}
      </Text>
    </View>
  )
}

export default function DomesticOrdersScreen() {

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [orders, setOrders] = useState<DomesticTransportOrder[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitialFetchRef = useRef(false)

  // Core fetch function
  const executeFetch = useCallback(
    async (search: string, filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: DomesticOrderFilters = {
          page,
          per_page: 20,
          is_active: true
        }

        if (search.trim()) {
          filters.search = search.trim()
        }

        if (filter !== 'all') {
          filters.status = filter as DomesticOrderStatus
        }

        const response = await getDomesticOrders(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setOrders((prev) => [...prev, ...response.orders])
          } else {
            setOrders(response.orders)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Domestic orders fetch error:', err)
          setError(err instanceof Error ? err.message : 'İş emirleri yüklenemedi')
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

  // Initial fetch
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

  // Filter change
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(searchQuery, activeFilter, 1, false)
  }, [activeFilter])

  // Search with debounce
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

  // Refs for useFocusEffect to avoid re-triggering
  const executeFetchRef = useRef(executeFetch)
  const searchQueryRef = useRef(searchQuery)
  const activeFilterRef = useRef(activeFilter)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    searchQueryRef.current = searchQuery
    activeFilterRef.current = activeFilter
  }, [executeFetch, searchQuery, activeFilter])

  // Refresh on screen focus
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

  return (
    <View style={styles.container}>
      <PageHeader
        title="Yurtiçi İş Emirleri"
        icon="cube-outline"
        subtitle={pagination ? `${pagination.total} iş emri` : undefined}
        showBackButton
        onBackPress={() => router.back()}
        rightActions={[
          {
            icon: 'add',
            onPress: () => router.push('/logistics/domestic/new')
          }
        ]}
      />

      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Sipariş no veya müşteri ile ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search" size={20} color={DashboardColors.textMuted} />}
            containerStyle={styles.searchInput}
          />
        </View>

        {/* Active Filter Bar */}
        {activeFilter !== 'all' && (
          <View style={styles.activeFilterBar}>
            <View style={styles.activeFilterContent}>
              <Ionicons name="funnel" size={14} color={DashboardColors.primary} />
              <Text style={styles.activeFilterText}>
                Filtre: <Text style={styles.activeFilterValue}>
                  {STATUS_FILTERS.find(f => f.id === activeFilter)?.label || 'Tümü'}
                </Text>
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
            <DomesticOrderCardSkeleton />
            <DomesticOrderCardSkeleton />
            <DomesticOrderCardSkeleton />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="alert-circle-outline" size={64} color={DashboardColors.danger} />
            </View>
            <Text style={styles.emptyTitle}>Bir hata oluştu</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true)
                executeFetch(searchQuery, activeFilter, 1, false)
              }}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <DomesticOrderCard
                item={item}
                onPress={() => router.push(`/logistics/domestic/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={DashboardColors.primary} />
                </View>
              ) : null
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

  // Search
  searchContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background
  },
  searchInput: {
    marginBottom: 0
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

  // Order Card
  orderCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    position: 'relative',
    ...DashboardShadows.md
  },
  orderHeader: {
    marginBottom: DashboardSpacing.sm,
    gap: DashboardSpacing.sm
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs
  },
  orderNumber: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  orderTypeBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm
  },
  orderTypeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500'
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.sm
  },
  customerText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  customerCode: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  addressContainer: {
    marginBottom: DashboardSpacing.sm,
    gap: DashboardSpacing.xs
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  addressText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    flex: 1
  },
  assignmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.sm
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  assignmentText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  dateLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  dateValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  delayedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginLeft: 'auto'
  },
  delayedText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: '#ef4444'
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
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.xl,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.danger
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  loadingMore: {
    paddingVertical: DashboardSpacing.lg,
    alignItems: 'center'
  }
})
