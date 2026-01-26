/**
 * Model Detail Screen
 *
 * View and edit product model details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { Save, Trash2, Layers } from 'lucide-react-native';
import { Input, Card, Badge, Checkbox, ConfirmDialog, FullScreenHeader } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getProductModel,
  updateProductModel,
  deleteProductModel,
  ProductModel,
  ModelFormData,
} from '@/services/endpoints/products';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function ModelDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [model, setModel] = useState<ProductModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    description: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch model data
  const fetchModel = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      setIsLoading(true);
      const data = await getProductModel(Number(id));
      setModel(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        is_active: data.is_active,
      });
    } catch (err) {
      console.error('Model fetch error:', err);
      setError(err instanceof Error ? err.message : 'Model yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof ModelFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (formErrors[field]) {
        setFormErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [formErrors]
  );

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Model adı zorunludur.';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !model) return;

    setIsSubmitting(true);
    try {
      const updated = await updateProductModel(model.id, formData);
      setModel(updated);
      setIsEditing(false);
      success('Başarılı', 'Model güncellendi.');
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setFormErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, model, success, showError]);

  // Delete handler - opens dialog
  const handleDelete = useCallback(() => {
    if (!model) return;
    setShowDeleteDialog(true);
  }, [model]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!model) return;

    setIsDeleting(true);
    try {
      await deleteProductModel(model.id);
      setShowDeleteDialog(false);
      success('Başarılı', 'Model silindi.');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Model silinemedi');
    } finally {
      setIsDeleting(false);
    }
  }, [model, success, showError]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    if (model) {
      setFormData({
        name: model.name,
        description: model.description || '',
        is_active: model.is_active,
      });
    }
    setFormErrors({});
    setIsEditing(false);
  }, [model]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Model Detayı"
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (error || !model) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Model Detayı"
          onBackPress={() => router.back()}
        />
        <View style={styles.errorState}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error || 'Model bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchModel}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FullScreenHeader
          title={isEditing ? 'Modeli Düzenle' : 'Model Detayı'}
          onBackPress={isEditing ? handleCancelEdit : () => router.back()}
          leftActions={
            !isEditing
              ? [
                  {
                    icon: <Trash2 size={22} color={colors.danger} />,
                    onPress: handleDelete,
                  },
                ]
              : undefined
          }
          rightAction={{
            icon: isSubmitting ? undefined : <Save size={22} color={Brand.primary} />,
            onPress: isEditing ? handleSubmit : () => setIsEditing(true),
            disabled: isSubmitting,
            loading: isSubmitting,
          }}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Model Info Header */}
          <View style={styles.modelInfoHeader}>
            <View style={[styles.modelIcon, { backgroundColor: `${Brand.primary}15` }]}>
              <Layers size={32} color={Brand.primary} />
            </View>
            <Badge
              label={model.is_active ? 'Aktif' : 'Pasif'}
              variant={model.is_active ? 'success' : 'default'}
              size="md"
            />
          </View>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Model Bilgileri</Text>

            {isEditing ? (
              <>
                <Input
                  label="Model Adı *"
                  placeholder="Örn: iPhone 15 Pro"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  error={formErrors.name}
                />

                <Input
                  label="Açıklama"
                  placeholder="Opsiyonel"
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  error={formErrors.description}
                  multiline
                  numberOfLines={3}
                />

                <View
                  style={[
                    styles.switchRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.switchContent}>
                    <Text style={[styles.switchLabel, { color: colors.text }]}>Aktif Model</Text>
                    <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                      Bu model kullanıma açık olacak
                    </Text>
                  </View>
                  <Checkbox
                    value={formData.is_active ?? true}
                    onValueChange={(val) => handleInputChange('is_active', val)}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Model Adı</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{model.name}</Text>
                </View>

                {model.description && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Aciklama
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {model.description}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Oluşturulma Tarihi
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(model.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Son Güncelleme
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(model.updated_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Model Sil"
        message={`"${model?.name}" modelini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        isDangerous={true}
        isLoading={isDeleting}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  modelInfoHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modelIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    ...Typography.bodySM,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.xs,
  },
  switchContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  switchDescription: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
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
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
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
