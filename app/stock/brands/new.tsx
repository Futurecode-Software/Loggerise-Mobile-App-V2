/**
 * New Brand Screen
 *
 * Create new product brand.
 */

import React, { useState, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { Input, Card, Checkbox } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import { createProductBrand, BrandFormData } from '@/services/endpoints/products';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function NewBrandScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof BrandFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field
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
      newErrors.name = 'Marka adı zorunludur.';
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
      await createProductBrand(formData);

      success('Başarılı', 'Marka başarıyla oluşturuldu.');
      setTimeout(() => {
        router.back();
      }, 1500);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Marka Ekle</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Brand.primary} />
            ) : (
              <Save size={22} color={Brand.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Marka Bilgileri</Text>

            <Input
              label="Marka Adı *"
              placeholder="Örn: Apple"
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

            {/* Aktif/Pasif */}
            <View
              style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}
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
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
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
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
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
