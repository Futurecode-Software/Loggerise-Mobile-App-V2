import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Plus, User, Phone, Mail, Users, Layers, UserCheck, UserMinus, UserX, ArrowRightLeft } from 'lucide-react-native';
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
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'active', label: 'Aktif', icon: UserCheck },
  { id: 'passive', label: 'Pasif', icon: UserMinus },
  { id: 'lost', label: 'Kaybedildi', icon: UserX },
  { id: 'converted', label: 'Dönüştürüldü', icon: ArrowRightLeft },
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

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function - doesn't depend on search/filter state
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

        const filters: CrmCustomerFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        if (filter !== 'all') {
          filters.status = filter as CrmCustomerStatus;
        }

        const response = await getCrmCustomers(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setCustomers((prev) => [...prev, ...response.customers]);
          } else {
            setCustomers(response.customers);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('CRM customers fetch error:', err);
          setError(err instanceof Error ? err.message : 'Müşteriler yüklenemedi');
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
  }, [activeFilter]); // Only activeFilter, not search (search has debounce)

  // Search change - with debounce
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

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, activeFilter, 1, false, true);
  };

  const loadMore = () => {
    if (
      pagination &&
      pagination.current_page < pagination.last_page &&
      !isLoadingMore &&
      !isLoading
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true);
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


  // Prepare tabs for header
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
        title="CRM Müşterileri"
        showBackButton={true}
        subtitle={pagination ? `${pagination.total} müşteri` : undefined}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/crm/customers/new' as any)}
            activeOpacity={0.7}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.contentCard}>
        <StandardListContainer
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id.toString()}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Müşteri ara...',
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
          executeFetch(searchQuery, activeFilter, 1, false);
        }}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
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
