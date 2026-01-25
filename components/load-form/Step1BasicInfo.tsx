/**
 * Step1BasicInfo - Temel Bilgiler
 *
 * Web versiyonu ile %100 uyumlu - Müşteri, Gönderici, Üretici, Alıcı firma seçimleri
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Card, Checkbox, SearchableSelect } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import type { LoadFormData } from '@/services/endpoints/loads';
import api from '@/services/api';

interface SelectOption {
  label: string;
  value: number;
  subtitle?: string;
}

interface Step1BasicInfoProps {
  data: LoadFormData;
  updateFormData: (field: keyof LoadFormData, value: any) => void;
  errors?: Record<string, string>;
  // Firma seçim state'leri
  selectedCustomer?: SelectOption | null;
  selectedSender?: SelectOption | null;
  selectedManufacturer?: SelectOption | null;
  selectedReceiver?: SelectOption | null;
  onCustomerChange?: (option: SelectOption | null) => void;
  onSenderChange?: (option: SelectOption | null) => void;
  onManufacturerChange?: (option: SelectOption | null) => void;
  onReceiverChange?: (option: SelectOption | null) => void;
  // Firma ekleme
  onAddCustomerClick?: () => void;
  onAddSenderClick?: () => void;
  onAddManufacturerClick?: () => void;
  onAddReceiverClick?: () => void;
  // Direction kilitleme
  isDirectionLocked?: boolean;
}

// Web ile aynı araç tipi seçenekleri
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

// Yükleme tipi seçenekleri
const LOADING_TYPE_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'Karışık', value: 'karisik' },
];

// Yük tipi seçenekleri
const LOAD_TYPE_OPTIONS = [
  { label: 'Komple', value: 'full' },
  { label: 'Parsiyel', value: 'partial' },
];

// Taşıma hızı seçenekleri
const TRANSPORT_SPEED_OPTIONS = [
  { label: 'Expres', value: 'expres' },
  { label: 'Normal', value: 'normal' },
];

// Yük sınıfı seçenekleri
const CARGO_CLASS_OPTIONS = [
  { label: 'Genel Kargo', value: 'general' },
  { label: 'Konteyner', value: 'container' },
  { label: 'Tehlikeli Madde', value: 'hazardous' },
  { label: 'Soğuk Zincir', value: 'cold_chain' },
  { label: 'Proje Kargo', value: 'project' },
];

// Firma arama API fonksiyonu
const loadContacts = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/contacts', {
      params: { search: searchQuery, include_potential: true, per_page: 20 },
    });
    // API response: { data: { contacts: [...], pagination: {...} } }
    const contacts = response.data.data?.contacts || response.data.data || [];
    return contacts.map((contact: any) => ({
      value: contact.id || contact.value,
      label: contact.name || contact.label,
      subtitle: contact.code || contact.short_name,
    }));
  } catch (error) {
    console.error('Error loading contacts:', error);
    return [];
  }
};

export default function Step1BasicInfo({
  data,
  updateFormData,
  errors = {},
  selectedCustomer,
  selectedSender,
  selectedManufacturer,
  selectedReceiver,
  onCustomerChange,
  onSenderChange,
  onManufacturerChange,
  onReceiverChange,
  onAddCustomerClick,
  onAddSenderClick,
  onAddManufacturerClick,
  onAddReceiverClick,
  isDirectionLocked = false,
}: Step1BasicInfoProps) {
  const colors = Colors.light;

  return (
    <View style={styles.container}>
      {/* Temel Bilgiler Kartı */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Temel Bilgiler</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Yük hakkında temel bilgileri girin
        </Text>

        {/* Müşteri Seçimi */}
        {onCustomerChange && (
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>
                Müşteri <Text style={{ color: colors.danger }}>*</Text>
              </Text>
            </View>
            <View style={styles.selectWithAddButton}>
              <View style={styles.selectFlex}>
                <SearchableSelect
                  placeholder="Müşteri seçiniz..."
                  value={selectedCustomer?.value}
                  selectedOption={selectedCustomer ? {
                    label: selectedCustomer.label,
                    value: selectedCustomer.value,
                    subtitle: selectedCustomer.subtitle,
                  } : null}
                  onValueChange={(value) => {
                    if (!value) {
                      onCustomerChange(null);
                      updateFormData('customer_id', undefined);
                    }
                  }}
                  onSelect={(option) => {
                    if (option) {
                      onCustomerChange({
                        label: option.label,
                        value: option.value as number,
                        subtitle: option.subtitle,
                      });
                      updateFormData('customer_id', option.value);
                    }
                  }}
                  loadOptions={loadContacts}
                  renderOption={(option) => (
                    <View>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                      {option.subtitle && (
                        <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>
                          {option.subtitle}
                        </Text>
                      )}
                    </View>
                  )}
                />
              </View>
              {onAddCustomerClick && (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.border }]}
                  onPress={onAddCustomerClick}
                >
                  <Plus size={20} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
            {errors.customer_id && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.customer_id}</Text>
            )}
          </View>
        )}

        {/* Yük Yönü */}
        <SelectInput
          label="Yük Yönü *"
          placeholder="Yük yönü seçiniz"
          value={data.direction || ''}
          onValueChange={(value) => updateFormData('direction', value)}
          options={[
            { label: 'İhracat (IHR)', value: 'export' },
            { label: 'İthalat (ITH)', value: 'import' },
          ]}
          disabled={isDirectionLocked}
        />
        {isDirectionLocked && (
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Yük yönü bu sayfadan otomatik belirlendi
          </Text>
        )}
        {errors.direction && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{errors.direction}</Text>
        )}

        {/* Araç Tipi */}
        <SelectInput
          label="Araç Tipi"
          placeholder="Araç tipi seçiniz"
          value={data.vehicle_type || ''}
          onValueChange={(value) => updateFormData('vehicle_type', value)}
          options={VEHICLE_TYPE_OPTIONS}
        />

        {/* Yükleme Tipi */}
        <SelectInput
          label="Yükleme Tipi *"
          placeholder="Seçiniz"
          value={data.loading_type || ''}
          onValueChange={(value) => updateFormData('loading_type', value)}
          options={LOADING_TYPE_OPTIONS}
        />
        {errors.loading_type && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{errors.loading_type}</Text>
        )}

        {/* Yük Tipi */}
        <SelectInput
          label="Yük Tipi (Komple/Parsiyel)"
          placeholder="Seçiniz"
          value={data.load_type || ''}
          onValueChange={(value) => updateFormData('load_type', value)}
          options={LOAD_TYPE_OPTIONS}
        />

        {/* Yük Taşıma Hızı */}
        <SelectInput
          label="Yük Taşıma Hızı *"
          placeholder="Seçiniz"
          value={data.transport_speed || ''}
          onValueChange={(value) => updateFormData('transport_speed', value)}
          options={TRANSPORT_SPEED_OPTIONS}
        />
        {errors.transport_speed && (
          <Text style={[styles.errorText, { color: colors.danger }]}>{errors.transport_speed}</Text>
        )}

        {/* Yük Sınıfı */}
        <SelectInput
          label="Yük Sınıfı"
          placeholder="Seçiniz"
          value={data.cargo_class || ''}
          onValueChange={(value) => updateFormData('cargo_class', value)}
          options={CARGO_CLASS_OPTIONS}
        />

        {/* Yük Havuzunda Yayınla */}
        <View style={styles.checkboxRow}>
          <Checkbox
            checked={data.publish_to_pool || false}
            onCheckedChange={(checked) => updateFormData('publish_to_pool', checked)}
          />
          <Text style={[styles.checkboxLabel, { color: colors.text }]}>Yük Havuzunda yayınla</Text>
        </View>
      </Card>

      {/* Firma Bilgileri Kartı */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Firma Bilgileri</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          Gönderici, üretici ve alıcı firma bilgileri
        </Text>

        {/* Gönderici Firma */}
        {onSenderChange && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Gönderici Firma</Text>
            <View style={styles.selectWithAddButton}>
              <View style={styles.selectFlex}>
                <SearchableSelect
                  placeholder="Gönderici firma seçiniz..."
                  value={selectedSender?.value}
                  selectedOption={selectedSender ? {
                    label: selectedSender.label,
                    value: selectedSender.value,
                    subtitle: selectedSender.subtitle,
                  } : null}
                  onValueChange={(value) => {
                    if (!value) {
                      onSenderChange(null);
                      updateFormData('sender_company_id', undefined);
                    }
                  }}
                  onSelect={(option) => {
                    if (option) {
                      onSenderChange({
                        label: option.label,
                        value: option.value as number,
                        subtitle: option.subtitle,
                      });
                      updateFormData('sender_company_id', option.value);
                    }
                  }}
                  loadOptions={loadContacts}
                />
              </View>
              {onAddSenderClick && (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.border }]}
                  onPress={onAddSenderClick}
                >
                  <Plus size={20} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Üretici Firma */}
        {onManufacturerChange && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Üretici Firma</Text>
            <View style={styles.selectWithAddButton}>
              <View style={styles.selectFlex}>
                <SearchableSelect
                  placeholder="Üretici firma seçiniz..."
                  value={selectedManufacturer?.value}
                  selectedOption={selectedManufacturer ? {
                    label: selectedManufacturer.label,
                    value: selectedManufacturer.value,
                    subtitle: selectedManufacturer.subtitle,
                  } : null}
                  onValueChange={(value) => {
                    if (!value) {
                      onManufacturerChange(null);
                      updateFormData('manufacturer_company_id', undefined);
                    }
                  }}
                  onSelect={(option) => {
                    if (option) {
                      onManufacturerChange({
                        label: option.label,
                        value: option.value as number,
                        subtitle: option.subtitle,
                      });
                      updateFormData('manufacturer_company_id', option.value);
                    }
                  }}
                  loadOptions={loadContacts}
                />
              </View>
              {onAddManufacturerClick && (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.border }]}
                  onPress={onAddManufacturerClick}
                >
                  <Plus size={20} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Alıcı Firma */}
        {onReceiverChange && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Alıcı Firma</Text>
            <View style={styles.selectWithAddButton}>
              <View style={styles.selectFlex}>
                <SearchableSelect
                  placeholder="Alıcı firma seçiniz..."
                  value={selectedReceiver?.value}
                  selectedOption={selectedReceiver ? {
                    label: selectedReceiver.label,
                    value: selectedReceiver.value,
                    subtitle: selectedReceiver.subtitle,
                  } : null}
                  onValueChange={(value) => {
                    if (!value) {
                      onReceiverChange(null);
                      updateFormData('receiver_company_id', undefined);
                    }
                  }}
                  onSelect={(option) => {
                    if (option) {
                      onReceiverChange({
                        label: option.label,
                        value: option.value as number,
                        subtitle: option.subtitle,
                      });
                      updateFormData('receiver_company_id', option.value);
                    }
                  }}
                  loadOptions={loadContacts}
                />
              </View>
              {onAddReceiverClick && (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.border }]}
                  onPress={onAddReceiverClick}
                >
                  <Plus size={20} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectWithAddButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  selectFlex: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 14,
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 11,
    marginTop: -4,
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: 11,
    marginTop: 2,
  },
});
