/**
 * Step1BasicInfo - Temel Bilgiler
 *
 * Web versiyonu ile %100 uyumlu - SearchableSelectModal ile modernize edildi
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, ChevronDown } from 'lucide-react-native';
import { Card, Checkbox, SearchableSelect } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { SearchableSelectModal, SearchableSelectModalRef, SelectOption } from '@/components/modals/SearchableSelectModal';
import type { LoadFormData } from '@/services/endpoints/loads';
import api from '@/services/api';

interface SelectOptionLocal {
  label: string;
  value: number;
  subtitle?: string;
}

interface Step1BasicInfoProps {
  data: LoadFormData;
  updateFormData: (field: keyof LoadFormData, value: any) => void;
  errors?: Record<string, string>;
  // Firma seçim state'leri
  selectedCustomer?: SelectOptionLocal | null;
  selectedSender?: SelectOptionLocal | null;
  selectedManufacturer?: SelectOptionLocal | null;
  selectedReceiver?: SelectOptionLocal | null;
  onCustomerChange?: (option: SelectOptionLocal | null) => void;
  onSenderChange?: (option: SelectOptionLocal | null) => void;
  onManufacturerChange?: (option: SelectOptionLocal | null) => void;
  onReceiverChange?: (option: SelectOptionLocal | null) => void;
  // Firma ekleme
  onAddCustomerClick?: () => void;
  onAddSenderClick?: () => void;
  onAddManufacturerClick?: () => void;
  onAddReceiverClick?: () => void;
  // Direction kilitleme
  isDirectionLocked?: boolean;
}

// Yük Yönü seçenekleri
const DIRECTION_OPTIONS: SelectOption[] = [
  { label: 'İhracat (IHR)', value: 'export' },
  { label: 'İthalat (ITH)', value: 'import' },
];

// Araç tipi seçenekleri
const VEHICLE_TYPE_OPTIONS: SelectOption[] = [
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
const LOADING_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Karışık', value: 'karisik' },
];

// Yük tipi seçenekleri
const LOAD_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Komple', value: 'full' },
  { label: 'Parsiyel', value: 'partial' },
];

// Taşıma hızı seçenekleri
const TRANSPORT_SPEED_OPTIONS: SelectOption[] = [
  { label: 'Expres', value: 'expres' },
  { label: 'Normal', value: 'normal' },
];

// Yük sınıfı seçenekleri
const CARGO_CLASS_OPTIONS: SelectOption[] = [
  { label: 'Genel Kargo', value: 'general' },
  { label: 'Konteyner', value: 'container' },
  { label: 'Tehlikeli Madde', value: 'hazardous' },
  { label: 'Soğuk Zincir', value: 'cold_chain' },
  { label: 'Proje Kargo', value: 'project' },
];

// Firma arama API fonksiyonu
const loadContacts = async (searchQuery: string): Promise<SelectOptionLocal[]> => {
  try {
    const response = await api.get('/contacts', {
      params: { search: searchQuery, include_potential: true, per_page: 20 },
    });
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

  // Modal refs
  const directionModalRef = useRef<SearchableSelectModalRef>(null);
  const vehicleTypeModalRef = useRef<SearchableSelectModalRef>(null);
  const loadingTypeModalRef = useRef<SearchableSelectModalRef>(null);
  const loadTypeModalRef = useRef<SearchableSelectModalRef>(null);
  const transportSpeedModalRef = useRef<SearchableSelectModalRef>(null);
  const cargoClassModalRef = useRef<SearchableSelectModalRef>(null);

  // Get selected label
  const getSelectedLabel = (value: string | undefined, options: SelectOption[]): string => {
    if (!value) return '';
    const option = options.find((opt) => opt.value === value);
    return option?.label || '';
  };

  // Render select button
  const renderSelectButton = (
    label: string,
    value: string | undefined,
    options: SelectOption[],
    onPress: () => void,
    required = false,
    disabled = false,
    error?: string
  ) => {
    const selectedLabel = getSelectedLabel(value, options);

    return (
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
        </Text>
        <TouchableOpacity
          style={[
            styles.selectButton,
            { backgroundColor: colors.card, borderColor: error ? colors.danger : colors.border },
            disabled && styles.selectButtonDisabled,
          ]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectButtonText,
              { color: selectedLabel ? colors.text : colors.placeholder },
            ]}
            numberOfLines={1}
          >
            {selectedLabel || 'Seçiniz'}
          </Text>
          <ChevronDown size={20} color={colors.icon} />
        </TouchableOpacity>
        {disabled && isDirectionLocked && (
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Yük yönü bu sayfadan otomatik belirlendi
          </Text>
        )}
        {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      </View>
    );
  };

  return (
    <>
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
                    selectedOption={
                      selectedCustomer
                        ? {
                            label: selectedCustomer.label,
                            value: selectedCustomer.value,
                            subtitle: selectedCustomer.subtitle,
                          }
                        : null
                    }
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
                        <Text style={[styles.optionLabel, { color: colors.text }]}>
                          {option.label}
                        </Text>
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
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.customer_id}
                </Text>
              )}
            </View>
          )}

          {/* Yük Yönü */}
          {renderSelectButton(
            'Yük Yönü',
            data.direction,
            DIRECTION_OPTIONS,
            () => directionModalRef.current?.present(),
            true,
            isDirectionLocked,
            errors.direction
          )}

          {/* Araç Tipi */}
          {renderSelectButton(
            'Araç Tipi',
            data.vehicle_type,
            VEHICLE_TYPE_OPTIONS,
            () => vehicleTypeModalRef.current?.present()
          )}

          {/* Yükleme Tipi */}
          {renderSelectButton(
            'Yükleme Tipi',
            data.loading_type,
            LOADING_TYPE_OPTIONS,
            () => loadingTypeModalRef.current?.present(),
            true,
            false,
            errors.loading_type
          )}

          {/* Yük Tipi */}
          {renderSelectButton(
            'Yük Tipi (Komple/Parsiyel)',
            data.load_type,
            LOAD_TYPE_OPTIONS,
            () => loadTypeModalRef.current?.present()
          )}

          {/* Yük Taşıma Hızı */}
          {renderSelectButton(
            'Yük Taşıma Hızı',
            data.transport_speed,
            TRANSPORT_SPEED_OPTIONS,
            () => transportSpeedModalRef.current?.present(),
            true,
            false,
            errors.transport_speed
          )}

          {/* Yük Sınıfı */}
          {renderSelectButton(
            'Yük Sınıfı',
            data.cargo_class,
            CARGO_CLASS_OPTIONS,
            () => cargoClassModalRef.current?.present()
          )}

          {/* Yük Havuzunda Yayınla */}
          <View style={styles.checkboxRow}>
            <Checkbox
              checked={data.publish_to_pool || false}
              onCheckedChange={(checked) => updateFormData('publish_to_pool', checked)}
            />
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Yük Havuzunda yayınla
            </Text>
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
                    selectedOption={
                      selectedSender
                        ? {
                            label: selectedSender.label,
                            value: selectedSender.value,
                            subtitle: selectedSender.subtitle,
                          }
                        : null
                    }
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
                    selectedOption={
                      selectedManufacturer
                        ? {
                            label: selectedManufacturer.label,
                            value: selectedManufacturer.value,
                            subtitle: selectedManufacturer.subtitle,
                          }
                        : null
                    }
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
                    selectedOption={
                      selectedReceiver
                        ? {
                            label: selectedReceiver.label,
                            value: selectedReceiver.value,
                            subtitle: selectedReceiver.subtitle,
                          }
                        : null
                    }
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

      {/* Modals - ScrollView DIŞINDA */}
      <SearchableSelectModal
        ref={directionModalRef}
        title="Yük Yönü Seçin"
        options={DIRECTION_OPTIONS}
        selectedValue={data.direction}
        onSelect={(option) => updateFormData('direction', option.value)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={vehicleTypeModalRef}
        title="Araç Tipi Seçin"
        options={VEHICLE_TYPE_OPTIONS}
        selectedValue={data.vehicle_type}
        onSelect={(option) => updateFormData('vehicle_type', option.value)}
        searchPlaceholder="Araç tipi ara..."
      />

      <SearchableSelectModal
        ref={loadingTypeModalRef}
        title="Yükleme Tipi Seçin"
        options={LOADING_TYPE_OPTIONS}
        selectedValue={data.loading_type}
        onSelect={(option) => updateFormData('loading_type', option.value)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={loadTypeModalRef}
        title="Yük Tipi Seçin"
        options={LOAD_TYPE_OPTIONS}
        selectedValue={data.load_type}
        onSelect={(option) => updateFormData('load_type', option.value)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={transportSpeedModalRef}
        title="Taşıma Hızı Seçin"
        options={TRANSPORT_SPEED_OPTIONS}
        selectedValue={data.transport_speed}
        onSelect={(option) => updateFormData('transport_speed', option.value)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={cargoClassModalRef}
        title="Yük Sınıfı Seçin"
        options={CARGO_CLASS_OPTIONS}
        selectedValue={data.cargo_class}
        onSelect={(option) => updateFormData('cargo_class', option.value)}
        searchPlaceholder="Sınıf ara..."
      />
    </>
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: 14,
    flex: 1,
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
    marginTop: 4,
  },
  errorText: {
    fontSize: 11,
    marginTop: 2,
  },
});
