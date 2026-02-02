/**
 * Çekler Liste Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern tasarım
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
import {
  getChecks,
  Check,
  CheckFilters,
  CheckStatus,
  Pagination,
  getCheckTypeLabel,
  getCheckStatusLabel,
  formatCheckAmount
} from '@/services/endpoints/checks'
import { formatDate } from '@/utils/formatters'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'pending', label: 'Beklemede', icon: 'time-outline' as const },
  { id: 'cleared', label: 'Tahsil Edildi', icon: 'checkmark-circle-outline' as const },
  { id: 'bounced', label: 'Karşılıksız', icon: 'alert-circle-outline' as const },
  { id: 'cancelled', label: 'İptal', icon: 'close-circle-outline' as const }
]

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  transferred: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  cleared: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  bounced: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  cancelled: { primary: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' }
}

// Tip renkleri
const TYPE_COLORS: Record<string, { primary: string; bg: string }> = {
  received: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  issued: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
}

// Skeleton Component
function CheckCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={140} height={14} />
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
interface CheckCardProps {
  item: Check
  onPress: () => void
}

function CheckCard({ item, onPress }: CheckCardProps) {
  const scale = useSharedValue(1)
  const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.pending
  const typeColors = TYPE_COLORS[item.type] || TYPE_COLORS.received
  const isReceived = item.type === 'received'

  // Vadeye kalan gün
  const daysUntilDue = Math.ceil(
    (new Date(item.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

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
          <Ionicons
            name={isReceived ? 'arrow-down-outline' : 'arrow-up-outline'}
            size={20}
            color={typeColors.primary}
          />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.check_number}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.contact?.name || '-'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.primary }]}>
            {getCheckStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>{item.bank_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText}>
            Vade: {formatDate(item.due_date, 'dd.MM.yyyy')}
            {daysUntilDue > 0 && daysUntilDue <= 30 && item.status === 'pending' && (
              <Text style={{ color: DashboardColors.warning }}> ({daysUntilDue} gün)</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>TUTAR</Text>
          <Text style={styles.amountValue}>
            {formatCheckAmount(item.amount, item.currency_type)}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
          <Text style={[styles.typeText, { color: typeColors.primary }]}>
            {getCheckTypeLabel(item.type)}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Summary Card Component
interface SummaryCardProps {
  totalAmount: number
  pendingAmount: number
  clearedAmount: number
  checkCount: number
}

function SummaryCard({ totalAmount, pendingAmount, clearedAmount, checkCount }: SummaryCardProps) {
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
          <Ionicons name="trending-up" size={18} color="#fff" />
        </View>
        <Text style={styles.summaryCurrency}>Çek Özeti</Text>
        <View style={styles.summaryCount}>
          <Text style={styles.summaryCountText}>{checkCount}</Text>
        </View>
      </View>

      <Text style={styles.summaryLabel}>Toplam Tutar</Text>
      <Text style={styles.summaryTotal}>
        {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
      </Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="checkmark" size={12} color="#10B981" />
          </View>
          <Text style={styles.summaryStatValue}>
            {clearedAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </Text>
          <Text style={styles.summaryStatLabel}>Tahsil</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
            <Ionicons name="time" size={12} color="#F59E0B" />
          </View>
          <Text style={styles.summaryStatValue}>
            {pendingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </Text>
          <Text style={styles.summaryStatLabel}>Beklemede</Text>
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
        <Ionicons name="document-text-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz çek yok</Text>
      <Text style={styles.emptyText}>
        Yeni çek eklemek için sağ üstteki + butonuna tıklayın.
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

export default function ChecksScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['92%'], [])

  // API state
  const [checks, setChecks] = useState<Check[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

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

        const filters: CheckFilters = {
          page,
          per_page: 20
        }

        if (filter !== 'all') {
          filters.status = filter as CheckStatus
        }

        const response = await getChecks(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setChecks((prev) => [...prev, ...response.checks])
          } else {
            setChecks(response.checks)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Checks fetch error:', err)
          setError(err instanceof Error ? err.message : 'Çekler yüklenemedi')
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

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(activeFilter, 1, false)
      }
    }, [activeFilter, executeFetch])
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

  // Toplamlar
  const getTotals = () => {
    const totalAmount = checks.reduce(
      (acc, check) => acc + (parseFloat(String(check.amount)) || 0),
      0
    )
    const pendingAmount = checks
      .filter(c => c.status === 'pending')
      .reduce((acc, check) => acc + (parseFloat(String(check.amount)) || 0), 0)
    const clearedAmount = checks
      .filter(c => c.status === 'cleared')
      .reduce((acc, check) => acc + (parseFloat(String(check.amount)) || 0), 0)
    return { totalAmount, pendingAmount, clearedAmount }
  }

  const totals = getTotals()

  const handleCardPress = (item: Check) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/check/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/accounting/check/new')
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
    const filter = STATUS_FILTERS.find(f => f.id === activeFilter)
    return filter?.label || 'Tümü'
  }

  // Summary Header
  const renderSummaryHeader = () => {
    if (checks.length === 0) return null

    return (
      <View style={styles.summarySection}>
        <SummaryCard
          totalAmount={totals.totalAmount}
          pendingAmount={totals.pendingAmount}
          clearedAmount={totals.clearedAmount}
          checkCount={checks.length}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Çekler"
        icon="document-text-outline"
        subtitle={pagination ? `${pagination.total} çek` : undefined}
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
            <CheckCardSkeleton />
            <CheckCardSkeleton />
            <CheckCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={checks}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <CheckCard
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
            <Text style={styles.bottomSheetTitle}>Durum Filtresi</Text>
            <TouchableOpacity
              onPress={() => filterBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Options */}
          <View style={styles.bottomSheetBody}>
            {STATUS_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id
              const colors = filter.id !== 'all' ? STATUS_COLORS[filter.id] : null

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
    paddingBottom: DashboardSpacing.xl
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
    marginBottom: DashboardSpacing.md
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    paddingTop: DashboardSpacing.md,
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
  cardSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
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
    color: DashboardColors.primary,
    letterSpacing: -0.3
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full
  },
  typeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
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
