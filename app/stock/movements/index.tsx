/**
 * Stock Movements List Screen
 *
 * List all stock movements with filtering by warehouse, product, type, and date range.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Plus, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Trash2, Filter, Repeat } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getStockMovements,
  deleteStockMovement,
  getMovementTypeLabel,
  isInboundMovement,
  getMovementTypeColor,
  StockMovement,
  StockMovementFilters,
} from '@/services/endpoints/stock-movements';
import { Pagination } from '@/services/endpoints/products';
import { useToast } from '@/hooks/use-toast';

export default function StockMovementsScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isInitialMount = useRef(true);

  // API state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch movements from API
  const fetchMovements = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters: StockMovementFilters = {
          page,
          per_page: 20,
          search: searchQuery.trim() || undefined,
          sort_by: 'transaction_date',
          sort_order: 'desc',
        };

        const response = await getStockMovements(filters);

        if (append) {
          setMovements((prev) => [...prev, ...response.movements]);
        } else {
          setMovements(response.movements);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Movements fetch error:', err);
        setError(err instanceof Error ? err.message : 'Stok hareketleri yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery]
  );

  // Single useEffect for both initial load and search
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!ignore) {
        setIsLoading(true);
        await fetchMovements(1, false);
      }
    };

    // Initial mount - fetch immediately
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadData();
      return;
    }

    // Search change - debounce
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMovements(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      fetchMovements(pagination.current_page + 1, true);
    }
  };

  const handleDelete = (movement: StockMovement) => {
    Alert.alert(
      'Hareketi Sil',
      `Bu stok hareketini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStockMovement(movement.id);
              success('Başarılı', 'Stok hareketi silindi.');
              fetchMovements(1, false);
            } catch (err) {
              showError('Hata', err instanceof Error ? err.message : 'Hareket silinemedi');
            }
          },
        },
      ]
    );
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
          right: (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              <Trash2 size={16} color={colors.danger} />
            </TouchableOpacity>
          ),
        }}
        onPress={() => router.push(`/stock/movements/${item.id}` as any)}
      />
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Stok Hareketleri"
        subtitle={pagination ? `${pagination.total} hareket` : undefined}
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
          fetchMovements(1, false);
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/stock/movements/new' as any)}
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
  deleteButton: {
    padding: Spacing.xs,
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
