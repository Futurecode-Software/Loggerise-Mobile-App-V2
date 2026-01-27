/**
 * Warehouse Edit Screen
 *
 * Edit existing warehouse information.
 * Matches backend MobileUpdateWarehouseRequest validation.
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
import { Save } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Input, Checkbox } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getWarehouse,
  updateWarehouse,
  WarehouseFormData,
} from '@/services/endpoints/warehouses';
import { getErrorMessage, getValidationErrors } from '@/services/api';

export default function WarehouseEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState<WarehouseFormData>({
    code: '',
    name: '',
    address: '',
    postal_code: '',
    phone: '',
    email: '',
    manager: '',
    notes: '',
    is_active: true,
  });

  // Load warehouse data
  useEffect(() => {
    const loadWarehouse = async () => {
      if (!id) return;
      try {
        const warehouseData = await getWarehouse(parseInt(id, 10));

        // Populate form with existing data
        setFormData({
          code: warehouseData.code || '',
          name: warehouseData.name || '',
          address: warehouseData.address || '',
          postal_code: warehouseData.postal_code || '',
          phone: warehouseData.phone || '',
          email: warehouseData.email || '',
          manager: warehouseData.manager || '',
          notes: warehouseData.notes || '',
          is_active: warehouseData.is_active !== false,
        });
      } catch {
        showError('Hata', 'Depo bilgileri yüklenemedi');
        setTimeout(() => {
          router.back();
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    loadWarehouse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = useCallback((key: keyof WarehouseFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.code?.trim()) {
      newErrors.code = 'Depo kodu zorunludur.';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Depo adı zorunludur.';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!id) return;

    setIsSubmitting(true);
    try {
      await updateWarehouse(parseInt(id, 10), formData);

      success('Başarılı', 'Depo başarıyla güncellendi.');
      router.back();
    } catch (error) {
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
  }, [id, formData, validateForm, success, showError]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Depo Düzenle"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.contentArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Depo bilgileri yükleniyor...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Depo Düzenle"
        showBackButton
        onBackPress={() => router.back()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >

        {/* Form Content */}
        <View style={styles.contentArea}>
          <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Temel Bilgiler */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

          <Input
            label="Depo Kodu *"
            placeholder="Örn: DEP001"
            value={formData.code}
            onChangeText={(text) => handleInputChange('code', text.toUpperCase())}
            error={errors.code}
            autoCapitalize="characters"
          />

          <Input
            label="Depo Adı *"
            placeholder="Örn: Merkez Depo"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            error={errors.name}
          />

          <Input
            label="Adres"
            placeholder="Opsiyonel"
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
            error={errors.address}
            multiline
            numberOfLines={3}
          />

          <Input
            label="Posta Kodu"
            placeholder="Opsiyonel"
            value={formData.postal_code}
            onChangeText={(text) => handleInputChange('postal_code', text)}
            error={errors.postal_code}
          />

          {/* İletişim Bilgileri */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
            İletişim Bilgileri
          </Text>

          <Input
            label="Telefon"
            placeholder="Opsiyonel"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <Input
            label="E-posta"
            placeholder="Opsiyonel"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Depo Sorumlusu"
            placeholder="Opsiyonel"
            value={formData.manager}
            onChangeText={(text) => handleInputChange('manager', text)}
            error={errors.manager}
          />

          {/* Notlar */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
            Diğer Bilgiler
          </Text>

          <Input
            label="Notlar"
            placeholder="Opsiyonel"
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            error={errors.notes}
            multiline
            numberOfLines={4}
          />

          {/* Aktif/Pasif */}
          <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.switchContent}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>
                Aktif Depo
              </Text>
              <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                Bu depo kullanıma açık olacak
              </Text>
            </View>
            <Checkbox
              value={formData.is_active ?? true}
              onValueChange={(val) => handleInputChange('is_active', val)}
            />
          </View>
        </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isSubmitting ? colors.textMuted : Brand.primary },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
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
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
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
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
