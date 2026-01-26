import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog, FullScreenHeader } from '@/components/ui';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Save,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Phone,
  Mail,
  Clock,
} from 'lucide-react-native';
import { Input, Button, Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  getCustomerInteraction,
  updateInteraction,
  deleteInteraction,
  completeInteraction,
  cancelInteraction,
  InteractionFormData,
  InteractionType,
  InteractionStatus,
  getInteractionTypeLabel,
  getInteractionStatusLabel,
  getInteractionStatusVariant,
  formatDateTime,
} from '@/services/endpoints/customer-interactions';

const INTERACTION_TYPES = [
  { value: 'meeting', label: 'Toplantı', icon: Users },
  { value: 'call', label: 'Arama', icon: Phone },
  { value: 'email', label: 'E-posta', icon: Mail },
  { value: 'follow_up', label: 'Takip', icon: Clock },
] as const;

export default function InteractionDetailScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();
  const { id, interactionId } = useLocalSearchParams<{ id: string; interactionId: string }>();
  const customerId = parseInt(id, 10);
  const interactionIdNum = parseInt(interactionId, 10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InteractionFormData>({
    interaction_type: 'meeting',
    subject: '',
    description: '',
    interaction_date: '',
    next_followup_date: '',
    status: 'pending',
  });

  const [originalData, setOriginalData] = useState<InteractionFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dialog states
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch interaction data
  useEffect(() => {
    const fetchInteraction = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const interaction = await getCustomerInteraction(customerId, interactionIdNum);

        const data: InteractionFormData = {
          interaction_type: interaction.interaction_type,
          subject: interaction.subject,
          description: interaction.description || '',
          interaction_date: interaction.interaction_date
            ? new Date(interaction.interaction_date).toISOString().split('T')[0]
            : '',
          next_followup_date: interaction.next_followup_date
            ? new Date(interaction.next_followup_date).toISOString().split('T')[0]
            : '',
          status: interaction.status,
        };

        setFormData(data);
        setOriginalData(data);
      } catch (err) {
        console.error('Fetch interaction error:', err);
        setError(err instanceof Error ? err.message : 'Görüşme bilgileri yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInteraction();
  }, [customerId, interactionIdNum]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject?.trim()) {
      newErrors.subject = 'Konu zorunludur';
    }

    if (!formData.interaction_date) {
      newErrors.interaction_date = 'Görüşme tarihi zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      showError('Hata', 'Lütfen formu eksiksiz doldurunuz');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateInteraction(customerId, interactionIdNum, formData);
      success('Başarılı', 'Görüşme başarıyla güncellendi');
      setIsEditing(false);
      setOriginalData(formData);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Görüşme güncellenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show complete dialog
  const handleComplete = () => {
    setShowCompleteDialog(true);
  };

  // Confirm complete
  const confirmComplete = async () => {
    try {
      const updated = await completeInteraction(customerId, interactionIdNum);
      setFormData((prev) => ({ ...prev, status: updated.status }));
      setOriginalData((prev) => (prev ? { ...prev, status: updated.status } : null));
      setShowCompleteDialog(false);
      success('Başarılı', 'Görüşme tamamlandı olarak işaretlendi');
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'İşlem başarısız');
    }
  };

  // Show cancel dialog
  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  // Confirm cancel interaction
  const confirmCancelInteraction = async () => {
    try {
      const updated = await cancelInteraction(customerId, interactionIdNum);
      setFormData((prev) => ({ ...prev, status: updated.status }));
      setOriginalData((prev) => (prev ? { ...prev, status: updated.status } : null));
      setShowCancelDialog(false);
      success('Başarılı', 'Görüşme iptal edildi');
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'İşlem başarısız');
    }
  };

  // Show delete dialog
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await deleteInteraction(customerId, interactionIdNum);
      setShowDeleteDialog(false);
      success('Başarılı', 'Görüşme silindi');
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Görüşme silinemedi');
    }
  };

  const cancelEdit = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setIsEditing(false);
    setErrors({});
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Görüşme Detayı" onBack={() => router.back()} />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Görüşme yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Görüşme Detayı" onBack={() => router.back()} />
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <FullScreenHeader
        title="Görüşme Detayı"
        onBack={() => router.back()}
        rightIcons={
          isEditing
            ? [
                {
                  icon: <Save size={20} color="#FFFFFF" />,
                  onPress: handleUpdate,
                  disabled: isSubmitting,
                },
              ]
            : [
                {
                  icon: <Trash2 size={20} color="#FFFFFF" />,
                  onPress: handleDelete,
                },
              ]
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Actions (only if not editing) */}
          {!isEditing && formData.status === 'pending' && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success + '15' }]}
                onPress={handleComplete}
              >
                <CheckCircle size={20} color={colors.success} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>
                  Tamamla
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.danger + '15' }]}
                onPress={handleCancel}
              >
                <XCircle size={20} color={colors.danger} />
                <Text style={[styles.actionButtonText, { color: colors.danger }]}>İptal Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Interaction Type */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Görüşme Tipi</Text>

            {isEditing ? (
              <View style={styles.typeGrid}>
                {INTERACTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = formData.interaction_type === type.value;

                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: isActive ? Brand.primary + '15' : colors.surface,
                          borderColor: isActive ? Brand.primary : colors.border,
                        },
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          interaction_type: type.value as InteractionType,
                        })
                      }
                    >
                      <Icon size={24} color={isActive ? Brand.primary : colors.textSecondary} />
                      <Text
                        style={[
                          styles.typeLabel,
                          { color: isActive ? Brand.primary : colors.text },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Badge
                label={getInteractionTypeLabel(formData.interaction_type)}
                variant="info"
                size="lg"
              />
            )}
          </Card>

          {/* Details */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Görüşme Detayları</Text>

            <Input
              label="Konu"
              placeholder="Görüşme konusu"
              value={formData.subject}
              onChangeText={(value) => setFormData({ ...formData, subject: value })}
              error={errors.subject}
              editable={isEditing}
              required
            />

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
              <Input
                placeholder="Görüşme notları..."
                value={formData.description}
                onChangeText={(value) => setFormData({ ...formData, description: value })}
                multiline
                numberOfLines={4}
                editable={isEditing}
                style={styles.textArea}
              />
            </View>
          </Card>

          {/* Dates */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarihler</Text>

            <Input
              label="Görüşme Tarihi"
              value={formData.interaction_date}
              onChangeText={(value) => setFormData({ ...formData, interaction_date: value })}
              error={errors.interaction_date}
              editable={isEditing}
              type="date"
              required
            />

            <Input
              label="Sonraki Takip Tarihi"
              value={formData.next_followup_date}
              onChangeText={(value) => setFormData({ ...formData, next_followup_date: value })}
              editable={isEditing}
              type="date"
            />
          </Card>

          {/* Status */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum</Text>
            <Badge
              label={getInteractionStatusLabel(formData.status || 'pending')}
              variant={getInteractionStatusVariant(formData.status || 'pending')}
              size="lg"
            />
          </Card>

          {/* Action Buttons */}
          {isEditing ? (
            <View style={styles.buttonRow}>
              <Button
                title="İptal"
                onPress={cancelEdit}
                variant="secondary"
                style={styles.halfButton}
              />
              <Button
                title={isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
                onPress={handleUpdate}
                disabled={isSubmitting}
                variant="primary"
                style={styles.halfButton}
              />
            </View>
          ) : (
            <Button
              title="Düzenle"
              onPress={() => setIsEditing(true)}
              variant="primary"
              style={styles.submitButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Complete Dialog */}
      <ConfirmDialog
        visible={showCompleteDialog}
        title="Görüşmeyi Tamamla"
        message="Bu görüşmeyi tamamlandı olarak işaretlemek istiyor musunuz?"
        confirmText="Tamamla"
        cancelText="İptal"
        onConfirm={confirmComplete}
        onCancel={() => setShowCompleteDialog(false)}
      />

      {/* Cancel Interaction Dialog */}
      <ConfirmDialog
        visible={showCancelDialog}
        title="Görüşmeyi İptal Et"
        message="Bu görüşmeyi iptal etmek istiyor musunuz?"
        confirmText="İptal Et"
        cancelText="Hayır"
        isDangerous
        onConfirm={confirmCancelInteraction}
        onCancel={() => setShowCancelDialog(false)}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Görüşmeyi Sil"
        message="Bu görüşmeyi silmek istediğinizden emin misiniz?"
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeLabel: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  halfButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing.lg,
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
  errorIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
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
