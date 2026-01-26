/**
 * New Bank Account Screen
 *
 * Create new bank account (banka hesabı).
 * Matches backend MobileStoreBankRequest validation.
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
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import { createBank, BankFormData, CurrencyType } from '@/services/endpoints/banks';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Currency options
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP' },
];

export default function NewBankAccountScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback((field: keyof BankFormData, value: any) => {
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
    if (!formData.name?.trim()) {
      newErrors.name = 'Banka adı zorunludur.';
    }
    if (!formData.branch?.trim()) {
      newErrors.branch = 'Şube adı zorunludur.';
    }
    if (!formData.branch_code?.trim()) {
      newErrors.branch_code = 'Şube kodu zorunludur.';
    }
    if (!formData.account_number?.trim()) {
      newErrors.account_number = 'Hesap numarası zorunludur.';
    }
    if (!formData.iban?.trim()) {
      newErrors.iban = 'IBAN zorunludur.';
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

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createBank(formData);

      success('Başarılı', 'Banka hesabı başarıyla oluşturuldu.');
      setTimeout(() => {
        router.back();
      }, 1500);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Yeni Banka Hesabı"
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
              label="Şube Adı *"
              placeholder="Örn: Kadıköy Şubesi"
              value={formData.branch}
              onChangeText={(text) => handleInputChange('branch', text)}
              error={errors.branch}
            />

            <Input
              label="Şube Kodu *"
              placeholder="Örn: 1234"
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
              label="Hesap Numarası *"
              placeholder="Örn: 12345678"
              value={formData.account_number}
              onChangeText={(text) => handleInputChange('account_number', text)}
              error={errors.account_number}
              keyboardType="numeric"
              maxLength={50}
            />

            <Input
              label="IBAN *"
              placeholder="Örn: TR330006100519786457841326"
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

            {/* İletişim Bilgileri */}
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
          </Card>
        </ScrollView>
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
