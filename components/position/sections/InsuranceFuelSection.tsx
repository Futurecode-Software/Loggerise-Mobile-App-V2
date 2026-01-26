/**
 * Insurance & Fuel Section (Editable)
 *
 * Matches web version: resources/js/components/logistics-management/positions/InsuranceFuel.tsx
 * Allows editing insurance status, amount, currency, exchange rate and fuel information.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Shield, Fuel, RefreshCw } from 'lucide-react-native';
import { Card, Button, Input, Select, DateInput } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import {
  Position,
  InsuranceStatus,
  updatePosition,
  CURRENCY_TYPES,
} from '@/services/endpoints/positions';
import { getLatestRate } from '@/services/endpoints/exchange-rates';
import { showToast } from '@/utils/toast';

interface InsuranceFuelSectionProps {
  position: Position;
  onUpdate: () => void;
}

// Insurance status options
const INSURANCE_STATUS_OPTIONS = [
  { value: 'done', label: 'Yapıldı' },
  { value: 'to_be_done', label: 'Yapılacak' },
  { value: 'not_required', label: 'Yapılmayacak' },
];

interface FormData {
  insurance_status: InsuranceStatus;
  insurance_date: string;
  insurance_amount: string;
  insurance_currency: string;
  insurance_exchange_rate: string;
  current_fuel_liters: string;
  fuel_added_liters: string;
  remaining_fuel_liters: string;
  fuel_consumption_percentage: string;
}

export function InsuranceFuelSection({ position, onUpdate }: InsuranceFuelSectionProps) {
  const colors = Colors.light;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    insurance_status: position.insurance_status || 'not_required',
    insurance_date: position.insurance_date
      ? new Date(position.insurance_date).toISOString().split('T')[0]
      : '',
    insurance_amount: position.insurance_amount || '0',
    insurance_currency: position.insurance_currency || 'TRY',
    insurance_exchange_rate: position.insurance_exchange_rate || '1',
    current_fuel_liters: position.current_fuel_liters || '0',
    fuel_added_liters: position.fuel_added_liters || '0',
    remaining_fuel_liters: position.remaining_fuel_liters || '0',
    fuel_consumption_percentage: position.fuel_consumption_percentage || '0',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when position changes
  useEffect(() => {
    setFormData({
      insurance_status: position.insurance_status || 'not_required',
      insurance_date: position.insurance_date
        ? new Date(position.insurance_date).toISOString().split('T')[0]
        : '',
      insurance_amount: position.insurance_amount || '0',
      insurance_currency: position.insurance_currency || 'TRY',
      insurance_exchange_rate: position.insurance_exchange_rate || '1',
      current_fuel_liters: position.current_fuel_liters || '0',
      fuel_added_liters: position.fuel_added_liters || '0',
      remaining_fuel_liters: position.remaining_fuel_liters || '0',
      fuel_consumption_percentage: position.fuel_consumption_percentage || '0',
    });
  }, [position]);

  // Fetch exchange rate when currency changes
  const fetchExchangeRate = async (currencyCode: string) => {
    if (currencyCode === 'TRY') {
      setFormData((prev) => ({ ...prev, insurance_exchange_rate: '1' }));
      return;
    }

    setIsFetchingRate(true);
    try {
      const rateData = await getLatestRate(currencyCode);
      const rate = rateData.forex_selling.toString();
      setFormData((prev) => ({ ...prev, insurance_exchange_rate: rate }));
    } catch (error) {
      console.error('Exchange rate fetch error:', error);
      showToast({
        type: 'error',
        message: `${currencyCode} için kur bulunamadı. Manuel giriş yapabilirsiniz.`,
      });
    } finally {
      setIsFetchingRate(false);
    }
  };

  // Handle currency change
  const handleCurrencyChange = (currency: string | undefined) => {
    if (!currency) return;
    setFormData((prev) => ({ ...prev, insurance_currency: currency }));
    fetchExchangeRate(currency);
  };

  // Reset form to original values
  const handleReset = () => {
    setFormData({
      insurance_status: position.insurance_status || 'not_required',
      insurance_date: position.insurance_date
        ? new Date(position.insurance_date).toISOString().split('T')[0]
        : '',
      insurance_amount: position.insurance_amount || '0',
      insurance_currency: position.insurance_currency || 'TRY',
      insurance_exchange_rate: position.insurance_exchange_rate || '1',
      current_fuel_liters: position.current_fuel_liters || '0',
      fuel_added_liters: position.fuel_added_liters || '0',
      remaining_fuel_liters: position.remaining_fuel_liters || '0',
      fuel_consumption_percentage: position.fuel_consumption_percentage || '0',
    });
    setErrors({});
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setErrors({});

    try {
      await updatePosition(position.id, {
        insurance_status: formData.insurance_status,
        insurance_date: formData.insurance_date || undefined,
        insurance_amount: formData.insurance_amount,
        insurance_currency: formData.insurance_currency,
        insurance_exchange_rate: formData.insurance_exchange_rate,
        current_fuel_liters: formData.current_fuel_liters,
        fuel_added_liters: formData.fuel_added_liters,
        remaining_fuel_liters: formData.remaining_fuel_liters,
        fuel_consumption_percentage: formData.fuel_consumption_percentage,
      });

      showToast({
        type: 'success',
        message: 'Sigorta ve mazot bilgileri başarıyla güncellendi.',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Update error:', error);

      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }

      showToast({
        type: 'error',
        message: 'Bilgiler güncellenirken bir hata oluştu.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if insurance details should be shown
  const showInsuranceDetails =
    formData.insurance_status === 'done' || formData.insurance_status === 'to_be_done';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Insurance Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color={colors.success} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sigorta Bilgileri</Text>
        </View>

        {/* Insurance Status */}
        <Select
          label="Sigorta Durumu"
          data={INSURANCE_STATUS_OPTIONS}
          value={formData.insurance_status}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              insurance_status: (value as InsuranceStatus) || 'not_required',
            }))
          }
          error={errors.insurance_status}
          placeholder="Seçiniz"
        />

        {/* Show additional fields if insurance is done or to_be_done */}
        {showInsuranceDetails && (
          <>
            {/* Insurance Date */}
            <DateInput
              label="Sigorta Tarihi"
              value={formData.insurance_date}
              onChangeDate={(date) => setFormData((prev) => ({ ...prev, insurance_date: date }))}
              error={errors.insurance_date}
              placeholder="Tarih seçiniz"
            />

            {/* Currency */}
            <Select
              label="Sigorta Bedeli Dövizi"
              data={CURRENCY_TYPES}
              value={formData.insurance_currency}
              onValueChange={handleCurrencyChange}
              error={errors.insurance_currency}
              placeholder="Döviz seçiniz"
            />

            {/* Insurance Amount */}
            <Input
              label="Sigorta Bedeli"
              value={formData.insurance_amount}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  insurance_amount: text.replace(/[^0-9.,]/g, ''),
                }))
              }
              keyboardType="decimal-pad"
              error={errors.insurance_amount}
              placeholder="0.00"
            />

            {/* Exchange Rate */}
            <View style={styles.exchangeRateContainer}>
              <View style={styles.exchangeRateInput}>
                <Input
                  label="Sigorta Bedeli Döviz Kuru"
                  value={formData.insurance_exchange_rate}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      insurance_exchange_rate: text.replace(/[^0-9.,]/g, ''),
                    }))
                  }
                  keyboardType="decimal-pad"
                  error={errors.insurance_exchange_rate}
                  placeholder="1.0000"
                  rightIcon={
                    isFetchingRate ? (
                      <RefreshCw size={16} color={colors.primary} />
                    ) : undefined
                  }
                />
              </View>
            </View>
          </>
        )}
      </Card>

      {/* Fuel Section */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Fuel size={20} color={colors.warning} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mazot Bilgileri</Text>
        </View>

        {/* Current Fuel */}
        <Input
          label="Mevcut Mazot (lt)"
          value={formData.current_fuel_liters}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              current_fuel_liters: text.replace(/[^0-9.,]/g, ''),
            }))
          }
          keyboardType="decimal-pad"
          error={errors.current_fuel_liters}
          placeholder="0.00"
        />

        {/* Fuel Added */}
        <Input
          label="Seferde Alınan Mazot (lt)"
          value={formData.fuel_added_liters}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              fuel_added_liters: text.replace(/[^0-9.,]/g, ''),
            }))
          }
          keyboardType="decimal-pad"
          error={errors.fuel_added_liters}
          placeholder="0.00"
        />

        {/* Remaining Fuel */}
        <Input
          label="Kalan Mazot (lt)"
          value={formData.remaining_fuel_liters}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              remaining_fuel_liters: text.replace(/[^0-9.,]/g, ''),
            }))
          }
          keyboardType="decimal-pad"
          error={errors.remaining_fuel_liters}
          placeholder="0.00"
        />

        {/* Fuel Consumption Percentage */}
        <Input
          label="Mazot Sarfiyat Yüzdesi (%)"
          value={formData.fuel_consumption_percentage}
          onChangeText={(text) =>
            setFormData((prev) => ({
              ...prev,
              fuel_consumption_percentage: text.replace(/[^0-9.,]/g, ''),
            }))
          }
          keyboardType="decimal-pad"
          error={errors.fuel_consumption_percentage}
          placeholder="0.00"
        />
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Değişiklikleri İptal Et"
          onPress={handleReset}
          variant="outline"
          disabled={isSaving}
          style={styles.cancelButton}
        />
        <Button
          title={isSaving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
          onPress={handleSave}
          variant="primary"
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    fontWeight: '600',
  },
  exchangeRateContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  exchangeRateInput: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});
