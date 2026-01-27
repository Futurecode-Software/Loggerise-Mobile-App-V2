/**
 * New Cash Register Screen
 *
 * Create new cash register (kasa).
 * Matches backend MobileStoreCashRegisterRequest validation.
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
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Card, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import { createCashRegister, CashRegisterFormData, CurrencyType } from '@/services/endpoints/cash-registers';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP' },
];

export default function NewCashRegisterScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<CashRegisterFormData>({
    code: '',
    name: '',
    location: '',
    currency_type: 'TRY',
    opening_balance: 0,
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback((field: keyof CashRegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validation function matching backend rules
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

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createCashRegister(formData);

      success('Başarılı', 'Kasa başarıyla oluşturuldu.');
      router.back();
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        // Convert Laravel errors to flat object
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
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Yeni Kasa"
        showBackButton
        rightIcons={
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.headerButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

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
              placeholder="Örn: Merkez Ofis"
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
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
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
