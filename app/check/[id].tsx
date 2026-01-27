/**
 * Check Detail Screen
 *
 * Shows check details with all information.
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
  FileText,
  Building2,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Copy,
  Check as CheckIcon,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getCheck,
  deleteCheck,
  Check,
  getCheckTypeLabel,
  getCheckStatusLabel,
  getCheckStatusColor,
  formatCheckAmount,
  getCurrencyLabel,
} from '@/services/endpoints/checks';
import { formatDate } from '@/utils/formatters';

export default function CheckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [check, setCheck] = useState<Check | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch check data
  const fetchCheck = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getCheck(parseInt(id, 10));
      setCheck(data);
    } catch (err) {
      console.error('Check fetch error:', err);
      setError(err instanceof Error ? err.message : 'Çek bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCheck();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheck();
  };

  // Delete check
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteCheck(parseInt(id, 10));
      success('Başarılı', 'Çek silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Çek silinemedi.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (field: string, value: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Render info row
  const renderInfoRow = (
    label: string,
    value?: string | number | boolean,
    icon?: any,
    copyable?: boolean,
    copyKey?: string
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
        <View style={styles.infoRowRight}>
          <Text style={[styles.infoValue, { color: colors.text }]}>{displayValue}</Text>
          {copyable && copyKey && (
            <TouchableOpacity onPress={() => handleCopy(copyKey, displayValue)}>
              {copiedField === copyKey ? (
                <CheckIcon size={16} color={colors.success} />
              ) : (
                <Copy size={16} color={colors.icon} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Çek Detayı" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Çek bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !check) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Çek Detayı" showBackButton />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Çek bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchCheck}
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
        title={check.check_number}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push(`/check/${check.id}/edit` as any)}
              activeOpacity={0.7}
            >
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
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

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryTop}>
              <Badge
                label={getCheckTypeLabel(check.type)}
                variant={check.type === 'received' ? 'success' : 'info'}
                size="md"
              />
              <Badge
                label={getCheckStatusLabel(check.status)}
                variant={getCheckStatusColor(check.status)}
                size="md"
              />
            </View>
            <Text style={[styles.amountText, { color: colors.primary }]}>
              {formatCheckAmount(check.amount, check.currency_type)}
            </Text>
            <Text style={[styles.currencyText, { color: colors.textSecondary }]}>
              {getCurrencyLabel(check.currency_type)}
            </Text>
          </View>
        </Card>

        {/* Cari Information */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Cari Bilgileri</Text>
          {renderInfoRow('Cari Adı', check.contact?.name, User)}
          {renderInfoRow('Cari Kodu', check.contact?.code, FileText)}
        </Card>

        {/* Check Information */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Çek Bilgileri</Text>
          {renderInfoRow('Çek Numarası', check.check_number, FileText, true, 'check_number')}
          {renderInfoRow('Portföy No', check.portfolio_number, FileText)}
          {renderInfoRow('Düzenleme Tarihi', formatDate(check.issue_date, 'dd.MM.yyyy'), Calendar)}
          {renderInfoRow('Vade Tarihi', formatDate(check.due_date, 'dd.MM.yyyy'), Calendar)}
        </Card>

        {/* Bank Information */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Banka Bilgileri</Text>
          {renderInfoRow('Banka', check.bank_name, Building2)}
          {renderInfoRow('Şube', check.branch_name, Building2)}
          {renderInfoRow('Hesap No', check.account_number, FileText, true, 'account_number')}
          {renderInfoRow('Keşideci', check.drawer_name, User)}
          {renderInfoRow('Ciranta', check.endorser_name, User)}
        </Card>

        {/* Status Dates */}
        {(check.transferred_date || check.cleared_date || check.bounced_date || check.cancelled_date) && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tarih Bilgileri</Text>
            {renderInfoRow('Transfer Tarihi', check.transferred_date ? formatDate(check.transferred_date, 'dd.MM.yyyy') : undefined, Calendar)}
            {renderInfoRow('Tahsil Tarihi', check.cleared_date ? formatDate(check.cleared_date, 'dd.MM.yyyy') : undefined, Calendar)}
            {renderInfoRow('Karşılıksız Tarihi', check.bounced_date ? formatDate(check.bounced_date, 'dd.MM.yyyy') : undefined, Calendar)}
            {renderInfoRow('İptal Tarihi', check.cancelled_date ? formatDate(check.cancelled_date, 'dd.MM.yyyy') : undefined, Calendar)}
          </Card>
        )}

        {/* Transfer Information */}
        {check.transferred_to && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Transfer Bilgileri</Text>
            {renderInfoRow('Transfer Edildiği Yer', check.transferred_to.name, Building2)}
          </Card>
        )}

        {/* Additional Information */}
        {check.description && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Açıklama</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {check.description}
            </Text>
          </Card>
        )}

        {/* Metadata */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sistem Bilgileri</Text>
          {renderInfoRow('Oluşturulma', formatDate(check.created_at, 'dd.MM.yyyy HH:mm'), Calendar)}
          {renderInfoRow('Güncellenme', formatDate(check.updated_at, 'dd.MM.yyyy HH:mm'), Calendar)}
        </Card>
      </ScrollView>
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Çeki Sil"
        message="Bu çeki silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
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
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryContent: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  summaryTop: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  amountText: {
    ...Typography.headingXL,
    marginBottom: Spacing.xs,
  },
  currencyText: {
    ...Typography.bodyMD,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoLabel: {
    ...Typography.bodySM,
    flex: 1,
  },
  infoValue: {
    ...Typography.bodySM,
    fontWeight: '600',
    textAlign: 'right',
  },
  descriptionText: {
    ...Typography.bodyMD,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingLG,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    ...Typography.buttonMD,
    color: Colors.light.surface,
  },
});
