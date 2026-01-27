/**
 * New Category Screen
 *
 * Create new product category with optional parent selection.
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
  TouchableOpacity,
} from 'react-native';

import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Card, Checkbox, SelectInput } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createProductCategory,
  getProductCategories,
  CategoryFormData,
  ProductCategory,
} from '@/services/endpoints/products';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function NewCategoryScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Parent categories for selection
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(true);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch parent categories
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const response = await getProductCategories({ is_active: true, per_page: 100 });
        setParentCategories(response.categories);
      } catch (err) {
        console.error('Failed to fetch parent categories:', err);
      } finally {
        setIsLoadingParents(false);
      }
    };
    fetchParentCategories();
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof CategoryFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Kategori adı zorunludur.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createProductCategory(formData);

      success('Başarılı', 'Kategori başarıyla oluşturuldu.');
      router.back();
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, success, showError]);

  // Parent category options for select
  const parentOptions = [
    { label: 'Üst kategori yok', value: '' },
    ...parentCategories.map((cat) => ({
      label: cat.name,
      value: String(cat.id),
    })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
          title="Yeni Kategori Ekle"
          showBackButton
          onBackPress={() => router.back()}
          rightIcons={
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.saveButton}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          }
        />

      <View style={styles.contentArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Form Content */}
          <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kategori Bilgileri</Text>

            <Input
              label="Kategori Adı *"
              placeholder="Örn: Elektronik"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
            />

            <Input
              label="Açıklama"
              placeholder="Opsiyonel"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              error={errors.description}
              multiline
              numberOfLines={3}
            />

            {/* Parent Category Selection */}
            <View style={styles.selectContainer}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>Üst Kategori</Text>
              {isLoadingParents ? (
                <View style={styles.loadingParent}>
                  <ActivityIndicator size="small" color={Brand.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
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
              <Text style={[styles.selectHint, { color: colors.textMuted }]}>
                Boş bırakırsanız ana kategori olarak oluşturulur
              </Text>
            </View>

            {/* Aktif/Pasif */}
            <View
              style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}
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
          </Card>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  saveButton: {
    padding: Spacing.sm,
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
  selectHint: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  loadingParent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySM,
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
});
