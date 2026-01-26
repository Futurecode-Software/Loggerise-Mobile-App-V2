/**
 * Advances Section (CRUD)
 *
 * Allows adding, editing, and deleting advance records for a position.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { DollarSign, Plus, Pencil, Trash2, ChevronLeft, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Input, Select, ConfirmDialog } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  Position,
  AdvanceResponse,
  AdvanceInput,
  createAdvance,
  updateAdvance,
  deleteAdvance,
  getDriverFullName,
  PAYMENT_METHODS,
  CURRENCY_TYPES,
  getPaymentMethodLabel,
} from '@/services/endpoints/positions';
import { showToast } from '@/utils/toast';

interface AdvancesSectionProps {
  position: Position;
  onUpdate: () => void;
}

const initialFormData: AdvanceInput = {
  advance_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash',
  amount: 0,
  currency_type: 'TRY',
  exchange_rate: 1,
  description: '',
};

export function AdvancesSection({ position, onUpdate }: AdvancesSectionProps) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const advances = position.advances || [];

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdvanceResponse | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<AdvanceInput>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get driver options from position
  const driverOptions = [
    ...(position.driver
      ? [{ label: getDriverFullName(position.driver), value: String(position.driver.id) }]
      : []),
    ...(position.second_driver
      ? [{ label: getDriverFullName(position.second_driver), value: String(position.second_driver.id) }]
      : []),
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isFormOpen) {
      setFormData(initialFormData);
      setEditingRecord(null);
    }
  }, [isFormOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingRecord) {
      setFormData({
        advance_date: editingRecord.advance_date
          ? new Date(editingRecord.advance_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        payment_method: editingRecord.payment_method || 'cash',
        amount: parseFloat(editingRecord.amount) || 0,
        currency_type: editingRecord.currency_type || 'TRY',
        exchange_rate: parseFloat(editingRecord.exchange_rate) || 1,
        description: editingRecord.description || '',
        employee_id: editingRecord.employee_id,
        load_id: editingRecord.load_id,
      });
    }
  }, [editingRecord]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData({
      ...initialFormData,
      // Default to position's driver
      employee_id: position.driver?.id,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: AdvanceResponse) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (recordId: number) => {
    setDeletingRecordId(recordId);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.advance_date) {
      showToast({ type: 'error', message: 'Tarih zorunludur' });
      return;
    }
    if (formData.amount <= 0) {
      showToast({ type: 'error', message: 'Tutar sıfırdan büyük olmalıdır' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await updateAdvance(position.id, editingRecord.id, formData);
        showToast({ type: 'success', message: 'Avans kaydı güncellendi' });
      } else {
        await createAdvance(position.id, formData);
        showToast({ type: 'success', message: 'Avans kaydı oluşturuldu' });
      }
      setIsFormOpen(false);
      onUpdate();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Bir hata oluştu',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRecordId) return;

    setIsDeleting(true);
    try {
      await deleteAdvance(position.id, deletingRecordId);
      showToast({ type: 'success', message: 'Avans kaydı silindi' });
      setIsDeleteDialogOpen(false);
      setDeletingRecordId(null);
      onUpdate();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Silme işlemi başarısız',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('tr-TR');
    } catch {
      return dateString;
    }
  };

  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Avans Kayıtları</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Brand.primary }]}
          onPress={handleOpenCreate}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Records List */}
      {advances.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.empty}>
            <DollarSign size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz avans kaydı bulunmuyor
            </Text>
          </View>
        </Card>
      ) : (
        advances.map((advance) => (
          <Card key={advance.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordDate, { color: colors.text }]}>
                  {formatDate(advance.date || advance.advance_date)}
                </Text>
                <Text style={[styles.recordType, { color: colors.textSecondary }]}>
                  {getPaymentMethodLabel(advance.payment_method)}
                </Text>
              </View>
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleOpenEdit(advance as any)}
                >
                  <Pencil size={16} color={Brand.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleOpenDelete(advance.id)}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.recordDetails}>
              {advance.employee && (
                <View style={styles.employeeRow}>
                  <User size={14} color={colors.icon} />
                  <Text style={[styles.employeeName, { color: colors.textSecondary }]}>
                    {getDriverFullName(advance.employee)}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tutar:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatNumber(advance.amount)} {advance.currency || advance.currency_type}
                </Text>
              </View>
              {advance.description && (
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {advance.description}
                </Text>
              )}
            </View>
          </Card>
        ))
      )}

      {/* Form Modal */}
      <Modal
        visible={isFormOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setIsFormOpen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: Brand.primary, paddingTop: insets.top }]}>
          {/* Green Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsFormOpen(false)} style={styles.backButton}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingRecord ? 'Avans Kaydı Düzenle' : 'Yeni Avans Kaydı'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Form Content */}
          <KeyboardAvoidingView
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.formContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <DateInput
                label="Tarih"
                value={formData.advance_date}
                onChange={(date) => setFormData({ ...formData, advance_date: date })}
                required
              />

              {driverOptions.length > 0 && (
                <Select
                  label="Çalışan"
                  data={driverOptions}
                  value={formData.employee_id ? String(formData.employee_id) : undefined}
                  onValueChange={(v) =>
                    setFormData({ ...formData, employee_id: v ? parseInt(v, 10) : undefined })
                  }
                  placeholder="Çalışan seçin"
                />
              )}

              <Select
                label="Ödeme Yöntemi"
                data={PAYMENT_METHODS.map((m) => ({ label: m.label, value: m.value }))}
                value={formData.payment_method}
                onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
                placeholder="Ödeme yöntemi seçin"
              />

              <Input
                label="Tutar"
                value={formData.amount > 0 ? String(formData.amount) : ''}
                onChangeText={(text) => setFormData({ ...formData, amount: parseFloat(text) || 0 })}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />

              <Select
                label="Para Birimi"
                data={CURRENCY_TYPES.map((c) => ({ label: c.label, value: c.value }))}
                value={formData.currency_type}
                onValueChange={(v) => setFormData({ ...formData, currency_type: v || 'TRY' })}
                placeholder="Para birimi seçin"
              />

              <Input
                label="Açıklama"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Opsiyonel açıklama"
                multiline
                numberOfLines={3}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: Brand.primary },
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingRecord ? 'Güncelle' : 'Kaydet'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={isDeleteDialogOpen}
        title="Avans Kaydını Sil"
        message="Bu avans kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setDeletingRecordId(null);
        }}
        isLoading={isDeleting}
        isDangerous
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    ...Typography.bodySM,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  recordCard: {
    padding: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  recordType: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  recordActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  recordDetails: {
    gap: Spacing.xs,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  employeeName: {
    ...Typography.bodySM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.bodySM,
  },
  detailValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  description: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  modalTitle: {
    ...Typography.headingMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  formContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  submitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
