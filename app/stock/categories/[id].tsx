/**
 * Category Detail Screen
 *
 * View and edit product category details.
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
import { Save, Trash2, FolderTree, CornerDownRight } from 'lucide-react-native';
import { Input, Card, Badge, Checkbox, SelectInput, ConfirmDialog, FullScreenHeader } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getProductCategory,
  getProductCategories,
  updateProductCategory,
  deleteProductCategory,
  ProductCategory,
  CategoryFormData,
} from '@/services/endpoints/products';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function CategoryDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingParents, setIsLoadingParents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch category data
  const fetchCategory = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      setIsLoading(true);
      const data = await getProductCategory(Number(id));
      setCategory(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        parent_id: data.parent_id || null,
        is_active: data.is_active,
      });
    } catch (err) {
      console.error('Category fetch error:', err);
      setError(err instanceof Error ? err.message : 'Kategori yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch parent categories
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const response = await getProductCategories({ is_active: true, per_page: 100 });
        // Filter out the current category to prevent self-reference
        setParentCategories(response.categories.filter((cat) => cat.id !== Number(id)));
      } catch (err) {
        console.error('Failed to fetch parent categories:', err);
      } finally {
        setIsLoadingParents(false);
      }
    };
    fetchParentCategories();
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof CategoryFormData, value: any) => {
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
      newErrors.name = 'Kategori adı zorunludur.';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !category) return;

    setIsSubmitting(true);
    try {
      const updated = await updateProductCategory(category.id, formData);
      setCategory(updated);
      setIsEditing(false);
      success('Başarılı', 'Kategori güncellendi.');
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
  }, [formData, validateForm, category, success, showError]);

  // Delete handler - opens dialog
  const handleDelete = useCallback(() => {
    if (!category) return;
    setShowDeleteDialog(true);
  }, [category]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!category) return;

    setIsDeleting(true);
    try {
      await deleteProductCategory(category.id);
      setShowDeleteDialog(false);
      success('Başarılı', 'Kategori silindi.');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Kategori silinemedi');
    } finally {
      setIsDeleting(false);
    }
  }, [category, success, showError]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id || null,
        is_active: category.is_active,
      });
    }
    setFormErrors({});
    setIsEditing(false);
  }, [category]);

  // Parent category options for select
  const parentOptions = [
    { label: 'Üst kategori yok', value: '' },
    ...parentCategories.map((cat) => ({
      label: cat.name,
      value: String(cat.id),
    })),
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Kategori Detayı"
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (error || !category) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Kategori Detayı"
          onBackPress={() => router.back()}
        />
        <View style={styles.errorState}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error || 'Kategori bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchCategory}
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
          title={isEditing ? 'Kategoriyi Düzenle' : 'Kategori Detayı'}
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

      <View style={styles.contentArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Info Header */}
          <View style={styles.categoryInfoHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: `${Brand.primary}15` }]}>
              <FolderTree size={32} color={Brand.primary} />
            </View>
            <Badge
              label={category.is_active ? 'Aktif' : 'Pasif'}
              variant={category.is_active ? 'success' : 'default'}
              size="md"
            />
          </View>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kategori Bilgileri</Text>

            {isEditing ? (
              <>
                <Input
                  label="Kategori Adı *"
                  placeholder="Örn: Elektronik"
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

                {/* Parent Category Selection */}
                <View style={styles.selectContainer}>
                  <Text style={[styles.selectLabel, { color: colors.text }]}>Üst Kategori</Text>
                  {isLoadingParents ? (
                    <View style={styles.loadingParent}>
                      <ActivityIndicator size="small" color={Brand.primary} />
                      <Text style={[styles.loadingTextSmall, { color: colors.textSecondary }]}>
                        Kategoriler yükleniyor...
                      </Text>
                    </View>
                  ) : (
                    <SelectInput
                      value={formData.parent_id ? String(formData.parent_id) : ''}
                      onValueChange={(value) =>
                        handleInputChange('parent_id', value ? Number(value) : null)
                      }
                      options={parentOptions}
                      placeholder="Üst kategori seçin (opsiyonel)"
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.switchRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.switchContent}>
                    <Text style={[styles.switchLabel, { color: colors.text }]}>Aktif Kategori</Text>
                    <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                      Bu kategori kullanıma açık olacak
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
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Kategori Adi
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{category.name}</Text>
                </View>

                {category.parent && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Ust Kategori
                    </Text>
                    <View style={styles.parentInfoRow}>
                      <CornerDownRight size={14} color={colors.textMuted} />
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {category.parent.name}
                      </Text>
                    </View>
                  </View>
                )}

                {category.description && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Aciklama
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {category.description}
                    </Text>
                  </View>
                )}

                {category.children_count !== undefined && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Alt Kategori Sayısı
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {category.children_count}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Oluşturulma Tarihi
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(category.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Son Güncelleme
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(category.updated_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </>
            )}
          </Card>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Kategori Sil"
        message={`"${category?.name}" kategorisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
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
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
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
  categoryInfoHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  categoryIcon: {
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
  selectContainer: {
    marginVertical: Spacing.xs,
  },
  selectLabel: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  loadingParent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingTextSmall: {
    ...Typography.bodySM,
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
  parentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
