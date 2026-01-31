/**
 * Yükler Listesi Ekranı
 *
 * Ana yük listesi - filtreleme, arama ve infinite scroll
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Pressable
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import { PageHeader } from '@/components/navigation'
import { LoadListSkeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  LoadStatusColors,
  LoadStatusBgColors,
  LoadStatusLabels,
  LoadDirectionColors,
  LoadDirectionBgColors,
  LoadDirectionLabels,
  STATUS_FILTER_OPTIONS,
  DIRECTION_FILTER_OPTIONS
} from '@/constants/load-theme'
import { getLoads } from '@/services/endpoints/loads'
import type { Load, LoadStatus, LoadDirection, Pagination } from '@/types/load'
import { formatCurrency } from '@/utils/currency'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Yük kartı bileşeni
interface LoadCardProps {
  item: Load
  onPress: () => void
}

function LoadCard({ item, onPress }: LoadCardProps) {
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

  // Rota bilgisi oluştur
  const routeInfo = () => {
    const sender = item.sender_company?.name || '-'
    const receiver = item.receiver_company?.name || '-'
    return `${sender} → ${receiver}`
  }

  // Navlun formatla
  const formatPrice = (amount?: number, currency?: string) => {
    if (!amount) return '-'
    return formatCurrency(amount, currency || 'TRY', { decimals: 0, symbolPosition: 'after' })
  }

  return (
    <View>
      <AnimatedPressable
        style={[styles.loadCard, animStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Üst kısım - Yük No ve Yön */}
        <View style={styles.cardHeader}>
          <View style={styles.loadNumberContainer}>
            <View style={styles.loadNumberIcon}>
              <Ionicons
                name="cube"
                size={14}
                color={DashboardColors.primary}
              />
            </View>
            <Text style={styles.loadNumber}>{item.load_number}</Text>
          </View>

          <View style={styles.badgeRow}>
            {/* Yön Badge */}
            {item.direction && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: LoadDirectionBgColors[item.direction] }
                ]}
              >
                <Ionicons
                  name={item.direction === 'export' ? 'arrow-up-circle' : 'arrow-down-circle'}
                  size={12}
                  color={LoadDirectionColors[item.direction]}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: LoadDirectionColors[item.direction] }
                  ]}
                >
                  {LoadDirectionLabels[item.direction]}
                </Text>
              </View>
            )}

            {/* Durum Badge */}
            <View
              style={[
                styles.badge,
                { backgroundColor: LoadStatusBgColors[item.status] }
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: LoadStatusColors[item.status] }
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: LoadStatusColors[item.status] }
                ]}
              >
                {LoadStatusLabels[item.status]}
              </Text>
            </View>
          </View>
        </View>

        {/* Kargo Adı */}
        <Text style={styles.cargoName} numberOfLines={1}>
          {item.cargo_name || 'Kargo adı belirtilmemiş'}
        </Text>

        {/* Rota */}
        <View style={styles.routeContainer}>
          <Ionicons
            name="location-outline"
            size={14}
            color={DashboardColors.textSecondary}
          />
          <Text style={styles.routeText} numberOfLines={1}>
            {routeInfo()}
          </Text>
        </View>

        {/* Alt kısım - Araç, Navlun, Müşteri */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {item.vehicle_type && (
              <View style={styles.footerItem}>
                <Ionicons
                  name="car-outline"
                  size={14}
                  color={DashboardColors.textMuted}
                />
                <Text style={styles.footerText}>{item.vehicle_type}</Text>
              </View>
            )}
            {item.freight_fee && (
              <View style={styles.footerItem}>
                <Ionicons
                  name="cash-outline"
                  size={14}
                  color={DashboardColors.accent}
                />
                <Text style={[styles.footerText, styles.priceText]}>
                  {formatPrice(item.freight_fee, item.freight_fee_currency)}
                </Text>
              </View>
            )}
          </View>

          {item.customer && (
            <View style={styles.customerBadge}>
              <Ionicons
                name="business-outline"
                size={12}
                color={DashboardColors.textSecondary}
              />
              <Text style={styles.customerText} numberOfLines={1}>
                {item.customer.name}
              </Text>
            </View>
          )}
        </View>

        {/* Sağ ok */}
        <View style={styles.cardArrow}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={DashboardColors.textMuted}
          />
        </View>
      </AnimatedPressable>
    </View>
  )
}

// Filtre çipi bileşeni
interface FilterChipProps {
  label: string
  isActive: boolean
  color?: string
  onPress: () => void
}

function FilterChip({ label, isActive, color, onPress }: FilterChipProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.95, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const activeColor = color || DashboardColors.primary

  return (
    <AnimatedPressable
      style={[
        styles.filterChip,
        isActive && { backgroundColor: activeColor, borderColor: activeColor },
        animStyle
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text
        style={[
          styles.filterChipText,
          isActive && styles.filterChipTextActive
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  )
}

export default function LoadsScreen() {
  const router = useRouter()

  // State
  const [loads, setLoads] = useState<Load[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')
  const [activeDirectionFilter, setActiveDirectionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const debounceTimeoutRef = useRef<number | undefined>(undefined)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (
      search: string,
      status: string,
      direction: string,
      page: number,
      append: boolean
    ) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        const filters: Record<string, unknown> = {
          page,
          per_page: 15
        }

        if (search.trim()) filters.search = search.trim()
        if (status !== 'all') filters.status = status
        if (direction !== 'all') filters.direction = direction

        const result = await getLoads(filters as Parameters<typeof getLoads>[0])

        if (!isMountedRef.current || currentFetchId !== fetchIdRef.current) {
          return
        }

        // Güvenli erişim - API yanıtını kontrol et
        if (!result) {
          throw new Error('API yanıtı alınamadı')
        }

        const loadsList = result.loads || []
        const paginationData = result.pagination || {
          current_page: 1,
          per_page: 15,
          total: 0,
          last_page: 1,
          from: null,
          to: null
        }

        if (append) {
          setLoads(prev => [...prev, ...loadsList])
        } else {
          setLoads(loadsList)
        }

        setPagination(paginationData)
        setError(null)
        hasInitialFetchRef.current = true
      } catch (err) {
        if (isMountedRef.current && currentFetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Yükler yüklenemedi')
        }
      } finally {
        if (isMountedRef.current && currentFetchId === fetchIdRef.current) {
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
    executeFetch(searchQuery, activeStatusFilter, activeDirectionFilter, 1, false)

    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current !== undefined) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtre değişikliğinde yeniden yükle
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(searchQuery, activeStatusFilter, activeDirectionFilter, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatusFilter, activeDirectionFilter])

  // Arama debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    if (debounceTimeoutRef.current !== undefined) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true)
      executeFetch(searchQuery, activeStatusFilter, activeDirectionFilter, 1, false)
    }, 500) as unknown as number

    return () => {
      if (debounceTimeoutRef.current !== undefined) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Sayfa odaklandığında yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, activeStatusFilter, activeDirectionFilter, 1, false)
      }
    }, [searchQuery, activeStatusFilter, activeDirectionFilter, executeFetch])
  )

  // Yenile (pull-to-refresh)
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    executeFetch(searchQuery, activeStatusFilter, activeDirectionFilter, 1, false)
  }, [searchQuery, activeStatusFilter, activeDirectionFilter, executeFetch])

  // Daha fazla yükle
  const loadMore = useCallback(() => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(
        searchQuery,
        activeStatusFilter,
        activeDirectionFilter,
        pagination.current_page + 1,
        true
      )
    }
  }, [
    isLoadingMore,
    pagination,
    searchQuery,
    activeStatusFilter,
    activeDirectionFilter,
    executeFetch
  ])

  // Yük detayına git
  const handleLoadPress = (load: Load) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/load/${load.id}`)
  }

  // Yeni yük oluştur
  const handleCreateLoad = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/load/new')
  }

  // Liste alt kısmı render
  const renderFooter = () => {
    if (!isLoadingMore) return null

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={DashboardColors.primary} />
        <Text style={styles.footerLoaderText}>Yükleniyor...</Text>
      </View>
    )
  }

  // Boş durum render
  const renderEmptyState = () => {
    if (isLoading) {
      return <LoadListSkeleton count={6} />
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={DashboardColors.danger}
            />
          </View>
          <Text style={styles.emptyStateTitle}>Bir hata oluştu</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true)
              setError(null)
              executeFetch(
                searchQuery,
                activeStatusFilter,
                activeDirectionFilter,
                1,
                false
              )
            }}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="cube-outline"
            size={48}
            color={DashboardColors.textMuted}
          />
        </View>
        <Text style={styles.emptyStateTitle}>Yük bulunamadı</Text>
        <Text style={styles.emptyStateText}>
          {searchQuery || activeStatusFilter !== 'all' || activeDirectionFilter !== 'all'
            ? 'Arama kriterlerinize uygun yük bulunamadı.'
            : 'Henüz kayıtlı yük bulunmuyor.'}
        </Text>
        {!searchQuery && activeStatusFilter === 'all' && activeDirectionFilter === 'all' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateLoad}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createButtonText}>Yeni Yük Oluştur</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <PageHeader
        title="Yükler"
        icon="cube-outline"
        subtitle={
          pagination?.total
            ? `${pagination.total} yük listeleniyor`
            : 'Yük takibi ve yönetimi'
        }
        rightAction={{
          icon: 'add',
          onPress: handleCreateLoad
        }}
      />

      {/* İçerik */}
      <View style={styles.content}>
        {/* Arama Kutusu */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search"
              size={20}
              color={DashboardColors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Yük no, kargo adı veya müşteri ara..."
              placeholderTextColor={DashboardColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={DashboardColors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtreler */}
        <View style={styles.filtersContainer}>
          {/* Yön Filtreleri */}
          <View style={styles.filterSection}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={DIRECTION_FILTER_OPTIONS}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <FilterChip
                  label={item.label}
                  isActive={activeDirectionFilter === item.id}
                  color={
                    item.id !== 'all'
                      ? LoadDirectionColors[item.id as LoadDirection]
                      : undefined
                  }
                  onPress={() => setActiveDirectionFilter(item.id)}
                />
              )}
            />
          </View>

          {/* Durum Filtreleri */}
          <View style={styles.filterSection}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={STATUS_FILTER_OPTIONS}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <FilterChip
                  label={item.label}
                  isActive={activeStatusFilter === item.id}
                  color={
                    item.id !== 'all'
                      ? LoadStatusColors[item.id as LoadStatus]
                      : undefined
                  }
                  onPress={() => setActiveStatusFilter(item.id)}
                />
              )}
            />
          </View>
        </View>

        {/* Yük Listesi */}
        <FlatList
          data={loads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <LoadCard
              item={item}
              onPress={() => handleLoadPress(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            loads.length === 0 && styles.listContentEmpty
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DashboardColors.primary}
              colors={[DashboardColors.primary]}
            />
          }
        />
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

  // Arama
  searchContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.sm
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  searchIcon: {
    marginRight: DashboardSpacing.sm
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  clearButton: {
    padding: DashboardSpacing.xs
  },

  // Filtreler
  filtersContainer: {
    paddingBottom: DashboardSpacing.sm
  },
  filterSection: {
    marginBottom: DashboardSpacing.xs
  },
  filterList: {
    paddingHorizontal: DashboardSpacing.lg,
    gap: DashboardSpacing.sm
  },
  filterChip: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.surface,
    borderWidth: 1,
    borderColor: DashboardColors.border
  },
  filterChipText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  filterChipTextActive: {
    color: '#fff'
  },

  // Liste
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  listContentEmpty: {
    flex: 1
  },

  // Yük Kartı
  loadCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DashboardSpacing.sm
  },
  loadNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  loadNumberIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadNumber: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3
  },
  badgeRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.xs
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.full,
    gap: 4
  },
  badgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  cargoName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.md,
    paddingRight: DashboardSpacing['2xl']
  },
  routeText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  footerLeft: {
    flexDirection: 'row',
    gap: DashboardSpacing.lg
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  footerText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  priceText: {
    fontWeight: '600',
    color: DashboardColors.accent
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 140,
    backgroundColor: DashboardColors.background,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.sm
  },
  customerText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    top: '50%',
    marginTop: -10
  },

  // Boş durum
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl']
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
    ...DashboardShadows.sm
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyStateTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyStateText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  createButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  },

  // Alt yükleme
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.xl
  },
  footerLoaderText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  }
})
