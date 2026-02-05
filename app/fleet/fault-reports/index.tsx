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
  getFaultReports,
  FaultReport,
  FaultReportFilters,
  Pagination,
  getFaultTypeLabel,
  getSeverityLabel,
  getFaultStatusLabel,
  getFaultStatusColor
} from '@/services/endpoints/fleet'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Önem seviyesi filtreleri
const SEVERITY_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'low', label: 'Düşük', icon: 'alert-circle-outline' as const, color: '#22c55e' },
  { id: 'medium', label: 'Orta', icon: 'alert-outline' as const, color: '#f5a623' },
  { id: 'high', label: 'Yüksek', icon: 'warning-outline' as const, color: '#f97316' },
  { id: 'critical', label: 'Kritik', icon: 'alert-outline' as const, color: '#ef4444' }
]

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'pending', label: 'Beklemede', icon: 'time-outline' as const, color: '#f5a623' },
  { id: 'in_progress', label: 'İşlemde', icon: 'construct-outline' as const, color: '#3b82f6' },
  { id: 'resolved', label: 'Çözüldü', icon: 'checkmark-circle-outline' as const, color: '#22c55e' },
  { id: 'cancelled', label: 'İptal', icon: 'close-circle-outline' as const, color: '#6B7280' }
]

// Severity renkleri
const SEVERITY_COLORS: Record<string, { primary: string; bg: string }> = {
  low: { primary: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  medium: { primary: '#f5a623', bg: 'rgba(245, 166, 35, 0.12)' },
  high: { primary: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  critical: { primary: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }
}

// Skeleton Component
function FaultReportCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={140} height={14} />
        <Skeleton width={120} height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={12} />
        <Skeleton width={100} height={24} style={{ marginTop: 4 }} />
      </View>
    </View>
  )
}

// Card Component
interface FaultReportCardProps {
  item: FaultReport
  onPress: () => void
}

function FaultReportCard({ item, onPress }: FaultReportCardProps) {
  const scale = useSharedValue(1)
  const colors = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.low

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const vehicleInfo = item.vehicle
    ? `${item.vehicle.plate}${
        item.vehicle.brand || item.vehicle.model
          ? ` • ${[item.vehicle.brand, item.vehicle.model].filter(Boolean).join(' ')}`
          : ''
      }`
    : 'Araç bilgisi yok'

  const reportedBy =
    item.reported_by_employee?.full_name ||
    item.reported_by_user?.name ||
    'Bilinmiyor'

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
          <Ionicons name="warning" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            Arıza #{item.id}
          </Text>
          <Text style={styles.cardCode}>{vehicleInfo}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.severityText, { color: colors.primary }]}>
            {getSeverityLabel(item.severity)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="construct-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {getFaultTypeLabel(item.fault_type)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {reportedBy}
          </Text>
        </View>
      </View>

      {/* Description */}
      {item.description && (
        <View style={styles.cardDescription}>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>BİLDİRİM TARİHİ</Text>
          <Text style={styles.dateValue}>
            {new Date(item.reported_at).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, {
          backgroundColor: getFaultStatusColor(item.status) + '20',
          borderColor: getFaultStatusColor(item.status)
        }]}>
          <Text style={[styles.statusText, { color: getFaultStatusColor(item.status) }]}>
            {getFaultStatusLabel(item.status)}
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
  severity: string
  count: number
  pendingCount: number
  resolvedCount: number
}

function SummaryCard({ severity, count, pendingCount, resolvedCount }: SummaryCardProps) {
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low

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
          <Ionicons name="warning" size={18} color={colors.primary} />
        </View>
        <Text style={styles.summarySeverity}>{getSeverityLabel(severity)}</Text>
        <View style={styles.summaryCount}>
          <Text style={styles.summaryCountText}>{count}</Text>
        </View>
      </View>

      <Text style={styles.summaryLabel}>Toplam Arıza</Text>
      <Text style={styles.summaryTotal}>{count} Kayıt</Text>

      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(245, 166, 35, 0.2)' }]}>
            <Ionicons name="time" size={12} color="#f5a623" />
          </View>
          <Text style={styles.summaryStatValue}>{pendingCount}</Text>
          <Text style={styles.summaryStatLabel}>Beklemede</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStat}>
          <View style={[styles.summaryStatIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
            <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
          </View>
          <Text style={styles.summaryStatValue}>{resolvedCount}</Text>
          <Text style={styles.summaryStatLabel}>Çözüldü</Text>
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
        <Ionicons name="checkmark-done-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Arıza kaydı yok</Text>
      <Text style={styles.emptyText}>
        Henüz arıza bildirimi yapılmamış. Tüm araçlar sorunsuz çalışıyor.
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

export default function FaultReportsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeSeverityFilter, setActiveSeverityFilter] = useState('all')
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')

  // BottomSheet refs
  const severityBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], []);

  // API state
  const [faultReports, setFaultReports] = useState<FaultReport[]>([])
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
    async (severityFilter: string, statusFilter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: FaultReportFilters = {
          page,
          per_page: 20,
          sort_by: 'created_at',
          sort_order: 'desc'
        }

        if (severityFilter !== 'all') {
          filters.severity = severityFilter
        }

        if (statusFilter !== 'all') {
          filters.status = statusFilter
        }

        const response = await getFaultReports(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setFaultReports((prev) => [...prev, ...response.fault_reports])
          } else {
            setFaultReports(response.fault_reports)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Fault reports fetch error:', err)
          setError(err instanceof Error ? err.message : 'Arıza bildirimleri yüklenemedi')
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
    executeFetch(activeSeverityFilter, activeStatusFilter, 1, false)

    return () => {
      isMountedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtre değişimi
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(activeSeverityFilter, activeStatusFilter, 1, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeverityFilter, activeStatusFilter])

  // Ref to store executeFetch and filters
  const executeFetchRef = useRef(executeFetch)
  const activeSeverityFilterRef = useRef(activeSeverityFilter)
  const activeStatusFilterRef = useRef(activeStatusFilter)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    activeSeverityFilterRef.current = activeSeverityFilter
    activeStatusFilterRef.current = activeStatusFilter
  }, [executeFetch, activeSeverityFilter, activeStatusFilter])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(
          activeSeverityFilterRef.current,
          activeStatusFilterRef.current,
          1,
          false
        )
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(activeSeverityFilter, activeStatusFilter, 1, false)
  }

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(activeSeverityFilter, activeStatusFilter, pagination.current_page + 1, true)
    }
  }

  // Önem seviyesi bazında toplamlar
  const getSeveritySummary = () => {
    const summary: Record<string, { count: number; pending: number; resolved: number }> = {}
    faultReports.forEach((report) => {
      if (!summary[report.severity]) {
        summary[report.severity] = { count: 0, pending: 0, resolved: 0 }
      }
      summary[report.severity].count++
      if (report.status === 'pending') summary[report.severity].pending++
      if (report.status === 'resolved') summary[report.severity].resolved++
    })
    return summary
  }

  const severitySummary = getSeveritySummary()

  const handleCardPress = (item: FaultReport) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Read-only modül - detay sayfası yok
  }

  const handleSeverityFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    severityBottomSheetRef.current?.present()
  }

  const handleSeverityFilterSelect = (filterId: string) => {
    Haptics.selectionAsync()
    setActiveSeverityFilter(filterId)
    severityBottomSheetRef.current?.dismiss()
  }

  const handleStatusFilterSelect = (filterId: string) => {
    Haptics.selectionAsync()
    setActiveStatusFilter(filterId)
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Carousel scroll
  const scrollToIndex = (index: number) => {
    const entries = Object.entries(severitySummary)
    if (index < 0 || index >= entries.length) return

    carouselRef.current?.scrollToOffset({
      offset: index * (cardWidth + DashboardSpacing.md),
      animated: true
    })
    setActiveCarouselIndex(index)
  }

  // Aktif filtre label
  const getActiveSeverityFilterLabel = () => {
    const filter = SEVERITY_FILTERS.find(f => f.id === activeSeverityFilter)
    return filter?.label || 'Tümü'
  }

  const getActiveStatusFilterLabel = () => {
    const filter = STATUS_FILTERS.find(f => f.id === activeStatusFilter)
    return filter?.label || 'Tümü'
  }

  // Summary Header
  const renderSummaryHeader = () => {
    const entries = Object.entries(severitySummary)
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
          keyExtractor={([severity]) => severity}
          renderItem={({ item: [severity, data] }) => (
            <View style={{ width: cardWidth }}>
              <SummaryCard
                severity={severity}
                count={data.count}
                pendingCount={data.pending}
                resolvedCount={data.resolved}
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
            {entries.map(([severity], index) => (
              <TouchableOpacity
                key={severity}
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
                  {getSeverityLabel(severity)}
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
        title="Arıza Bildirimleri"
        icon="warning-outline"
        subtitle={pagination ? `${pagination.total} kayıt` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'funnel-outline',
            onPress: handleSeverityFilterPress
          }
        ]}
      />

      <View style={styles.content}>
        {/* Active Filter Bar */}
        {(activeSeverityFilter !== 'all' || activeStatusFilter !== 'all') && (
          <View style={styles.activeFilterBar}>
            <View style={styles.activeFilterContent}>
              <Ionicons name="funnel" size={14} color={DashboardColors.primary} />
              <Text style={styles.activeFilterText}>
                Filtre:
                {activeSeverityFilter !== 'all' && (
                  <Text style={styles.activeFilterValue}> {getActiveSeverityFilterLabel()}</Text>
                )}
                {activeSeverityFilter !== 'all' && activeStatusFilter !== 'all' && (
                  <Text style={styles.activeFilterText}>, </Text>
                )}
                {activeStatusFilter !== 'all' && (
                  <Text style={styles.activeFilterValue}> {getActiveStatusFilterLabel()}</Text>
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setActiveSeverityFilter('all')
                setActiveStatusFilter('all')
              }}
              style={styles.clearFilterButton}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Status Filter Chips */}
        <View style={styles.statusFilterChips}>
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                activeStatusFilter === filter.id && styles.filterChipActive
              ]}
              onPress={() => handleStatusFilterSelect(filter.id)}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={activeStatusFilter === filter.id ? DashboardColors.primary : DashboardColors.textMuted}
              />
              <Text style={[
                styles.filterChipText,
                activeStatusFilter === filter.id && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <FaultReportCardSkeleton />
            <FaultReportCardSkeleton />
            <FaultReportCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={faultReports}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <FaultReportCard
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

      {/* Severity Filter BottomSheet */}
      <BottomSheetModal
        ref={severityBottomSheetRef}
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
            <Text style={styles.bottomSheetTitle}>Önem Seviyesi</Text>
            <TouchableOpacity
              onPress={() => severityBottomSheetRef.current?.dismiss()}
              style={styles.bottomSheetCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Filter Options */}
          <View style={styles.bottomSheetBody}>
            {SEVERITY_FILTERS.map((filter) => {
              const isActive = activeSeverityFilter === filter.id
              const colors = filter.id !== 'all' && SEVERITY_COLORS[filter.id]
                ? SEVERITY_COLORS[filter.id]
                : null

              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    isActive && styles.filterOptionActive
                  ]}
                  onPress={() => handleSeverityFilterSelect(filter.id)}
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

  // Status Filter Chips
  statusFilterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.surface,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  filterChipActive: {
    backgroundColor: DashboardColors.primaryGlow,
    borderColor: DashboardColors.primary
  },
  filterChipText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textMuted
  },
  filterChipTextActive: {
    color: DashboardColors.primary
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
  summarySeverity: {
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
    marginBottom: DashboardSpacing.lg,
    color: '#FFFFFF'
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
  severityBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  severityText: {
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
  cardDescription: {
    paddingVertical: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  descriptionText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DashboardSpacing.md
  },
  dateContainer: {},
  dateLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  dateValue: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full,
    borderWidth: 1
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700'
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    top: DashboardSpacing.lg + 12
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
