/**
 * Expenses Section (CRUD)
 *
 * Allows adding, editing, and deleting expense records for a position.
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
import { Receipt, Plus, Pencil, Trash2, ChevronLeft, Building2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Input, Select, ConfirmDialog } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  Position,
  ExpenseResponse,
  ExpenseInput,
  createExpense,
  updateExpense,
  deleteExpense,
  EXPENSE_TYPES,
  CURRENCY_TYPES,
  getExpenseTypeLabel,
} from '@/services/endpoints/positions';
import { showToast } from '@/utils/toast';
import { formatCurrency } from '@/utils/formatters';

interface ExpensesSectionProps {
  position: Position;
  onUpdate: () => void;
}

const initialFormData: ExpenseInput = {
  expense_date: new Date().toISOString().split('T')[0],
  expense_type: 'other',
  amount: 0,
  currency_type: 'TRY',
  exchange_rate: 1,
  description: '',
};

export function ExpensesSection({ position, onUpdate }: ExpensesSectionProps) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const expenses = position.expenses || [];

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseResponse | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<ExpenseInput>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        expense_date: editingRecord.expense_date
          ? new Date(editingRecord.expense_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        expense_type: editingRecord.expense_type || 'other',
        amount: parseFloat(editingRecord.amount) || 0,
        currency_type: editingRecord.currency_type || 'TRY',
        exchange_rate: parseFloat(editingRecord.exchange_rate) || 1,
        description: editingRecord.description || '',
        contact_id: editingRecord.contact_id,
        load_id: editingRecord.load_id,
      });
    }
  }, [editingRecord]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record: ExpenseResponse) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (recordId: number) => {
    setDeletingRecordId(recordId);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.expense_date) {
      showToast({ type: 'error', message: 'Tarih zorunludur' });
      return;
    }
    if (!formData.expense_type) {
      showToast({ type: 'error', message: 'Masraf türü seçilmelidir' });
      return;
    }
    if (formData.amount <= 0) {
      showToast({ type: 'error', message: 'Tutar sıfırdan büyük olmalıdır' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await updateExpense(position.id, editingRecord.id, formData);
        showToast({ type: 'success', message: 'Masraf kaydı güncellendi' });
      } else {
        await createExpense(position.id, formData);
        showToast({ type: 'success', message: 'Masraf kaydı oluşturuldu' });
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
      await deleteExpense(position.id, deletingRecordId);
      showToast({ type: 'success', message: 'Masraf kaydı silindi' });
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

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Masraf Kayıtları</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: Brand.primary }]}
          onPress={handleOpenCreate}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Records List */}
      {expenses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.empty}>
            <Receipt size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz masraf kaydı bulunmuyor
            </Text>
          </View>
        </Card>
      ) : (
        expenses.map((expense) => (
          <Card key={expense.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.recordInfo}>
                <Text style={[styles.recordDate, { color: colors.text }]}>
                  {formatDate(expense.date || expense.expense_date)}
                </Text>
                <Text style={[styles.recordType, { color: colors.textSecondary }]}>
                  {getExpenseTypeLabel(expense.expense_type)}
                </Text>
              </View>
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleOpenEdit(expense as any)}
                >
                  <Pencil size={16} color={Brand.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleOpenDelete(expense.id)}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.recordDetails}>
              {expense.contact && (
                <View style={styles.contactRow}>
                  <Building2 size={14} color={colors.icon} />
                  <Text style={[styles.contactName, { color: colors.textSecondary }]}>
                    {expense.contact.name}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tutar:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatCurrency(parseFloat(expense.amount as any), expense.currency || expense.currency_type)}
                </Text>
              </View>
              {expense.description && (
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {expense.description}
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
              {editingRecord ? 'Masraf Kaydı Düzenle' : 'Yeni Masraf Kaydı'}
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
                value={formData.expense_date}
                onChange={(date) => setFormData({ ...formData, expense_date: date })}
                required
              />

              <Select
                label="Masraf Türü"
                data={EXPENSE_TYPES.map((t) => ({ label: t.label, value: t.value }))}
                value={formData.expense_type}
                onValueChange={(v) => setFormData({ ...formData, expense_type: v || 'other' })}
                placeholder="Masraf türü seçin"
                required
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
        title="Masraf Kaydını Sil"
        message="Bu masraf kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  contactName: {
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
