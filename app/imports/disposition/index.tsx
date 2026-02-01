/**
 * İthalat Dispozisyon Ekranı
 *
 * İthalat taslak pozisyonları ve yük atamalarını yönetir.
 * Web dispozisyon sürükle-bırak arayüzünün mobil uyarlaması.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { PageHeader } from '@/components/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import LoadPickerModal, { LoadPickerModalRef } from '@/components/modals/LoadPickerModal';
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations,
} from '@/constants/dashboard-theme';
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
import { Load } from '@/services/endpoints/loads';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pozisyon durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  active: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  completed: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  draft: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
};

// Skeleton Bileşeni
function PositionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  );
}

// Taslak Pozisyon Kartı Bileşeni
interface DraftPositionCardProps {
  position: DraftPosition;
  isExpanded: boolean;
  isConfirming: boolean;
  onToggleExpand: () => void;
  onAddLoad: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  onRemoveLoad: (load: Load) => void;
}

function DraftPositionCard({
  position,
  isExpanded,
  isConfirming,
  onToggleExpand,
  onAddLoad,
  onConfirm,
  onDelete,
  onRemoveLoad,
}: DraftPositionCardProps) {
  const scale = useSharedValue(1);
  const colors = STATUS_COLORS.draft;
  const loads = position.loads || [];
  const capacity = calculatePositionCapacity(loads);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleExpand();
  };

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name="map-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            Taslak Pozisyon #{position.id}
          </Text>
          <View style={styles.cardMeta}>
            {position.truck_tractor && (
              <View style={styles.metaItem}>
                <Ionicons name="car-outline" size={12} color={DashboardColors.textMuted} />
                <Text style={styles.metaText}>{position.truck_tractor.plate}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={12} color={DashboardColors.textMuted} />
              <Text style={styles.metaText}>{loads.length} yük</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardActions}>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>Taslak</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={DashboardColors.textMuted}
          />
        </View>
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Capacity Info */}
          <View style={styles.capacityRow}>
            <View style={styles.capacityItem}>
              <Text style={styles.capacityLabel}>Hacim</Text>
              <Text style={styles.capacityValue}>{capacity.totalVolume} m³</Text>
            </View>
            <View style={styles.capacityItem}>
              <Text style={styles.capacityLabel}>Ağırlık</Text>
              <Text style={styles.capacityValue}>{capacity.totalWeight} kg</Text>
            </View>
            <View style={styles.capacityItem}>
              <Text style={styles.capacityLabel}>LDM</Text>
              <Text style={styles.capacityValue}>{capacity.totalLademetre}</Text>
            </View>
          </View>

          {/* Loads List */}
          {loads.length > 0 ? (
            <View style={styles.loadsList}>
              <Text style={styles.loadsTitle}>Atanmış Yükler</Text>
              {loads.map((load) => (
                <View key={load.id} style={styles.loadItem}>
                  <View style={styles.loadInfo}>
                    <Text style={styles.loadNumber}>{load.load_number}</Text>
                    <Text style={styles.loadCargo} numberOfLines={1}>
                      {load.cargo_name || '-'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeLoadBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onRemoveLoad(load);
                    }}
                  >
                    <Ionicons name="close" size={14} color={DashboardColors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyLoads}>
              <Ionicons name="alert-circle-outline" size={24} color={DashboardColors.textMuted} />
              <Text style={styles.emptyLoadsText}>Henüz yük atanmamış</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddLoad();
              }}
            >
              <Ionicons name="add" size={16} color={DashboardColors.primary} />
              <Text style={[styles.actionBtnText, { color: DashboardColors.primary }]}>
                Yük Ekle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnPrimary,
                (isConfirming || loads.length === 0) && styles.actionBtnDisabled,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onConfirm();
              }}
              disabled={isConfirming || loads.length === 0}
            >
              {isConfirming ? (
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Onayla</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={16} color={DashboardColors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </AnimatedPressable>
  );
}

// Boş Durum Bileşeni
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="map-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Taslak pozisyon yok</Text>
      <Text style={styles.emptyText}>
        Yeni taslak oluşturmak için + butonuna tıklayın
      </Text>
    </View>
  );
}

// Hata Durumu Bileşeni
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.errorState}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
      </View>
      <Text style={styles.errorTitle}>Bir hata oluştu</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DispositionScreen() {
  const { success, error: showError } = useToast();

  // Veri state
  const [data, setData] = useState<DispositionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedPosition, setSelectedPosition] = useState<DraftPosition | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<DraftPosition | null>(null);

  // Yükleme state'leri
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState<number | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const loadPickerModalRef = useRef<LoadPickerModalRef>(null);
  const hasInitialFetchRef = useRef(false);

  // Veri çekme
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      // İthalat için 'import' parametresi kullanılır
      const result = await getDispositionData('import');
      if (isMountedRef.current) {
        setData(result);
        hasInitialFetchRef.current = true;
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('İthalat dispozisyon getirme hatası:', err);
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

  // Ekran odaklandığında yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        fetchData();
      }
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Yeni taslak pozisyon oluştur
  const handleCreateDraft = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreating(true);
    try {
      // İthalat için 'import' parametresi kullanılır
      const position = await createDraftPosition('import');
      success('Başarılı', 'Taslak pozisyon oluşturuldu.');
      // Yeni pozisyonu genişlet
      setExpandedPositions((prev) => new Set([...prev, position.id]));
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Taslak oluşturulamadı.');
    } finally {
      setIsCreating(false);
    }
  };

  // Taslak pozisyonu onayla
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

  // Taslak pozisyonu sil - onay göster
  const handleDeleteDraft = (position: DraftPosition) => {
    setPositionToDelete(position);
    setShowDeleteConfirm(true);
  };

  // Silme işlemini onayla ve çalıştır
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

  // Pozisyon için yük seçici aç
  const handleOpenLoadPicker = (position: DraftPosition) => {
    setSelectedPosition(position);
    loadPickerModalRef.current?.present();
  };

  // Yükü pozisyona ata
  const handleAssignLoad = async (load: Load) => {
    if (!selectedPosition) return;
    setIsAssigning(load.id);
    try {
      await assignLoadToPosition(selectedPosition.id, load.id);
      success('Başarılı', 'Yük pozisyona atandı.');
      // Modalı kapatma - birden fazla seçime izin ver
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Yük atanamadı.');
      throw err; // Modalın işlemesi için yeniden fırlat
    } finally {
      setIsAssigning(null);
    }
  };

  // Yükü pozisyondan kaldır
  const handleRemoveLoad = async (position: DraftPosition, load: Load) => {
    try {
      await removeLoadFromPosition(position.id, load.id);
      success('Başarılı', 'Yük pozisyondan çıkarıldı.');
      fetchData();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Yük çıkarılamadı.');
    }
  };

  // Pozisyon genişletme durumunu değiştir
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

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const draftPositions = data?.draft_positions || [];
  const unassignedLoads = data?.unassigned_loads || [];

  return (
    <View style={styles.container}>
      <PageHeader
        title="İthalat Dispozisyon"
        icon="map-outline"
        subtitle={`${draftPositions.length} taslak • ${unassignedLoads.length} atanmamış yük`}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'add',
            onPress: handleCreateDraft,
            isLoading: isCreating,
          },
        ]}
      />

      <View style={styles.content}>
        {/* İstatistik Çubuğu */}
        {!isLoading && !error && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: DashboardColors.primary }]}>
                {draftPositions.length}
              </Text>
              <Text style={styles.statLabel}>Taslak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: DashboardColors.warning }]}>
                {unassignedLoads.length}
              </Text>
              <Text style={styles.statLabel}>Atanmamış</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: DashboardColors.success }]}>
                {data?.active_positions?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Aktif</Text>
            </View>
          </View>
        )}

        {/* Liste */}
        {isLoading ? (
          <View style={styles.listContent}>
            <PositionCardSkeleton />
            <PositionCardSkeleton />
            <PositionCardSkeleton />
          </View>
        ) : error ? (
          <ErrorState error={error} onRetry={() => { setIsLoading(true); fetchData(); }} />
        ) : (
          <FlatList
            data={draftPositions}
            renderItem={({ item }) => (
              <DraftPositionCard
                position={item}
                isExpanded={expandedPositions.has(item.id)}
                isConfirming={isConfirming === item.id}
                onToggleExpand={() => togglePositionExpand(item.id)}
                onAddLoad={() => handleOpenLoadPicker(item)}
                onConfirm={() => handleConfirmDraft(item)}
                onDelete={() => handleDeleteDraft(item)}
                onRemoveLoad={(load) => handleRemoveLoad(item, load)}
              />
            )}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            ListEmptyComponent={<EmptyState />}
          />
        )}
      </View>

      {/* Yük Seçici Modal */}
      <LoadPickerModal
        ref={loadPickerModalRef}
        loads={unassignedLoads}
        onSelectLoad={handleAssignLoad}
        loadingLoadId={isAssigning}
      />

      {/* Silme Onay Dialogu */}
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
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },

  // İstatistik Çubuğu
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: DashboardSpacing.md,
    marginHorizontal: DashboardSpacing.lg,
    marginVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.surface,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: DashboardColors.borderLight,
  },

  // Liste
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.xl,
  },

  // Kart
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md,
  },
  cardName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    marginTop: DashboardSpacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
  },

  // Genişletilmiş İçerik
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    paddingTop: DashboardSpacing.md,
    marginTop: DashboardSpacing.md,
    gap: DashboardSpacing.md,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
  },
  capacityItem: {
    alignItems: 'center',
  },
  capacityLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
  },
  capacityValue: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: 2,
  },

  // Yük Listesi
  loadsList: {
    gap: DashboardSpacing.sm,
  },
  loadsTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs,
  },
  loadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.md,
    gap: DashboardSpacing.sm,
  },
  loadInfo: {
    flex: 1,
  },
  loadNumber: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  loadCargo: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2,
  },
  removeLoadBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLoads: {
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.sm,
  },
  emptyLoadsText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
  },

  // İşlem Butonları
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md,
    gap: DashboardSpacing.xs,
    flex: 1,
  },
  actionBtnPrimary: {
    backgroundColor: DashboardColors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
  },
  actionBtnDanger: {
    backgroundColor: DashboardColors.dangerBg,
    flex: 0.5,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
  },

  // Kart Bilgisi (Skeleton için)
  cardInfo: {
    gap: DashboardSpacing.xs,
    paddingTop: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    marginTop: DashboardSpacing.md,
  },

  // Boş Durum
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Hata Durumu
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl'],
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff',
  },
});
