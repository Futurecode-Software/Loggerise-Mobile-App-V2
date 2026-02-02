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
import {
  getFinancialTransactions,
  FinancialTransaction,
  TransactionFilters,
  TransactionSummary,
  Pagination,
  TransactionType,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  formatAmount,
  formatDate
} from '@/services/endpoints/financial-transactions'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// İşlem tipi filtreleri
const TYPE_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'income', label: 'Gelir', icon: 'arrow-down-outline' as const },
  { id: 'expense', label: 'Gider', icon: 'arrow-up-outline' as const },
  { id: 'transfer', label: 'Transfer', icon: 'swap-horizontal-outline' as const }
]

// İşlem tipi renkleri
const TYPE_COLORS: Record<string, { primary: string; bg: string }> = {
  income: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  expense: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  transfer: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
}

// Skeleton Component
function TransactionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
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
        <Skeleton width={70} height={26} borderRadius={13} />
      </View>
    </View>
  )
}

// Card Component
interface TransactionCardProps {
  item: FinancialTransaction
  onPress: () => void
}

function TransactionCard({ item, onPress }: TransactionCardProps) {
  const scale = useSharedValue(1)
  const colors = TYPE_COLORS[item.transaction_type] || TYPE_COLORS.transfer

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const getTypeIcon = (type: TransactionType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'income':
        return 'arrow-down-outline'
      case 'expense':
        return 'arrow-up-outline'
      case 'transfer':
        return 'swap-horizontal-outline'
      default:
        return 'swap-horizontal-outline'
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
        <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name={getTypeIcon(item.transaction_type)} size={20} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.description || item.category || getTransactionTypeLabel(item.transaction_type)}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={12} color={DashboardColors.textMuted} />
            <Text style={styles.cardDate}>{formatDate(item.transaction_date)}</Text>
          </View>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.typeText, { color: colors.primary }]}>
            {getTransactionTypeLabel(item.transaction_type)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {item.contact && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.contact.name}</Text>
          </View>
        )}
        {item.reference_number && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.reference_number}</Text>
          </View>
        )}
        {item.category && (
          <View style={styles.infoRow}>
            <Ionicons name="folder-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.category}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>TUTAR</Text>
          <Text style={[
            styles.amountValue,
            { color: item.transaction_type === 'income' ? DashboardColors.success : DashboardColors.danger }
          ]}>
            {item.transaction_type === 'income' ? '+' : '-'}
            {formatAmount(item.amount, item.currency_type)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: item.status === 'approved'
              ? 'rgba(16, 185, 129, 0.12)'
              : item.status === 'pending'
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(239, 68, 68, 0.12)'
          }
        ]}>
          <Text style={[
            styles.statusText,
            {
              color: item.status === 'approved'
                ? DashboardColors.success
                : item.status === 'pending'
                  ? DashboardColors.warning
                  : DashboardColors.danger
            }
          ]}>
            {getTransactionStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Reconciled Badge */}
      {item.is_reconciled && (
        <View style={styles.reconciledBadge}>
          <Ionicons name="checkmark-circle" size={12} color={DashboardColors.success} />
        </View>
      )}

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Summary Card Component
interface SummaryCardProps {
  totalCredit: number
  totalDebit: number
  netBalance: number
  transactionCount: number
}

function SummaryCard({ totalCredit, totalDebit, netBalance, transactionCount }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.summaryGlow} />

      <View style={styles.summaryHeader}>
        <View style={styles.summaryIcon}>
          <Ionicons name="stats-chart" size={18} color="#10B981" />
        </View>
        <Text style={styles.summaryTitle}>Mali Özet</Text>
        <View style={styles.summaryCount}>
          <Text style={styles.summaryCountText}>{transactionCount}</Text>
        </View>
      </View>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="arrow-down" size={12} color="#10B981" />
          </View>
          <View>
            <Text style={styles.summaryStatLabel}>Gelir</Text>
            <Text style={[styles.summaryStatValue, { color: '#10B981' }]}>
              {formatAmount(totalCredit, 'TRY')}
            </Text>
          </View>
        </View>

        <View style={styles.summaryStatDivider} />

        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <Ionicons name="arrow-up" size={12} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.summaryStatLabel}>Gider</Text>
            <Text style={[styles.summaryStatValue, { color: '#EF4444' }]}>
              {formatAmount(totalDebit, 'TRY')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.netBalanceRow}>
        <Text style={styles.netBalanceLabel}>Net Bakiye</Text>
        <Text style={[
          styles.netBalanceValue,
          { color: netBalance >= 0 ? '#FFFFFF' : '#FCA5A5' }
        ]}>
          {formatAmount(netBalance, 'TRY')}
        </Text>
      </View>
    </View>
  )
}

// Empty State
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="swap-horizontal-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz işlem yok</Text>
      <Text style={styles.emptyText}>
        Mali işlemler burada listelenecektir.
      </Text>
    </View>
  )
}

// Error State
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.errorState}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
      </View>
      <Text style={styles.errorTitle}>Bir hata oluştu</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#fff" />
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

export default function TransactionsScreen() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['92%'], [])

  // API state
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Summary Card Carousel
  const screenWidth = Dimensions.get('window').width
  const cardWidth = screenWidth - DashboardSpacing.lg * 2

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: TransactionFilters = {
          page,
          per_page: 20,
          is_active: true
        }

        if (filter !== 'all') {
          filters.transaction_type = filter as TransactionType
        }

        const response = await getFinancialTransactions(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setTransactions((prev) => [...prev, ...response.transactions])
          } else {
            setTransactions(response.transactions)
          }
          setSummary(response.summary)
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Transactions fetch error:', err)
          setError(err instanceof Error ? err.message : 'İşlemler yüklenemedi')
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

  const handleCardPress = (item: FinancialTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/transactions/${item.id}` as any)
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

  // Aktif filtre label
  const getActiveFilterLabel = () => {
    const filter = TYPE_FILTERS.find(f => f.id === activeFilter)
    return filter?.label || 'Tümü'
  }

  // Summary Header
  const renderSummaryHeader = () => {
    if (!summary) return null

    return (
      <View style={styles.summarySection}>
        <View style={{ width: cardWidth }}>
          <SummaryCard
            totalCredit={summary.total_credit}
            totalDebit={summary.total_debit}
            netBalance={summary.net_balance}
            transactionCount={pagination?.total || 0}
          />
        </View>
      </View>
    )
  }

  // Footer loader
  const renderFooter = () => {
    if (!isLoadingMore) return null
    return (
      <View style={styles.loadingMore}>
        <Skeleton width={200} height={20} borderRadius={10} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Mali İşlemler"
        icon="swap-horizontal-outline"
        subtitle={pagination ? `${pagination.total} işlem` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightAction={{
          icon: 'funnel-outline',
          onPress: handleFilterPress
        }}
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
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
          </View>
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              setIsLoading(true)
              executeFetch(activeFilter, 1, false)
            }}
          />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TransactionCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderSummaryHeader()}
            ListEmptyComponent={<EmptyState />}
            ListFooterComponent={renderFooter()}
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
            <Text style={styles.bottomSheetTitle}>İşlem Tipi Filtresi</Text>
            <TouchableOpacity
              onPress={() => filterBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Options */}
          <View style={styles.bottomSheetBody}>
            {TYPE_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id
              const colors = filter.id !== 'all' ? TYPE_COLORS[filter.id] : null

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
                    <Ionicons
                      name={filter.icon}
                      size={20}
                      color={colors?.primary || DashboardColors.primary}
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
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.xl,
    flexGrow: 1
  },

  // Summary Section
  summarySection: {
    marginBottom: DashboardSpacing.lg
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
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.lg
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryTitle: {
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
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
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
  summaryStatLabel: {
    fontSize: DashboardFontSizes.xs,
    color: 'rgba(255,255,255,0.6)'
  },
  summaryStatValue: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700'
  },
  summaryStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: DashboardSpacing.md
  },
  netBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DashboardSpacing.md
  },
  netBalanceLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255,255,255,0.6)'
  },
  netBalanceValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800'
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
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  cardDate: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  typeText: {
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
    paddingTop: DashboardSpacing.md
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
    letterSpacing: -0.3
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  reconciledBadge: {
    position: 'absolute',
    top: DashboardSpacing.lg,
    right: DashboardSpacing.lg
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

  // Error State
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
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
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorText: {
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

  // Loading More
  loadingMore: {
    paddingVertical: DashboardSpacing.lg,
    alignItems: 'center'
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
