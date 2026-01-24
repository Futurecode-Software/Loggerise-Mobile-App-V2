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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
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
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Çalışan bilgileri yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !employee) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Çalışan Detayı</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
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
          {employee.full_name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push(`/employee/${employee.id}/edit` as any)}
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

      {/* Status Card */}
      <View style={[styles.statusCard, { backgroundColor: Brand.primary }]}>
        <View style={styles.statusCardHeader}>
          <User size={32} color="#FFFFFF" />
          <View style={styles.statusCardInfo}>
            <Text style={styles.statusCardName}>{employee.full_name}</Text>
            {employee.position && (
              <Text style={styles.statusCardPosition}>{getPositionLabel(employee.position)}</Text>
            )}
          </View>
        </View>
        <View style={styles.statusCardFooter}>
          <Badge
            label={getEmploymentStatusLabel(employee.employment_status)}
            variant={employee.employment_status === 'active' ? 'success' : 'default'}
            size="sm"
          />
          {employee.contract_type && (
            <Badge
              label={getContractTypeLabel(employee.contract_type)}
              variant="outline"
              size="sm"
              style={{ borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.2)' }}
              textStyle={{ color: '#FFFFFF' }}
            />
          )}
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
  statusCard: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.lg,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusCardInfo: {
    flex: 1,
  },
  statusCardName: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusCardPosition: {
    ...Typography.bodyMD,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
  statusCardFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  infoLabel: {
    ...Typography.bodySM,
  },
  infoValue: {
    ...Typography.bodySM,
    fontWeight: '500',
    textAlign: 'right',
  },
});
