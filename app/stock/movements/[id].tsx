/**
 * Stock Movement Detail Screen
 *
 * View stock movement details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import {
  Trash2,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Box,
  Warehouse,
  Calendar,
  Hash,
  FileText,
} from 'lucide-react-native';
import { Card, Badge, ConfirmDialog } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getStockMovement,
  deleteStockMovement,
  getMovementTypeLabel,
  isInboundMovement,
  getMovementTypeColor,
  StockMovement,
} from '@/services/endpoints/stock-movements';

export default function MovementDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [movement, setMovement] = useState<StockMovement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch movement data
  const fetchMovement = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      setIsLoading(true);
      const data = await getStockMovement(Number(id));
      setMovement(data);
    } catch (err) {
      console.error('Movement fetch error:', err);
      setError(err instanceof Error ? err.message : 'Stok hareketi yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovement();
  }, [fetchMovement]);

  // Delete handler - opens dialog
  const handleDelete = useCallback(() => {
    if (!movement) return;
    setShowDeleteDialog(true);
  }, [movement]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!movement) return;

    setIsDeleting(true);
    try {
      await deleteStockMovement(movement.id);
      setShowDeleteDialog(false);
      success('Başarılı', 'Stok hareketi silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Hareket silinemedi');
    } finally {
      setIsDeleting(false);
    }
  }, [movement, success, showError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatQuantity = (mov: StockMovement) => {
    const sign = isInboundMovement(mov.movement_type) ? '+' : '-';
    const unit = mov.product?.unit || '';
    return `${sign}${mov.quantity} ${unit}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Hareket Detayı"
          onBackPress={() => router.back()}
        />
        <View style={styles.contentArea}>
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error || !movement) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Hareket Detayı"
          onBackPress={() => router.back()}
        />
        <View style={styles.contentArea}>
          <View style={styles.errorState}>
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error || 'Hareket bulunamadı'}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Brand.primary }]}
              onPress={fetchMovement}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isInbound = isInboundMovement(movement.movement_type);
  const typeColor = getMovementTypeColor(movement.movement_type);
  const isTransfer =
    movement.movement_type === 'transfer_in' || movement.movement_type === 'transfer_out';

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Hareket Detayı"
        onBackPress={() => router.back()}
        leftActions={[
          {
            icon: <Trash2 size={22} color="#FFFFFF" />,
            onPress: handleDelete,
          },
        ]}
      />

      <View style={styles.contentArea}>
        <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Movement Info Header */}
        <View style={styles.movementInfoHeader}>
          <View style={[styles.movementIcon, { backgroundColor: `${typeColor}15` }]}>
            {isTransfer ? (
              <Repeat size={40} color={typeColor} />
            ) : isInbound ? (
              <ArrowDownLeft size={40} color={typeColor} />
            ) : (
              <ArrowUpRight size={40} color={typeColor} />
            )}
          </View>
          <Badge
            label={getMovementTypeLabel(movement.movement_type)}
            variant={isInbound ? 'success' : 'danger'}
            size="md"
          />
          <Text
            style={[
              styles.quantityBig,
              { color: isInbound ? colors.success : colors.danger },
            ]}
          >
            {formatQuantity(movement)}
          </Text>
        </View>

        {/* Product Info */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Box size={18} color={Brand.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ürün Bilgisi</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ürün</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {movement.product?.name || `#${movement.product_id}`}
            </Text>
          </View>
          {movement.product?.code && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Kod</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{movement.product.code}</Text>
            </View>
          )}
        </Card>

        {/* Warehouse Info */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Warehouse size={18} color={Brand.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Depo Bilgisi</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {isTransfer ? 'Kaynak Depo' : 'Depo'}
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {movement.warehouse?.name || `#${movement.warehouse_id}`}
            </Text>
          </View>
          {isTransfer && movement.reference_warehouse && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Hedef Depo</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {movement.reference_warehouse.name}
              </Text>
            </View>
          )}
        </Card>

        {/* Movement Details */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Hash size={18} color={Brand.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Hareket Detayı</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Miktar</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {movement.quantity} {movement.product?.unit || ''}
            </Text>
          </View>
          {movement.unit_cost !== undefined && movement.unit_cost !== null && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Birim Maliyet</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {movement.unit_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </Text>
            </View>
          )}
          {movement.total_cost !== undefined && movement.total_cost !== null && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Toplam Maliyet</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {movement.total_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </Text>
            </View>
          )}
          {movement.balance_after !== undefined && movement.balance_after !== null && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Sonraki Bakiye</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {movement.balance_after} {movement.product?.unit || ''}
              </Text>
            </View>
          )}
        </Card>

        {/* Date & Notes */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={18} color={Brand.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tarih ve Notlar</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>İşlem Tarihi</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(movement.transaction_date)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Kayıt Tarihi
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(movement.created_at)}
            </Text>
          </View>
          {movement.notes && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Notlar</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{movement.notes}</Text>
            </View>
          )}
        </Card>
      </ScrollView>
      </View>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Stok Hareketi Sil"
        message="Bu stok hareketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  movementInfoHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  movementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  quantityBig: {
    ...Typography.headingXL,
    marginTop: Spacing.sm,
  },
  card: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: {
    ...Typography.headingSM,
  },
  infoRow: {
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    ...Typography.bodySM,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
