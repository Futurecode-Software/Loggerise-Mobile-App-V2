import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Layers, Clock, CheckCircle, XCircle, AlertTriangle, Ban, FileText } from 'lucide-react-native';
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
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
});
