/**
 * Bank Account Detail Screen
 *
 * Shows bank account details with balance information.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Edit,
  Trash2,
  Landmark,
  Building2,
  Hash,
  CreditCard,
  Wallet,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getBank,
  deleteBank,
  Bank,
  formatBalance,
  getCurrencyLabel,
} from '@/services/endpoints/banks';

export default function BankAccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [bank, setBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch bank data
  const fetchBank = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getBank(parseInt(id, 10));
      setBank(data);
    } catch (err) {
      console.error('Bank fetch error:', err);
      setError(err instanceof Error ? err.message : 'Banka hesabı bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBank();
  };

  // Delete bank
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteBank(parseInt(id, 10));
      success('Başarılı', 'Banka hesabı silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Banka hesabı silinemedi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (field: string, value: string) => {
    // In a real app, use Clipboard.setString(value)
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
                <Check size={16} color={colors.success} />
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Banka hesabı bilgileri yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !bank) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Banka Hesabı Detayı</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Banka hesabı bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchBank}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {bank.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push(`/bank/${bank.id}/edit` as any)}
          >
            <Edit size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Trash2 size={20} color={colors.danger} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: Brand.primary }]}>
        <Text style={styles.balanceLabel}>Güncel Bakiye</Text>
        <Text
          style={[
            styles.balanceAmount,
            bank.balance < 0 && { color: 'rgba(255, 255, 255, 0.8)' },
          ]}
        >
          {formatBalance(bank.balance, bank.currency_type)}
        </Text>
        <View style={styles.balanceFooter}>
          <Badge
            label={getCurrencyLabel(bank.currency_type)}
            variant="outline"
            size="sm"
            style={{ borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.2)' }}
            textStyle={{ color: '#FFFFFF' }}
          />
          <Badge
            label={bank.is_active ? 'Aktif' : 'Pasif'}
            variant={bank.is_active ? 'success' : 'default'}
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
        {/* Banka Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Banka Bilgileri</Text>
          {renderInfoRow('Banka Adı', bank.name, Landmark)}
          {bank.bank_code && renderInfoRow('Banka Kodu', bank.bank_code, Hash)}
          {renderInfoRow('Şube', bank.branch, Building2)}
          {bank.branch_code && renderInfoRow('Şube Kodu', bank.branch_code, Hash)}
        </Card>

        {/* Hesap Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hesap Bilgileri</Text>
          {bank.account_number && renderInfoRow(
            'Hesap No',
            bank.account_number,
            CreditCard,
            true,
            'account_number'
          )}
          {bank.iban && renderInfoRow('IBAN', bank.iban, CreditCard, true, 'iban')}
          {renderInfoRow('Açılış Bakiyesi', formatBalance(bank.opening_balance, bank.currency_type), Wallet)}
        </Card>

        {/* Açıklama */}
        {bank.description && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Açıklama</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {bank.description}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Banka Hesabını Sil"
        message="Bu banka hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
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
    ...Typography.headingMD,
    flex: 1,
    marginLeft: Spacing.sm,
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
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
