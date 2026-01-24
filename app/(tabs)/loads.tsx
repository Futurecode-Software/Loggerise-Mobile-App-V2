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
  Calendar,
  Package,
  Box,
  ArrowRight,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getLoads,
  Load,
  LoadStatus,
  LoadFilters,
  Pagination,
  getStatusLabel,
  getStatusColor,
} from '@/services/endpoints/loads';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', color: undefined },
  { id: 'pending', label: 'Beklemede', color: '#f5a623' },
  { id: 'confirmed', label: 'Onaylandı', color: '#3b82f6' },
  { id: 'in_transit', label: 'Yolda', color: '#227d53' },
  { id: 'delivered', label: 'Teslim Edildi', color: '#13452d' },
  { id: 'cancelled', label: 'İptal', color: '#d0021b' },
];

export default function LoadsScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [loads, setLoads] = useState<Load[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch loads from API
  const fetchLoads = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        // Build filters
        const filters: LoadFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        // Add search filter
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        // Add status filter
        if (activeFilter !== 'all') {
          filters.status = activeFilter as LoadStatus;
        }

        const response = await getLoads(filters);

        if (append) {
          setLoads((prev) => [...prev, ...response.loads]);
        } else {
          setLoads(response.loads);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Loads fetch error:', err);
        setError(err instanceof Error ? err.message : 'Yükler yüklenemedi');
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
    fetchLoads(1, false);
  }, [activeFilter]); // Don't include searchQuery to avoid too many requests

  // Search with debounce - skip on initial mount to prevent double fetch
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      fetchLoads(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoads(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchLoads(pagination.current_page + 1, true);
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

  // Format weight/volume
  const formatNumber = (value?: number, unit?: string): string => {
    if (value === undefined || value === null) return '-';
    const formatted = value.toLocaleString('tr-TR');
    return unit ? `${formatted} ${unit}` : formatted;
  };

  // Format price
  const formatPrice = (amount?: number, currency?: string): string => {
    if (amount === undefined || amount === null) return '-';
    const formatted = amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${currency || 'TL'}`;
  };

  const getStatusBadge = (status: LoadStatus) => {
    const label = getStatusLabel(status);
    const variantMap: Record<LoadStatus, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
      pending: 'warning',
      confirmed: 'info',
      in_transit: 'success',
      delivered: 'success',
      cancelled: 'danger',
    };
    return <Badge label={label} variant={variantMap[status] || 'default'} size="sm" />;
  };

  // Get origin/destination from addresses or sender/receiver companies
  const getOrigin = (item: Load): string => {
    return item.sender_company?.name || '-';
  };

  const getDestination = (item: Load): string => {
    return item.receiver_company?.name || '-';
  };

  const renderLoad = ({ item }: { item: Load }) => (
    <Card
      style={styles.loadCard}
      onPress={() => router.push(`/load/${item.id}` as any)}
    >
      {/* Header */}
      <View style={styles.loadHeader}>
        <Text style={[styles.loadNumber, { color: colors.text }]}>{item.load_number}</Text>
        {getStatusBadge(item.status)}
      </View>

      {/* Cargo Name */}
      {item.cargo_name && (
        <Text style={[styles.cargoName, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.cargo_name}
        </Text>
      )}

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <MapPin size={16} color={colors.success} />
          <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
            {getOrigin(item)}
          </Text>
        </View>
        <ArrowRight size={16} color={colors.icon} style={styles.routeArrow} />
        <View style={styles.routePoint}>
          <MapPin size={16} color={colors.danger} />
          <Text style={[styles.routeText, { color: colors.textSecondary }]} numberOfLines={1}>
            {getDestination(item)}
          </Text>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.datesContainer}>
        <View style={styles.dateItem}>
          <Calendar size={14} color={colors.icon} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatDate(item.pickup_date)}
          </Text>
        </View>
        <Text style={[styles.dateSeparator, { color: colors.textMuted }]}>-</Text>
        <View style={styles.dateItem}>
          <Calendar size={14} color={colors.icon} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatDate(item.delivery_date)}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Package size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatNumber(item.total_weight, 'kg')}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Box size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatNumber(item.total_volume, 'm³')}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.priceText, { color: colors.success }]}>
            {formatPrice(item.sale_price, item.sale_currency)}
          </Text>
        </View>
      </View>

      {/* Customer */}
      {item.customer && (
        <View style={[styles.customerContainer, { borderTopColor: colors.border }]}>
          <Truck size={14} color={colors.icon} />
          <Text style={[styles.customerText, { color: colors.textMuted }]} numberOfLines={1}>
            {item.customer.name}
          </Text>
        </View>
      )}
    </Card>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Yükler yükleniyor...
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
              fetchLoads(1, false);
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
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz yük eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni yük eklemek için + butonuna tıklayın'}
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
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yükler</Text>
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
          placeholder="Yük no, kargo adı veya müşteri ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
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

      {/* Load List */}
      <FlatList
        data={loads}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderLoad}
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
        onPress={() => router.push('/load/new' as any)}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.headingLG,
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
  loadCard: {
    marginBottom: 0,
  },
  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  loadNumber: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  cargoName: {
    ...Typography.bodySM,
    marginBottom: Spacing.sm,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  routeText: {
    ...Typography.bodySM,
    flex: 1,
  },
  routeArrow: {
    marginHorizontal: Spacing.sm,
  },
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateText: {
    ...Typography.bodySM,
  },
  dateSeparator: {
    marginHorizontal: Spacing.sm,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    ...Typography.bodySM,
  },
  priceText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  customerText: {
    ...Typography.bodySM,
    flex: 1,
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
