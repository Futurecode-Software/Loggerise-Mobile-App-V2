/**
 * Faturalar Liste Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern liste sayfası
 * Referans: app/cash-register/index.tsx
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  Pressable
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
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
  BottomSheetView,
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
  getInvoices,
  Invoice,
  InvoiceFilters,
  InvoiceType,
  InvoiceStatus,
  PaymentStatus,
  Pagination,
  getInvoiceTypeLabel,
  getPaymentStatusLabel,
  formatInvoiceTotal
} from '@/services/endpoints/invoices'
import { formatBalance } from '@/services/endpoints/cash-registers'
import { formatDate } from '@/utils/formatters'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Fatura tipi filtreleri
const TYPE_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'sale', label: 'Satış', icon: 'trending-up-outline' as const },
  { id: 'purchase', label: 'Alış', icon: 'trending-down-outline' as const },
  { id: 'service', label: 'Hizmet', icon: 'construct-outline' as const }
]

// Durum filtreleri
const STATUS_FILTERS: { id: 'all' | InvoiceStatus; label: string; color: string }[] = [
  { id: 'all', label: 'Tümü', color: '#6B7280' },
  { id: 'draft', label: 'Taslak', color: '#6B7280' },
  { id: 'approved', label: 'Onaylı', color: '#10B981' },
  { id: 'cancelled', label: 'İptal', color: '#EF4444' }
]

// Ödeme durumu filtreleri
const PAYMENT_FILTERS: { id: 'all' | PaymentStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' },
  { id: 'pending', label: 'Bekliyor', icon: 'time-outline' },
  { id: 'paid', label: 'Ödendi', icon: 'checkmark-circle-outline' },
  { id: 'overdue', label: 'Vadesi Geçti', icon: 'alert-circle-outline' }
]

// Tip renkleri
const TYPE_COLORS: Record<string, { primary: string; bg: string }> = {
  sale: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  purchase: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  service: { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' }
}

// Ödeme durumu renkleri
const PAYMENT_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  paid: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  partial: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  overdue: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

// Skeleton Component
function InvoiceCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={140} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
      <View style={styles.cardFooter}>
        <View>
          <Skeleton width={60} height={12} />
          <Skeleton width={120} height={24} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={70} height={28} borderRadius={14} />
      </View>
    </View>
  )
}

// Card Component
interface InvoiceCardProps {
  item: Invoice
  onPress: () => void
}

function InvoiceCard({ item, onPress }: InvoiceCardProps) {
  const scale = useSharedValue(1)
  const typeColors = TYPE_COLORS[item.type] || TYPE_COLORS.sale
  const paymentColors = PAYMENT_COLORS[item.payment_status] || PAYMENT_COLORS.pending

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
        <View style={[styles.cardIcon, { backgroundColor: typeColors.bg }]}>
          <Ionicons name="document-text-outline" size={20} color={typeColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.invoice_no || `#${item.id}`}
          </Text>
          <Text style={styles.cardCode} numberOfLines={1}>
            {item.contact?.name || 'Cari belirtilmemiş'}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
          <Text style={[styles.typeBadgeText, { color: typeColors.primary }]}>
            {getInvoiceTypeLabel(item.type)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText}>{formatDate(item.invoice_date)}</Text>
        </View>
        {item.due_date && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>Vade: {formatDate(item.due_date)}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>TOPLAM</Text>
          <Text style={styles.amountValue}>
            {formatInvoiceTotal(item)}
          </Text>
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: paymentColors.bg }]}>
          <Text style={[styles.paymentBadgeText, { color: paymentColors.primary }]}>
            {getPaymentStatusLabel(item.payment_status)}
          </Text>
        </View>
      </View>

      {/* Status Dot */}
      <View style={[
        styles.statusDot,
        { backgroundColor: item.status === 'approved' ? DashboardColors.success :
          item.status === 'cancelled' ? DashboardColors.danger : DashboardColors.textMuted }
      ]} />

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Summary Card Component
interface SummaryCardProps {
  currency: string
  total: number
  count: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
}

function SummaryCard({ currency, total, count, paidAmount, pendingAmount, overdueAmount }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.summaryGlow, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]} />

      <View style={styles.summaryHeader}>
        <View style={styles.summaryIcon}>
          <Ionicons name="trending-up" size={18} color="#10B981" />
        </View>
        <Text style={styles.summaryCurrency}>{currency}</Text>
        <View style={styles.summaryCount}>
          <Text style={styles.summaryCountText}>{count}</Text>
        </View>
      </View>

      <Text style={styles.summaryLabel}>Toplam Tutar</Text>
      <Text style={styles.summaryTotal}>
        {formatBalance(total, currency as any)}
      </Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="checkmark" size={12} color="#10B981" />
          </View>
          <Text style={styles.summaryStatValue}>{formatBalance(paidAmount, currency as any)}</Text>
          <Text style={styles.summaryStatLabel}>Ödendi</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
            <Ionicons name="time" size={12} color="#F59E0B" />
          </View>
          <Text style={styles.summaryStatValue}>{formatBalance(pendingAmount, currency as any)}</Text>
          <Text style={styles.summaryStatLabel}>Bekliyor</Text>
        </View>
        {overdueAmount > 0 && (
          <>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStat}>
              <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="alert" size={12} color="#EF4444" />
              </View>
              <Text style={[styles.summaryStatValue, { color: '#FCA5A5' }]}>
                {formatBalance(overdueAmount, currency as any)}
              </Text>
              <Text style={styles.summaryStatLabel}>Vadesi Geçti</Text>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

// Empty State
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="document-text-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz fatura yok</Text>
      <Text style={styles.emptyText}>
        Yeni fatura eklemek için sağ üstteki + butonuna tıklayın.
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

export default function InvoicesListScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeTypeFilter, setActiveTypeFilter] = useState('all')
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | InvoiceStatus>('all')
  const [activePaymentFilter, setActivePaymentFilter] = useState<'all' | PaymentStatus>('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], []);

  // API state
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  // Carousel state
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0)
  const carouselRef = useRef<FlatList>(null)
  const screenWidth = Dimensions.get('window').width
  const cardWidth = screenWidth - DashboardSpacing.lg * 2 - 24

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (
      typeFilter: string,
      statusFilter: 'all' | InvoiceStatus,
      paymentFilter: 'all' | PaymentStatus,
      page: number = 1,
      append: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: InvoiceFilters = {
          page,
          per_page: 20
        }

        if (typeFilter !== 'all') {
          filters.type = typeFilter as InvoiceType
        }
        if (statusFilter !== 'all') {
          filters.status = statusFilter
        }
        if (paymentFilter !== 'all') {
          filters.payment_status = paymentFilter
        }

        const response = await getInvoices(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setInvoices((prev) => [...prev, ...response.invoices])
          } else {
            setInvoices(response.invoices)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Invoices fetch error:', err)
          setError(err instanceof Error ? err.message : 'Faturalar yüklenemedi')
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
    executeFetch(activeTypeFilter, activeStatusFilter, activePaymentFilter, 1, false)

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Filtre değişimi
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(activeTypeFilter, activeStatusFilter, activePaymentFilter, 1, false)
  }, [activeTypeFilter, activeStatusFilter, activePaymentFilter])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(activeTypeFilter, activeStatusFilter, activePaymentFilter, 1, false)
      }
    }, [activeTypeFilter, activeStatusFilter, activePaymentFilter, executeFetch])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(activeTypeFilter, activeStatusFilter, activePaymentFilter, 1, false)
  }

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(
        activeTypeFilter,
        activeStatusFilter,
        activePaymentFilter,
        pagination.current_page + 1,
        true
      )
    }
  }

  // Para birimi bazında toplamlar
  const getTotals = () => {
    const totals: Record<string, {
      total: number
      count: number
      paid: number
      pending: number
      overdue: number
    }> = {}

    invoices.forEach((inv) => {
      const currency = inv.currency_type || 'TRY'
      if (!totals[currency]) {
        totals[currency] = { total: 0, count: 0, paid: 0, pending: 0, overdue: 0 }
      }
      totals[currency].total += inv.total
      totals[currency].count++
      if (inv.payment_status === 'paid') totals[currency].paid += inv.total
      else if (inv.payment_status === 'pending') totals[currency].pending += inv.total
      else if (inv.payment_status === 'overdue') totals[currency].overdue += inv.total
    })
    return totals
  }

  const totals = getTotals()

  const handleCardPress = (item: Invoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/invoices/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/accounting/invoices/new')
  }

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    filterBottomSheetRef.current?.present()
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const clearFilters = () => {
    setActiveTypeFilter('all')
    setActiveStatusFilter('all')
    setActivePaymentFilter('all')
    filterBottomSheetRef.current?.dismiss()
  }

  const applyFilters = () => {
    Haptics.selectionAsync()
    filterBottomSheetRef.current?.dismiss()
  }

  // Aktif filtre sayısı
  const activeFilterCount = [
    activeTypeFilter !== 'all',
    activeStatusFilter !== 'all',
    activePaymentFilter !== 'all'
  ].filter(Boolean).length

  // Carousel scroll
  const scrollToIndex = (index: number) => {
    const entries = Object.entries(totals)
    if (index < 0 || index >= entries.length) return

    carouselRef.current?.scrollToOffset({
      offset: index * (cardWidth + DashboardSpacing.md),
      animated: true
    })
    setActiveCarouselIndex(index)
  }

  // Summary Header
  const renderSummaryHeader = () => {
    const entries = Object.entries(totals)
    if (entries.length === 0) return null

    return (
      <View style={styles.summarySection}>
        <FlatList
          ref={carouselRef}
          data={entries}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + DashboardSpacing.md}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          keyExtractor={([currency]) => currency}
          renderItem={({ item: [currency, data] }) => (
            <View style={{ width: cardWidth }}>
              <SummaryCard
                currency={currency}
                total={data.total}
                count={data.count}
                paidAmount={data.paid}
                pendingAmount={data.pending}
                overdueAmount={data.overdue}
              />
            </View>
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / (cardWidth + DashboardSpacing.md)
            )
            setActiveCarouselIndex(index)
          }}
        />

        {/* Pagination Dots */}
        {entries.length > 1 && (
          <View style={styles.paginationDots}>
            {entries.map(([currency], index) => (
              <TouchableOpacity
                key={currency}
                onPress={() => scrollToIndex(index)}
                style={[
                  styles.paginationDot,
                  index === activeCarouselIndex && styles.paginationDotActive
                ]}
              >
                <Text style={[
                  styles.paginationDotText,
                  index === activeCarouselIndex && styles.paginationDotTextActive
                ]}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Faturalar"
        icon="document-text-outline"
        subtitle={pagination ? `${pagination.total} fatura` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'funnel-outline',
            onPress: handleFilterPress,
            badge: activeFilterCount > 0 ? activeFilterCount : undefined
          },
          {
            icon: 'add',
            onPress: handleNewPress
          }
        ]}
      />

      <View style={styles.content}>
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
              onPress={clearFilters}
              style={styles.clearFilterButton}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <InvoiceCardSkeleton />
            <InvoiceCardSkeleton />
            <InvoiceCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={invoices}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <InvoiceCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderSummaryHeader()}
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
            <Text style={styles.bottomSheetTitle}>Filtreler</Text>
            <TouchableOpacity
              onPress={() => filterBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <BottomSheetScrollView style={styles.bottomSheetBody}>
            {/* Type Filters */}
            <Text style={styles.filterSectionTitle}>Fatura Tipi</Text>
            <View style={styles.filterOptions}>
              {TYPE_FILTERS.map((filter) => {
                const isActive = activeTypeFilter === filter.id
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.filterOption,
                      isActive && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync()
                      setActiveTypeFilter(filter.id)
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.filterOptionIcon,
                      { backgroundColor: isActive ? DashboardColors.primaryGlow : DashboardColors.background }
                    ]}>
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={isActive ? DashboardColors.primary : DashboardColors.textMuted}
                      />
                    </View>
                    <Text style={[
                      styles.filterOptionLabel,
                      isActive && styles.filterOptionLabelActive
                    ]}>
                      {filter.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={24} color={DashboardColors.primary} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Status Filters */}
            <Text style={styles.filterSectionTitle}>Fatura Durumu</Text>
            <View style={styles.filterOptions}>
              {STATUS_FILTERS.map((filter) => {
                const isActive = activeStatusFilter === filter.id
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.filterOption,
                      isActive && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync()
                      setActiveStatusFilter(filter.id)
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.filterOptionIcon,
                      { backgroundColor: isActive ? `${filter.color}20` : DashboardColors.background }
                    ]}>
                      <View style={[styles.filterColorDot, { backgroundColor: filter.color }]} />
                    </View>
                    <Text style={[
                      styles.filterOptionLabel,
                      isActive && { color: filter.color }
                    ]}>
                      {filter.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={24} color={filter.color} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Payment Filters */}
            <Text style={styles.filterSectionTitle}>Ödeme Durumu</Text>
            <View style={styles.filterOptions}>
              {PAYMENT_FILTERS.map((filter) => {
                const isActive = activePaymentFilter === filter.id
                const colors = PAYMENT_COLORS[filter.id] || { primary: DashboardColors.primary, bg: DashboardColors.primaryGlow }
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.filterOption,
                      isActive && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync()
                      setActivePaymentFilter(filter.id)
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.filterOptionIcon,
                      { backgroundColor: isActive ? colors.bg : DashboardColors.background }
                    ]}>
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={isActive ? colors.primary : DashboardColors.textMuted}
                      />
                    </View>
                    <Text style={[
                      styles.filterOptionLabel,
                      isActive && { color: colors.primary }
                    ]}>
                      {filter.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
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

  // Summary Section
  summarySection: {
    marginBottom: DashboardSpacing.lg
  },
  carouselContent: {
    gap: DashboardSpacing.md
  },
  summaryCard: {
    padding: DashboardSpacing.xl,
    borderRadius: DashboardBorderRadius.xl,
    backgroundColor: DashboardColors.primary,
    overflow: 'hidden',
    position: 'relative'
  },
  summaryGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryCurrency: {
    flex: 1,
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: DashboardSpacing.sm
  },
  summaryCount: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  summaryCountText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: DashboardSpacing.xs
  },
  summaryTotal: {
    fontSize: DashboardFontSizes['4xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: DashboardSpacing.lg
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  summaryStatIcon: {
    width: 28,
    height: 28,
    borderRadius: DashboardBorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryStatValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  summaryStatLabel: {
    fontSize: DashboardFontSizes.xs,
    color: 'rgba(255,255,255,0.6)'
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: DashboardSpacing.sm
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.md
  },
  paginationDot: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.surface,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  paginationDotActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  paginationDotText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textMuted
  },
  paginationDotTextActive: {
    color: '#FFFFFF'
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
    fontWeight: '500'
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  typeBadgeText: {
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
    alignItems: 'flex-end',
    paddingTop: 0,
  },
  amountContainer: {},
  amountLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  amountValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    color: DashboardColors.textPrimary,
    letterSpacing: -0.3
  },
  paymentBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full
  },
  paymentBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
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
    padding: DashboardSpacing.lg
  },
  filterSectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.md,
    marginTop: DashboardSpacing.md
  },
  filterOptions: {
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
  filterColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6
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
  filterActions: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
    marginTop: DashboardSpacing.xl,
    paddingBottom: DashboardSpacing.xl
  },
  clearButton: {
    flex: 1,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    alignItems: 'center'
  },
  clearButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  applyButton: {
    flex: 1,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
    alignItems: 'center'
  },
  applyButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF'
  }
})
