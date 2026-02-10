/**
 * Beklenen Mallar Liste Sayfası
 *
 * CLAUDE.md ilkelerine uygun
 * PageHeader + FlatList + Durum Filtreleri
 * Kart üzerinde Varış Onayla / Kabul Onayla butonları
 * Backend: GET /export-warehouse-items/pending-receiving
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
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
  getPendingReceivingItems,
  confirmArrival,
  confirmReceiving,
  ExportWarehouseItem,
  getStatusInfo,
  getPackageTypeLabel
} from '@/services/endpoints/export-warehouse-items'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'expected', label: 'Bekleniyor', icon: 'time-outline' as const },
  { id: 'pending_receiving', label: 'Kabul Bekliyor', icon: 'hourglass-outline' as const },
]

// Tarih formatlama
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

// Gecikme kontrolü
const isOverdue = (dateString?: string): boolean => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

// Bugün kontrolü
const isToday = (dateString?: string): boolean => {
  if (!dateString) return false
  const today = new Date()
  const date = new Date(dateString)
  return (
    today.getDate() === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  )
}

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
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={14} />
        <Skeleton width={120} height={36} borderRadius={8} />
      </View>
    </View>
  )
}

// Card Component
interface ItemCardProps {
  item: ExportWarehouseItem
  onPress: () => void
  onAction: (item: ExportWarehouseItem) => void
  isActionLoading: boolean
  actionLoadingId: number | null
}

function ItemCard({ item, onPress, onAction, isActionLoading, actionLoadingId }: ItemCardProps) {
  const scale = useSharedValue(1)
  const statusInfo = getStatusInfo(item.status)
  const overdue = isOverdue(item.expected_arrival_date)
  const today = isToday(item.expected_arrival_date) && !overdue

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const isThisLoading = isActionLoading && actionLoadingId === item.id

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[
          styles.cardIcon,
          overdue && styles.cardIconOverdue,
          today && styles.cardIconToday,
        ]}>
          <Ionicons
            name={overdue ? 'alert-circle-outline' : 'cube-outline'}
            size={20}
            color={overdue ? '#EF4444' : today ? '#3B82F6' : DashboardColors.primary}
          />
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
        {item.expected_arrival_date && (
          <View style={styles.infoRow}>
            <Ionicons
              name={overdue ? 'alert-circle' : 'calendar-outline'}
              size={14}
              color={overdue ? '#EF4444' : today ? '#3B82F6' : DashboardColors.textMuted}
            />
            <Text style={[
              styles.infoText,
              overdue && styles.infoTextOverdue,
              today && styles.infoTextToday,
            ]}>
              {formatDate(item.expected_arrival_date)}
              {overdue && ' (Gecikmiş)'}
              {today && ' (Bugün)'}
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

        {/* Aksiyon Butonu */}
        {item.status === 'expected' && (
          <TouchableOpacity
            style={styles.arrivalButton}
            onPress={() => onAction(item)}
            disabled={isThisLoading}
            activeOpacity={0.7}
          >
            {isThisLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Varış Onayla</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {item.status === 'pending_receiving' && (
          <TouchableOpacity
            style={styles.receivingButton}
            onPress={() => onAction(item)}
            disabled={isThisLoading}
            activeOpacity={0.7}
          >
            {isThisLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Kabul Onayla</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="time-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Beklenen mal yok</Text>
      <Text style={styles.emptyText}>
        Şu anda yolda olan veya kabul bekleyen mal bulunmuyor.
      </Text>
    </View>
  )
}

export default function ExportWarehouseExpectedScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // API state
  const [allItems, setAllItems] = useState<ExportWarehouseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

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
  const executeFetch = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current

    try {
      const items = await getPendingReceivingItems()

      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setAllItems(items)
        hasInitialFetchRef.current = true
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (__DEV__) console.error('Expected items fetch error:', err)
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch()

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refs for useFocusEffect
  const executeFetchRef = useRef(executeFetch)
  useEffect(() => {
    executeFetchRef.current = executeFetch
  }, [executeFetch])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current()
      }
    }, [])
  )

  // Filtrelenmiş veri
  const filteredItems = React.useMemo(() => {
    let items = allItems

    // Durum filtresi
    if (activeFilter !== 'all') {
      items = items.filter(item => item.status === activeFilter)
    }

    // Arama filtresi
    if (debouncedSearch.trim()) {
      const search = debouncedSearch.trim().toLowerCase()
      items = items.filter(item =>
        item.item_number?.toLowerCase().includes(search) ||
        item.load?.load_number?.toLowerCase().includes(search) ||
        item.customer?.name?.toLowerCase().includes(search) ||
        item.customer?.short_name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      )
    }

    return items
  }, [allItems, activeFilter, debouncedSearch])

  // İstatistikler
  const stats = React.useMemo(() => {
    const expected = allItems.filter(i => i.status === 'expected').length
    const pendingReceiving = allItems.filter(i => i.status === 'pending_receiving').length
    return { total: allItems.length, expected, pendingReceiving }
  }, [allItems])

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch()
  }

  const handleCardPress = (item: ExportWarehouseItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/warehouse/export-expected/${item.id}`)
  }

  const handleAction = async (item: ExportWarehouseItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setActionLoadingId(item.id)

    try {
      if (item.status === 'expected') {
        await confirmArrival(item.id)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Toast.show({
          type: 'success',
          text1: 'Varış başarıyla onaylandı',
          position: 'top',
          visibilityTime: 1500,
        })
      } else if (item.status === 'pending_receiving') {
        await confirmReceiving(item.id)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Toast.show({
          type: 'success',
          text1: 'Kabul başarıyla onaylandı',
          position: 'top',
          visibilityTime: 1500,
        })
      }
      // Listeyi yenile
      await executeFetch()
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'İşlem başarısız',
        position: 'top',
        visibilityTime: 1500,
      })
    } finally {
      setActionLoadingId(null)
    }
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
        title="Beklenen Mallar"
        icon="time-outline"
        subtitle={`${stats.total} mal`}
        showBackButton
        onBackPress={handleBackPress}
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
            const count = filter.id === 'all'
              ? stats.total
              : filter.id === 'expected'
                ? stats.expected
                : stats.pendingReceiving
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
                  {filter.label} ({count})
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
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() => handleCardPress(item)}
                onAction={handleAction}
                isActionLoading={actionLoadingId !== null}
                actionLoadingId={actionLoadingId}
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
  cardIconOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cardIconToday: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
  infoTextOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  infoTextToday: {
    color: '#3B82F6',
    fontWeight: '600',
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
    flex: 1,
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

  // Action Buttons
  arrivalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    minWidth: 120,
    justifyContent: 'center',
  },
  receivingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    minWidth: 120,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
    color: '#fff',
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
