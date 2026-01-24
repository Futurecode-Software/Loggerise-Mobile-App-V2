/**
 * Stock Movements List Screen
 *
 * List all stock movements with filtering by warehouse, product, type, and date range.
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Search,
  Plus,
  ArrowLeftRight,
  ChevronRight,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Filter,
  Repeat,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
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

  const renderMovement = ({ item }: { item: StockMovement }) => {
    const isInbound = isInboundMovement(item.movement_type);
    const typeColor = getMovementTypeColor(item.movement_type);
    const isTransfer = item.movement_type === 'transfer_in' || item.movement_type === 'transfer_out';

    return (
      <Card
        style={styles.movementCard}
        onPress={() => router.push(`/stock/movements/${item.id}` as any)}
      >
        <View style={styles.movementHeader}>
          <View style={[styles.movementIcon, { backgroundColor: `${typeColor}15` }]}>
            {isTransfer ? (
              <Repeat size={20} color={typeColor} />
            ) : isInbound ? (
              <ArrowDownLeft size={20} color={typeColor} />
            ) : (
              <ArrowUpRight size={20} color={typeColor} />
            )}
          </View>
          <View style={styles.movementInfo}>
            <Text style={[styles.productName, { color: colors.text }]}>
              {item.product?.name || `Ürün #${item.product_id}`}
            </Text>
            <Text style={[styles.warehouseName, { color: colors.textSecondary }]}>
              {item.warehouse?.name || `Depo #${item.warehouse_id}`}
              {isTransfer && item.reference_warehouse && (
                <Text> → {item.reference_warehouse.name}</Text>
              )}
            </Text>
          </View>
          <Text
            style={[
              styles.quantity,
              { color: isInbound ? colors.success : colors.danger },
            ]}
          >
            {formatQuantity(item)}
          </Text>
        </View>

        {item.notes && (
          <Text style={[styles.notes, { color: colors.textMuted }]} numberOfLines={1}>
            {item.notes}
          </Text>
        )}

        <View style={[styles.movementFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerLeft}>
            <Badge
              label={getMovementTypeLabel(item.movement_type)}
              variant={isInbound ? 'success' : 'danger'}
              size="sm"
            />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {formatDate(item.transaction_date)}
            </Text>
          </View>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              <Trash2 size={16} color={colors.danger} />
            </TouchableOpacity>
            <ChevronRight size={18} color={colors.icon} />
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Stok hareketleri yükleniyor...
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
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchMovements(1, false);
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
          <ArrowLeftRight size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz stok hareketi yok'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni hareket eklemek için + butonuna tıklayın'}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Stok Hareketleri</Text>
        <View style={styles.headerActions}>
          {pagination && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {pagination.total} hareket
            </Text>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Ürün veya not ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={movements}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMovement}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/stock/movements/new' as any)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  countText: {
    ...Typography.bodySM,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  movementCard: {
    marginBottom: 0,
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  movementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  movementInfo: {
    flex: 1,
  },
  productName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  warehouseName: {
    ...Typography.bodySM,
  },
  quantity: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  notes: {
    ...Typography.bodySM,
    marginBottom: Spacing.sm,
    paddingLeft: 52, // Align with product name
  },
  movementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.xs,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dateText: {
    ...Typography.bodyXS,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.xs,
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
    borderRadius: 8,
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
