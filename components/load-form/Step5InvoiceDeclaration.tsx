/**
 * Step5InvoiceDeclaration - Fatura ve Beyanname Bilgileri
 *
 * Web versiyonu ile %100 uyumlu - Tüm tarih alanları ve kur bilgisi
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, FileText, Receipt } from 'lucide-react-native';
import { Card, Input } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';
import type { LoadFormData } from '@/services/endpoints/loads';
import api from '@/services/api';

interface Step5InvoiceDeclarationProps {
  data: LoadFormData;
  updateFormData: (field: keyof LoadFormData, value: any) => void;
}

// Para birimi seçenekleri - Web ile aynı (currencyTypes)
const CURRENCY_OPTIONS = [
  { label: 'TRY - Türk Lirası', value: 'TRY' },
  { label: 'USD - Amerikan Doları', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - İngiliz Sterlini', value: 'GBP' },
  { label: 'CHF - İsviçre Frangı', value: 'CHF' },
  { label: 'JPY - Japon Yeni', value: 'JPY' },
  { label: 'CNY - Çin Yuanı', value: 'CNY' },
  { label: 'RUB - Rus Rublesi', value: 'RUB' },
  { label: 'SAR - Suudi Arabistan Riyali', value: 'SAR' },
  { label: 'AED - BAE Dirhemi', value: 'AED' },
];

// Teslim şartları seçenekleri - Web ile aynı (17 seçenek)
const DELIVERY_TERMS_OPTIONS = [
  { label: 'CAD - Belgeye Karşı Ödeme', value: 'CAD' },
  { label: 'CAG - Mala Karşı Ödeme', value: 'CAG' },
  { label: 'CFA - Navlun Dahil', value: 'CFA' },
  { label: 'CFR - Navlun Dahil', value: 'CFR' },
  { label: 'CIF - Navlun ve Sigorta Dahil', value: 'CIF' },
  { label: 'CIP - Taşıma ve Sigorta Ödenmiş', value: 'CIP' },
  { label: 'CPT - Taşıma Ödenmiş', value: 'CPT' },
  { label: 'DAF - Sınırda Teslim', value: 'DAF' },
  { label: 'DAP - Yerde Teslim', value: 'DAP' },
  { label: 'DDP - Gümrük Vergisi Ödenmiş Teslim', value: 'DDP' },
  { label: 'DDU - Gümrük Vergisi Ödenmemiş Teslim', value: 'DDU' },
  { label: 'DEQ - Rıhtımda Teslim', value: 'DEQ' },
  { label: 'DES - Gemide Teslim', value: 'DES' },
  { label: 'EXW - Fabrikada Teslim', value: 'EXW' },
  { label: 'FAS - Gemi Doğrultusunda Masrafsız', value: 'FAS' },
  { label: 'FCA - Taşıyıcıya Masrafsız', value: 'FCA' },
  { label: 'FOB - Gemide Masrafsız', value: 'FOB' },
];

export default function Step5InvoiceDeclaration({
  data,
  updateFormData,
}: Step5InvoiceDeclarationProps) {
  const colors = Colors.light;
  const [showDatePicker, setShowDatePicker] = React.useState<string | null>(null);

  // Döviz kuru çekme fonksiyonu - Web ile aynı
  const fetchExchangeRate = async (currencyCode: string) => {
    if (currencyCode === 'TRY') {
      updateFormData('estimated_value_exchange_rate', '1');
      return;
    }

    try {
      const response = await api.get(`/exchange-rates/latest/${currencyCode}`);
      if (response.data.success) {
        const rate = response.data.data.forex_selling;
        updateFormData('estimated_value_exchange_rate', rate?.toString() || '1');
      }
    } catch (error) {
      console.error('Kur çekilirken hata:', error);
      // Hata durumunda sessizce devam et, kullanıcı manuel giriş yapabilir
    }
  };

  // Para birimi değiştiğinde kur çek
  const handleCurrencyChange = (value: string) => {
    updateFormData('estimated_value_currency', value);
    fetchExchangeRate(value);
  };

  const handleDateChange = (field: keyof LoadFormData, date?: Date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      updateFormData(field, formattedDate);
    }
    setShowDatePicker(null);
  };

  const renderDateField = (
    field: keyof LoadFormData,
    label: string,
    value: string | undefined
  ) => (
    <View style={styles.dateFieldContainer}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dateButton, { borderColor: colors.border }]}
        onPress={() => setShowDatePicker(field as string)}
      >
        <Calendar size={14} color={colors.icon} />
        <Text
          style={[
            styles.dateButtonText,
            { color: value ? colors.text : colors.textMuted },
          ]}
        >
          {value || 'Tarih seçiniz'}
        </Text>
      </TouchableOpacity>
      {showDatePicker === field && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleDateChange(field, date)}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Beyanname Bilgileri */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={18} color={Brand.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Beyanname Bilgileri</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Gümrük beyannamesi bilgileri
            </Text>
          </View>
        </View>

        <Input
          label="Beyanname No"
          placeholder="Örn: 2024123456"
          value={data.declaration_no || ''}
          onChangeText={(value) => updateFormData('declaration_no', value)}
        />

        {/* 2'li grid - Web ile aynı */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            {renderDateField(
              'declaration_submission_date',
              'Beyanname Sunulma Tarihi',
              data.declaration_submission_date
            )}
          </View>
          <View style={styles.flex1}>
            {renderDateField(
              'declaration_ready_date',
              'Beyanname Hazır Bildirim Tarihi',
              data.declaration_ready_date
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            {renderDateField(
              'declaration_inspection_date',
              'Beyanname Fiziki Muayene Tarihi',
              data.declaration_inspection_date
            )}
          </View>
          <View style={styles.flex1}>
            {renderDateField(
              'declaration_clearance_date',
              'Beyanname Araç Çıkabilir Tarihi',
              data.declaration_clearance_date
            )}
          </View>
        </View>
      </Card>

      {/* Fatura Bilgileri */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Receipt size={18} color="#3B82F6" />
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Fatura Bilgileri</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Mal faturası ve bedel bilgileri
            </Text>
          </View>
        </View>

        {/* 2'li grid - Web ile aynı */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Mal Fatura No"
              placeholder="Örn: INV-2024-001"
              value={data.cargo_invoice_no || ''}
              onChangeText={(value) => updateFormData('cargo_invoice_no', value)}
            />
          </View>
          <View style={styles.flex1}>
            {renderDateField('cargo_invoice_date', 'Fatura Tarihi', data.cargo_invoice_date)}
          </View>
        </View>

        {/* 3'lü grid - Mal Bedeli, Para Birimi, Döviz Kuru */}
        <View style={styles.row}>
          <View style={styles.flex2}>
            <Input
              label="Mal Bedeli"
              placeholder="0.00"
              value={data.estimated_cargo_value || ''}
              onChangeText={(value) => updateFormData('estimated_cargo_value', value)}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.flex1}>
            <SelectInput
              label="Para Birimi"
              placeholder="TRY"
              value={data.estimated_value_currency || 'TRY'}
              onValueChange={(value: string | number | null) => handleCurrencyChange(value as string)}
              options={CURRENCY_OPTIONS}
            />
          </View>
        </View>

        <Input
          label="Döviz Kuru"
          placeholder="1.0000"
          value={data.estimated_value_exchange_rate || ''}
          onChangeText={(value) => updateFormData('estimated_value_exchange_rate', value)}
          keyboardType="decimal-pad"
        />

        <SelectInput
          label="Teslim Şekli"
          placeholder="Seçiniz"
          value={data.delivery_terms || ''}
          onValueChange={(value) => updateFormData('delivery_terms', value)}
          options={DELIVERY_TERMS_OPTIONS}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  card: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateFieldContainer: {
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  dateButtonText: {
    fontSize: 14,
  },
});
