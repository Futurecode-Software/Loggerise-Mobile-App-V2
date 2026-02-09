/**
 * İthalat Yükleri Sayfası
 *
 * İthalat yönündeki yüklerin listelenmesi ve filtrelenmesi.
 * Dashboard teması ile modern tasarım.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
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
  BottomSheetScrollView
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
  getLoads,
  Load,
  LoadFilters,
  Pagination,
  LoadStatus,
  getStatusLabel,
  getDirectionLabel
} from '@/services/endpoints/loads'
import { DateInput } from '@/components/ui'
import {
  SearchableSelectModal,
  SearchableSelectModalRef
} from '@/components/modals/SearchableSelectModal'
import api from '@/services/api'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'pending', label: 'Beklemede', icon: 'time-outline' as const },
  { id: 'confirmed', label: 'Onaylandı', icon: 'checkmark-circle-outline' as const },
  { id: 'in_transit', label: 'Yolda', icon: 'car-outline' as const },
  { id: 'delivered', label: 'Teslim Edildi', icon: 'flag-outline' as const },
  { id: 'cancelled', label: 'İptal', icon: 'close-circle-outline' as const }
]

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  confirmed: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  in_transit: { primary: '#227d53', bg: 'rgba(34, 125, 83, 0.12)' },
  delivered: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  completed: { primary: '#13452d', bg: 'rgba(19, 69, 45, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  loading: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  assigned: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  loaded: { primary: '#227d53', bg: 'rgba(34, 125, 83, 0.12)' },
  at_customs: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  in_progress: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
}

// Skeleton Bileşeni
function LoadCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={120} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={150} height={14} />
        <Skeleton width={120} height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={16} />
      </View>
    </View>
  )
}

// Yük Kartı Bileşeni
interface LoadCardProps {
  item: Load
  onPress: () => void
}

function LoadCard({ item, onPress }: LoadCardProps) {
  const scale = useSharedValue(1)
  const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.pending

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  // Yük tipi etiketi
  const getLoadTypeLabel = (type?: string) => {
    if (type === 'full') return 'Komple'
    if (type === 'partial') return 'Parsiyel'
    return '-'
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
        <View style={[styles.cardIcon, { backgroundColor: statusColors.bg }]}>
          <Ionicons name="cube-outline" size={20} color={statusColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <View style={styles.cardHeaderTop}>
            <Text style={styles.cardNumber} numberOfLines={1}>
              {item.load_number}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </View>
          <Text style={styles.cardCargo}>{item.cargo_name || '-'}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColors.primary }]} />
              <Text style={[styles.statusText, { color: statusColors.primary }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bilgi Satırları */}
      <View style={styles.cardInfo}>
        {item.customer?.name && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.customer.name}
            </Text>
          </View>
        )}
        {item.declaration_no && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              Beyanname: {item.declaration_no}
            </Text>
          </View>
        )}
        {item.load_type && (
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>
              {getLoadTypeLabel(item.load_type)}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.directionContainer}>
          <Ionicons name="arrow-down-circle" size={14} color={DashboardColors.primary} />
          <Text style={styles.directionText}>
            {getDirectionLabel(item.direction || 'import')}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  )
}

// Özet Kartı Bileşeni
interface SummaryCardProps {
  title: string
  count: number
  icon: keyof typeof Ionicons.glyphMap
  color: string
}

function SummaryCard({ title, count, icon, color }: SummaryCardProps) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: `${color}15` }]}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}25` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryTitle}>{title}</Text>
    </View>
  )
}

// Boş Durum Bileşeni
function EmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cube-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz ithalat yükü yok'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni ithalat yükü oluşturmak için + butonuna tıklayın'}
      </Text>
    </View>
  )
}

// Hata Durumu Bileşeni
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.errorState}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle-outline" size={64} color={DashboardColors.danger} />
      </View>
      <Text style={styles.errorTitle}>Yükler yüklenemedi</Text>
      <Text style={styles.errorText}>
        Bir hata oluştu. Lütfen tekrar deneyin.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
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

export default function ImportLoadsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const customerFilterRef = useRef<SearchableSelectModalRef>(null)
  const snapPoints = useMemo(() => ['90%'], [])

  // API state
  const [loads, setLoads] = useState<Load[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [filterCustomerId, setFilterCustomerId] = useState('')
  const [filterCustomerLabel, setFilterCustomerLabel] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Customer data
  const [customers, setCustomers] = useState<{ id: number; name: string; code?: string }[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Filter refs (executeFetch yeniden oluşturulmadan erişim için)
  const filterCustomerIdRef = useRef('')
  const filterDateFromRef = useRef('')
  const filterDateToRef = useRef('')

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (search: string, filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: LoadFilters = {
          page,
          per_page: 20,
          direction: 'import', // Sadece ithalat yükleri
          is_active: true,
          assigned_to_trip: 'all'
        }

        if (search.trim()) {
          filters.search = search.trim()
        }

        if (filter !== 'all') {
          filters.status = filter as LoadStatus
        }

        if (filterCustomerIdRef.current) {
          filters.customer_id = Number(filterCustomerIdRef.current)
        }

        if (filterDateFromRef.current) {
          filters.date_from = filterDateFromRef.current
        }

        if (filterDateToRef.current) {
          filters.date_to = filterDateToRef.current
        }

        const response = await getLoads(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setLoads((prev) => [...prev, ...response.loads])
          } else {
            setLoads(response.loads)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Loads fetch error:', err)
          setError(err instanceof Error ? err.message : 'Yükler yüklenemedi')
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

  // Müşteri listesini yükle
  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true)
      try {
        const response = await api.get('/contacts', {
          params: { per_page: 100, is_active: true, type: 'customer' }
        })
        let list: { id: number; name: string; code?: string }[] = []
        if (response.data?.data?.contacts) {
          list = response.data.data.contacts
        } else if (Array.isArray(response.data?.data)) {
          list = response.data.data
        } else if (Array.isArray(response.data)) {
          list = response.data
        }
        if (isMountedRef.current) setCustomers(list)
      } catch (err) {
        if (__DEV__) console.error('Failed to load customers:', err)
      } finally {
        if (isMountedRef.current) setLoadingCustomers(false)
      }
    }
    loadCustomers()
  }, [])

  // Filter ref senkronizasyonu
  useEffect(() => {
    filterCustomerIdRef.current = filterCustomerId
    filterDateFromRef.current = filterDateFrom
    filterDateToRef.current = filterDateTo
  }, [filterCustomerId, filterDateFrom, filterDateTo])

  // Filter değişimi (müşteri ve tarih)
  useEffect(() => {
    if (!hasInitialFetchRef.current) return
    setIsLoading(true)
    executeFetch(searchQuery, activeFilter, 1, false)
  }, [filterCustomerId, filterDateFrom, filterDateTo])

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

  // Refs for useFocusEffect to avoid re-triggering
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
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true)
      executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true)
    }
  }

  // Özet istatistikler
  const getSummaryStats = () => {
    const stats = {
      total: loads.length,
      pending: loads.filter(l => l.status === 'pending').length,
      inTransit: loads.filter(l => l.status === 'in_transit').length,
      delivered: loads.filter(l => l.status === 'delivered' || l.status === 'completed').length
    }
    return stats
  }

  const stats = getSummaryStats()

  // Event handlers
  const handleCardPress = (item: Load) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/logistics/load/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/logistics/load/new?direction=import')
  }

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    filterBottomSheetRef.current?.present()
  }

  const handleFilterSelect = (filterId: string) => {
    Haptics.selectionAsync()
    setActiveFilter(filterId)
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const handleRetry = () => {
    setIsLoading(true)
    executeFetch(searchQuery, activeFilter, 1, false)
  }

  // Müşteri seçenekleri
  const customerOptions = useMemo(() =>
    customers.map((c) => ({
      label: c.code ? `${c.name} (${c.code})` : c.name,
      value: String(c.id)
    })),
    [customers]
  )

  // Aktif filtre kontrolü
  const hasActiveFilters = activeFilter !== 'all' || !!filterCustomerId || !!filterDateFrom || !!filterDateTo

  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setActiveFilter('all')
    setFilterCustomerId('')
    setFilterCustomerLabel('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  // Müşteri filtresi seçim handler'ı
  const handleCustomerFilterSelect = (option: any) => {
    setFilterCustomerId(String(option.value))
    setFilterCustomerLabel(option.label)
  }

  // Müşteri filtresini temizle
  const clearCustomerFilter = () => {
    setFilterCustomerId('')
    setFilterCustomerLabel('')
  }

  // Aktif filtre etiketi
  const getActiveFilterLabel = () => {
    const filter = STATUS_FILTERS.find(f => f.id === activeFilter)
    return filter?.label || 'Tümü'
  }

  // Özet Header'ı
  const renderSummaryHeader = () => (
    <View style={styles.summarySection}>
      <SummaryCard
        title="Toplam"
        count={stats.total}
        icon="cube-outline"
        color={DashboardColors.primary}
      />
      <SummaryCard
        title="Beklemede"
        count={stats.pending}
        icon="time-outline"
        color={DashboardColors.warning}
      />
      <SummaryCard
        title="Yolda"
        count={stats.inTransit}
        icon="car-outline"
        color={DashboardColors.info}
      />
      <SummaryCard
        title="Teslim"
        count={stats.delivered}
        icon="flag-outline"
        color={DashboardColors.success}
      />
    </View>
  )

  // Liste footer'ı (daha fazla yükleme göstergesi)
  const renderListFooter = () => {
    if (!isLoadingMore) return null
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={DashboardColors.primary} />
        <Text style={styles.loadMoreText}>Daha fazla yükleniyor...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="İthalat Yükleri"
        icon="download-outline"
        subtitle={pagination ? `${pagination.total} yük` : undefined}
        showBackButton
        onBackPress={handleBackPress}
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
        {/* Arama */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={DashboardColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Yük numarası, kargo veya müşteri ara..."
              placeholderTextColor={DashboardColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Aktif Filtre Göstergesi */}
        {hasActiveFilters && (
          <View style={styles.activeFilterBar}>
            <View style={styles.activeFilterChips}>
              <Ionicons name="funnel" size={14} color={DashboardColors.primary} />
              {activeFilter !== 'all' && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setActiveFilter('all')}
                >
                  <Text style={styles.filterChipText}>{getActiveFilterLabel()}</Text>
                  <Ionicons name="close-circle" size={14} color={DashboardColors.primary} />
                </TouchableOpacity>
              )}
              {filterCustomerId && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={clearCustomerFilter}
                >
                  <Text style={styles.filterChipText} numberOfLines={1}>
                    {filterCustomerLabel}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={DashboardColors.primary} />
                </TouchableOpacity>
              )}
              {filterDateFrom && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setFilterDateFrom('')}
                >
                  <Text style={styles.filterChipText}>{filterDateFrom}</Text>
                  <Ionicons name="close-circle" size={14} color={DashboardColors.primary} />
                </TouchableOpacity>
              )}
              {filterDateTo && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setFilterDateTo('')}
                >
                  <Text style={styles.filterChipText}>{filterDateTo}</Text>
                  <Ionicons name="close-circle" size={14} color={DashboardColors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={clearAllFilters}
              style={styles.clearFilterButton}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Liste */}
        {isLoading ? (
          <View style={styles.listContent}>
            {renderSummaryHeader()}
            <LoadCardSkeleton />
            <LoadCardSkeleton />
            <LoadCardSkeleton />
          </View>
        ) : error ? (
          <ErrorState onRetry={handleRetry} />
        ) : (
          <FlatList
            data={loads}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <LoadCard item={item} onPress={() => handleCardPress(item)} />
            )}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderSummaryHeader()}
            ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
            ListFooterComponent={renderListFooter()}
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

      {/* Filtre BottomSheet */}
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
        <BottomSheetScrollView style={styles.bottomSheetContent}>
          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHeaderIcon}>
              <Ionicons name="funnel" size={20} color={DashboardColors.primary} />
            </View>
            <Text style={styles.bottomSheetTitle}>Filtreler</Text>
            <TouchableOpacity
              onPress={() => filterBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSheetBody}>
            {/* Durum Filtresi */}
            <Text style={styles.filterSectionTitle}>Durum</Text>
            <View style={styles.filterSectionContent}>
              {STATUS_FILTERS.map((filter) => {
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
                      { backgroundColor: DashboardColors.primaryGlow }
                    ]}>
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={DashboardColors.primary}
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

            {/* Müşteri Filtresi */}
            <Text style={styles.filterSectionTitle}>Müşteri</Text>
            <TouchableOpacity
              style={[
                styles.filterSelectTrigger,
                filterCustomerId ? styles.filterSelectTriggerActive : null
              ]}
              onPress={() => customerFilterRef.current?.present()}
            >
              <Ionicons name="business-outline" size={20} color={filterCustomerId ? DashboardColors.primary : DashboardColors.textMuted} />
              <Text
                style={[
                  styles.filterSelectText,
                  !filterCustomerId && styles.filterSelectPlaceholder
                ]}
                numberOfLines={1}
              >
                {filterCustomerLabel || 'Müşteri seçiniz...'}
              </Text>
              {filterCustomerId ? (
                <TouchableOpacity onPress={clearCustomerFilter} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={20} color={DashboardColors.primary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
              )}
            </TouchableOpacity>

            {/* Tarih Aralığı */}
            <Text style={styles.filterSectionTitle}>Tarih Aralığı</Text>
            <DateInput
              label="Başlangıç Tarihi"
              placeholder="Tarih seçiniz"
              value={filterDateFrom}
              onChangeDate={setFilterDateFrom}
            />
            <DateInput
              label="Bitiş Tarihi"
              placeholder="Tarih seçiniz"
              value={filterDateTo}
              onChangeDate={setFilterDateTo}
            />

            {/* Filtreleri Temizle */}
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAllFilters}
              >
                <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
                <Text style={styles.clearAllButtonText}>Tüm Filtreleri Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Müşteri Seçim Modal'ı */}
      <SearchableSelectModal
        ref={customerFilterRef}
        title="Müşteri Seçiniz"
        options={customerOptions}
        selectedValue={filterCustomerId}
        onSelect={handleCustomerFilterSelect}
        searchPlaceholder="Müşteri ara..."
        emptyMessage="Müşteri bulunamadı"
        loading={loadingCustomers}
      />
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
    paddingVertical: DashboardSpacing.md,
    backgroundColor: DashboardColors.background
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    ...DashboardShadows.sm
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingVertical: 0
  },

  // Aktif Filtre Barı
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
  activeFilterChips: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.primaryGlow,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
    gap: 4,
    maxWidth: 160
  },
  filterChipText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary,
    flexShrink: 1
  },
  clearFilterButton: {
    padding: DashboardSpacing.xs
  },

  // Liste
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.xl
  },

  // Özet Bölümü
  summarySection: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.lg,
    paddingHorizontal: DashboardSpacing.xs
  },
  summaryCard: {
    flex: 1,
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center'
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xs
  },
  summaryCount: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '800',
    marginBottom: 2
  },
  summaryTitle: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },

  // Kart
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
    gap: 2
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardNumber: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    flex: 1
  },
  cardCargo: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginTop: DashboardSpacing.xs
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
    gap: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
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
    color: DashboardColors.textSecondary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    backgroundColor: DashboardColors.primaryGlow,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.md
  },
  directionText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary
  },

  // Daha Fazla Yükleme
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing.lg,
    gap: DashboardSpacing.sm
  },
  loadMoreText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },

  // Boş Durum
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
    marginBottom: DashboardSpacing.xl,
    ...DashboardShadows.sm
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

  // Hata Durumu
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF'
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
    gap: DashboardSpacing.sm,
    paddingBottom: DashboardSpacing['3xl']
  },
  filterSectionTitle: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.md,
    marginBottom: DashboardSpacing.xs
  },
  filterSectionContent: {
    gap: DashboardSpacing.sm
  },
  filterSelectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  filterSelectTriggerActive: {
    backgroundColor: DashboardColors.primaryGlow,
    borderColor: DashboardColors.primary
  },
  filterSelectText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  filterSelectPlaceholder: {
    color: DashboardColors.textMuted
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.dangerBg,
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.md
  },
  clearAllButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.danger
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
