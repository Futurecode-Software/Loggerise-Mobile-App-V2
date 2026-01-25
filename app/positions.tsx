import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Search,
  Filter,
  Plus,
  Truck,
  MapPin,
  User,
  Calendar,
  ArrowRight,
  AlertCircle,
  Route,
  ChevronLeft,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getPositions,
  Position,
  PositionType,
  PositionFilters,
  Pagination,
  getPositionTypeLabel,
  getVehicleOwnerTypeLabel,
  getDriverFullName,
} from '@/services/endpoints/positions';

const TYPE_FILTERS = [
  { id: 'all', label: 'Tümü', color: undefined },
  { id: 'international', label: 'Uluslararası', color: '#3b82f6' },
  { id: 'domestic', label: 'Yurtiçi', color: '#227d53' },
  { id: 'warehouse', label: 'Depo', color: '#f5a623' },
];

export default function PositionsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [positions, setPositions] = useState<Position[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch positions from API
  const fetchPositions = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        // Build filters
        const filters: PositionFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        // Add search filter
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        // Add type filter
        if (activeFilter !== 'all') {
          filters.position_type = activeFilter as PositionType;
        }

        const response = await getPositions(filters);

        if (append) {
          setPositions((prev) => [...prev, ...response.positions]);
        } else {
          setPositions(response.positions);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Positions fetch error:', err);
        setError(err instanceof Error ? err.message : 'Pozisyonlar yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, activeFilter]
  );

  // Track if initial mount has completed
  const isInitialMount = useRef(true);

  // Initial load and filter changes
  useEffect(() => {
    setIsLoading(true);
    fetchPositions(1, false);
  }, [activeFilter]);

  // Search with debounce - skip on initial mount to prevent double fetch
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      fetchPositions(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPositions(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchPositions(pagination.current_page + 1, true);
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

  const getTypeBadge = (type?: PositionType) => {
    const label = getPositionTypeLabel(type);
    const variantMap: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
      international: 'info',
      domestic: 'success',
      warehouse: 'warning',
    };
    return <Badge label={label} variant={type ? variantMap[type] || 'default' : 'default'} size="sm" />;
  };

  const renderPosition = ({ item }: { item: Position }) => (
    <Card
      style={styles.positionCard}
      onPress={() => router.push(`/position/${item.id}` as any)}
    >
      {/* Header */}
      <View style={styles.positionHeader}>
        <Text style={[styles.positionNumber, { color: colors.text }]}>
          {item.position_number || `#${item.id}`}
        </Text>
        {getTypeBadge(item.position_type)}
      </View>

      {/* Route */}
      {item.route && (
        <View style={styles.routeContainer}>
          <Route size={16} color={colors.icon} />
          <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.route}
          </Text>
        </View>
      )}

      {/* Vehicle Info */}
      <View style={styles.vehicleContainer}>
        {item.truck_tractor && (
          <View style={styles.vehicleItem}>
            <Truck size={14} color={colors.icon} />
            <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
              {item.truck_tractor.plate}
            </Text>
          </View>
        )}
        {item.trailer && (
          <View style={styles.vehicleItem}>
            <ArrowRight size={12} color={colors.icon} style={{ marginHorizontal: 4 }} />
            <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
              {item.trailer.plate}
            </Text>
          </View>
        )}
      </View>

      {/* Driver Info */}
      {item.driver && (
        <View style={styles.driverContainer}>
          <User size={14} color={colors.icon} />
          <Text style={[styles.driverText, { color: colors.textSecondary }]}>
            {getDriverFullName(item.driver)}
          </Text>
        </View>
      )}

      {/* Location */}
      {item.manual_location && (
        <View style={styles.locationContainer}>
          <MapPin size={14} color={colors.success} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.manual_location}
          </Text>
        </View>
      )}

      {/* Dates */}
      {item.estimated_arrival_date && (
        <View style={styles.dateContainer}>
          <Calendar size={14} color={colors.icon} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Tahmini: {formatDate(item.estimated_arrival_date)}
          </Text>
        </View>
      )}

      {/* Owner Type */}
      <View style={[styles.ownerContainer, { borderTopColor: colors.border }]}>
        <Text style={[styles.ownerLabel, { color: colors.textMuted }]}>Araç Durumu:</Text>
        <Text style={[styles.ownerValue, { color: colors.text }]}>
          {getVehicleOwnerTypeLabel(item.vehicle_owner_type)}
        </Text>
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Pozisyonlar yükleniyor...
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
              fetchPositions(1, false);
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
          <MapPin size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz pozisyon eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni pozisyon eklemek için + butonuna tıklayın'}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pozisyonlar</Text>
        <View style={styles.headerActions}>
          {pagination && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {pagination.total} kayıt
            </Text>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Pozisyon no, plaka veya şoför ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Type Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={TYPE_FILTERS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === item.id
                      ? item.color || Brand.primary
                      : colors.card,
                  borderColor:
                    activeFilter === item.id
                      ? item.color || Brand.primary
                      : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: activeFilter === item.id ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Position List */}
      <FlatList
        data={positions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPosition}
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/position/new' as any)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  countText: {
    ...Typography.bodySM,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterContainer: {
    paddingVertical: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  positionCard: {
    marginBottom: 0,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  positionNumber: {
    ...Typography.bodyMD,
    fontWeight: '700',
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
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  ownerLabel: {
    ...Typography.bodySM,
  },
  ownerValue: {
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
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
