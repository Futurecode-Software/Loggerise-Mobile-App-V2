/**
 * New Tire Screen
 *
 * Create new tire (lastik deposu).
 * Matches backend Mobile API endpoint: POST /api/v1/mobile/filo-yonetimi/lastik-deposu
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
import { Input, Card } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { DateInput } from '@/components/ui/date-input';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import api, { getErrorMessage, getValidationErrors } from '@/services/api';

// Tire type options
const TIRE_TYPE_OPTIONS = [
  { label: 'Yaz Lastiği', value: 'summer' },
  { label: 'Kış Lastiği', value: 'winter' },
  { label: 'Dört Mevsim', value: 'all_season' },
];

// Condition options
const CONDITION_OPTIONS = [
  { label: 'Yeni', value: 'new' },
  { label: 'İyi', value: 'good' },
  { label: 'Orta', value: 'fair' },
  { label: 'Kötü', value: 'poor' },
  { label: 'Eskimiş', value: 'worn_out' },
];

export default function NewTireScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<{
    serial_number: string;
    brand: string;
    model: string;
    size: string;
    dot_code?: string;
    tire_type: string;
    tread_depth?: string;
    purchase_date?: string;
    purchase_price?: string;
    supplier?: string;
    condition: string;
    warehouse_location?: string;
    notes?: string;
  }>({
    serial_number: '',
    brand: '',
    model: '',
    size: '',
    tire_type: 'summer',
    condition: 'new',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback((field: string, value: any) => {
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

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.serial_number?.trim()) {
      newErrors.serial_number = 'Seri numarası zorunludur.';
    }

    if (!formData.brand?.trim()) {
      newErrors.brand = 'Marka zorunludur.';
    }

    if (!formData.model?.trim()) {
      newErrors.model = 'Model zorunludur.';
    }

    if (!formData.size?.trim()) {
      newErrors.size = 'Ebat zorunludur.';
    }

    if (!formData.tire_type) {
      newErrors.tire_type = 'Lastik tipi zorunludur.';
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
      // Prepare data - convert string numbers to actual numbers
      const submitData: any = { ...formData };
      if (submitData.tread_depth) {
        submitData.tread_depth = parseFloat(submitData.tread_depth);
      }
      if (submitData.purchase_price) {
        submitData.purchase_price = parseFloat(submitData.purchase_price);
      }

      const response = await api.post('/filo-yonetimi/lastik-deposu', submitData);

      success('Başarılı', response.data.message || 'Lastik başarıyla oluşturuldu.');
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

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Yeni Lastik"
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
          <View style={styles.formWrapper}>
            <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

            <Input
              label="Seri Numarası *"
              placeholder="Örn: TIRE-2024-001"
              value={formData.serial_number}
              onChangeText={(text) => handleInputChange('serial_number', text)}
              error={errors.serial_number}
              maxLength={255}
            />

            <Input
              label="Marka *"
              placeholder="Örn: Michelin, Bridgestone"
              value={formData.brand}
              onChangeText={(text) => handleInputChange('brand', text)}
              error={errors.brand}
              maxLength={255}
            />

            <Input
              label="Model *"
              placeholder="Örn: XZE2+"
              value={formData.model}
              onChangeText={(text) => handleInputChange('model', text)}
              error={errors.model}
              maxLength={255}
            />

            <Input
              label="Ebat *"
              placeholder="Örn: 315/80 R 22.5"
              value={formData.size}
              onChangeText={(text) => handleInputChange('size', text)}
              error={errors.size}
              maxLength={255}
            />

            <SelectInput
              label="Lastik Tipi *"
              options={TIRE_TYPE_OPTIONS}
              selectedValue={formData.tire_type}
              onValueChange={(val) => handleInputChange('tire_type', val)}
              error={errors.tire_type}
            />

            <SelectInput
              label="Durum"
              options={CONDITION_OPTIONS}
              selectedValue={formData.condition}
              onValueChange={(val) => handleInputChange('condition', val)}
              error={errors.condition}
            />

            <Input
              label="Diş Derinliği (mm)"
              placeholder="Örn: 15.5"
              value={formData.tread_depth || ''}
              onChangeText={(text) => handleInputChange('tread_depth', text)}
              error={errors.tread_depth}
              keyboardType="decimal-pad"
            />

            <Input
              label="DOT Kodu"
              placeholder="Üretim kodu (opsiyonel)"
              value={formData.dot_code || ''}
              onChangeText={(text) => handleInputChange('dot_code', text)}
              error={errors.dot_code}
              maxLength={255}
            />
            </Card>

            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Satın Alma Bilgileri</Text>

            <DateInput
              label="Satın Alma Tarihi"
              value={formData.purchase_date || ''}
              onChangeDate={(date) => handleInputChange('purchase_date', date)}
              error={errors.purchase_date}
            />

            <Input
              label="Satın Alma Fiyatı (TL)"
              placeholder="Örn: 5000"
              value={formData.purchase_price || ''}
              onChangeText={(text) => handleInputChange('purchase_price', text)}
              error={errors.purchase_price}
              keyboardType="decimal-pad"
            />

            <Input
              label="Tedarikçi"
              placeholder="Tedarikçi adı (opsiyonel)"
              value={formData.supplier || ''}
              onChangeText={(text) => handleInputChange('supplier', text)}
              error={errors.supplier}
              maxLength={255}
            />
            </Card>

            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Depo Bilgileri</Text>

            <Input
              label="Depo Konumu"
              placeholder="Örn: Raf A1, Bölüm 3"
              value={formData.warehouse_location || ''}
              onChangeText={(text) => handleInputChange('warehouse_location', text)}
              error={errors.warehouse_location}
              maxLength={255}
            />

            <Input
              label="Notlar"
              placeholder="İsteğe bağlı notlar"
              value={formData.notes || ''}
              onChangeText={(text) => handleInputChange('notes', text)}
              error={errors.notes}
              multiline
              numberOfLines={3}
              maxLength={1000}
            />
            </Card>
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
    padding: Spacing.lg,
  },
  formWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
