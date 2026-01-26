import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Filter, Plus, Warehouse, MapPin, User } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getWarehouses,
  Warehouse as WarehouseType,
  WarehouseFilters,
  Pagination,
} from '@/services/endpoints/warehouses';

export default function WarehouseScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function - no dependencies on state
  const executeFetch = useCallback(
    async (search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: WarehouseFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        const response = await getWarehouses(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setWarehouses((prev) => [...prev, ...response.warehouses]);
          } else {
            setWarehouses(response.warehouses);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Warehouses fetch error:', err);
          setError(err instanceof Error ? err.message : 'Depolar yüklenemedi');
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
    executeFetch(searchQuery, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty deps - only run on mount

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
  }, [searchQuery]); // Only searchQuery

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, 1, false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, pagination.current_page + 1, true);
    }
  };

  const renderWarehouse = (item: WarehouseType) => {
    const additionalInfo = [];
    if (item.address) {
      additionalInfo.push(
        <View key="address" style={styles.detailRow}>
          <MapPin size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.address}
          </Text>
        </View>
      );
    }
    if (item.manager) {
      additionalInfo.push(
        <View key="manager" style={styles.detailRow}>
          <User size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.manager}
          </Text>
        </View>
      );
    }

    return (
      <StandardListItem
        icon={Warehouse}
        iconColor={Brand.primary}
        title={item.name}
        subtitle={item.code}
        additionalInfo={additionalInfo.length > 0 ? <View style={styles.additionalInfo}>{additionalInfo}</View> : undefined}
        status={{
          label: item.is_active ? 'Aktif' : 'Pasif',
          variant: item.is_active ? 'success' : 'default',
        }}
        statusDot={item.is_active ? { color: colors.success } : { color: colors.textMuted }}
        onPress={() => router.push(`/warehouse/${item.id}` as any)}
      />
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Depolar"
        subtitle={pagination ? `${pagination.total} depo` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => {
              // Filter action
            }}
            activeOpacity={0.7}
          >
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <StandardListContainer
        data={warehouses}
        renderItem={renderWarehouse}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Depo adı veya kod ile ara...',
        }}
        emptyState={{
          icon: Warehouse,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz depo eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni depo eklemek için + butonuna tıklayın',
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/warehouse/new' as any)}
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
