/**
 * Quote Create - Step 1: Temel Bilgiler
 *
 * Müşteri, tarihler, transport bilgileri
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, User, Truck } from 'lucide-react-native';
import { DateInput, Card, AutocompleteInput, SelectInput } from '@/components/ui';
import type { AutocompleteOption } from '@/components/ui';
import { Spacing, Brand } from '@/constants/theme';
import { NewQuoteFormData, Direction } from '@/services/endpoints/quotes-new-format';
import { getContacts } from '@/services/endpoints/contacts';

interface QuoteCreateBasicInfoScreenProps {
  data: Partial<NewQuoteFormData>;
  onChange: (updates: Partial<NewQuoteFormData>) => void;
  onNext: () => void;
}

const DIRECTION_OPTIONS = [
  { label: 'İhracat (IHR)', value: 'export' },
  { label: 'İthalat (ITH)', value: 'import' },
];

const VEHICLE_TYPE_OPTIONS = [
  { label: 'Tenteli', value: 'tenteli' },
  { label: 'Mega Tenteli', value: 'mega_tenteli' },
  { label: 'Maxi Tenteli', value: 'maxi_tenteli' },
  { label: 'Optima Tenteli', value: 'optima_tenteli' },
  { label: 'Jumbo Tenteli', value: 'jumbo_tenteli' },
  { label: 'Jumbo Düz', value: 'jumbo_duz' },
  { label: 'Düz', value: 'duz' },
  { label: 'Kapalı Kasa', value: 'kapali_kasa' },
  { label: 'Açık Kasa', value: 'acik_kasa' },
  { label: 'Mega Askılı', value: 'mega_askili' },
  { label: 'Frigorifik', value: 'frigorifik' },
  { label: 'Lowbed', value: 'lowbed' },
  { label: 'Damper', value: 'damper' },
  { label: 'Tır', value: 'tir' },
  { label: 'Kamyon', value: 'kamyon' },
  { label: 'Kamyonet', value: 'kamyonet' },
];

const LOADING_TYPE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Karışık', value: 'karisik' },
];

const LOAD_TYPE_OPTIONS = [
  { label: 'Komple', value: 'full' },
  { label: 'Parsiyel', value: 'partial' },
];

const TRANSPORT_SPEED_OPTIONS = [
  { label: 'Expres', value: 'expres' },
  { label: 'Normal', value: 'normal' },
];

export function QuoteCreateBasicInfoScreen({
  data,
  onChange,
  onNext,
}: QuoteCreateBasicInfoScreenProps) {
  // Load customer options
  const loadCustomerOptions = useCallback(
    async (searchQuery: string): Promise<AutocompleteOption[]> => {
      try {
        const response = await getContacts({
          search: searchQuery,
          type: 'customer',
          include_potential: true,
          is_active: true,
          per_page: 20,
        });

        const contacts = response.contacts || [];

        return contacts.map((contact) => ({
          label: contact.name,
          value: contact.id,
          subtitle: contact.code ? `Kod: ${contact.code}` : undefined,
        }));
      } catch (error) {
        console.error('[BasicInfo] Load customers error:', error);
        return [];
      }
    },
    []
  );

  return (
    <>
      {/* Müşteri Bilgileri */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={Brand.primary} />
            <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
          </View>

          <AutocompleteInput
            label="Müşteri *"
            placeholder="Müşteri ara ve seçiniz..."
            value={data.customer_id}
            onValueChange={(value, option) => {
              // Müşteri ID'sini ve bilgilerini kaydet
              onChange({
                customer_id: Number(value),
                customer: option
                  ? {
                      id: Number(value),
                      name: option.label,
                      short_name: option.label,
                    }
                  : undefined,
              });
            }}
            loadOptions={loadCustomerOptions}
            minSearchLength={2}
            debounceMs={300}
          />
        </Card>

        {/* Tarihler */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Brand.primary} />
            <Text style={styles.sectionTitle}>Tarihler</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <DateInput
                label="Teklif Tarihi *"
                value={data.quote_date || ''}
                onChangeText={(value) => onChange({ quote_date: value })}
                required
              />
            </View>

            <View style={styles.halfWidth}>
              <DateInput
                label="Geçerlilik Tarihi *"
                value={data.valid_until || ''}
                onChangeText={(value) => onChange({ valid_until: value })}
                required
                minimumDate={data.quote_date}
              />
            </View>
          </View>
        </Card>

        {/* Transport Bilgileri */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Truck size={20} color={Brand.primary} />
            <Text style={styles.sectionTitle}>Taşıma Bilgileri</Text>
          </View>

          <SelectInput
            label="Yük Yönü"
            placeholder="Seçiniz..."
            value={data.direction}
            onValueChange={(value) => onChange({ direction: value as Direction })}
            options={DIRECTION_OPTIONS}
          />

          <SelectInput
            label="Araç Tipi"
            placeholder="Seçiniz..."
            value={data.vehicle_type}
            onValueChange={(value) => onChange({ vehicle_type: value })}
            options={VEHICLE_TYPE_OPTIONS}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <SelectInput
                label="Yükleme Tipi *"
                placeholder="Seçiniz..."
                value={data.loading_type}
                onValueChange={(value) => onChange({ loading_type: value })}
                options={LOADING_TYPE_OPTIONS}
              />
            </View>

            <View style={styles.halfWidth}>
              <SelectInput
                label="Yük Tipi"
                placeholder="Seçiniz..."
                value={data.load_type}
                onValueChange={(value) => onChange({ load_type: value })}
                options={LOAD_TYPE_OPTIONS}
              />
            </View>
          </View>

          <SelectInput
            label="Yük Taşıma Hızı *"
            placeholder="Seçiniz..."
            value={data.transport_speed}
            onValueChange={(value) => onChange({ transport_speed: value })}
            options={TRANSPORT_SPEED_OPTIONS}
          />
        </Card>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Sonraki Adım</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.xs,
  },
  halfWidth: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  bottomActions: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
