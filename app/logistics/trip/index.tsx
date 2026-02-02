import { FullScreenHeader } from '@/components/header';
import { Badge, Card, Input } from '@/components/ui';
import { BorderRadius, Brand, Colors, Spacing, Typography, Shadows } from '@/constants/theme';
import {
    getDriverFullName,
    getTrips,
    getTripStatusLabel,
    getTripStatusVariant,
    getTripTypeLabel,
    getVehicleOwnerTypeLabel,
    Pagination,
    Trip,
    TripFilters,
    TripStatus,
} from '@/services/endpoints/trips';
import { router, useFocusEffect } from 'expo-router';
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    Container,
    Filter,
    MapPin,
    Route,
    Search,
    Ship,
    Train,
    Truck,
    User,
    Layers,
    Clock,
    Activity,
    CheckCircle,
    XCircle,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', color: undefined, icon: Layers },
  { id: 'planning', label: 'Planlama', color: '#f5a623', icon: Clock },
  { id: 'active', label: 'Aktif', color: '#3b82f6', icon: Activity },
  { id: 'completed', label: 'Tamamlandı', color: '#22c55e', icon: CheckCircle },
  { id: 'cancelled', label: 'İptal', color: '#ef4444', icon: XCircle },
];

export default function TripsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialFetchRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  // Core fetch function - no dependencies on state
  const executeFetch = useCallback(
    async (search: string, filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        // Build filters
        const filters: TripFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        // Add search filter
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add status filter
        if (filter !== 'all') {
          filters.status = filter as TripStatus;
        }

        const response = await getTrips(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setTrips((prev) => [...prev, ...response.trips]);
          } else {
            setTrips(response.trips);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Trips fetch error:', err);
          setError(err instanceof Error ? err.message : 'Seferler yüklenemedi');
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    []
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
  }, []); // Empty deps - only run on mount

  // Filter change - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(searchQuery, activeFilter, 1, false);
  }, [activeFilter]); // Only activeFilter

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
  }, [searchQuery]); // Only searchQuery

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      // Refresh data when screen comes into focus
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, activeFilter, 1, false);
      }
    }, [searchQuery, activeFilter, executeFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, activeFilter, 1, false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status?: TripStatus) => {
    const label = getTripStatusLabel(status);
    const variant = getTripStatusVariant(status);
    return <Badge label={label} variant={variant} size="sm" />;
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <Card
      style={styles.tripCard}
      onPress={() => router.push(`/logistics/trip/${item.id}` as any)}
    >
      {/* Header */}
      <View style={styles.tripHeader}>
        <View style={styles.tripNumberContainer}>
          <Text style={[styles.tripNumber, { color: colors.text }]}>
            {item.trip_number || '-'}
          </Text>
          {item.trip_type ? (
            <Text style={[styles.tripType, { color: colors.textSecondary }]}>
              {getTripTypeLabel(item.trip_type)}
            </Text>
          ) : null}
        </View>
        {getStatusBadge(item.status)}
      </View>

      {/* Transport Type Icons */}
      {(item.is_roro || item.is_train || item.is_mafi) ? (
        <View style={styles.transportIcons}>
          {item.is_roro ? (
            <View style={[styles.transportBadge, { backgroundColor: '#3b82f6' + '20' }]}>
              <Ship size={14} color="#3b82f6" />
              <Text style={[styles.transportText, { color: '#3b82f6' }]}>RoRo</Text>
            </View>
          ) : null}
          {item.is_train ? (
            <View style={[styles.transportBadge, { backgroundColor: '#8b5cf6' + '20' }]}>
              <Train size={14} color="#8b5cf6" />
              <Text style={[styles.transportText, { color: '#8b5cf6' }]}>Tren</Text>
            </View>
          ) : null}
          {item.is_mafi ? (
            <View style={[styles.transportBadge, { backgroundColor: '#f59e0b' + '20' }]}>
              <Container size={14} color="#f59e0b" />
              <Text style={[styles.transportText, { color: '#f59e0b' }]}>Mafi</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Route */}
      {item.route ? (
        <View style={styles.routeContainer}>
          <Route size={16} color={colors.icon} />
          <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.route}
          </Text>
        </View>
      ) : null}

      {/* Vehicle Info */}
      <View style={styles.vehicleContainer}>
        {item.truck_tractor ? (
          <View style={styles.vehicleItem}>
            <Truck size={14} color={colors.icon} />
            <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
              {item.truck_tractor.plate || '-'}
            </Text>
          </View>
        ) : null}
        {item.trailer ? (
          <View style={styles.vehicleItem}>
            <ArrowRight size={12} color={colors.icon} style={{ marginHorizontal: 4 }} />
            <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
              {item.trailer.plate || '-'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Driver Info */}
      {item.driver ? (
        <View style={styles.driverContainer}>
          <User size={14} color={colors.icon} />
          <Text style={[styles.driverText, { color: colors.textSecondary }]}>
            {getDriverFullName(item.driver)}
          </Text>
          {item.second_driver ? (
            <Text style={[styles.driverText, { color: colors.textMuted }]}>
              {` + ${getDriverFullName(item.second_driver)}`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Location */}
      {item.manual_location ? (
        <View style={styles.locationContainer}>
          <MapPin size={14} color={colors.success} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.manual_location}
          </Text>
        </View>
      ) : null}

      {/* Dates */}
      {item.estimated_arrival_date ? (
        <View style={styles.dateContainer}>
          <Calendar size={14} color={colors.icon} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Tahmini: {formatDate(item.estimated_arrival_date)}
          </Text>
        </View>
      ) : null}

      {/* Footer Info */}
      <View style={[styles.footerContainer, { borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Araç Durumu:</Text>
          <Text style={[styles.footerValue, { color: colors.text }]}>
            {getVehicleOwnerTypeLabel(item.vehicle_owner_type)}
          </Text>
        </View>
        {item.loads && item.loads.length > 0 ? (
          <View style={styles.footerItem}>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>Yük:</Text>
            <Text style={[styles.footerValue, { color: Brand.primary }]}>
              {item.loads.length} adet
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Seferler yükleniyor...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              executeFetch(searchQuery, activeFilter, 1, false);
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <Truck size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz sefer eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Seferler pozisyonlar aracılığıyla otomatik oluşturulur'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Brand.primary} />
      </View>
    );
  };

  // Prepare tabs for header - similar to position detail page
  const headerTabs = STATUS_FILTERS.map((filter) => {
    const Icon = filter.icon;
    const isActive = activeFilter === filter.id;
    return {
      id: filter.id,
      label: filter.label,
      icon: <Icon size={16} color="#FFFFFF" strokeWidth={isActive ? 2.5 : 2} />,
      isActive,
      onPress: () => setActiveFilter(filter.id),
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Seferler"
        showBackButton
        onBackPress={() => router.back()}
        subtitle={pagination && pagination.total ? `${pagination.total} sefer` : undefined}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Sefer no, plaka veya güzergah ile ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color={colors.icon} />}
            containerStyle={styles.searchInput}
          />
        </View>

        {/* Trip List */}
        <FlatList
          data={trips}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTrip}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Brand.primary}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  tripCard: {
    marginBottom: 0,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  tripNumberContainer: {
    flex: 1,
  },
  tripNumber: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  tripType: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  transportIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  transportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  transportText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  routeText: {
    ...Typography.bodySM,
    flex: 1,
  },
  vehicleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vehicleText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  driverText: {
    ...Typography.bodySM,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.bodySM,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  dateText: {
    ...Typography.bodySM,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerLabel: {
    ...Typography.bodySM,
  },
  footerValue: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
