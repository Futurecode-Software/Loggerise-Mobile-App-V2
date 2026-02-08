/**
 * Step3Addresses - Adresler
 *
 * Web versiyonu ile %100 uyumlu - Conditional rendering ve tüm alanlar
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, MapPin, Building, Warehouse, Truck, Package } from 'lucide-react-native';
import { Card, SearchableSelect, AddressSelect } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import type { AddressOption } from '@/components/ui/address-select';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';
import api from '@/services/api';

// Web ile aynı adres tipi tanımlaması
export interface LoadAddress {
  type: 'pickup' | 'delivery';
  pickup_type?: string | null;
  delivery_type?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
  // Loading
  loading_company_id?: number | null;
  loading_location_id?: number | null;
  expected_loading_entry_date?: string;
  loading_entry_date?: string;
  loading_exit_date?: string;
  // Domestic warehouse
  domestic_warehouse_id?: number | null;
  domestic_warehouse_expected_entry_date?: string;
  domestic_warehouse_expected_exit_date?: string;
  domestic_warehouse_entry_date?: string;
  domestic_warehouse_exit_date?: string;
  // Domestic customs
  domestic_customs_company_id?: number | null;
  domestic_customs_location_id?: number | null;
  expected_domestic_customs_entry_date?: string;
  domestic_customs_date?: string;
  domestic_customs_entry_date?: string;
  domestic_customs_exit_date?: string;
  // Customs flags
  mahrece_iade?: boolean;
  kirmizi_beyanname?: boolean;
  beyanname_acildi?: boolean;
  talimat_geldi?: boolean;
  serbest_bolge?: boolean;
  transit?: boolean;
  yys_sahip?: boolean;
  mavi_hat?: boolean;
  police?: boolean;
  // International customs
  intl_customs_company_id?: number | null;
  intl_customs_location_id?: number | null;
  expected_intl_customs_entry_date?: string;
  intl_customs_date?: string;
  intl_customs_entry_date?: string;
  intl_customs_exit_date?: string;
  // Unloading
  unloading_company_id?: number | null;
  unloading_location_id?: number | null;
  destination_country_id?: number | null;
  expected_unloading_entry_date?: string;
  unloading_entry_date?: string;
  unloading_exit_date?: string;
  // International warehouse
  intl_warehouse_id?: number | null;
  intl_warehouse_expected_entry_date?: string;
  intl_warehouse_expected_exit_date?: string;
  intl_warehouse_entry_date?: string;
  intl_warehouse_exit_date?: string;
}

interface SelectOption {
  label: string;
  value: number | string;
  subtitle?: string;
  description?: string;
}

interface Step3AddressesProps {
  addresses: LoadAddress[];
  setAddresses: (addresses: LoadAddress[]) => void;
}

// Web ile aynı pickup type seçenekleri (3 seçenek)
const PICKUP_TYPE_OPTIONS: SelectOption[] = [
  {
    value: 'pre_transport',
    label: 'Ön Taşıma Yapılacak',
    description: 'Yükleme + Depo + Gümrük',
  },
  {
    value: 'direct_from_address',
    label: 'Adresten Çıkış Yapılacak',
    description: 'Yükleme + Gümrük',
  },
  {
    value: 'customer_to_warehouse',
    label: 'Müşteri Depoya Teslim Edecek',
    description: 'Depo + Gümrük',
  },
];

// Web ile aynı delivery type seçenekleri (3 seçenek)
const DELIVERY_TYPE_OPTIONS: SelectOption[] = [
  {
    value: 'deliver_to_address',
    label: 'Adres Teslim Edilecek',
    description: 'Gümrük + Boşaltma',
  },
  {
    value: 'final_transport',
    label: 'Son Taşıma Yapılacak',
    description: 'Gümrük + Boşaltma + Depo',
  },
  {
    value: 'pickup_from_warehouse',
    label: 'Depodan Teslim Alınacak',
    description: 'Gümrük + Depo',
  },
];

// Gümrük bayrakları
const CUSTOMS_FLAGS = [
  { key: 'mahrece_iade', label: 'Mahrece İade' },
  { key: 'kirmizi_beyanname', label: 'Kırmızı Beyanname' },
  { key: 'beyanname_acildi', label: 'Beyanname Açıldı' },
  { key: 'talimat_geldi', label: 'Talimat Geldi' },
  { key: 'serbest_bolge', label: 'Serbest Bölge' },
  { key: 'transit', label: 'Transit' },
  { key: 'yys_sahip', label: 'YYS Sahip' },
  { key: 'mavi_hat', label: 'Mavi Hat' },
  { key: 'police', label: 'Poliçe' },
] as const;

// Firma arama API fonksiyonu
const loadContacts = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/contacts', {
      params: { search: searchQuery, per_page: 20 },
    });
    const contacts = response.data.data?.contacts || response.data.data || [];
    return contacts.map((contact: any) => ({
      value: contact.id || contact.value,
      label: contact.name || contact.label,
      subtitle: contact.code,
    }));
  } catch (error) {
    if (__DEV__) console.error('Error loading contacts:', error);
    return [];
  }
};

// İhracat Depo arama API fonksiyonu (export_warehouses tablosu - yurtiçi depo)
const loadExportWarehouses = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/export-warehouses/search', {
      params: { search: searchQuery },
    });
    const warehouses = response.data.data || [];
    return warehouses.map((wh: any) => ({
      value: wh.value || wh.id,
      label: wh.label || wh.name,
      subtitle: wh.code,
    }));
  } catch (error) {
    if (__DEV__) console.error('Error loading export warehouses:', error);
    return [];
  }
};

// Depo arama API fonksiyonu (warehouses tablosu - yurtdışı depo)
const loadWarehouses = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/warehouses', {
      params: { search: searchQuery, per_page: 20 },
    });
    const warehouses = response.data.data?.warehouses || response.data.data || [];
    return warehouses.map((wh: any) => ({
      value: wh.id || wh.value,
      label: wh.name || wh.label,
      subtitle: wh.code,
    }));
  } catch (error) {
    if (__DEV__) console.error('Error loading warehouses:', error);
    return [];
  }
};

const getDefaultPickupAddress = (): LoadAddress => ({
  type: 'pickup',
  pickup_type: null,
  sort_order: 0,
  is_active: true,
});

const getDefaultDeliveryAddress = (): LoadAddress => ({
  type: 'delivery',
  delivery_type: null,
  sort_order: 1,
  is_active: true,
});

export default function Step3Addresses({ addresses, setAddresses }: Step3AddressesProps) {
  const colors = Colors.light;
  const [showDatePicker, setShowDatePicker] = React.useState<{
    field: string;
    type: 'pickup' | 'delivery';
  } | null>(null);

  // Ensure we have pickup and delivery addresses
  useEffect(() => {
    if (addresses.length === 0) {
      setAddresses([getDefaultPickupAddress(), getDefaultDeliveryAddress()]);
    }
  }, []);

  const pickupAddress = addresses.find((a) => a.type === 'pickup') || getDefaultPickupAddress();
  const deliveryAddress = addresses.find((a) => a.type === 'delivery') || getDefaultDeliveryAddress();

  // Pickup type visibility logic (web ile aynı)
  const showPickupLoading =
    pickupAddress.pickup_type === 'pre_transport' ||
    pickupAddress.pickup_type === 'direct_from_address';
  const showPickupWarehouse =
    pickupAddress.pickup_type === 'pre_transport' ||
    pickupAddress.pickup_type === 'customer_to_warehouse';
  const showPickupCustoms = pickupAddress.pickup_type !== null;

  // Delivery type visibility logic (web ile aynı)
  const showDeliveryCustoms = deliveryAddress.delivery_type !== null;
  const showDeliveryUnloading =
    deliveryAddress.delivery_type === 'deliver_to_address' ||
    deliveryAddress.delivery_type === 'final_transport';
  const showDeliveryWarehouse =
    deliveryAddress.delivery_type === 'final_transport' ||
    deliveryAddress.delivery_type === 'pickup_from_warehouse';

  const updateAddress = (type: 'pickup' | 'delivery', field: keyof LoadAddress, value: any) => {
    const updated = addresses.map((a) => (a.type === type ? { ...a, [field]: value } : a));
    if (!updated.find((a) => a.type === type)) {
      const newAddress = type === 'pickup' ? getDefaultPickupAddress() : getDefaultDeliveryAddress();
      updated.push({ ...newAddress, [field]: value });
    }
    setAddresses(updated);
  };

  const handleDateChange = (type: 'pickup' | 'delivery', field: string, date?: Date) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      updateAddress(type, field as keyof LoadAddress, formattedDate);
    }
    setShowDatePicker(null);
  };

  const renderDateField = (
    type: 'pickup' | 'delivery',
    field: string,
    label: string,
    value: string | undefined
  ) => (
    <View style={styles.dateFieldContainer}>
      <Text style={[styles.smallLabel, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dateButton, { borderColor: colors.border }]}
        onPress={() => setShowDatePicker({ field, type })}
      >
        <Calendar size={12} color={colors.icon} />
        <Text
          style={[styles.dateButtonText, { color: value ? colors.text : colors.textMuted }]}
          numberOfLines={1}
        >
          {value || 'Seçiniz'}
        </Text>
      </TouchableOpacity>
      {showDatePicker?.field === field && showDatePicker?.type === type && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleDateChange(type, field, date)}
        />
      )}
    </View>
  );

  const renderCheckboxFlag = (
    type: 'pickup' | 'delivery',
    flag: { key: string; label: string },
    address: LoadAddress
  ) => (
    <View key={flag.key} style={styles.checkboxRow}>
      <Switch
        value={address[flag.key as keyof LoadAddress] as boolean || false}
        onValueChange={(checked) => updateAddress(type, flag.key as keyof LoadAddress, checked)}
        trackColor={{ false: colors.border, true: Brand.primary }}
        thumbColor="#fff"
        style={styles.switch}
      />
      <Text style={[styles.checkboxLabel, { color: colors.text }]}>{flag.label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Alış Adresi Kartı */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <MapPin size={18} color={Brand.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Alış Adresi</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Yükün alınacağı adres bilgileri
            </Text>
          </View>
        </View>

        {/* Teslim Alma Tipi */}
        <SelectInput
          label="Teslim Alma Tipi *"
          placeholder="Teslim alma tipi seçiniz"
          value={pickupAddress.pickup_type || ''}
          onValueChange={(value) => updateAddress('pickup', 'pickup_type', value || null)}
          options={PICKUP_TYPE_OPTIONS.map((o) => ({
            ...o,
            label: `${o.label} (${o.description})`,
          }))}
        />

        {/* Yurtiçi Yükleme Bilgileri - Conditional */}
        {showPickupLoading && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Truck size={16} color={Brand.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yurtiçi Yükleme Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Building size={14} color={colors.icon} />
                <Text style={[styles.label, { color: colors.text }]}>Yükleme Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={pickupAddress.loading_company_id || undefined}
                onValueChange={(value) => {
                  updateAddress('pickup', 'loading_company_id', value || null);
                  // Firma değişince adresi sıfırla
                  if (!value || value !== pickupAddress.loading_company_id) {
                    updateAddress('pickup', 'loading_location_id', null);
                  }
                }}
                loadOptions={loadContacts}
              />
            </View>

            {/* Yükleme Adresi - Firma seçildikten sonra göster */}
            {pickupAddress.loading_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MapPin size={14} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>Yükleme Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={pickupAddress.loading_company_id}
                  value={pickupAddress.loading_location_id}
                  addressType="pickup"
                  onValueChange={(value) => updateAddress('pickup', 'loading_location_id', value)}
                />
              </View>
            )}

            <View style={styles.dateRow}>
              {renderDateField('pickup', 'expected_loading_entry_date', 'Beklenen Yükleme Giriş', pickupAddress.expected_loading_entry_date)}
              {renderDateField('pickup', 'loading_entry_date', 'Yüklemeye Giriş', pickupAddress.loading_entry_date)}
              {renderDateField('pickup', 'loading_exit_date', 'Yükleme/Çıkış', pickupAddress.loading_exit_date)}
            </View>
          </View>
        )}

        {/* Yurtiçi Depo Bilgileri - Conditional */}
        {showPickupWarehouse && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Warehouse size={16} color={Brand.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yurtiçi Depo Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Warehouse size={14} color={colors.icon} />
                <Text style={[styles.label, { color: colors.text }]}>Yurtiçi Depo</Text>
              </View>
              <SearchableSelect
                placeholder="Depo seçiniz..."
                value={pickupAddress.domestic_warehouse_id || undefined}
                onValueChange={(value) => updateAddress('pickup', 'domestic_warehouse_id', value || null)}
                loadOptions={loadExportWarehouses}
              />
            </View>

            <View style={styles.dateRow}>
              {renderDateField('pickup', 'domestic_warehouse_expected_entry_date', 'Beklenen Giriş', pickupAddress.domestic_warehouse_expected_entry_date)}
              {renderDateField('pickup', 'domestic_warehouse_expected_exit_date', 'Beklenen Çıkış', pickupAddress.domestic_warehouse_expected_exit_date)}
            </View>
            <View style={styles.dateRow}>
              {renderDateField('pickup', 'domestic_warehouse_entry_date', 'Depo Giriş', pickupAddress.domestic_warehouse_entry_date)}
              {renderDateField('pickup', 'domestic_warehouse_exit_date', 'Depo Çıkış', pickupAddress.domestic_warehouse_exit_date)}
            </View>
          </View>
        )}

        {/* Yurtiçi Gümrükleme Bilgileri - Conditional */}
        {showPickupCustoms && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={16} color="#F97316" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yurtiçi Gümrükleme Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Building size={14} color={colors.icon} />
                <Text style={[styles.label, { color: colors.text }]}>Yurtiçi Gümrükleme Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={pickupAddress.domestic_customs_company_id || undefined}
                onValueChange={(value) => {
                  updateAddress('pickup', 'domestic_customs_company_id', value || null);
                  // Firma değişince adresi sıfırla
                  if (!value || value !== pickupAddress.domestic_customs_company_id) {
                    updateAddress('pickup', 'domestic_customs_location_id', null);
                  }
                }}
                loadOptions={loadContacts}
              />
            </View>

            {/* Gümrükleme Adresi - Firma seçildikten sonra göster */}
            {pickupAddress.domestic_customs_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MapPin size={14} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>Gümrükleme Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={pickupAddress.domestic_customs_company_id}
                  value={pickupAddress.domestic_customs_location_id}
                  addressType="pickup"
                  onValueChange={(value) => updateAddress('pickup', 'domestic_customs_location_id', value)}
                />
              </View>
            )}

            <View style={styles.dateRow}>
              {renderDateField('pickup', 'expected_domestic_customs_entry_date', 'Beklenen Gümrük Giriş', pickupAddress.expected_domestic_customs_entry_date)}
              {renderDateField('pickup', 'domestic_customs_date', 'Yurtiçi Gümrük Tarihi', pickupAddress.domestic_customs_date)}
            </View>
            <View style={styles.dateRow}>
              {renderDateField('pickup', 'domestic_customs_entry_date', 'Gümrüklemeye Giriş', pickupAddress.domestic_customs_entry_date)}
              {renderDateField('pickup', 'domestic_customs_exit_date', 'Gümrüklemeden Çıkış', pickupAddress.domestic_customs_exit_date)}
            </View>

            {/* Gümrük Bayrakları */}
            <View style={[styles.flagsContainer, { borderColor: '#FDBA74', backgroundColor: '#FFF7ED' }]}>
              <Text style={[styles.flagsTitle, { color: '#9A3412' }]}>Gümrük Bayrakları</Text>
              <View style={styles.flagsGrid}>
                {CUSTOMS_FLAGS.map((flag) => renderCheckboxFlag('pickup', flag, pickupAddress))}
              </View>
            </View>
          </View>
        )}
      </Card>

      {/* Teslim Adresi Kartı */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <MapPin size={18} color="#3B82F6" />
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Teslim Adresi</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Yükün teslim edileceği adres bilgileri
            </Text>
          </View>
        </View>

        {/* Teslim Etme Tipi */}
        <SelectInput
          label="Teslim Etme Tipi *"
          placeholder="Teslim etme tipi seçiniz"
          value={deliveryAddress.delivery_type || ''}
          onValueChange={(value) => updateAddress('delivery', 'delivery_type', value || null)}
          options={DELIVERY_TYPE_OPTIONS.map((o) => ({
            ...o,
            label: `${o.label} (${o.description})`,
          }))}
        />

        {/* Yurtdışı Gümrükleme Bilgileri - Conditional */}
        {showDeliveryCustoms && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={16} color="#3B82F6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yurtdışı Gümrükleme Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Building size={14} color={colors.icon} />
                <Text style={[styles.label, { color: colors.text }]}>Yurtdışı Gümrükleme Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={deliveryAddress.intl_customs_company_id || undefined}
                onValueChange={(value) => {
                  updateAddress('delivery', 'intl_customs_company_id', value || null);
                  // Firma değişince adresi sıfırla
                  if (!value || value !== deliveryAddress.intl_customs_company_id) {
                    updateAddress('delivery', 'intl_customs_location_id', null);
                  }
                }}
                loadOptions={loadContacts}
              />
            </View>

            {/* Gümrükleme Adresi - Firma seçildikten sonra göster */}
            {deliveryAddress.intl_customs_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MapPin size={14} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>Gümrükleme Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={deliveryAddress.intl_customs_company_id}
                  value={deliveryAddress.intl_customs_location_id}
                  addressType="delivery"
                  onValueChange={(value) => updateAddress('delivery', 'intl_customs_location_id', value)}
                />
              </View>
            )}

            <View style={styles.dateRow}>
              {renderDateField('delivery', 'expected_intl_customs_entry_date', 'Beklenen Gümrük Giriş', deliveryAddress.expected_intl_customs_entry_date)}
              {renderDateField('delivery', 'intl_customs_date', 'Yurtdışı Gümrük Tarihi', deliveryAddress.intl_customs_date)}
            </View>
            <View style={styles.dateRow}>
              {renderDateField('delivery', 'intl_customs_entry_date', 'Gümrüklemeye Giriş', deliveryAddress.intl_customs_entry_date)}
              {renderDateField('delivery', 'intl_customs_exit_date', 'Gümrüklemeden Çıkış', deliveryAddress.intl_customs_exit_date)}
            </View>
          </View>
        )}

        {/* Yurtdışı Boşaltma Bilgileri - Conditional */}
        {showDeliveryUnloading && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Truck size={16} color="#3B82F6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yurtdışı Boşaltma Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Building size={14} color={colors.icon} />
                <Text style={[styles.label, { color: colors.text }]}>Boşaltma Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={deliveryAddress.unloading_company_id || undefined}
                onValueChange={(value) => {
                  updateAddress('delivery', 'unloading_company_id', value || null);
                  // Firma değişince adresi sıfırla
                  if (!value || value !== deliveryAddress.unloading_company_id) {
                    updateAddress('delivery', 'unloading_location_id', null);
                  }
                }}
                loadOptions={loadContacts}
              />
            </View>

            {/* Boşaltma Adresi - Firma seçildikten sonra göster */}
            {deliveryAddress.unloading_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <MapPin size={14} color={colors.icon} />
                  <Text style={[styles.label, { color: colors.text }]}>Boşaltma Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={deliveryAddress.unloading_company_id}
                  value={deliveryAddress.unloading_location_id}
                  addressType="delivery"
                  onValueChange={(value) => updateAddress('delivery', 'unloading_location_id', value)}
                />
              </View>
            )}

            <View style={styles.dateRow}>
              {renderDateField('delivery', 'expected_unloading_entry_date', 'Beklenen Teslimat', deliveryAddress.expected_unloading_entry_date)}
              {renderDateField('delivery', 'unloading_entry_date', 'Boşaltmaya Giriş', deliveryAddress.unloading_entry_date)}
              {renderDateField('delivery', 'unloading_exit_date', 'Boşaltmadan Çıkış', deliveryAddress.unloading_exit_date)}
            </View>
          </View>
        )}

        {/* Yurtdışı Depo Bilgileri - Conditional */}
        {showDeliveryWarehouse && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Warehouse size={16} color="#3B82F6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yurtdışı Depo Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Warehouse size={14} color={colors.icon} />
                <Text style={[styles.label, { color: colors.text }]}>Yurtdışı Depo</Text>
              </View>
              <SearchableSelect
                placeholder="Depo seçiniz..."
                value={deliveryAddress.intl_warehouse_id || undefined}
                onValueChange={(value) => updateAddress('delivery', 'intl_warehouse_id', value || null)}
                loadOptions={loadWarehouses}
              />
            </View>

            <View style={styles.dateRow}>
              {renderDateField('delivery', 'intl_warehouse_expected_entry_date', 'Beklenen Giriş', deliveryAddress.intl_warehouse_expected_entry_date)}
              {renderDateField('delivery', 'intl_warehouse_expected_exit_date', 'Beklenen Çıkış', deliveryAddress.intl_warehouse_expected_exit_date)}
            </View>
            <View style={styles.dateRow}>
              {renderDateField('delivery', 'intl_warehouse_entry_date', 'Depo Giriş', deliveryAddress.intl_warehouse_entry_date)}
              {renderDateField('delivery', 'intl_warehouse_exit_date', 'Depo Çıkış', deliveryAddress.intl_warehouse_exit_date)}
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
  section: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    backgroundColor: '#FAFAFA',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  dateFieldContainer: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 11,
    flex: 1,
  },
  flagsContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  flagsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  flagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '48%',
    marginBottom: 4,
  },
  switch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },
  checkboxLabel: {
    fontSize: 11,
    flex: 1,
  },
});
