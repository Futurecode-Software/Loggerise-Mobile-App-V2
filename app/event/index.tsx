import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Plus,
  Layers,
  Clock,
  CheckCircle,
  Ban,
  Calendar as CalendarIcon,
  Phone,
  Users,
  MessageCircle,
  Mail,
  CheckSquare,
  AlertCircle,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Typography, BorderRadius, Shadows, Brand } from '@/constants/theme';
import {
  getEvents,
  Event,
  EventFilters,
  EventStatus,
  Pagination,
  getEventTypeLabel,
  getEventStatusLabel,
  getEventStatusColor,
  formatEventTimeRange,
  groupEventsByDate,
  getEventTypeIcon,
  getPriorityColor,
} from '@/services/endpoints/events';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'pending', label: 'Beklemede', icon: Clock },
  { id: 'completed', label: 'Tamamlandı', icon: CheckCircle },
  { id: 'cancelled', label: 'İptal', icon: Ban },
];

interface EventSection {
  title: string;
  data: Event[];
  date: string;
}

export default function EventsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [events, setEvents] = useState<Event[]>([]);
  const [sections, setSections] = useState<EventSection[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);
  const searchQueryRef = useRef(searchQuery);
  const activeFilterRef = useRef(activeFilter);

  // Ref'leri güncelle
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);

  // Core fetch function - events dependency'siz (functional update kullanarak)
  const executeFetch = useCallback(
    async (
      search: string,
      filter: string,
      page: number = 1,
      append: boolean = false,
      isRefresh: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        // Build filters
        const filters: EventFilters = {
          page,
          per_page: 20,
          sort_by: 'start_datetime',
          sort_order: 'asc',
        };

        // Add search filter
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add status filter
        if (filter !== 'all') {
          filters.status = filter as EventStatus;
        }

        const response = await getEvents(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          // Functional update kullanarak events dependency'sini kaldır
          setEvents((prevEvents) => {
            const newEvents = append ? [...prevEvents, ...response.events] : response.events;
            
            // Group events by date for timeline view
            const grouped = groupEventsByDate(newEvents);
            const newSections: EventSection[] = Object.keys(grouped)
              .sort()
              .map((dateKey) => {
                const date = new Date(dateKey);
                const today = new Date();
                const isToday =
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();

                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isTomorrow =
                  date.getDate() === tomorrow.getDate() &&
                  date.getMonth() === tomorrow.getMonth() &&
                  date.getFullYear() === tomorrow.getFullYear();

                let title = formatDate(dateKey, 'dd MMMM yyyy, EEEE');
                if (isToday) {
                  title = `Bugün - ${formatDate(dateKey, 'dd MMMM yyyy')}`;
                } else if (isTomorrow) {
                  title = `Yarın - ${formatDate(dateKey, 'dd MMMM yyyy')}`;
                }

                return {
                  title,
                  date: dateKey,
                  data: grouped[dateKey],
                };
              });

            setSections(newSections);
            return newEvents;
          });
          
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Events fetch error:', err);
          setError(err instanceof Error ? err.message : 'Etkinlikler yüklenemedi');
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    []  // events dependency kaldırıldı - functional update kullanılıyor
  );

  // Initial fetch - only once on mount
  useEffect(() => {
    isMountedRef.current = true;
    executeFetch(searchQuery, activeFilter, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Filter change - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(searchQuery, activeFilter, 1, false);
  }, [activeFilter]);

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      executeFetch(searchQuery, activeFilter, 1, false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Refresh on screen focus - sadece sayfa focus olduğunda çalışır
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        // Ref'lerden güncel değerleri al
        executeFetch(searchQueryRef.current, activeFilterRef.current, 1, false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])  // Boş dependency array - sadece focus değişikliğinde çalışır
  );

  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    executeFetch(searchQuery, activeFilter, 1, false, true);
  };

  const handleLoadMore = () => {
    if (!pagination || pagination.current_page >= pagination.last_page || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Get icon component by event type
  const getEventTypeIconComponent = (type: string) => {
    const iconMap: Record<string, any> = {
      call: Phone,
      meeting: Users,
      whatsapp: MessageCircle,
      email: Mail,
      task: CheckSquare,
      deadline: AlertCircle,
    };
    return iconMap[type] || CalendarIcon;
  };

  // Render event card
  const renderEventCard = (event: Event) => {
    const IconComponent = getEventTypeIconComponent(event.event_type);
    const timeRange = formatEventTimeRange(event);

    return (
      <TouchableOpacity
        key={event.id}
        style={[styles.eventCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/event/${event.id}`)}
        activeOpacity={0.7}
      >
        {/* Timeline line */}
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineDot, { backgroundColor: Brand.primary }]} />
          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Event content */}
        <View style={styles.eventContent}>
          {/* Time */}
          <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{timeRange}</Text>

          {/* Title row */}
          <View style={styles.eventTitleRow}>
            <View style={[styles.eventIconContainer, { backgroundColor: Brand.primaryLight }]}>
              <IconComponent size={16} color={Brand.primary} />
            </View>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
              {event.title}
            </Text>
          </View>

          {/* Details */}
          {(event.customer || event.description) && (
            <Text style={[styles.eventDetails, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.customer?.name || event.description || ''}
            </Text>
          )}

          {/* Footer */}
          <View style={styles.eventFooter}>
            <Badge
              label={getEventTypeLabel(event.event_type)}
              variant="info"
              size="sm"
            />
            <Badge
              label={getEventStatusLabel(event.status)}
              variant={getEventStatusColor(event.status)}
              size="sm"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render section header
  const renderSectionHeader = ({ section }: { section: EventSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      <Badge label={`${section.data.length} etkinlik`} variant="default" size="sm" />
    </View>
  );

  // Header tabs
  const headerTabs = STATUS_FILTERS.map((filter) => {
    const Icon = filter.icon;
    const isActive = activeFilter === filter.id;
    return {
      id: filter.id,
      label: filter.label,
      icon: <Icon size={16} color={isActive ? colors.surface : colors.textSecondary} />,
      isActive,
      onPress: () => setActiveFilter(filter.id),
    };
  });

  // Empty state
  if (!isLoading && sections.length === 0) {
    return (
      <View style={styles.container}>
        <FullScreenHeader
          title="Ajanda"
          subtitle={pagination ? `${pagination.total} etkinlik` : undefined}
          tabs={headerTabs}
          rightIcons={
            <TouchableOpacity
              onPress={() => router.push('/event/new')}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          }
        />

        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <CalendarIcon size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery || activeFilter !== 'all' ? 'Etkinlik bulunamadı' : 'Henüz etkinlik yok'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: Brand.primary }]}
            onPress={() => router.push('/event/new')}
          >
            <Text style={styles.emptyButtonText}>Yeni Etkinlik Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Ajanda"
        subtitle={pagination ? `${pagination.total} etkinlik` : undefined}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/event/new')}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Brand.primary }]}
              onPress={() => executeFetch(searchQuery, activeFilter, 1, false)}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => renderEventCard(item)}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={Brand.primary} />
                </View>
              ) : null
            }
            stickySectionHeadersEnabled={true}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  timelineContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.md,
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
    marginTop: Spacing.xs,
  },
  eventContent: {
    flex: 1,
  },
  eventTime: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  eventTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
  },
  eventDetails: {
    ...Typography.bodySM,
    marginBottom: Spacing.sm,
  },
  eventFooter: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    ...Typography.bodyMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.bodyLG,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    ...Typography.bodyMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
