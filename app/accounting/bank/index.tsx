/**
 * Banka Hesapları Liste Sayfası
 *
 * Modern tasarım - CLAUDE.md ilkelerine uygun
 * Referans: cash-register/index.tsx
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
import { getCurrencyColors } from '@/constants/currencies'
import {
  getBanks,
  Bank,
  BankFilters,
  Pagination,
  CurrencyType,
  formatBalance
} from '@/services/endpoints/banks'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Para birimi filtreleri
const CURRENCY_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'TRY', label: 'TRY', symbol: '₺' },
  { id: 'USD', label: 'USD', symbol: '$' },
  { id: 'EUR', label: 'EUR', symbol: '€' },
  { id: 'GBP', label: 'GBP', symbol: '£' }
]

// Skeleton Component
function BankCardSkeleton() {
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
      <View style={styles.cardFooter}>
        <View>
          <Skeleton width={60} height={12} />
          <Skeleton width={120} height={24} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  )
}

// Card Component
interface BankCardProps {
  item: Bank
  onPress: () => void
}

function BankCard({ item, onPress }: BankCardProps) {
  const scale = useSharedValue(1)
  const colors = getCurrencyColors(item.currency_type)

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
        <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name="business-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.branch && (
            <Text style={styles.cardCode}>{item.branch}</Text>
          )}
        </View>
        <View style={[styles.currencyBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.currencyText, { color: colors.primary }]}>
            {item.currency_type}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {item.iban && (
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.iban}</Text>
          </View>
        )}
        {item.account_number && (
          <View style={styles.infoRow}>
            <Ionicons name="keypad-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              **** **** {item.account_number.slice(-4)}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>BAKİYE</Text>
          <Text style={[
            styles.balanceValue,
            { color: item.balance >= 0 ? DashboardColors.success : DashboardColors.danger }
          ]}>
            {formatBalance(item.balance, item.currency_type)}
          </Text>
        </View>
        <View style={styles.openingContainer}>
          <Text style={styles.openingLabel}>Açılış</Text>
          <Text style={styles.openingValue}>
            {formatBalance(item.opening_balance, item.currency_type)}
          </Text>
        </View>
      </View>

      {/* Status Dot */}
      <View style={[
        styles.statusDot,
        { backgroundColor: item.is_active ? DashboardColors.success : DashboardColors.textMuted }
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
  positiveCount: number
  negativeCount: number
}

function SummaryCard({ currency, total, count, positiveCount, negativeCount }: SummaryCardProps) {
  const colors = getCurrencyColors(currency)

  return (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.summaryGlow, { backgroundColor: colors.bg }]} />

      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name="business" size={18} color={colors.primary} />
        </View>
        <Text style={styles.summaryCurrency}>{currency}</Text>
        <View style={styles.summaryCount}>
          <Text style={styles.summaryCountText}>{count}</Text>
        </View>
      </View>

      <Text style={styles.summaryLabel}>Toplam Bakiye</Text>
      <Text style={[
        styles.summaryTotal,
        { color: total >= 0 ? '#FFFFFF' : '#FCA5A5' }
      ]}>
        {formatBalance(total, currency as CurrencyType)}
      </Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="arrow-up" size={12} color="#10B981" />
          </View>
          <Text style={styles.summaryStatValue}>{positiveCount}</Text>
          <Text style={styles.summaryStatLabel}>Pozitif</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <Ionicons name="arrow-down" size={12} color="#EF4444" />
          </View>
          <Text style={styles.summaryStatValue}>{negativeCount}</Text>
          <Text style={styles.summaryStatLabel}>Negatif</Text>
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
      <Text style={styles.emptyTitle}>Henüz banka hesabı yok</Text>
      <Text style={styles.emptyText}>
        Yeni banka hesabı eklemek için sağ üstteki + butonuna tıklayın.
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

export default function BankAccountsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], []);

  // API state
  const [banks, setBanks] = useState<Bank[]>([])
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
    async (filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: BankFilters = {
          page,
          per_page: 20,
          is_active: true
        }

        if (filter !== 'all') {
          filters.currency_type = filter as CurrencyType
        }

        const response = await getBanks(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setBanks((prev) => [...prev, ...response.banks])
          } else {
            setBanks(response.banks)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Banks fetch error:', err)
          setError(err instanceof Error ? err.message : 'Banka hesapları yüklenemedi')
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
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(activeFilter, 1, false)
  }, [activeFilter])

  // Ref to store executeFetch and activeFilter to avoid useFocusEffect re-triggering
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

  // Para birimi bazında toplamlar
  const getTotals = () => {
    const totals: Record<string, { total: number; count: number; positive: number; negative: number }> = {}
    banks.forEach((bank) => {
      if (!totals[bank.currency_type]) {
        totals[bank.currency_type] = { total: 0, count: 0, positive: 0, negative: 0 }
      }
      totals[bank.currency_type].total += bank.balance
      totals[bank.currency_type].count++
      if (bank.balance > 0) totals[bank.currency_type].positive++
      if (bank.balance < 0) totals[bank.currency_type].negative++
    })
    return totals
  }

  const totals = getTotals()

  const handleCardPress = (item: Bank) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/bank/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/accounting/bank/new')
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

  // Aktif filtre label
  const getActiveFilterLabel = () => {
    const filter = CURRENCY_FILTERS.find(f => f.id === activeFilter)
    return filter?.label || 'Tümü'
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
                positiveCount={data.positive}
                negativeCount={data.negative}
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
        title="Banka Hesapları"
        icon="business-outline"
        subtitle={pagination ? `${pagination.total} hesap` : undefined}
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
            <BankCardSkeleton />
            <BankCardSkeleton />
            <BankCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={banks}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <BankCard
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
            <Text style={styles.bottomSheetTitle}>Döviz Filtresi</Text>
            <TouchableOpacity
              onPress={() => filterBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Options */}
          <View style={styles.bottomSheetBody}>
            {CURRENCY_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id
              const colors = filter.id !== 'all' ? getCurrencyColors(filter.id) : null

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
                    {filter.icon ? (
                      <Ionicons
                        name={filter.icon}
                        size={20}
                        color={colors?.primary || DashboardColors.primary}
                      />
                    ) : (
                      <Text style={[
                        styles.filterOptionSymbol,
                        { color: colors?.primary || DashboardColors.primary }
                      ]}>
                        {filter.symbol}
                      </Text>
                    )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  summaryStatIcon: {
    width: 28,
    height: 28,
    borderRadius: DashboardBorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryStatValue: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  summaryStatLabel: {
    fontSize: DashboardFontSizes.xs,
    color: 'rgba(255,255,255,0.6)'
  },
  summaryStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: DashboardSpacing.md
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
  currencyBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  currencyText: {
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
  balanceContainer: {},
  balanceLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  balanceValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    letterSpacing: -0.3
  },
  openingContainer: {
    alignItems: 'flex-end'
  },
  openingLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginBottom: 2
  },
  openingValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textSecondary
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

  // BottomSheet - iOS Modal Style
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
  filterOptionSymbol: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700'
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
