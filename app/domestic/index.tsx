/**
 * Domestic Transport Orders List Screen
 *
 * Lists all domestic transport orders with search and filter functionality.
 * Matches web version at /yurtici-tasimacilik
 */

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
import { router } from 'expo-router';
import {
  Search,
  Filter,
  Plus,
  Truck,
  MapPin,
  User,
  Calendar,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Layers,
  FileText,
  ClipboardList,
  Activity,
  Ban,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getDomesticOrders,
  DomesticTransportOrder,
  DomesticOrderStatus,
  DomesticOrderFilters,
  Pagination,
  getOrderStatusLabel,
  getOrderStatusVariant,
  getOrderTypeLabel,
  getOrderTypeColor,
  getDriverFullName,
  formatDate,
} from '@/services/endpoints/domestic-orders';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', color: undefined, icon: Layers },
  { id: 'draft', label: 'Taslak', color: '#6B7280', icon: FileText },
  { id: 'planned', label: 'Planlandı', color: '#f5a623', icon: ClipboardList },
  { id: 'assigned', label: 'Atandı', color: '#3b82f6', icon: User },
  { id: 'in_transit', label: 'Yolda', color: '#8b5cf6', icon: Activity },
  { id: 'completed', label: 'Tamamlandı', color: '#22c55e', icon: CheckCircle },
  { id: 'cancelled', label: 'İptal', color: '#ef4444', icon: Ban },
];

export default function DomesticOrdersScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [orders, setOrders] = useState<DomesticTransportOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function
  const executeFetch = useCallback(
    async (search: string, filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: DomesticOrderFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        if (filter !== 'all') {
          filters.status = filter as DomesticOrderStatus;
        }

        const response = await getDomesticOrders(filters);

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setOrders((prev) => [...prev, ...response.orders]);
          } else {
            setOrders(response.orders);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Domestic orders fetch error:', err);
          setError(err instanceof Error ? err.message : 'İş emirleri yüklenemedi');
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

  // Initial fetch
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

  // Filter change
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

  const getStatusIcon = (status?: DomesticOrderStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} color="#22c55e" />;
      case 'cancelled':
        return <XCircle size={14} color="#ef4444" />;
      case 'in_transit':
        return <Truck size={14} color="#8b5cf6" />;
      default:
        return <Clock size={14} color={colors.icon} />;
    }
  };

  const renderOrder = ({ item }: { item: DomesticTransportOrder }) => (
    <Card
      style={styles.orderCard}
      onPress={() => router.push(`/domestic/${item.id}` as any)}
    >
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberContainer}>
          <Text style={[styles.orderNumber, { color: colors.text }]}>
            {item.order_number}
          </Text>
          <View style={[styles.orderTypeBadge, { backgroundColor: getOrderTypeColor(item.order_type) + '20' }]}>
            <Text style={[styles.orderTypeText, { color: getOrderTypeColor(item.order_type) }]}>
              {getOrderTypeLabel(item.order_type)}
            </Text>
          </View>
        </View>
        <Badge label={getOrderStatusLabel(item.status)} variant={getOrderStatusVariant(item.status)} size="sm" />
      </View>

      {/* Customer */}
      {item.customer && (
        <View style={styles.customerContainer}>
          <User size={14} color={colors.icon} />
          <Text style={[styles.customerText, { color: colors.text }]} numberOfLines={1}>
            {item.customer.name}
          </Text>
          {item.customer.code && (
            <Text style={[styles.customerCode, { color: colors.textMuted }]}>
              ({item.customer.code})
            </Text>
          )}
        </View>
      )}

      {/* Addresses */}
      <View style={styles.addressContainer}>
        {item.pickup_address && (
          <View style={styles.addressRow}>
            <View style={[styles.addressDot, { backgroundColor: '#22c55e' }]} />
            <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.pickup_address.title || item.pickup_address.address || 'Alım Adresi'}
            </Text>
          </View>
        )}
        {item.delivery_address && (
          <View style={styles.addressRow}>
            <View style={[styles.addressDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.delivery_address.title || item.delivery_address.address || 'Teslimat Adresi'}
            </Text>
          </View>
        )}
      </View>

      {/* Vehicle & Driver */}
      <View style={styles.assignmentContainer}>
        {item.vehicle && (
          <View style={styles.assignmentItem}>
            <Truck size={14} color={colors.icon} />
            <Text style={[styles.assignmentText, { color: colors.textSecondary }]}>
              {item.vehicle.plate}
            </Text>
          </View>
        )}
        {item.driver && (
          <View style={styles.assignmentItem}>
            <User size={14} color={colors.icon} />
            <Text style={[styles.assignmentText, { color: colors.textSecondary }]}>
              {getDriverFullName(item.driver)}
            </Text>
          </View>
        )}
      </View>

      {/* Dates */}
      <View style={[styles.footerContainer, { borderTopColor: colors.border }]}>
        <View style={styles.dateItem}>
          <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Alım:</Text>
          <Text style={[styles.dateValue, { color: colors.text }]}>
            {formatDate(item.pickup_expected_date)}
          </Text>
        </View>
        <ArrowRight size={14} color={colors.icon} />
        <View style={styles.dateItem}>
          <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Teslimat:</Text>
          <Text style={[styles.dateValue, { color: colors.text }]}>
            {formatDate(item.delivery_expected_date)}
          </Text>
        </View>
        {item.is_delayed && (
          <View style={[styles.delayedBadge, { backgroundColor: '#ef4444' + '20' }]}>
            <AlertCircle size={12} color="#ef4444" />
            <Text style={[styles.delayedText, { color: '#ef4444' }]}>Gecikmiş</Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            İş emirleri yükleniyor...
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
          <Package size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz iş emri eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni iş emri eklemek için + butonuna tıklayın'}
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

  // Prepare tabs for header - similar to position detail and trip pages
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Yurtiçi İş Emirleri"
        showBackButton
        onBackPress={() => router.back()}
        subtitle={pagination ? `${pagination.total} iş emri` : undefined}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Sipariş no veya müşteri ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Order List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
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
        onPress={() => router.push('/domestic/new' as any)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  orderCard: {
    marginBottom: 0,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderNumberContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  orderNumber: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  orderTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  orderTypeText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  customerText: {
    ...Typography.bodyMD,
    fontWeight: '500',
    flex: 1,
  },
  customerCode: {
    ...Typography.bodySM,
  },
  addressContainer: {
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addressText: {
    ...Typography.bodySM,
    flex: 1,
  },
  assignmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  assignmentText: {
    ...Typography.bodySM,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateLabel: {
    ...Typography.bodySM,
  },
  dateValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  delayedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: 'auto',
  },
  delayedText: {
    ...Typography.bodySM,
    fontWeight: '500',
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
