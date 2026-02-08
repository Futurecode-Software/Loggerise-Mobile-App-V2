/**
 * Step6CustomsDocuments - Gümrük ve Belgeler
 *
 * Web versiyonu ile %100 uyumlu - GTIP API'den arama, belge durumları
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileCheck, FileWarning } from 'lucide-react-native';
import { Card, Input, SearchableSelect } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import type { LoadFormData } from '@/services/endpoints/loads';
import api from '@/services/api';

interface SelectOption {
  label: string;
  value: string;
  subtitle?: string;
}

interface Step6CustomsDocumentsProps {
  data: LoadFormData;
  updateFormData: (field: keyof LoadFormData, value: any) => void;
}

// Web ile aynı belge durumu seçenekleri (sadece 2 seçenek)
const DOCUMENT_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Orijinal', value: 'original' },
  { label: 'Kopya', value: 'copy' },
];

// Web ile aynı belge alanları
const DOCUMENT_FIELDS = [
  { id: 'invoice_document', label: 'Fatura Belge Durumu' },
  { id: 'atr_document', label: 'ATR Belge Durumu' },
  { id: 'packing_list_document', label: 'Çeki Listesi Belge Durumu' },
  { id: 'origin_certificate_document', label: 'Menşei Belgesi Durumu' },
  { id: 'health_certificate_document', label: 'Sağlık Sertifikası Durumu' },
  { id: 'eur1_document', label: 'EUR-1 Belge Durumu' },
  { id: 't1_t2_document', label: 'T1/T2 Belge Durumu' },
];

// GTIP kodu arama API fonksiyonu
const loadGtipCodes = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/gtip-codes/search', {
      params: { search: searchQuery },
    });
    return (response.data.data || []).map((item: any) => ({
      value: item.value || item.code,
      label: item.label || `${item.code} - ${item.description || ''}`,
      subtitle: item.description,
    }));
  } catch (error) {
    if (__DEV__) console.error('Error loading GTIP codes:', error);
    return [];
  }
};

export default function Step6CustomsDocuments({
  data,
  updateFormData,
}: Step6CustomsDocumentsProps) {
  const colors = Colors.light;

  // GTIP seçildiğinde
  const handleGtipChange = (value: string | number | null) => {
    updateFormData('gtip_hs_code', (value as string) || '');
  };

  return (
    <View style={styles.container}>
      {/* Gümrük Bilgileri */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <FileWarning size={18} color={Brand.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Gümrük Bilgileri</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              GTIP, ATR ve rejim bilgileri
            </Text>
          </View>
        </View>

        {/* GTIP - HS Kodu - API'den arama */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text }]}>GTIP - HS Kodu</Text>
          <SearchableSelect
            placeholder="GTIP - HS Kodu seçiniz..."
            value={data.gtip_hs_code || undefined}
            onValueChange={handleGtipChange}
            loadOptions={loadGtipCodes}
            displayValue={data.gtip_hs_code || undefined}
          />
        </View>

        {/* ATR No ve Rejim No */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="ATR No"
              placeholder="ATR numarasını girin"
              value={data.atr_no || ''}
              onChangeText={(value) => updateFormData('atr_no', value)}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Rejim No"
              placeholder="Rejim numarasını girin"
              value={data.regime_no || ''}
              onChangeText={(value) => updateFormData('regime_no', value)}
            />
          </View>
        </View>
      </Card>

      {/* Belge Durumları */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <FileCheck size={18} color="#3B82F6" />
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Belge Durumları</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Ticari belgelerin orijinal/kopya durumu
            </Text>
          </View>
        </View>

        {/* Belge durumu seçicileri - 2'li grid */}
        <View style={styles.documentGrid}>
          {DOCUMENT_FIELDS.map((field) => (
            <View key={field.id} style={styles.documentItem}>
              <SelectInput
                label={field.label}
                placeholder="Seçiniz"
                value={(data as any)[field.id] || ''}
                onValueChange={(value) => updateFormData(field.id as keyof LoadFormData, value)}
                options={DOCUMENT_STATUS_OPTIONS}
              />
            </View>
          ))}
        </View>
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
  fieldGroup: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  documentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  documentItem: {
    width: '48%',
  },
});
