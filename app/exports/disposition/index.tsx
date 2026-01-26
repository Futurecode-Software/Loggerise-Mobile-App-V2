/**
 * Disposition Screen
 *
 * Manages draft positions and load assignments for exports.
 * Mobile-optimized version of web disposition drag & drop interface.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import {
  Plus,
  Check,
  Trash2,
  Package,
  MapPin,
  Truck,
  User,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge, Button } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getDispositionData,
  createDraftPosition,
  confirmDraftPosition,
  deleteDraftPosition,
  assignLoadToPosition,
  removeLoadFromPosition,
  calculatePositionCapacity,
  DraftPosition,
  DispositionData,
} from '@/services/endpoints/disposition';
import { Load, getStatusLabel, getStatusColor } from '@/services/endpoints/loads';

export default function DispositionScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Data state
  const [data, setData] = useState<DispositionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedPosition, setSelectedPosition] = useState<DraftPosition | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set());
  const [showLoadPicker, setShowLoadPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<DraftPosition | null>(null);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState<number | null>(null);

  // Refs
  const isMountedRef = useRef(true);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getDispositionData('export');
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Disposition fetch error:', err);
        setError(err instanceof Error ? err.message : 'Veriler yüklenemedi');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Create new draft position
  const handleCreateDraft = async () => {
    setIsCreating(true);
    try {
      const position = await createDraftPosition('export');
      success('Başarılı', 'Taslak pozisyon oluşturuldu.');
      // Expand new position
      setExpandedPositions((prev) => new Set([...prev, position.id]));
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Taslak oluşturulamadı.');
    } finally {
      setIsCreating(false);
    }
  };

  // Confirm draft position
  const handleConfirmDraft = async (position: DraftPosition) => {
    setIsConfirming(position.id);
    try {
      await confirmDraftPosition(position.id);
      success('Başarılı', 'Pozisyon onaylandı.');
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Pozisyon onaylanamadı.');
    } finally {
      setIsConfirming(null);
    }
  };

  // Delete draft position - show confirm
  const handleDeleteDraft = (position: DraftPosition) => {
    setPositionToDelete(position);
    setShowDeleteConfirm(true);
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!positionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDraftPosition(positionToDelete.id);
      success('Başarılı', 'Taslak pozisyon silindi.');
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Taslak silinemedi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setPositionToDelete(null);
    }
  };

  // Open load picker for a position
  const handleOpenLoadPicker = (position: DraftPosition) => {
    setSelectedPosition(position);
    setShowLoadPicker(true);
  };

  // Assign load to position
  const handleAssignLoad = async (load: Load) => {
    if (!selectedPosition) return;
    setIsAssigning(load.id);
    try {
      await assignLoadToPosition(selectedPosition.id, load.id);
      success('Başarılı', 'Yük pozisyona atandı.');
      setShowLoadPicker(false);
      setSelectedPosition(null);
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Yük atanamadı.');
    } finally {
      setIsAssigning(null);
    }
  };

  // Remove load from position
  const handleRemoveLoad = async (position: DraftPosition, load: Load) => {
    try {
      await removeLoadFromPosition(position.id, load.id);
      success('Başarılı', 'Yük pozisyondan çıkarıldı.');
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Yük çıkarılamadı.');
    }
  };

  // Toggle position expansion
  const togglePositionExpand = (positionId: number) => {
    setExpandedPositions((prev) => {
      const next = new Set(prev);
      if (next.has(positionId)) {
        next.delete(positionId);
      } else {
        next.add(positionId);
      }
      return next;
    });
  };

  // Render draft position card
  const renderDraftPosition = ({ item: position }: { item: DraftPosition }) => {
    const isExpanded = expandedPositions.has(position.id);
    const loads = position.loads || [];
    const capacity = calculatePositionCapacity(loads);
    const isConfirmingThis = isConfirming === position.id;

    return (
      <Card style={styles.positionCard}>
        {/* Header */}
        <TouchableOpacity
          style={styles.positionHeader}
          onPress={() => togglePositionExpand(position.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.positionIcon, { backgroundColor: Brand.primary + '15' }]}>
            <MapPin size={20} color={Brand.primary} />
          </View>
          <View style={styles.positionInfo}>
            <Text style={[styles.positionTitle, { color: colors.text }]}>
              Taslak Pozisyon #{position.id}
            </Text>
            <View style={styles.positionMeta}>
              {position.truck_tractor && (
                <View style={styles.metaItem}>
                  <Truck size={12} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {position.truck_tractor.plate}
                  </Text>
                </View>
              )}
              <View style={styles.metaItem}>
                <Package size={12} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {loads.length} yük
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.positionActions}>
            <Badge label="Taslak" variant="warning" size="sm" />
            {isExpanded ? (
              <ChevronUp size={20} color={colors.textMuted} />
            ) : (
              <ChevronDown size={20} color={colors.textMuted} />
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.positionContent}>
            {/* Capacity Info */}
            <View style={[styles.capacityRow, { backgroundColor: colors.surface }]}>
              <View style={styles.capacityItem}>
                <Text style={[styles.capacityLabel, { color: colors.textSecondary }]}>Hacim</Text>
                <Text style={[styles.capacityValue, { color: colors.text }]}>
                  {capacity.totalVolume} m³
                </Text>
              </View>
              <View style={styles.capacityItem}>
                <Text style={[styles.capacityLabel, { color: colors.textSecondary }]}>Ağırlık</Text>
                <Text style={[styles.capacityValue, { color: colors.text }]}>
                  {capacity.totalWeight} kg
                </Text>
              </View>
              <View style={styles.capacityItem}>
                <Text style={[styles.capacityLabel, { color: colors.textSecondary }]}>LDM</Text>
                <Text style={[styles.capacityValue, { color: colors.text }]}>
                  {capacity.totalLademetre}
                </Text>
              </View>
            </View>

            {/* Loads List */}
            {loads.length > 0 ? (
              <View style={styles.loadsList}>
                <Text style={[styles.loadsTitle, { color: colors.text }]}>Atanmış Yükler</Text>
                {loads.map((load) => (
                  <View
                    key={load.id}
                    style={[styles.loadItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.loadInfo}>
                      <Text style={[styles.loadNumber, { color: colors.text }]}>
                        {load.load_number}
                      </Text>
                      <Text
                        style={[styles.loadCargo, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {load.cargo_name || '-'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.removeLoadBtn, { backgroundColor: colors.dangerLight }]}
                      onPress={() => handleRemoveLoad(position, load)}
                    >
                      <X size={14} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyLoads}>
                <AlertCircle size={24} color={colors.textMuted} />
                <Text style={[styles.emptyLoadsText, { color: colors.textSecondary }]}>
                  Henüz yük atanmamış
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleOpenLoadPicker(position)}
              >
                <Plus size={16} color={Brand.primary} />
                <Text style={[styles.actionBtnText, { color: Brand.primary }]}>Yük Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Brand.primary }]}
                onPress={() => handleConfirmDraft(position)}
                disabled={isConfirmingThis || loads.length === 0}
              >
                {isConfirmingThis ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Onayla</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                onPress={() => handleDeleteDraft(position)}
              >
                <Trash2 size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>
    );
  };

  // Render unassigned load item (in modal)
  const renderUnassignedLoad = ({ item: load }: { item: Load }) => {
    const isAssigningThis = isAssigning === load.id;

    return (
      <TouchableOpacity
        style={[styles.unassignedLoadItem, { borderColor: colors.border }]}
        onPress={() => handleAssignLoad(load)}
        disabled={isAssigningThis}
        activeOpacity={0.7}
      >
        <View style={styles.loadInfo}>
          <Text style={[styles.loadNumber, { color: colors.text }]}>{load.load_number}</Text>
          <Text style={[styles.loadCargo, { color: colors.textSecondary }]} numberOfLines={1}>
            {load.cargo_name || '-'}
          </Text>
          {load.customer && (
            <Text style={[styles.loadCustomer, { color: colors.textMuted }]} numberOfLines={1}>
              {load.customer.name}
            </Text>
          )}
        </View>
        <View style={styles.loadStatusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(load.status) }]} />
          {isAssigningThis ? (
            <ActivityIndicator size="small" color={Brand.primary} />
          ) : (
            <Plus size={20} color={Brand.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Dispozisyon" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Dispozisyon" showBackButton />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const draftPositions = data?.draft_positions || [];
  const unassignedLoads = data?.unassigned_loads || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Dispozisyon"
        subtitle={`${draftPositions.length} taslak • ${unassignedLoads.length} atanmamış yük`}
        showBackButton
      />

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Brand.primary }]}>{draftPositions.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taslak</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{unassignedLoads.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Atanmamış</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {data?.active_positions?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aktif</Text>
        </View>
      </View>

      {/* Draft Positions List */}
      <FlatList
        data={draftPositions}
        renderItem={renderDraftPosition}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <MapPin size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Taslak pozisyon yok
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Yeni taslak oluşturmak için + butonuna tıklayın
            </Text>
          </View>
        }
      />

      {/* FAB - Create Draft */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={handleCreateDraft}
        disabled={isCreating}
        activeOpacity={0.8}
      >
        {isCreating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Plus size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Load Picker Modal */}
      <Modal
        visible={showLoadPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLoadPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Yük Seç</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowLoadPicker(false);
                  setSelectedPosition(null);
                }}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {unassignedLoads.length > 0 ? (
              <FlatList
                data={unassignedLoads}
                renderItem={renderUnassignedLoad}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.modalListContent}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.modalEmpty}>
                <Package size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Atanmamış yük yok
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Tüm yükler pozisyonlara atanmış
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Taslak Pozisyonu Sil"
        message="Bu taslak pozisyonu silmek istediğinizden emin misiniz? Pozisyona atanmış yükler serbest kalacaktır."
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPositionToDelete(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.headingMD,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  positionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  positionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionInfo: {
    flex: 1,
  },
  positionTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  positionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.bodyXS,
  },
  positionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  positionContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  capacityItem: {
    alignItems: 'center',
  },
  capacityLabel: {
    ...Typography.bodyXS,
  },
  capacityValue: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginTop: 2,
  },
  loadsList: {
    gap: Spacing.sm,
  },
  loadsTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  loadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  loadInfo: {
    flex: 1,
  },
  loadNumber: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  loadCargo: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  loadCustomer: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  removeLoadBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLoads: {
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyLoadsText: {
    ...Typography.bodySM,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: Spacing.xs,
    flex: 1,
  },
  actionBtnText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headingSM,
  },
  emptySubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.headingMD,
  },
  modalListContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalEmpty: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  unassignedLoadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  loadStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
