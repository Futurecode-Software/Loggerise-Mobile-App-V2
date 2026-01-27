/**
 * Stock Movements List Screen
 *
 * List all stock movements with filtering by warehouse, product, type, and date range.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Filter, Repeat } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getStockMovements,
  getMovementTypeLabel,
  isInboundMovement,
  getMovementTypeColor,
  StockMovement,
  StockMovementFilters,
} from '@/services/endpoints/stock-movements';
import { Pagination } from '@/services/endpoints/products';

export default function StockMovementsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function - no dependencies on state
  const executeFetch = useCallback(
    async (search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: StockMovementFilters = {
          page,
          per_page: 20,
          search: search.trim() || undefined,
          sort_by: 'transaction_date',
          sort_order: 'desc',
        };

        const response = await getStockMovements(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setMovements((prev) => [...prev, ...response.movements]);
          } else {
            setMovements(response.movements);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Movements fetch error:', err);
          setError(err instanceof Error ? err.message : 'Stok hareketleri yüklenemedi');
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

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, 1, false);
      }
    }, [searchQuery, executeFetch])
  );

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatQuantity = (movement: StockMovement) => {
    const sign = isInboundMovement(movement.movement_type) ? '+' : '-';
    const unit = movement.product?.unit || '';
    return `${sign}${movement.quantity} ${unit}`;
  };

  const renderMovement = (item: StockMovement) => {
    const isInbound = isInboundMovement(item.movement_type);
    const typeColor = getMovementTypeColor(item.movement_type);
    const isTransfer = item.movement_type === 'transfer_in' || item.movement_type === 'transfer_out';

    const Icon = isTransfer ? Repeat : isInbound ? ArrowDownLeft : ArrowUpRight;
    const warehouseText = item.warehouse?.name || `Depo #${item.warehouse_id}`;
    const fullWarehouseText = isTransfer && item.reference_warehouse
      ? `${warehouseText} → ${item.reference_warehouse.name}`
      : warehouseText;

    return (
      <StandardListItem
        icon={Icon}
        iconColor={typeColor}
        iconBg={`${typeColor}15`}
        title={item.product?.name || `Ürün #${item.product_id}`}
        subtitle={fullWarehouseText}
        meta={item.notes}
        additionalInfo={
          <Text
            style={[
              styles.quantity,
              { color: isInbound ? colors.success : colors.danger },
            ]}
          >
            {formatQuantity(item)}
          </Text>
        }
        status={{
          label: getMovementTypeLabel(item.movement_type),
          variant: isInbound ? 'success' : 'danger',
        }}
        footer={{
          left: (
            <View style={styles.footerLeftContent}>
              <Badge
                label={getMovementTypeLabel(item.movement_type)}
                variant={isInbound ? 'success' : 'danger'}
                size="sm"
              />
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {formatDate(item.transaction_date)}
              </Text>
            </View>
          ),
        }}
        onPress={() => router.push(`/stock/movements/${item.id}` as any)}
      />
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Stok Hareketleri"
        subtitle={pagination ? `${pagination.total} hareket` : undefined}
        showBackButton={true}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push('/stock/movements/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Filter action
              }}
              activeOpacity={0.7}
            >
              <Filter size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.contentArea}>
        <StandardListContainer
        data={movements}
        renderItem={renderMovement}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Ürün veya not ile ara...',
        }}
        emptyState={{
          icon: ArrowLeftRight,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz stok hareketi yok',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni hareket eklemek için + butonuna tıklayın',
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
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  footerLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dateText: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
});
