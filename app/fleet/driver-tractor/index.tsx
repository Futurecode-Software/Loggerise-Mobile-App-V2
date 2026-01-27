import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { UserCircle2, Plus, CheckCircle2, XCircle, Edit, Trash2 } from 'lucide-react-native';
import { StandardListContainer, StandardListItem, ConfirmDialog } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import { showToast } from '@/utils/toast';
import {
  getDriverTractorAssignments,
  DriverTractorAssignment,
  DriverTractorAssignmentFilters,
  Pagination,
  deleteDriverTractorAssignment,
  toggleDriverTractorAssignment,
} from '@/services/endpoints/fleet';

export default function DriverTractorAssignmentsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [assignments, setAssignments] = useState<DriverTractorAssignment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DriverTractorAssignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function
  const executeFetch = useCallback(
    async (search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: DriverTractorAssignmentFilters = {
          page,
          per_page: 20,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        const response = await getDriverTractorAssignments(filters);

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setAssignments((prev) => [...prev, ...response.assignments]);
          } else {
            setAssignments(response.assignments);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Assignments fetch error:', err);
          setError(err instanceof Error ? err.message : 'Eşleştirmeler yüklenemedi');
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

  const handleToggle = async (assignment: DriverTractorAssignment) => {
    try {
      await toggleDriverTractorAssignment(assignment.id);

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id ? { ...a, is_active: !a.is_active } : a
        )
      );

      showToast({
        type: 'success',
        message: assignment.is_active ? 'Eşleştirme pasif edildi' : 'Eşleştirme aktif edildi',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'İşlem başarısız oldu',
      });
    }
  };

  const handleDelete = (assignment: DriverTractorAssignment) => {
    setItemToDelete(assignment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDriverTractorAssignment(itemToDelete.id);
      setAssignments((prev) => prev.filter((a) => a.id !== itemToDelete.id));
      setShowDeleteDialog(false);
      setItemToDelete(null);
      showToast({ type: 'success', message: 'Eşleştirme başarıyla silindi' });
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Silme başarısız oldu',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderAssignment = (item: DriverTractorAssignment) => {
    const driverInfo = item.employee
      ? `${item.employee.full_name}${item.employee.phone_1 ? ` • ${item.employee.phone_1}` : ''}`
      : 'Sürücü bilgisi yok';

    const tractorInfo = item.tractor
      ? `${item.tractor.plate}${
          item.tractor.brand || item.tractor.model
            ? ` • ${[item.tractor.brand, item.tractor.model].filter(Boolean).join(' ')}`
            : ''
        }`
      : 'Çekici bilgisi yok';

    const additionalInfo = (
      <View style={styles.additionalInfo}>
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Sürücü:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{driverInfo}</Text>
        </View>
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Çekici:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{tractorInfo}</Text>
        </View>
        {item.notes && (
          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Not:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Atanma Tarihi:
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {new Date(item.assigned_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
    );

    return (
      <StandardListItem
        icon={UserCircle2}
        iconColor={Brand.primary}
        title={`${item.employee?.full_name || 'Sürücü'} - ${item.tractor?.plate || 'Çekici'}`}
        subtitle={`Eşleştirme #${item.id}`}
        additionalInfo={additionalInfo}
        status={{
          label: item.is_active ? 'Aktif' : 'Pasif',
          variant: item.is_active ? 'success' : 'secondary',
        }}
        statusDot={{ color: item.is_active ? '#22c55e' : '#6B7280' }}
        actions={
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => handleToggle(item)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              {item.is_active ? (
                <XCircle size={20} color="#f97316" />
              ) : (
                <CheckCircle2 size={20} color="#22c55e" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/fleet/driver-tractor/${item.id}` as any)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Edit size={20} color={Brand.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Sürücü-Çekici Eşleştirme"
        subtitle={pagination ? `${pagination.total} eşleştirme` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/fleet/driver-tractor/new' as any)}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.contentCard}>
        <StandardListContainer
        data={assignments}
        renderItem={renderAssignment}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Sürücü adı veya çekici plakası ile ara...',
        }}
        emptyState={{
          icon: UserCircle2,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz eşleştirme eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni eşleştirme eklemek için + butonuna tıklayın',
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

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Eşleştirmeyi Sil"
        message={
          itemToDelete
            ? `${itemToDelete.employee?.full_name || 'Sürücü'} - ${itemToDelete.tractor?.plate || 'Çekici'} eşleştirmesini silmek istediğinize emin misiniz?`
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
    minWidth: 80,
  },
  infoValue: {
    fontSize: 12,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.xs,
  },
});
