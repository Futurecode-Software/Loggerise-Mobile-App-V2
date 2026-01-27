/**
 * Cash Register Detail Screen
 *
 * Shows cash register details with balance information.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Edit,
  Trash2,
  Hash,
  MapPin,
  Wallet,
  User,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getCashRegister,
  deleteCashRegister,
  CashRegister,
  formatBalance,
  getCurrencyLabel,
} from '@/services/endpoints/cash-registers';

export default function CashRegisterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch cash register data
  const fetchCashRegister = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getCashRegister(parseInt(id, 10));
      setCashRegister(data);
    } catch (err) {
      console.error('Cash register fetch error:', err);
      setError(err instanceof Error ? err.message : 'Kasa bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCashRegister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCashRegister();
  };

  // Delete cash register
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteCashRegister(parseInt(id, 10));
      success('Başarılı', 'Kasa silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Kasa silinemedi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Render info row
  const renderInfoRow = (
    label: string,
    value?: string | number | boolean,
    icon?: any
  ) => {
    if (value === undefined || value === null || value === '') return null;
    const Icon = icon;
    const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value);

    return (
      <View style={styles.infoRow}>
        <View style={styles.infoRowLeft}>
          {Icon && <Icon size={16} color={colors.textMuted} />}
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
        </View>
        <Text style={[styles.infoValue, { color: colors.text }]}>{displayValue}</Text>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Kasa Detayı" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Kasa bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !cashRegister) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Kasa Detayı" showBackButton />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Kasa bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchCashRegister}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title={cashRegister.name}
        showBackButton
        rightIcons={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/cash-register/${cashRegister.id}/edit` as any)}
            >
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Trash2 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: Brand.primary }]}>
        <Text style={styles.balanceLabel}>Güncel Bakiye</Text>
        <Text
          style={[
            styles.balanceAmount,
            cashRegister.balance < 0 && { color: 'rgba(255, 255, 255, 0.8)' },
          ]}
        >
          {formatBalance(cashRegister.balance, cashRegister.currency_type)}
        </Text>
        <View style={styles.balanceFooter}>
          <Badge
            label={getCurrencyLabel(cashRegister.currency_type)}
            variant="outline"
            size="sm"
            style={{ borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.2)' }}
            textStyle={{ color: '#FFFFFF' }}
          />
          <Badge
            label={cashRegister.is_active ? 'Aktif' : 'Pasif'}
            variant={cashRegister.is_active ? 'success' : 'default'}
            size="sm"
          />
        </View>
      </View>

      {/* Details */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {/* Kasa Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kasa Bilgileri</Text>
          {renderInfoRow('Kasa Adı', cashRegister.name, Wallet)}
          {cashRegister.code && renderInfoRow('Kasa Kodu', cashRegister.code, Hash)}
          {cashRegister.location && renderInfoRow('Konum', cashRegister.location, MapPin)}
          {cashRegister.responsible_user && renderInfoRow(
            'Sorumlu',
            cashRegister.responsible_user.name,
            User
          )}
        </Card>

        {/* Bakiye Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bakiye Bilgileri</Text>
          {renderInfoRow('Açılış Bakiyesi', formatBalance(cashRegister.opening_balance, cashRegister.currency_type), Wallet)}
          {renderInfoRow('Güncel Bakiye', formatBalance(cashRegister.balance, cashRegister.currency_type), Wallet)}
        </Card>

        {/* Açıklama */}
        {cashRegister.description && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Açıklama</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {cashRegister.description}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Kasayı Sil"
        message="Bu kasayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
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
  balanceCard: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  balanceLabel: {
    ...Typography.bodyMD,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    ...Typography.headingXL,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  balanceFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  sectionCard: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  infoLabel: {
    ...Typography.bodySM,
  },
  infoValue: {
    ...Typography.bodySM,
    fontWeight: '500',
    textAlign: 'right',
  },
  descriptionText: {
    ...Typography.bodyMD,
    lineHeight: 20,
  },
});
