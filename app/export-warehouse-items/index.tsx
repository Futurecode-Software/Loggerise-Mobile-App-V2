/**
 * İhracat Deposu Malları Liste Sayfası
 *
 * CLAUDE.md ilkelerine uygun
 * PageHeader + FlatList + Durum Filtreleri + Pagination
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput
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
  getExportWarehouseItems,
  ExportWarehouseItem,
  ExportWarehouseItemFilters,
  Pagination,
  getStatusInfo,
  getPackageTypeLabel
} from '@/services/endpoints/export-warehouse-items'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'waiting', label: 'Beklemede', icon: 'hourglass-outline' as const },
  { id: 'received', label: 'Alındı', icon: 'checkmark-circle-outline' as const },
  { id: 'ready', label: 'Hazır', icon: 'checkmark-done-outline' as const },
  { id: 'loaded', label: 'Yüklendi', icon: 'car-outline' as const },
]

// Skeleton Component
function ItemCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={140} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={160} height={14} />
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface ItemCardProps {
  item: ExportWarehouseItem
  onPress: () => void
}

function ItemCard({ item, onPress }: ItemCardProps) {
  const scale = useSharedValue(1)
  const statusInfo = getStatusInfo(item.status)

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
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="cube-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardItemNumber} numberOfLines={1}>
            {item.item_number}
          </Text>
          {item.load?.load_number && (
            <Text style={styles.cardLoadNumber}>
              Yük: {item.load.load_number}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {item.description && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.description}</Text>
          </View>
        )}
        {item.customer?.name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.customer.short_name || item.customer.name}
            </Text>
          </View>
        )}
        {item.warehouse?.name && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.warehouse.name} ({item.warehouse.code})
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          {item.package_type && (
            <View style={styles.footerTag}>
              <Ionicons name="archive-outline" size={12} color={DashboardColors.primary} />
              <Text style={styles.footerTagText}>
                {getPackageTypeLabel(item.package_type)}
                {item.package_count ? ` x${item.package_count}` : ''}
              </Text>
            </View>
          )}
          {item.gross_weight_kg && (
            <View style={styles.footerTag}>
              <Ionicons name="scale-outline" size={12} color={DashboardColors.textMuted} />
              <Text style={styles.footerTagTextMuted}>{item.gross_weight_kg} kg</Text>
            </View>
          )}
        </View>
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
        <Ionicons name="cube-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz mal yok</Text>
      <Text style={styles.emptyText}>
        Yeni mal eklemek için sağ üstteki + butonuna tıklayın.
      </Text>
    </View>
  )
}

export default function ExportWarehouseItemsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // API state
  const [items, setItems] = useState<ExportWarehouseItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Arama debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchText)
    }, 500)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchText])

  // Veri çekme
  const executeFetch = useCallback(
    async (filter: string, search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        const filters: ExportWarehouseItemFilters = {
          page,
          per_page: 20,
        }

        if (filter !== 'all') {
          filters.status = filter
        }

        if (search.trim()) {
          filters.search = search.trim()
        }

        const response = await getExportWarehouseItems(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setItems(prev => [...prev, ...response.items])
          } else {
            setItems(response.items)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Export warehouse items fetch error:', err)
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
    executeFetch(activeFilter, debouncedSearch, 1, false)

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtre veya arama değişimi
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(activeFilter, debouncedSearch, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, debouncedSearch])

  // Refs for useFocusEffect
  const executeFetchRef = useRef(executeFetch)
  const activeFilterRef = useRef(activeFilter)
  const debouncedSearchRef = useRef(debouncedSearch)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    activeFilterRef.current = activeFilter
    debouncedSearchRef.current = debouncedSearch
  }, [executeFetch, activeFilter, debouncedSearch])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(activeFilterRef.current, debouncedSearchRef.current, 1, false)
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(activeFilter, debouncedSearch, 1, false)
  }

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(activeFilter, debouncedSearch, pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: ExportWarehouseItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/export-warehouse-items/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/export-warehouse-items/new')
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
        title="Depo Malları"
        icon="cube-outline"
        subtitle={pagination ? `${pagination.total} mal` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'add',
            onPress: handleNewPress,
          },
        ]}
      />

      <View style={styles.content}>
        {/* Arama */}
        <View style={styles.searchBar}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={18} color={DashboardColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Mal no, yük no, müşteri ara..."
              placeholderTextColor={DashboardColors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color={DashboardColors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

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
            <ItemCardSkeleton />
            <ItemCardSkeleton />
            <ItemCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
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
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },

  // Search Bar
  searchBar: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.xs,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    height: 44,
    gap: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingVertical: 0,
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
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
    borderColor: DashboardColors.borderLight,
  },
  filterChipActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary,
  },
  filterChipText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md,
  },
  cardItemNumber: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  cardLoadNumber: {
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
    fontWeight: '600',
  },
  cardInfo: {
    gap: DashboardSpacing.xs,
    paddingBottom: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
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
  cardFooter: {
    paddingTop: DashboardSpacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },
  footerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.md,
  },
  footerTagText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary,
  },
  footerTagTextMuted: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textMuted,
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    bottom: DashboardSpacing.lg + 8,
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
})
