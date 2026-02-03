import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable
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
  getJobPostings,
  JobPosting,
  JobPostingFilters,
  Pagination,
  getEmploymentTypeLabel,
  getExperienceLevelLabel,
  isJobPostingExpired
} from '@/services/endpoints/job-postings'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Status filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'active', label: 'Aktif', icon: 'checkmark-circle-outline' as const },
  { id: 'inactive', label: 'Pasif', icon: 'close-circle-outline' as const },
  { id: 'public', label: 'Herkese Açık', icon: 'globe-outline' as const },
  { id: 'private', label: 'Özel', icon: 'lock-closed-outline' as const }
]

// Skeleton Component
function JobPostingCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={140} height={14} />
        <Skeleton width={100} height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={24} borderRadius={12} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface JobPostingCardProps {
  item: JobPosting
  onPress: () => void
}

function JobPostingCard({ item, onPress }: JobPostingCardProps) {
  const scale = useSharedValue(1)
  const isExpired = isJobPostingExpired(item)
  const applicationCount = item.applications_count || item.application_count || 0

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
        <View style={[styles.cardIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
          <Ionicons name="briefcase-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardPosition}>{item.position}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.location || 'Lokasyon belirtilmemiş'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {getEmploymentTypeLabel(item.employment_type)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {getExperienceLevelLabel(item.experience_level)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.badgeGroup}>
          {item.is_active ? (
            <View style={[styles.badge, { backgroundColor: DashboardColors.successBg }]}>
              <View style={[styles.badgeDot, { backgroundColor: DashboardColors.success }]} />
              <Text style={[styles.badgeText, { color: DashboardColors.success }]}>Aktif</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: DashboardColors.dangerBg }]}>
              <View style={[styles.badgeDot, { backgroundColor: DashboardColors.danger }]} />
              <Text style={[styles.badgeText, { color: DashboardColors.danger }]}>Pasif</Text>
            </View>
          )}
          {item.is_public && (
            <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Text style={[styles.badgeText, { color: '#3B82F6' }]}>Herkese Açık</Text>
            </View>
          )}
          {isExpired && (
            <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Text style={[styles.badgeText, { color: '#F59E0B' }]}>Süresi Doldu</Text>
            </View>
          )}
        </View>
        <View style={styles.applicationCount}>
          <Ionicons name="people-outline" size={16} color={DashboardColors.primary} />
          <Text style={styles.applicationText}>{applicationCount}</Text>
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
        <Ionicons name="briefcase-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz iş ilanı yok</Text>
      <Text style={styles.emptyText}>
        Yeni iş ilanı eklemek için sağ üstteki + butonuna tıklayın.
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

export default function JobPostingsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], []);

  // API state
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
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

        const filters: JobPostingFilters = {
          page,
          per_page: 20,
          exclude_expired: true
        }

        if (filter === 'active') {
          filters.is_active = true
        } else if (filter === 'inactive') {
          filters.is_active = false
        } else if (filter === 'public') {
          filters.is_public = true
        } else if (filter === 'private') {
          filters.is_public = false
        }

        const response = await getJobPostings(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setJobPostings((prev) => [...prev, ...response.jobPostings])
          } else {
            setJobPostings(response.jobPostings)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Job postings fetch error:', err)
          setError(err instanceof Error ? err.message : 'İş ilanları yüklenemedi')
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

  const handleCardPress = (item: JobPosting) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/hr/job-postings/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/hr/job-postings/new')
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

  return (
    <View style={styles.container}>
      <PageHeader
        title="İş İlanları"
        icon="briefcase-outline"
        subtitle={pagination ? `${pagination.total} ilan` : undefined}
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
            <JobPostingCardSkeleton />
            <JobPostingCardSkeleton />
            <JobPostingCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={jobPostings}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <JobPostingCard
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
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardPosition: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    fontWeight: '500'
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
    alignItems: 'center',
    paddingTop: DashboardSpacing.md
  },
  badgeGroup: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginRight: DashboardSpacing.md
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
    gap: 4
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  badgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  applicationCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  applicationText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
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
