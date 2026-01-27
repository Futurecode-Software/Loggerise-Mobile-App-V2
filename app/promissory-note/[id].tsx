/**
 * Promissory Note Detail Screen
 *
 * Shows promissory note details with all information.
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
  getPromissoryNote,
  deletePromissoryNote,
  PromissoryNote,
  getPromissoryNoteTypeLabel,
  getPromissoryNoteStatusLabel,
  getPromissoryNoteStatusColor,
  formatPromissoryNoteAmount,
  getCurrencyLabel,
} from '@/services/endpoints/promissory-notes';
import { formatDate } from '@/utils/formatters';

export default function PromissoryNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [promissoryNote, setPromissoryNote] = useState<PromissoryNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchPromissoryNote = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getPromissoryNote(parseInt(id, 10));
      setPromissoryNote(data);
    } catch (err) {
      console.error('Promissory note fetch error:', err);
      setError(err instanceof Error ? err.message : 'Senet bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPromissoryNote();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPromissoryNote();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deletePromissoryNote(parseInt(id, 10));
      success('Başarılı', 'Senet silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Senet silinemedi.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopy = (field: string, value: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Senet Detayı" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Senet bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !promissoryNote) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Senet Detayı" showBackButton />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Senet bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchPromissoryNote}
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
        title={promissoryNote.promissory_note_number}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push(`/promissory-note/${promissoryNote.id}/edit` as any)}
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
                label={getPromissoryNoteTypeLabel(promissoryNote.type)}
                variant={promissoryNote.type === 'received' ? 'success' : 'info'}
                size="md"
              />
              <Badge
                label={getPromissoryNoteStatusLabel(promissoryNote.status)}
                variant={getPromissoryNoteStatusColor(promissoryNote.status)}
                size="md"
              />
            </View>
            <Text style={[styles.amountText, { color: colors.primary }]}>
              {formatPromissoryNoteAmount(promissoryNote.amount, promissoryNote.currency_type)}
            </Text>
            <Text style={[styles.currencyText, { color: colors.textSecondary }]}>
              {getCurrencyLabel(promissoryNote.currency_type)}
            </Text>
          </View>
        </Card>

        {/* Cari Information */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Cari Bilgileri</Text>
          {renderInfoRow('Cari Adı', promissoryNote.contact?.name, User)}
          {renderInfoRow('Cari Kodu', promissoryNote.contact?.code, FileText)}
        </Card>

        {/* Promissory Note Information */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Senet Bilgileri</Text>
          {renderInfoRow('Senet Numarası', promissoryNote.promissory_note_number, FileText, true, 'promissory_note_number')}
          {renderInfoRow('Portföy No', promissoryNote.portfolio_number, FileText)}
          {renderInfoRow('Düzenleme Tarihi', formatDate(promissoryNote.issue_date, 'dd.MM.yyyy'), Calendar)}
          {renderInfoRow('Vade Tarihi', formatDate(promissoryNote.due_date, 'dd.MM.yyyy'), Calendar)}
          {renderInfoRow('Aktif', promissoryNote.is_active, FileText)}
        </Card>

        {/* Bank Information */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Banka Bilgileri</Text>
          {renderInfoRow('Banka', promissoryNote.bank_name, Building2)}
          {renderInfoRow('Şube', promissoryNote.branch_name, Building2)}
          {renderInfoRow('Hesap No', promissoryNote.account_number, FileText, true, 'account_number')}
          {renderInfoRow('Keşideci', promissoryNote.drawer_name, User)}
          {renderInfoRow('Ciranta', promissoryNote.endorser_name, User)}
        </Card>

        {/* Status Dates */}
        {(promissoryNote.transferred_date || promissoryNote.cleared_date || promissoryNote.protested_date || promissoryNote.cancelled_date) && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tarih Bilgileri</Text>
            {renderInfoRow('Transfer Tarihi', promissoryNote.transferred_date ? formatDate(promissoryNote.transferred_date, 'dd.MM.yyyy') : undefined, Calendar)}
            {renderInfoRow('Tahsil Tarihi', promissoryNote.cleared_date ? formatDate(promissoryNote.cleared_date, 'dd.MM.yyyy') : undefined, Calendar)}
            {renderInfoRow('Protesto Tarihi', promissoryNote.protested_date ? formatDate(promissoryNote.protested_date, 'dd.MM.yyyy') : undefined, Calendar)}
            {renderInfoRow('İptal Tarihi', promissoryNote.cancelled_date ? formatDate(promissoryNote.cancelled_date, 'dd.MM.yyyy') : undefined, Calendar)}
          </Card>
        )}

        {/* Additional Information */}
        {promissoryNote.description && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Açıklama</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {promissoryNote.description}
            </Text>
          </Card>
        )}

        {/* Metadata */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sistem Bilgileri</Text>
          {renderInfoRow('Oluşturulma', formatDate(promissoryNote.created_at, 'dd.MM.yyyy HH:mm'), Calendar)}
          {renderInfoRow('Güncellenme', formatDate(promissoryNote.updated_at, 'dd.MM.yyyy HH:mm'), Calendar)}
        </Card>
      </ScrollView>
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Senedi Sil"
        message="Bu senedi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
