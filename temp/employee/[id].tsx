/**
 * Employee Detail Screen
 *
 * Shows employee details with related information.
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
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getEmployee,
  deleteEmployee,
  Employee,
  getEmploymentStatusLabel,
  getContractTypeLabel,
  getPositionLabel,
  getGenderLabel,
  getMaritalStatusLabel,
} from '@/services/endpoints/employees';

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch employee data
  const fetchEmployee = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getEmployee(parseInt(id, 10));
      setEmployee(data);
    } catch (err) {
      console.error('Employee fetch error:', err);
      setError(err instanceof Error ? err.message : 'Çalışan bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployee();
  };

  // Delete employee
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteEmployee(parseInt(id, 10));
      // Success toast goster ve hemen geri don
      success('Başarılı', 'Çalışan silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Çalışan silinemedi.');
      // Hata durumunda state'leri temizle
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
    // Not: Basari durumunda sayfa geri dondugu icin state temizlemeye gerek yok
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
      <View style={styles.container}>
        <FullScreenHeader
          title="Çalışan Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.content}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Çalışan bilgileri yükleniyor...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !employee) {
    return (
      <View style={styles.container}>
        <FullScreenHeader
          title="Çalışan Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.content}>
          <View style={styles.errorCard}>
            <AlertCircle size={64} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error || 'Çalışan bulunamadı'}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Brand.primary }]}
              onPress={fetchEmployee}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title={employee.full_name}
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push(`/employee/${employee.id}/edit` as any)}
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

      {/* Details */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {/* Temel Bilgiler */}
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Temel Bilgiler</Text>
            {renderInfoRow('TC Kimlik No', employee.citizenship_no, User)}
            {employee.employee_code && renderInfoRow('Personel Kodu', employee.employee_code, Briefcase)}
            {employee.sgk_number && renderInfoRow('SGK No', employee.sgk_number, Briefcase)}
            {employee.gender && renderInfoRow('Cinsiyet', getGenderLabel(employee.gender), User)}
            {employee.marital_status && renderInfoRow('Medeni Durum', getMaritalStatusLabel(employee.marital_status), User)}
          </Card>

          {/* İletişim Bilgileri */}
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>İletişim Bilgileri</Text>
            {renderInfoRow('Telefon', employee.phone_1, Phone)}
            {employee.phone_2 && renderInfoRow('Telefon 2', employee.phone_2, Phone)}
            {renderInfoRow('E-posta', employee.email, Mail)}
            {employee.home_phone && renderInfoRow('Ev Telefonu', employee.home_phone, Phone)}
            {employee.emergency_phone_1 && renderInfoRow('Acil Durum Tel', employee.emergency_phone_1, Phone)}
          </Card>

          {/* İstihdam Bilgileri */}
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>İstihdam Bilgileri</Text>
            {renderInfoRow('Durum', getEmploymentStatusLabel(employee.employment_status), Briefcase)}
            {employee.contract_type && renderInfoRow('Sözleşme Tipi', getContractTypeLabel(employee.contract_type), Briefcase)}
            {employee.position && renderInfoRow('Pozisyon', getPositionLabel(employee.position), Briefcase)}
            {employee.start_date && renderInfoRow('Başlangıç Tarihi', new Date(employee.start_date).toLocaleDateString('tr-TR'), Calendar)}
            {employee.end_date && renderInfoRow('Bitiş Tarihi', new Date(employee.end_date).toLocaleDateString('tr-TR'), Calendar)}
          </Card>
        </ScrollView>
      </View>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Çalışanı Sil"
        message="Bu çalışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
  infoLabel: {
    ...Typography.bodySM,
    flex: 1,
  },
  infoValue: {
    ...Typography.bodySM,
    fontWeight: '600',
    textAlign: 'right',
  },
  loadingCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  errorCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
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
