/**
 * Brand Detail Screen
 *
 * View and edit product brand details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Save, Trash2, Tag } from 'lucide-react-native';
import { Input, Card, Badge, Checkbox, ConfirmDialog } from '@/components/ui';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getProductBrand,
  updateProductBrand,
  deleteProductBrand,
  ProductBrand,
  BrandFormData,
} from '@/services/endpoints/products';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function BrandDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [brand, setBrand] = useState<ProductBrand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch brand data
  const fetchBrand = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      setIsLoading(true);
      const data = await getProductBrand(Number(id));
      setBrand(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        is_active: data.is_active,
      });
    } catch (err) {
      console.error('Brand fetch error:', err);
      setError(err instanceof Error ? err.message : 'Marka yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof BrandFormData, value: any) => {
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
      newErrors.name = 'Marka adı zorunludur.';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !brand) return;

    setIsSubmitting(true);
    try {
      const updated = await updateProductBrand(brand.id, formData);
      setBrand(updated);
      setIsEditing(false);
      success('Başarılı', 'Marka güncellendi.');
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
  }, [formData, validateForm, brand, success, showError]);

  // Delete handler - opens dialog
  const handleDelete = useCallback(() => {
    if (!brand) return;
    setShowDeleteDialog(true);
  }, [brand]);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!brand) return;

    setIsDeleting(true);
    try {
      await deleteProductBrand(brand.id);
      setShowDeleteDialog(false);
      success('Başarılı', 'Marka silindi.');
      router.back();
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Marka silinemedi');
      setIsDeleting(false);
    }
  }, [brand, success, showError]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description || '',
        is_active: brand.is_active,
      });
    }
    setFormErrors({});
    setIsEditing(false);
  }, [brand]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Marka Detayı" showBackButton />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (error || !brand) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Marka Detayı" showBackButton />
        <View style={styles.errorState}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {error || 'Marka bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchBrand}
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
        title={isEditing ? 'Markayı Düzenle' : 'Marka Detayı'}
        showBackButton
        onBackPress={isEditing ? handleCancelEdit : undefined}
        rightIcons={
          <View style={styles.headerActions}>
            {!isEditing && (
              <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                <Trash2 size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={isEditing ? handleSubmit : () => setIsEditing(true)}
              style={styles.headerButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        }
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
          {/* Brand Info Header */}
          <View style={styles.brandInfoHeader}>
            <View style={[styles.brandIcon, { backgroundColor: `${Brand.primary}15` }]}>
              <Tag size={32} color={Brand.primary} />
            </View>
            <Badge
              label={brand.is_active ? 'Aktif' : 'Pasif'}
              variant={brand.is_active ? 'success' : 'default'}
              size="md"
            />
          </View>

          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Marka Bilgileri</Text>

            {isEditing ? (
              <>
                <Input
                  label="Marka Adı *"
                  placeholder="Örn: Apple"
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
                    <Text style={[styles.switchLabel, { color: colors.text }]}>Aktif Marka</Text>
                    <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                      Bu marka kullanıma açık olacak
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
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Marka Adı</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{brand.name}</Text>
                </View>

                {brand.description && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Aciklama
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {brand.description}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Oluşturulma Tarihi
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(brand.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Son Güncelleme
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(brand.updated_at).toLocaleDateString('tr-TR')}
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
        title="Marka Sil"
        message={`"${brand?.name}" markasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  brandInfoHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandIcon: {
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
