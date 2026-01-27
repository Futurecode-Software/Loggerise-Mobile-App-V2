import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Layers, Clock, CheckCircle, XCircle, AlertTriangle, Ban, FileText, TrendingUp, Wallet, AlertCircle } from 'lucide-react-native';
import { formatBalance } from '@/services/endpoints/cash-registers';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Typography, BorderRadius, Shadows, Brand } from '@/constants/theme';
import {
  getChecks,
  Check,
  CheckFilters,
  CheckStatus,
  Pagination,
  getCheckTypeLabel,
  getCheckStatusLabel,
  getCheckStatusColor,
  formatCheckAmount,
} from '@/services/endpoints/checks';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'pending', label: 'Beklemede', icon: Clock },
  { id: 'cleared', label: 'Tahsil Edildi', icon: CheckCircle },
  { id: 'bounced', label: 'Karşılıksız', icon: AlertTriangle },
  { id: 'cancelled', label: 'İptal', icon: Ban },
];

export default function ChecksScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [checks, setChecks] = useState<Check[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasInitialFetchRef = useRef(false);

  // Core fetch function
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
        const filters: CheckFilters = {
          page,
          per_page: 20,
        };

        // Add search filter
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add status filter
        if (filter !== 'all') {
          filters.status = filter as CheckStatus;
        }

        const response = await getChecks(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setChecks((prev) => [...prev, ...response.checks]);
          } else {
            setChecks(response.checks);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Checks fetch error:', err);
          setError(err instanceof Error ? err.message : 'Çekler yüklenemedi');
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

  // Refresh on screen focus (e.g., after deleting a check)
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, activeFilter, 1, false);
      }
    }, [searchQuery, activeFilter, executeFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, activeFilter, 1, false, true);
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

  const renderCheck = (item: Check) => {
    const isReceived = item.type === 'received';
    const daysUntilDue = Math.ceil(
      (new Date(item.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const additionalInfo = (
      <View style={styles.additionalInfo}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {item.bank_name} • {formatDate(item.due_date, 'dd.MM.yyyy')}
          {daysUntilDue > 0 && daysUntilDue <= 30 && item.status === 'pending' && (
            <Text style={{ color: colors.warning }}> ({daysUntilDue} gün)</Text>
          )}
        </Text>
      </View>
    );

    return (
      <StandardListItem
        icon={FileText}
        iconColor={Brand.primary}
        title={item.check_number}
        subtitle={item.contact?.name || '-'}
        additionalInfo={additionalInfo}
        status={{
          label: getCheckStatusLabel(item.status),
          variant: getCheckStatusColor(item.status),
        }}
        footer={{
          left: (
            <Badge
              label={getCheckTypeLabel(item.type)}
              variant={isReceived ? 'success' : 'info'}
              size="sm"
            />
          ),
          right: (
            <Text style={[styles.amount, { color: colors.primary }]}>
              {formatCheckAmount(item.amount, item.currency_type)}
            </Text>
          ),
        }}
        onPress={() => router.push(`/check/${item.id}`)}
      />
    );
  };

  // Calculate totals
  const getTotals = () => {
    const totalAmount = checks.reduce((acc, check) => acc + check.amount, 0);
    const pendingAmount = checks
      .filter(c => c.status === 'pending')
      .reduce((acc, check) => acc + check.amount, 0);
    const clearedAmount = checks
      .filter(c => c.status === 'cleared')
      .reduce((acc, check) => acc + check.amount, 0);
    return { totalAmount, pendingAmount, clearedAmount };
  };

  const totals = getTotals();

  const renderHeader = () => {
    if (checks.length === 0) return null;
    
    return (
      <View style={styles.summaryCard}>
        {/* Header */}
        <View style={styles.summaryHeader}>
          <View style={styles.summaryHeaderLeft}>
            <View style={styles.summaryIcon}>
              <TrendingUp size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryTitle}>Çek Özeti</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{checks.length} Çek</Text>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Toplam Tutar</Text>
          <Text style={styles.summaryTotalValue}>
            {totals.totalAmount.toFixed(2)} ₺
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryStat, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <View style={styles.summaryStatHeader}>
              <Wallet size={16} color="#10B981" />
              <Text style={[styles.summaryStatValue, { color: '#10B981' }]}>
                {totals.clearedAmount.toFixed(2)} ₺
              </Text>
            </View>
            <Text style={styles.summaryStatLabel}>Tahsil Edildi</Text>
          </View>

          <View style={[styles.summaryStat, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <View style={styles.summaryStatHeader}>
              <Clock size={16} color="#F59E0B" />
              <Text style={[styles.summaryStatValue, { color: '#F59E0B' }]}>
                {totals.pendingAmount.toFixed(2)} ₺
              </Text>
            </View>
            <Text style={styles.summaryStatLabel}>Beklemede</Text>
          </View>
        </View>
      </View>
    );
  };

  // Prepare tabs for header
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

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Çekler"
        subtitle={pagination ? `${pagination.total} çek` : undefined}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/check/new')}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <StandardListContainer
        data={checks}
        renderItem={renderCheck}
        keyExtractor={(item) => `check-${item.id}`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Çek numarası, banka ara..."
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLoadMore={loadMore}
        error={error}
        emptyTitle="Çek bulunamadı"
        emptySubtitle="Henüz kayıtlı çek bulunmuyor"
        ListHeaderComponent={renderHeader()}
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
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  additionalInfo: {
    marginTop: Spacing.xs,
  },
  detailText: {
    ...Typography.bodySM,
  },
  amount: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Brand.primary,
    ...Shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    ...Typography.headingSM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryBadgeText: {
    ...Typography.bodyXS,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryTotal: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryTotalLabel: {
    ...Typography.bodySM,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  summaryTotalValue: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryStat: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryStatValue: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  summaryStatLabel: {
    ...Typography.bodyXS,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
