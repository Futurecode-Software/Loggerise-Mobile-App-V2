/**
 * Quote Create - Step 1: Temel Bilgiler
 *
 * Müşteri, tarihler, transport bilgileri
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, User, Truck } from 'lucide-react-native';
import { Input, DateInput, Card, AutocompleteInput, SelectInput } from '@/components/ui';
import type { AutocompleteOption } from '@/components/ui';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
import { NewQuoteFormData, Direction } from '@/services/endpoints/quotes-new-format';
import { getContacts } from '@/services/endpoints/contacts';

interface QuoteCreateBasicInfoScreenProps {
  data: Partial<NewQuoteFormData>;
  onChange: (updates: Partial<NewQuoteFormData>) => void;
  onNext: () => void;
}

const DIRECTION_OPTIONS = [
  { label: 'İthalat', value: 'import' },
  { label: 'İhracat', value: 'export' },
];

const VEHICLE_TYPE_OPTIONS = [
  { label: 'Tır', value: 'Tır' },
  { label: 'Kamyon', value: 'Kamyon' },
  { label: 'Kamyonet', value: 'Kamyonet' },
  { label: 'Dorse', value: 'Dorse' },
  { label: 'Konteyner', value: 'Konteyner' },
];

const LOADING_TYPE_OPTIONS = [
  { label: 'FTL (Tam Yük)', value: 'FTL' },
  { label: 'LTL (Parsiyel)', value: 'LTL' },
  { label: 'Konteyner', value: 'Konteyner' },
];

const TRANSPORT_SPEED_OPTIONS = [
  { label: 'Ekspres', value: 'Ekspres' },
  { label: 'Standart', value: 'Standart' },
  { label: 'Ekonomik', value: 'Ekonomik' },
];

export function QuoteCreateBasicInfoScreen({
  data,
  onChange,
  onNext,
}: QuoteCreateBasicInfoScreenProps) {
  const colors = Colors.light;

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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <SelectInput
                label="Araç Tipi"
                placeholder="Seçiniz..."
                value={data.vehicle_type}
                onValueChange={(value) => onChange({ vehicle_type: value })}
                options={VEHICLE_TYPE_OPTIONS}
              />
            </View>

            <View style={styles.halfWidth}>
              <SelectInput
                label="Yükleme Tipi"
                placeholder="Seçiniz..."
                value={data.loading_type}
                onValueChange={(value) => onChange({ loading_type: value })}
                options={LOADING_TYPE_OPTIONS}
              />
            </View>
          </View>

          <SelectInput
            label="Taşıma Hızı"
            placeholder="Seçiniz..."
            value={data.transport_speed}
            onValueChange={(value) => onChange({ transport_speed: value })}
            options={TRANSPORT_SPEED_OPTIONS}
          />
        </Card>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
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
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
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
