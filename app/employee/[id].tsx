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
import { Card, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getEmployee,
  deleteEmployee,
  Employee,
  getFullName,
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
      success('Başarılı', 'Çalışan silindi.');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Çalışan silinemedi.');
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
        <FullScreenHeader
          title="Çalışan Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={[styles.loadingCard, { backgroundColor: '#FFFFFF' }]}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Çalışan bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !employee) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Çalışan Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={[styles.errorCard, { backgroundColor: '#FFFFFF' }]}>
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
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title={employee.full_name}
        showBackButton
        onBackPress={() => router.back()}
        rightIcons={
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/employee/${employee.id}/edit` as any)}
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
          </>
        }
      />

      {/* Details */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        <View style={styles.contentCard}>
        {/* Temel Bilgiler */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>
          {renderInfoRow('TC Kimlik No', employee.citizenship_no, User)}
          {employee.employee_code && renderInfoRow('Personel Kodu', employee.employee_code, Briefcase)}
          {employee.sgk_number && renderInfoRow('SGK No', employee.sgk_number, Briefcase)}
          {employee.gender && renderInfoRow('Cinsiyet', getGenderLabel(employee.gender), User)}
          {employee.marital_status && renderInfoRow('Medeni Durum', getMaritalStatusLabel(employee.marital_status), User)}
        </Card>

        {/* İletişim Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>İletişim Bilgileri</Text>
          {renderInfoRow('Telefon', employee.phone_1, Phone)}
          {employee.phone_2 && renderInfoRow('Telefon 2', employee.phone_2, Phone)}
          {renderInfoRow('E-posta', employee.email, Mail)}
          {employee.home_phone && renderInfoRow('Ev Telefonu', employee.home_phone, Phone)}
          {employee.emergency_phone_1 && renderInfoRow('Acil Durum Tel', employee.emergency_phone_1, Phone)}
        </Card>

        {/* İstihdam Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>İstihdam Bilgileri</Text>
          {renderInfoRow('Durum', getEmploymentStatusLabel(employee.employment_status), Briefcase)}
          {employee.contract_type && renderInfoRow('Sözleşme Tipi', getContractTypeLabel(employee.contract_type), Briefcase)}
          {employee.position && renderInfoRow('Pozisyon', getPositionLabel(employee.position), Briefcase)}
          {employee.start_date && renderInfoRow('Başlangıç Tarihi', new Date(employee.start_date).toLocaleDateString('tr-TR'), Calendar)}
          {employee.end_date && renderInfoRow('Bitiş Tarihi', new Date(employee.end_date).toLocaleDateString('tr-TR'), Calendar)}
        </Card>
        </View>
      </ScrollView>

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
  },
  headerButton: {
    padding: Spacing.sm,
  },
  loadingCard: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    ...Shadows.lg,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  errorCard: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
    ...Shadows.lg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    ...Shadows.lg,
    gap: Spacing.md,
  },
  sectionCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
});
