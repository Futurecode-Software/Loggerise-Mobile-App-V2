/**
 * Events List Screen (Ajanda)
 *
 * Timeline-style events list with Dashboard theme.
 * CLAUDE.md standartlarına tam uyumlu.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations,
} from '@/constants/dashboard-theme'
import {
  getEvents,
  Event,
  EventFilters,
  EventStatus,
  Pagination,
  getEventTypeLabel,
  getEventStatusLabel,
  formatEventTimeRange,
  groupEventsByDate,
} from '@/services/endpoints/events'
import { formatDate } from '@/utils/formatters'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'pending', label: 'Beklemede', icon: 'time-outline' as const },
  { id: 'completed', label: 'Tamamlandı', icon: 'checkmark-circle-outline' as const },
  { id: 'cancelled', label: 'İptal', icon: 'close-circle-outline' as const },
]

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  completed: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
}

// Event type icons
const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  call: 'call-outline',
  meeting: 'people-outline',
  whatsapp: 'logo-whatsapp',
  email: 'mail-outline',
  task: 'checkbox-outline',
  deadline: 'alarm-outline',
}

interface EventSection {
  title: string
  data: Event[]
  date: string
}

// Skeleton Component
function EventCardSkeleton() {
  return (
    <View style={styles.eventCard}>
      <View style={styles.timelineContainer}>
        <Skeleton width={12} height={12} borderRadius={6} />
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.eventContent}>
        <Skeleton width={60} height={14} style={{ marginBottom: 8 }} />
        <Skeleton width={200} height={18} style={{ marginBottom: 8 }} />
        <Skeleton width={150} height={14} />
      </View>
    </View>
  )
}

// Event Card Component
interface EventCardProps {
  item: Event
  onPress: () => void
}

function EventCard({ item, onPress }: EventCardProps) {
  const scale = useSharedValue(1)
  const colors = STATUS_COLORS[item.status] || STATUS_COLORS.pending

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const icon = EVENT_TYPE_ICONS[item.event_type] || 'calendar-outline'
  const timeRange = formatEventTimeRange(item)

  return (
    <AnimatedPressable
      style={[styles.eventCard, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Timeline */}
      <View style={styles.timelineContainer}>
        <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.timelineLine, { backgroundColor: DashboardColors.borderLight }]} />
      </View>

      {/* Content */}
      <View style={styles.eventContent}>
        <Text style={styles.eventTime}>{timeRange}</Text>

        <View style={styles.eventTitleRow}>
          <View style={[styles.eventIcon, { backgroundColor: colors.bg }]}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        {(item.customer || item.description) && (
          <Text style={styles.eventDetails} numberOfLines={1}>
            {item.customer?.name || item.description || ''}
          </Text>
        )}

        <View style={styles.eventFooter}>
          <View style={[styles.typeBadge, { backgroundColor: DashboardColors.primaryGlow }]}>
            <Text style={styles.typeBadgeText}>{getEventTypeLabel(item.event_type)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
              {getEventStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
    </AnimatedPressable>
  )
}

// Section Header Component
interface SectionHeaderProps {
  section: EventSection
}

function SectionHeader({ section }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
      </View>
    </View>
  )
}

// Empty State
function EmptyState({ searchQuery, activeFilter }: { searchQuery: string; activeFilter: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery || activeFilter !== 'all' ? 'Etkinlik bulunamadı' : 'Henüz etkinlik yok'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery || activeFilter !== 'all'
          ? 'Farklı bir arama terimi veya filtre deneyin'
          : 'Yeni etkinlik eklemek için + butonuna tıklayın'}
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

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [events, setEvents] = useState<Event[]>([])
  const [sections, setSections] = useState<EventSection[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // BottomSheet ref
  const filterBottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['90%'], []);

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitialFetchRef = useRef(false)

  // Core fetch function
  const executeFetch = useCallback(
    async (search: string, filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters: EventFilters = {
          page,
          per_page: 20,
          sort_by: 'start_datetime',
          sort_order: 'asc',
        }

        if (search.trim()) {
          filters.search = search.trim()
        }

        if (filter !== 'all') {
          filters.status = filter as EventStatus
        }

        const response = await getEvents(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          // Use functional state update to avoid dependency on events
          setEvents((prevEvents) => {
            const newEvents = append ? [...prevEvents, ...response.events] : response.events

            // Group events by date
            const grouped = groupEventsByDate(newEvents)
            const newSections: EventSection[] = Object.keys(grouped)
              .sort()
              .map((dateKey) => {
                const date = new Date(dateKey)
                const today = new Date()
                const isToday =
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear()

                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                const isTomorrow =
                  date.getDate() === tomorrow.getDate() &&
                  date.getMonth() === tomorrow.getMonth() &&
                  date.getFullYear() === tomorrow.getFullYear()

                let title = formatDate(dateKey, 'dd MMMM yyyy, EEEE')
                if (isToday) {
                  title = `Bugün - ${formatDate(dateKey, 'dd MMMM yyyy')}`
                } else if (isTomorrow) {
                  title = `Yarın - ${formatDate(dateKey, 'dd MMMM yyyy')}`
                }

                return {
                  title,
                  date: dateKey,
                  data: grouped[dateKey],
                }
              })

            setSections(newSections)
            return newEvents
          })

          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Events fetch error:', err)
          setError(err instanceof Error ? err.message : 'Etkinlikler yüklenemedi')
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

  // Initial fetch - only on mount
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(searchQuery, activeFilter, 1, false)

    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeFetch])

  // Filter change - searchQuery intentionally not in deps (handled by search useEffect)
  useEffect(() => {
    if (!hasInitialFetchRef.current) return
    setIsLoading(true)
    executeFetch(searchQuery, activeFilter, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, executeFetch])

  // Search with debounce - activeFilter intentionally not in deps (handled by filter useEffect)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, executeFetch])

  // Refs for useFocusEffect - keep refs in sync
  const executeFetchRef = useRef(executeFetch)
  const searchQueryRef = useRef(searchQuery)
  const activeFilterRef = useRef(activeFilter)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    searchQueryRef.current = searchQuery
    activeFilterRef.current = activeFilter
  }, [executeFetch, searchQuery, activeFilter])

  // Refresh on screen focus
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

  const handleCardPress = (item: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/event/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/event/new')
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

  const getActiveFilterLabel = () => {
    const filter = STATUS_FILTERS.find((f) => f.id === activeFilter)
    return filter?.label || 'Tümü'
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Ajanda"
        icon="calendar-outline"
        subtitle={pagination ? `${pagination.total} etkinlik` : undefined}
        showBackButton
        onBackPress={() => router.back()}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Etkinlik ara...',
        }}
        rightActions={[
          {
            icon: 'funnel-outline',
            onPress: handleFilterPress,
          },
          {
            icon: 'add',
            onPress: handleNewPress,
          },
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
        {isLoading && !refreshing ? (
          <View style={styles.listContent}>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true)
                executeFetch(searchQuery, activeFilter, 1, false)
              }}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : sections.length === 0 ? (
          <EmptyState searchQuery={searchQuery} activeFilter={activeFilter} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <EventCard item={item} onPress={() => handleCardPress(item)} />
            )}
            renderSectionHeader={({ section }) => <SectionHeader section={section} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            stickySectionHeadersEnabled
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={DashboardColors.primary} />
                  <Text style={styles.loadingMoreText}>Yükleniyor...</Text>
                </View>
              ) : null
            }
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
        enablePanDownToClose
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
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

          <View style={styles.bottomSheetBody}>
            {STATUS_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id
              const colors = filter.id !== 'all' ? STATUS_COLORS[filter.id] : null

              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    isActive && styles.filterOptionActive,
                  ]}
                  onPress={() => handleFilterSelect(filter.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.filterOptionIcon,
                      { backgroundColor: colors?.bg || DashboardColors.primaryGlow },
                    ]}
                  >
                    <Ionicons
                      name={filter.icon}
                      size={20}
                      color={colors?.primary || DashboardColors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterOptionLabel,
                      isActive && styles.filterOptionLabelActive,
                    ]}
                  >
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
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
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
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing['3xl'],
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.md,
    marginTop: DashboardSpacing.md,
    marginBottom: DashboardSpacing.sm,
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
  },
  sectionBadge: {
    backgroundColor: DashboardColors.primaryGlow,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.full,
  },
  sectionBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary,
  },

  // Event Card
  eventCard: {
    flexDirection: 'row',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.md,
    marginBottom: DashboardSpacing.sm,
    ...DashboardShadows.sm,
  },
  timelineContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: DashboardSpacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: DashboardSpacing.xs,
  },
  eventContent: {
    flex: 1,
  },
  eventTime: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.xs,
  },
  eventIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DashboardSpacing.sm,
  },
  eventTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1,
  },
  eventDetails: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.sm,
  },
  eventFooter: {
    flexDirection: 'row',
    gap: DashboardSpacing.xs,
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.md,
  },
  typeBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary,
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.md,
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
  },

  // Loading More
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.lg,
  },
  loadingMoreText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl'],
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
    ...DashboardShadows.sm,
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

  // Error State
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl'],
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.md,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff',
  },

  // BottomSheet
  bottomSheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  bottomSheetBackground: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  bottomSheetContent: {
    flex: 1,
    paddingBottom: DashboardSpacing['3xl'],
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  bottomSheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetTitle: {
    flex: 1,
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md,
  },
  bottomSheetCloseButton: {
    padding: DashboardSpacing.xs,
  },
  bottomSheetBody: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
  },
  filterOptionActive: {
    backgroundColor: DashboardColors.primaryGlow,
    borderColor: DashboardColors.primary,
  },
  filterOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionLabel: {
    flex: 1,
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md,
  },
  filterOptionLabelActive: {
    color: DashboardColors.primary,
  },
  filterOptionCheck: {
    marginLeft: DashboardSpacing.sm,
  },
})
