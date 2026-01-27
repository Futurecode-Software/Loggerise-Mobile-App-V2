import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { CircleDot, Plus, Filter } from 'lucide-react-native';
import { StandardListContainer, StandardListItem, Badge, ConfirmDialog } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import { showToast } from '@/utils/toast';
import {
  getTires,
  Tire,
  TireFilters,
  Pagination,
  deleteTire,
  getTireStatusLabel,
  getTireConditionLabel,
  getTireTypeLabel,
  getTireStatusColor,
  getTireConditionColor,
} from '@/services/endpoints/tires';

export default function TireWarehouseScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [tires, setTires] = useState<Tire[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Tire | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Core fetch function
  const executeFetch = useCallback(
    async (search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: TireFilters = {
          page,
          per_page: 20,
          sort_by: 'created_at',
          sort_order: 'desc',
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        const response = await getTires(filters);

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setTires((prev) => [...prev, ...response.tires]);
          } else {
            setTires(response.tires);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Tires fetch error:', err);
          setError(err instanceof Error ? err.message : 'Lastikler yüklenemedi');
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
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, pagination.current_page + 1, true);
    }
  };

  const handleDelete = (tire: Tire) => {
    setItemToDelete(tire);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTire(itemToDelete.id);
      setTires((prev) => prev.filter((t) => t.id !== itemToDelete.id));
      setShowDeleteDialog(false);
      setItemToDelete(null);
      showToast({ type: 'success', message: 'Lastik başarıyla silindi' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Silme başarısız oldu',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (status) {
      case 'in_stock':
        return 'success';
      case 'assigned':
        return 'default';
      case 'maintenance':
        return 'warning';
      case 'retired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getConditionBadgeVariant = (
    condition: string
  ): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (condition) {
      case 'new':
        return 'success';
      case 'good':
        return 'default';
      case 'fair':
        return 'warning';
      case 'worn':
        return 'warning';
      case 'damaged':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderTire = (item: Tire) => {
    const brandModel = [item.brand, item.model].filter(Boolean).join(' ');
    const tireInfo = [brandModel, item.size, getTireTypeLabel(item.tire_type)]
      .filter(Boolean)
      .join(' • ');

    const additionalInfo = (
      <View style={styles.additionalInfo}>
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Lastik Bilgisi:
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{tireInfo}</Text>
        </View>

        {item.tread_depth !== null && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Diş Derinliği:
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: item.tread_depth <= 3.0 ? '#ef4444' : colors.text,
                  fontWeight: item.tread_depth <= 3.0 ? '600' : 'normal',
                },
              ]}
            >
              {item.tread_depth} mm
              {item.tread_depth <= 3.0 && ' ⚠️'}
            </Text>
          </View>
        )}

        {item.warehouse_location && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Konum:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {item.warehouse_location}
            </Text>
          </View>
        )}

        {item.current_assignment?.vehicle && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Araçta:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]}>
              {item.current_assignment.vehicle.plate}
              {item.current_assignment.position && ` (${item.current_assignment.position})`}
            </Text>
          </View>
        )}

        {item.purchase_date && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Alım Tarihi:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(item.purchase_date).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Not:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        <View style={styles.badgesRow}>
          <View style={styles.badgeItem}>
            <Text style={[styles.badgeLabel, { color: colors.textSecondary }]}>Durum:</Text>
            <Badge variant={getStatusBadgeVariant(item.status)}>
              {getTireStatusLabel(item.status)}
            </Badge>
          </View>
          <View style={styles.badgeItem}>
            <Text style={[styles.badgeLabel, { color: colors.textSecondary }]}>Kondisyon:</Text>
            <Badge variant={getConditionBadgeVariant(item.condition)}>
              {getTireConditionLabel(item.condition)}
            </Badge>
          </View>
        </View>
      </View>
    );

    return (
      <StandardListItem
        icon={CircleDot}
        iconColor={getTireStatusColor(item.status)}
        title={`${item.serial_number} - ${item.brand}`}
        subtitle={item.size}
        additionalInfo={additionalInfo}
        statusDot={{ color: getTireConditionColor(item.condition) }}
        onPress={() => router.push(`/fleet/tire-warehouse/${item.id}` as any)}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Lastik Deposu"
        subtitle={pagination ? `${pagination.total} lastik` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => {
              // Filter modal açılabilir
            }}
            activeOpacity={0.7}
          >
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.contentCard}>
        <StandardListContainer
        data={tires}
        renderItem={renderTire}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Seri no, marka, model veya ebat ile ara...',
        }}
        emptyState={{
          icon: CircleDot,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz lastik kaydı yok',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni lastik eklemek için + butonuna tıklayın',
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
          onPress={() => router.push('/fleet/tire-warehouse/new' as any)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Lastiği Sil"
        message={
          itemToDelete
            ? `${itemToDelete.serial_number} (${itemToDelete.brand} ${itemToDelete.size}) lastiğini silmek istediğinize emin misiniz?`
            : ''
        }
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setItemToDelete(null);
        }}
        isLoading={isDeleting}
        isDangerous={true}
      />
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
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 100,
  },
  infoValue: {
    fontSize: 12,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeLabel: {
    fontSize: 11,
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
