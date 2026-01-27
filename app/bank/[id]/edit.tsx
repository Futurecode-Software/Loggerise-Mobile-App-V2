/**
 * Bank Account Edit Screen
 *
 * Edit existing bank account information.
 * Matches backend MobileUpdateBankRequest validation.
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
  getBank,
  updateBank,
  BankFormData,
  CurrencyType,
} from '@/services/endpoints/banks';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP' },
];

export default function BankAccountEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState<BankFormData>({
    name: '',
    bank_code: '',
    branch: '',
    branch_code: '',
    account_number: '',
    iban: '',
    currency_type: 'TRY',
    opening_balance: 0,
    description: '',
    is_active: true,
  });

  // Load bank data
  useEffect(() => {
    const loadBank = async () => {
      if (!id) return;
      try {
        const bankData = await getBank(parseInt(id, 10));

        // Populate form with existing data
        setFormData({
          name: bankData.name || '',
          bank_code: bankData.bank_code || '',
          branch: bankData.branch || '',
          branch_code: bankData.branch_code || '',
          account_number: bankData.account_number || '',
          iban: bankData.iban || '',
          currency_type: bankData.currency_type || 'TRY',
          opening_balance: bankData.opening_balance ?? 0,
          description: bankData.description || '',
          is_active: bankData.is_active !== false,
        });
      } catch {
        showError('Hata', 'Banka hesabı bilgileri yüklenemedi');
        setTimeout(() => {
          router.back();
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    loadBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = useCallback((key: keyof BankFormData, value: any) => {
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
    if (!formData.name?.trim()) {
      newErrors.name = 'Banka adı zorunludur.';
    }
    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur.';
    }

    // Length validations
    if (formData.bank_code && formData.bank_code.length > 10) {
      newErrors.bank_code = 'Banka kodu en fazla 10 karakter olabilir.';
    }
    if (formData.branch && formData.branch.length > 255) {
      newErrors.branch = 'Şube adı en fazla 255 karakter olabilir.';
    }
    if (formData.branch_code && formData.branch_code.length > 10) {
      newErrors.branch_code = 'Şube kodu en fazla 10 karakter olabilir.';
    }
    if (formData.account_number && formData.account_number.length > 50) {
      newErrors.account_number = 'Hesap numarası en fazla 50 karakter olabilir.';
    }
    if (formData.iban && formData.iban.length > 34) {
      newErrors.iban = 'IBAN en fazla 34 karakter olabilir.';
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
      await updateBank(parseInt(id, 10), formData);

      success('Başarılı', 'Banka hesabı başarıyla güncellendi.');
      setTimeout(() => {
        router.back();
      }, 1500);
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
        <FullScreenHeader title="Banka Hesabı Düzenle" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Banka hesabı bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader title="Banka Hesabı Düzenle" showBackButton />

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
            label="Banka Adı *"
            placeholder="Örn: Ziraat Bankası"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            error={errors.name}
          />

          <Input
            label="Banka Kodu"
            placeholder="Opsiyonel"
            value={formData.bank_code}
            onChangeText={(text) => handleInputChange('bank_code', text)}
            error={errors.bank_code}
            maxLength={10}
          />

          <Input
            label="Şube Adı"
            placeholder="Opsiyonel"
            value={formData.branch}
            onChangeText={(text) => handleInputChange('branch', text)}
            error={errors.branch}
          />

          <Input
            label="Şube Kodu"
            placeholder="Opsiyonel"
            value={formData.branch_code}
            onChangeText={(text) => handleInputChange('branch_code', text)}
            error={errors.branch_code}
            maxLength={10}
          />

          {/* Hesap Bilgileri */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
            Hesap Bilgileri
          </Text>

          <Input
            label="Hesap Numarası"
            placeholder="Opsiyonel"
            value={formData.account_number}
            onChangeText={(text) => handleInputChange('account_number', text)}
            error={errors.account_number}
            keyboardType="numeric"
            maxLength={50}
          />

          <Input
            label="IBAN"
            placeholder="Opsiyonel"
            value={formData.iban}
            onChangeText={(text) => handleInputChange('iban', text.toUpperCase())}
            error={errors.iban}
            autoCapitalize="characters"
            maxLength={34}
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
                Aktif Hesap
              </Text>
              <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                Bu hesap kullanıma açık olacak
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
