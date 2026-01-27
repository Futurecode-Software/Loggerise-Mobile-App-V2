/**
 * New Employee Screen
 *
 * Create new employee (personel).
 * Matches backend StoreEmployeeRequest validation.
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
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Input, Card, Checkbox } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createEmployee,
  EmployeeFormData,
  EmploymentStatus,
  ContractType,
  Position,
  Gender,
  MaritalStatus,
} from '@/services/endpoints/employees';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Employment status options
const EMPLOYMENT_STATUS_OPTIONS = [
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'passive' },
  { label: 'İzinde', value: 'on_leave' },
  { label: 'Askıya Alındı', value: 'suspended' },
  { label: 'İşten Ayrıldı', value: 'terminated' },
];

// Contract type options
const CONTRACT_TYPE_OPTIONS = [
  { label: 'Tam Zamanlı', value: 'full_time' },
  { label: 'Yarı Zamanlı', value: 'part_time' },
  { label: 'Geçici', value: 'temporary' },
  { label: 'Sezonluk', value: 'seasonal' },
  { label: 'Stajyer', value: 'internship' },
  { label: 'Serbest', value: 'freelance' },
];

// Position options
const POSITION_OPTIONS = [
  { label: 'Ofis Personeli', value: 'office_staff' },
  { label: 'Sürücü', value: 'driver' },
  { label: 'Beyaz Yaka', value: 'white_collar' },
  { label: 'Mavi Yaka', value: 'blue_collar' },
  { label: 'Yönetici', value: 'manager' },
  { label: 'Süpervizör', value: 'supervisor' },
  { label: 'Teknisyen', value: 'technician' },
  { label: 'Mühendis', value: 'engineer' },
  { label: 'Muhasebeci', value: 'accountant' },
  { label: 'Satış Temsilcisi', value: 'sales_representative' },
  { label: 'Müşteri Hizmetleri', value: 'customer_service' },
  { label: 'Depo Personeli', value: 'warehouse_staff' },
  { label: 'Güvenlik', value: 'security' },
  { label: 'Temizlik Personeli', value: 'cleaning_staff' },
  { label: 'Stajyer', value: 'intern' },
  { label: 'Diğer', value: 'other' },
];

// Gender options
const GENDER_OPTIONS = [
  { label: 'Erkek', value: 'male' },
  { label: 'Kadın', value: 'female' },
  { label: 'Diğer', value: 'other' },
];

// Marital status options
const MARITAL_STATUS_OPTIONS = [
  { label: 'Bekar', value: 'single' },
  { label: 'Evli', value: 'married' },
  { label: 'Boşanmış', value: 'divorced' },
  { label: 'Dul', value: 'widowed' },
];

export default function NewEmployeeScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<EmployeeFormData>({
    citizenship_no: '',
    first_name: '',
    last_name: '',
    phone_1: '',
    email: '',
    employment_status: 'active',
    status: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback((field: keyof EmployeeFormData, value: any) => {
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
    if (!formData.citizenship_no?.trim()) {
      newErrors.citizenship_no = 'TC Kimlik No zorunludur.';
    } else if (formData.citizenship_no.length > 11) {
      newErrors.citizenship_no = 'TC Kimlik No en fazla 11 karakter olabilir.';
    }

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Ad zorunludur.';
    } else if (formData.first_name.length > 100) {
      newErrors.first_name = 'Ad en fazla 100 karakter olabilir.';
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Soyad zorunludur.';
    } else if (formData.last_name.length > 100) {
      newErrors.last_name = 'Soyad en fazla 100 karakter olabilir.';
    }

    if (!formData.phone_1?.trim()) {
      newErrors.phone_1 = 'Telefon zorunludur.';
    } else if (formData.phone_1.length > 20) {
      newErrors.phone_1 = 'Telefon en fazla 20 karakter olabilir.';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-posta adresi zorunludur.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
    } else if (formData.email.length > 255) {
      newErrors.email = 'E-posta en fazla 255 karakter olabilir.';
    }

    if (!formData.employment_status) {
      newErrors.employment_status = 'İstihdam durumu zorunludur.';
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
      await createEmployee(formData);

      success('Başarılı', 'Çalışan başarıyla oluşturuldu.');
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
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Yeni Çalışan"
        showBackButton
        onBackPress={() => router.back()}
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
          <View style={styles.formCard}>
            {/* Temel Bilgiler */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

            <Input
              label="TC Kimlik No *"
              placeholder="11 haneli TC kimlik numarası"
              value={formData.citizenship_no}
              onChangeText={(text) => handleInputChange('citizenship_no', text)}
              error={errors.citizenship_no}
              keyboardType="numeric"
              maxLength={11}
            />

            <Input
              label="Ad *"
              placeholder="Örn: Ahmet"
              value={formData.first_name}
              onChangeText={(text) => handleInputChange('first_name', text)}
              error={errors.first_name}
              maxLength={100}
            />

            <Input
              label="Soyad *"
              placeholder="Örn: Yılmaz"
              value={formData.last_name}
              onChangeText={(text) => handleInputChange('last_name', text)}
              error={errors.last_name}
              maxLength={100}
            />

            <Input
              label="Personel Kodu"
              placeholder="Opsiyonel"
              value={formData.employee_code}
              onChangeText={(text) => handleInputChange('employee_code', text)}
              error={errors.employee_code}
              maxLength={50}
            />

            <Input
              label="SGK Numarası"
              placeholder="Opsiyonel"
              value={formData.sgk_number}
              onChangeText={(text) => handleInputChange('sgk_number', text)}
              error={errors.sgk_number}
              maxLength={50}
            />

            <SelectInput
              label="Cinsiyet"
              options={GENDER_OPTIONS}
              selectedValue={formData.gender}
              onValueChange={(value) => handleInputChange('gender', value as Gender)}
              error={errors.gender}
              placeholder="Seçiniz"
            />

            <SelectInput
              label="Medeni Durum"
              options={MARITAL_STATUS_OPTIONS}
              selectedValue={formData.marital_status}
              onValueChange={(value) => handleInputChange('marital_status', value as MaritalStatus)}
              error={errors.marital_status}
              placeholder="Seçiniz"
            />

            {/* İletişim Bilgileri */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
              İletişim Bilgileri
            </Text>

            <Input
              label="Telefon *"
              placeholder="Örn: 0555 123 45 67"
              value={formData.phone_1}
              onChangeText={(text) => handleInputChange('phone_1', text)}
              error={errors.phone_1}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <Input
              label="Telefon 2"
              placeholder="Opsiyonel"
              value={formData.phone_2}
              onChangeText={(text) => handleInputChange('phone_2', text)}
              error={errors.phone_2}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <Input
              label="E-posta *"
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={255}
            />

            <Input
              label="Ev Telefonu"
              placeholder="Opsiyonel"
              value={formData.home_phone}
              onChangeText={(text) => handleInputChange('home_phone', text)}
              error={errors.home_phone}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <Input
              label="Acil Durum Telefon 1"
              placeholder="Opsiyonel"
              value={formData.emergency_phone_1}
              onChangeText={(text) => handleInputChange('emergency_phone_1', text)}
              error={errors.emergency_phone_1}
              keyboardType="phone-pad"
              maxLength={20}
            />

            {/* İstihdam Bilgileri */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
              İstihdam Bilgileri
            </Text>

            <SelectInput
              label="İstihdam Durumu *"
              options={EMPLOYMENT_STATUS_OPTIONS}
              selectedValue={formData.employment_status}
              onValueChange={(value) => handleInputChange('employment_status', value as EmploymentStatus)}
              error={errors.employment_status}
            />

            <SelectInput
              label="Sözleşme Tipi"
              options={CONTRACT_TYPE_OPTIONS}
              selectedValue={formData.contract_type}
              onValueChange={(value) => handleInputChange('contract_type', value as ContractType)}
              error={errors.contract_type}
              placeholder="Seçiniz"
            />

            <SelectInput
              label="Pozisyon"
              options={POSITION_OPTIONS}
              selectedValue={formData.position}
              onValueChange={(value) => handleInputChange('position', value as Position)}
              error={errors.position}
              placeholder="Seçiniz"
            />

            {/* Aktif/Pasif */}
            <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.switchContent}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  Aktif Çalışan
                </Text>
                <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
                  Bu çalışan aktif olacak
                </Text>
              </View>
              <Checkbox
                value={formData.status ?? true}
                onValueChange={(val) => handleInputChange('status', val)}
              />
            </View>
          </View>
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
    flexGrow: 1,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    ...Shadows.lg,
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
