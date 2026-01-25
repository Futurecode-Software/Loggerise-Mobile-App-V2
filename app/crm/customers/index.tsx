import React, { useState, useEffect, useCallback } from 'react';
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
  Plus,
  User,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle,
  Users,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getCrmCustomers,
  CrmCustomer,
  CrmCustomerFilters,
  CrmCustomerStatus,
  Pagination,
  getCrmCustomerStatusLabel,
  getCrmCustomerStatusVariant,
  getCustomerSegmentLabel,
  formatDate,
} from '@/services/endpoints/crm-customers';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'active', label: 'Aktif' },
  { id: 'passive', label: 'Pasif' },
  { id: 'lost', label: 'Kaybedildi' },
  { id: 'converted', label: 'Dönüştürüldü' },
];

export default function CrmCustomersListScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers from API
  const fetchCustomers = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters: CrmCustomerFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        if (activeFilter !== 'all') {
          filters.status = activeFilter as CrmCustomerStatus;
        }

        const response = await getCrmCustomers(filters);

        if (append) {
          setCustomers((prev) => [...prev, ...response.customers]);
        } else {
          setCustomers(response.customers);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('CRM customers fetch error:', err);
        setError(err instanceof Error ? err.message : 'Müşteriler yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, activeFilter]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      pagination &&
      pagination.current_page < pagination.last_page &&
      !isLoadingMore &&
      !isLoading
    ) {
      setIsLoadingMore(true);
      fetchCustomers(pagination.current_page + 1, true);
    }
  };

  const renderCustomerItem = ({ item }: { item: CrmCustomer }) => (
    <TouchableOpacity
      style={[styles.customerItem, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/crm/customers/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.customerHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: Brand.primary + '15' }]}>
          <User size={20} color={Brand.primary} />
        </View>
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.customerCode, { color: colors.textSecondary }]}>
            {item.code}
          </Text>
        </View>
        <View style={styles.customerBadges}>
          <Badge
            label={getCrmCustomerStatusLabel(item.status)}
            variant={getCrmCustomerStatusVariant(item.status)}
            size="sm"
          />
        </View>
      </View>

      <View style={styles.customerDetails}>
        {item.customer_segment && (
          <View style={styles.detailRow}>
            <Users size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {getCustomerSegmentLabel(item.customer_segment)}
            </Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.detailRow}>
            <Phone size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {item.phone}
            </Text>
          </View>
        )}
        {item.email && (
          <View style={styles.detailRow}>
            <Mail size={14} color={colors.textMuted} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.customerFooter}>
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: colors.textMuted }]}>
            {item.interactions_count || 0} görüşme
          </Text>
          <Text style={[styles.statSeparator, { color: colors.border }]}>•</Text>
          <Text style={[styles.statText, { color: colors.textMuted }]}>
            {item.quotes_count || 0} teklif
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
        <Users size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'Müşteri bulunamadı' : 'Henüz müşteri yok'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? 'Arama kriterlerinize uygun müşteri bulunamadı'
          : 'Yeni müşteri eklemek için + butonunu kullanın'}
      </Text>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Brand.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="CRM Müşterileri" showBackButton={true} />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Müşteriler yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="CRM Müşterileri" showBackButton={true} />
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchCustomers();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="CRM Müşterileri"
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/crm/customers/new' as any)}
            activeOpacity={0.7}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <Input
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.textMuted} />}
          style={styles.searchInput}
        />
      </View>

      {/* Status Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.background }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === item.id ? Brand.primary : colors.surface,
                  borderColor: activeFilter === item.id ? Brand.primary : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === item.id ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Customers List */}
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
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
  filtersContainer: {
    paddingVertical: Spacing.md,
  },
  filtersList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  customerItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerCode: {
    ...Typography.bodyXS,
  },
  customerBadges: {
    alignItems: 'flex-end',
  },
  customerDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    ...Typography.bodySM,
    flex: 1,
  },
  customerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statText: {
    ...Typography.bodyXS,
  },
  statSeparator: {
    ...Typography.bodyXS,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  errorIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  loadingFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
