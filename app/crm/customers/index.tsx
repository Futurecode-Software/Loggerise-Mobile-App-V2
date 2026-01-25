import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Plus, User, Phone, Mail, Users } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
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

  const renderCustomerItem = (item: CrmCustomer) => {
    const additionalInfo = [];
    if (item.customer_segment) {
      additionalInfo.push(
        <View key="segment" style={styles.detailRow}>
          <Users size={14} color={colors.textMuted} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {getCustomerSegmentLabel(item.customer_segment)}
          </Text>
        </View>
      );
    }
    if (item.phone) {
      additionalInfo.push(
        <View key="phone" style={styles.detailRow}>
          <Phone size={14} color={colors.textMuted} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.phone}
          </Text>
        </View>
      );
    }
    if (item.email) {
      additionalInfo.push(
        <View key="email" style={styles.detailRow}>
          <Mail size={14} color={colors.textMuted} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      );
    }

    return (
      <StandardListItem
        icon={User}
        iconColor={Brand.primary}
        iconBg={Brand.primary + '15'}
        title={item.name}
        subtitle={item.code}
        additionalInfo={
          additionalInfo.length > 0 ? (
            <View style={styles.additionalInfo}>{additionalInfo}</View>
          ) : undefined
        }
        status={{
          label: getCrmCustomerStatusLabel(item.status),
          variant: getCrmCustomerStatusVariant(item.status),
        }}
        footer={{
          left: (
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {item.interactions_count || 0} görüşme
              </Text>
              <Text style={[styles.statSeparator, { color: colors.border }]}>•</Text>
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {item.quotes_count || 0} teklif
              </Text>
            </View>
          ),
        }}
        onPress={() => router.push(`/crm/customers/${item.id}` as any)}
      />
    );
  };


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

      <StandardListContainer
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id.toString()}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Müşteri ara...',
        }}
        filters={{
          items: STATUS_FILTERS,
          activeId: activeFilter,
          onChange: setActiveFilter,
        }}
        emptyState={{
          icon: Users,
          title: searchQuery ? 'Müşteri bulunamadı' : 'Henüz müşteri yok',
          subtitle: searchQuery
            ? 'Arama kriterlerinize uygun müşteri bulunamadı'
            : 'Yeni müşteri eklemek için + butonunu kullanın',
        }}
        loading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLoadMore={loadMore}
        pagination={pagination || undefined}
        isLoadingMore={isLoadingMore}
        error={error}
        onRetry={() => {
          setIsLoading(true);
          fetchCustomers(1, false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  additionalInfo: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statText: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
  statSeparator: {
    fontSize: 10,
    color: Colors.light.border,
  },
});
