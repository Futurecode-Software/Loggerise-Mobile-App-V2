/**
 * Export Loads Screen
 *
 * Lists export direction loads with filtering.
 * Mobile version of web export loads listing.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Filter, Package, Building2, MapPin, Truck, Plus } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getLoads,
  Load,
  LoadFilters,
  Pagination,
  getStatusLabel,
  getStatusColor,
  getDirectionLabel,
} from '@/services/endpoints/loads';

export default function ExportLoadsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [loads, setLoads] = useState<Load[]>([]);
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
  const executeFetch = useCallback(async (search: string, page: number = 1, append: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current;

    try {
      setError(null);

      const filters: LoadFilters = {
        page,
        per_page: 20,
        direction: 'export', // Sadece ihracat yükleri
        is_active: true,
        assigned_to_trip: 'all', // Tüm yükler (atanmış ve atanmamış)
      };

      if (search.trim()) {
        filters.search = search.trim();
      }

      const response = await getLoads(filters);

      // Only update if this is still the latest request
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (append) {
          setLoads((prev) => [...prev, ...response.loads]);
        } else {
          setLoads(response.loads);
        }
        setPagination(response.pagination);
        hasInitialFetchRef.current = true;
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        console.error('Loads fetch error:', err);
        setError(err instanceof Error ? err.message : 'Yükler yüklenemedi');
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Initial fetch - only once on mount
  useEffect(() => {
    isMountedRef.current = true;
    executeFetch(searchQuery, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      executeFetch(searchQuery, 1, false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, 1, false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, pagination.current_page + 1, true);
    }
  };

  // Get status badge variant
  const getStatusVariant = (
    status?: string
  ): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' | 'info' => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'success';
      case 'in_transit':
      case 'in_progress':
        return 'info';
      case 'pending':
      case 'loading':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderLoad = (item: Load) => {
    const additionalInfo = [];

    // Müşteri
    if (item.customer?.name) {
      additionalInfo.push(
        <View key="customer" style={styles.detailRow}>
          <Building2 size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.customer.name}
          </Text>
        </View>
      );
    }

    // Kargo adı
    if (item.cargo_name) {
      additionalInfo.push(
        <View key="cargo" style={styles.detailRow}>
          <Package size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.cargo_name}
          </Text>
        </View>
      );
    }

    // Yük tipi
    if (item.load_type) {
      additionalInfo.push(
        <View key="type" style={styles.detailRow}>
          <Truck size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.load_type === 'full' ? 'Komple' : 'Parsiyel'}
          </Text>
        </View>
      );
    }

    return (
      <StandardListItem
        icon={Package}
        iconColor={Brand.primary}
        title={item.load_number}
        subtitle={item.cargo_name || '-'}
        additionalInfo={
          additionalInfo.length > 0 ? (
            <View style={styles.additionalInfo}>{additionalInfo}</View>
          ) : undefined
        }
        status={{
          label: getStatusLabel(item.status),
          variant: getStatusVariant(item.status),
        }}
        statusDot={{ color: getStatusColor(item.status) }}
        onPress={() => router.push(`/load/${item.id}` as any)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="İhracat Yükleri"
        subtitle={pagination ? `${pagination.total} yük` : undefined}
        showBackButton={true}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push('/load/new?direction=export')}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Filter action - can be implemented later
              }}
              activeOpacity={0.7}
            >
              <Filter size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.contentCard}>
          <StandardListContainer
        data={loads}
        renderItem={renderLoad}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Yük numarası, kargo veya müşteri ara...',
        }}
        emptyState={{
          icon: Package,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz ihracat yükü yok',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni ihracat yükü oluşturmak için + butonuna tıklayın',
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
          executeFetch(searchQuery, 1, false);
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
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
    color: Colors.light.textSecondary,
  },
});
