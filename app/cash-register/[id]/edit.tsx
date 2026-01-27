/**
 * Cash Register Edit Screen
 *
 * Edit existing cash register information.
 * Matches backend MobileUpdateCashRegisterRequest validation.
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
import { Input, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getCashRegister,
  updateCashRegister,
  CashRegisterFormData,
  CurrencyType,
} from '@/services/endpoints/cash-registers';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP' },
];

export default function CashRegisterEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState<CashRegisterFormData>({
    code: '',
    name: '',
    location: '',
    currency_type: 'TRY',
    opening_balance: 0,
    description: '',
    is_active: true,
  });

  // Load cash register data
  useEffect(() => {
    const loadCashRegister = async () => {
      if (!id) return;
      try {
        const data = await getCashRegister(parseInt(id, 10));

        // Populate form with existing data
        setFormData({
          code: data.code || '',
          name: data.name || '',
          location: data.location || '',
          currency_type: data.currency_type || 'TRY',
          opening_balance: data.opening_balance ?? 0,
          description: data.description || '',
          is_active: data.is_active !== false,
        });
      } catch {
        showError('Hata', 'Kasa bilgileri yüklenemedi');
        setTimeout(() => {
          router.back();
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    loadCashRegister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = useCallback((key: keyof CashRegisterFormData, value: any) => {
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
      newErrors.code = 'Kasa kodu zorunludur.';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Kasa adı zorunludur.';
    }
    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur.';
    }

    // Length validations
    if (formData.code && formData.code.length > 50) {
      newErrors.code = 'Kasa kodu en fazla 50 karakter olabilir.';
    }
    if (formData.name && formData.name.length > 255) {
      newErrors.name = 'Kasa adı en fazla 255 karakter olabilir.';
    }
    if (formData.location && formData.location.length > 255) {
      newErrors.location = 'Konum en fazla 255 karakter olabilir.';
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
      await updateCashRegister(parseInt(id, 10), formData);

      success('Başarılı', 'Kasa başarıyla güncellendi.');
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
        <FullScreenHeader title="Kasa Düzenle" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Kasa bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader title="Kasa Düzenle" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >

        {/* Form Content */}
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Temel Bilgiler */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

          <Input
            label="Kasa Kodu *"
            placeholder="Örn: KSA-001"
            value={formData.code}
            onChangeText={(text) => handleInputChange('code', text)}
            error={errors.code}
            maxLength={50}
          />

          <Input
            label="Kasa Adı *"
            placeholder="Örn: Ana Kasa"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            error={errors.name}
            maxLength={255}
          />

          <Input
            label="Konum"
            placeholder="Opsiyonel"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            error={errors.location}
            maxLength={255}
          />

          <SelectInput
            label="Para Birimi *"
            options={CURRENCY_OPTIONS}
            selectedValue={formData.currency_type}
            onValueChange={(value) => handleInputChange('currency_type', value as CurrencyType)}
            error={errors.currency_type}
          />

          <Input
            label="Açılış Bakiyesi"
            placeholder="0.00"
            value={String(formData.opening_balance ?? '')}
            onChangeText={(text) => {
              const numValue = parseFloat(text) || 0;
              handleInputChange('opening_balance', numValue);
            }}
            error={errors.opening_balance}
            keyboardType="decimal-pad"
          />

          {/* Diğer Bilgiler */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
            Diğer Bilgiler
          </Text>

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
          <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.switchContent}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>
                Aktif Kasa
              </Text>
              <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                Bu kasa kullanıma açık olacak
              </Text>
            </View>
            <Checkbox
              value={formData.is_active ?? true}
              onValueChange={(val) => handleInputChange('is_active', val)}
            />
          </View>
        </ScrollView>

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
    backgroundColor: Brand.primary,
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
  keyboardAvoidingView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
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
