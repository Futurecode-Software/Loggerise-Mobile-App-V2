/**
 * Step3Addresses - Adresler
 *
 * Web versiyonu ile %100 uyumlu - Conditional rendering ve tüm alanlar
 */

import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, SearchableSelect, AddressSelect, DateInput } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import type { AddressOption } from '@/components/ui/address-select'
import type { SearchableSelectOption } from '@/components/ui/searchable-select'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import api from '@/services/api'

// Web ile aynı adres tipi tanımlaması
export interface LoadAddress {
  type: 'pickup' | 'delivery'
  pickup_type?: string | null
  delivery_type?: string | null
  sort_order?: number | null
  is_active?: boolean
  // Loading
  loading_company_id?: number | null
  loading_location_id?: number | null
  expected_loading_entry_date?: string
  loading_entry_date?: string
  loading_exit_date?: string
  // Domestic warehouse
  domestic_warehouse_id?: number | null
  domestic_warehouse_expected_entry_date?: string
  domestic_warehouse_expected_exit_date?: string
  domestic_warehouse_entry_date?: string
  domestic_warehouse_exit_date?: string
  // Domestic customs
  domestic_customs_company_id?: number | null
  domestic_customs_location_id?: number | null
  expected_domestic_customs_entry_date?: string
  domestic_customs_date?: string
  domestic_customs_entry_date?: string
  domestic_customs_exit_date?: string
  // Customs flags
  mahrece_iade?: boolean
  kirmizi_beyanname?: boolean
  beyanname_acildi?: boolean
  talimat_geldi?: boolean
  serbest_bolge?: boolean
  transit?: boolean
  yys_sahip?: boolean
  mavi_hat?: boolean
  police?: boolean
  // International customs
  intl_customs_company_id?: number | null
  intl_customs_location_id?: number | null
  expected_intl_customs_entry_date?: string
  intl_customs_date?: string
  intl_customs_entry_date?: string
  intl_customs_exit_date?: string
  // Unloading
  unloading_company_id?: number | null
  unloading_location_id?: number | null
  destination_country_id?: number | null
  expected_unloading_entry_date?: string
  unloading_entry_date?: string
  unloading_exit_date?: string
  // International warehouse
  intl_warehouse_id?: number | null
  intl_warehouse_expected_entry_date?: string
  intl_warehouse_expected_exit_date?: string
  intl_warehouse_entry_date?: string
  intl_warehouse_exit_date?: string
}

interface SelectOption {
  label: string
  value: number | string
  subtitle?: string
  description?: string
}

export interface SelectedOptionsMap {
  [key: string]: SearchableSelectOption | AddressOption | null
}

interface Step3AddressesProps {
  addresses: LoadAddress[]
  setAddresses: (addresses: LoadAddress[]) => void
  selectedOptions?: SelectedOptionsMap
  onSelectedOptionsChange?: (options: SelectedOptionsMap) => void
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
]

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
]

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
] as const

// Firma arama API fonksiyonu
const loadContacts = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/contacts', {
      params: { search: searchQuery, per_page: 20 },
    })
    const contacts = response.data.data?.contacts || response.data.data || []
    return contacts.map((contact: any) => ({
      value: contact.id || contact.value,
      label: contact.name || contact.label,
      subtitle: contact.code,
    }))
  } catch (error) {
    if (__DEV__) console.error('Error loading contacts:', error)
    return []
  }
}

// İhracat Depo arama API fonksiyonu
const loadExportWarehouses = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/export-warehouses/search', {
      params: { search: searchQuery },
    })
    const warehouses = response.data.data || []
    return warehouses.map((wh: any) => ({
      value: wh.value || wh.id,
      label: wh.label || wh.name,
      subtitle: wh.code,
    }))
  } catch (error) {
    if (__DEV__) console.error('Error loading export warehouses:', error)
    return []
  }
}

// Depo arama API fonksiyonu
const loadWarehouses = async (searchQuery: string): Promise<SelectOption[]> => {
  try {
    const response = await api.get('/warehouses', {
      params: { search: searchQuery, per_page: 20 },
    })
    const warehouses = response.data.data?.warehouses || response.data.data || []
    return warehouses.map((wh: any) => ({
      value: wh.id || wh.value,
      label: wh.name || wh.label,
      subtitle: wh.code,
    }))
  } catch (error) {
    if (__DEV__) console.error('Error loading warehouses:', error)
    return []
  }
}

const getDefaultPickupAddress = (): LoadAddress => ({
  type: 'pickup',
  pickup_type: null,
  sort_order: 0,
  is_active: true,
})

const getDefaultDeliveryAddress = (): LoadAddress => ({
  type: 'delivery',
  delivery_type: null,
  sort_order: 1,
  is_active: true,
})

export default function Step3Addresses({
  addresses,
  setAddresses,
  selectedOptions = {},
  onSelectedOptionsChange,
}: Step3AddressesProps) {
  // Ensure we have pickup and delivery addresses
  useEffect(() => {
    if (addresses.length === 0) {
      setAddresses([getDefaultPickupAddress(), getDefaultDeliveryAddress()])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickupAddress = addresses.find((a) => a.type === 'pickup') || getDefaultPickupAddress()
  const deliveryAddress = addresses.find((a) => a.type === 'delivery') || getDefaultDeliveryAddress()

  // Pickup type visibility logic (web ile aynı)
  const showPickupLoading =
    pickupAddress.pickup_type === 'pre_transport' ||
    pickupAddress.pickup_type === 'direct_from_address'
  const showPickupWarehouse =
    pickupAddress.pickup_type === 'pre_transport' ||
    pickupAddress.pickup_type === 'customer_to_warehouse'
  const showPickupCustoms = pickupAddress.pickup_type !== null

  // Delivery type visibility logic (web ile aynı)
  const showDeliveryCustoms = deliveryAddress.delivery_type !== null
  const showDeliveryUnloading =
    deliveryAddress.delivery_type === 'deliver_to_address' ||
    deliveryAddress.delivery_type === 'final_transport'
  const showDeliveryWarehouse =
    deliveryAddress.delivery_type === 'final_transport' ||
    deliveryAddress.delivery_type === 'pickup_from_warehouse'

  const updateAddress = (type: 'pickup' | 'delivery', field: keyof LoadAddress, value: any) => {
    setAddresses((prev) => {
      const updated = prev.map((a) => (a.type === type ? { ...a, [field]: value } : a))
      if (!updated.find((a) => a.type === type)) {
        const newAddress = type === 'pickup' ? getDefaultPickupAddress() : getDefaultDeliveryAddress()
        updated.push({ ...newAddress, [field]: value })
      }
      return updated
    })
  }

  const updateSelectedOption = (key: string, option: any) => {
    onSelectedOptionsChange?.({ ...selectedOptions, [key]: option })
  }

  const renderCheckboxFlag = (
    type: 'pickup' | 'delivery',
    flag: { key: string, label: string },
    address: LoadAddress
  ) => (
    <View key={flag.key} style={styles.checkboxRow}>
      <Switch
        value={address[flag.key as keyof LoadAddress] as boolean || false}
        onValueChange={(checked) => updateAddress(type, flag.key as keyof LoadAddress, checked)}
        trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
        thumbColor="#fff"
        style={styles.switch}
      />
      <Text style={styles.checkboxLabel}>{flag.label}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Alış Adresi Kartı */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={18} color={DashboardColors.primary} />
          <View>
            <Text style={styles.cardTitle}>Alış Adresi</Text>
            <Text style={styles.cardDescription}>
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

        {/* Yurtiçi Yükleme Bilgileri */}
        {showPickupLoading && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-outline" size={16} color={DashboardColors.primary} />
              <Text style={styles.sectionTitle}>
                Yurtiçi Yükleme Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
                <Text style={styles.label}>Yükleme Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={pickupAddress.loading_company_id || undefined}
                selectedOption={(selectedOptions['pickup_loading_company'] as SearchableSelectOption) || null}
                onValueChange={(value) => {
                  updateAddress('pickup', 'loading_company_id', value || null)
                  if (!value || value !== pickupAddress.loading_company_id) {
                    updateAddress('pickup', 'loading_location_id', null)
                    updateSelectedOption('pickup_loading_address', null)
                  }
                }}
                onSelect={(option) => updateSelectedOption('pickup_loading_company', option)}
                loadOptions={loadContacts}
              />
            </View>

            {pickupAddress.loading_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
                  <Text style={styles.label}>Yükleme Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={pickupAddress.loading_company_id}
                  value={pickupAddress.loading_location_id}
                  selectedOption={(selectedOptions['pickup_loading_address'] as AddressOption) || null}
                  addressType="pickup"
                  onValueChange={(value) => updateAddress('pickup', 'loading_location_id', value)}
                  onSelect={(option) => updateSelectedOption('pickup_loading_address', option)}
                />
              </View>
            )}

            <DateInput
              label="Beklenen Yükleme Giriş"
              placeholder="Tarih seçiniz"
              value={pickupAddress.expected_loading_entry_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'expected_loading_entry_date', date)}
            />
            <DateInput
              label="Yüklemeye Giriş"
              placeholder="Tarih seçiniz"
              value={pickupAddress.loading_entry_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'loading_entry_date', date)}
            />
            <DateInput
              label="Yükleme/Çıkış"
              placeholder="Tarih seçiniz"
              value={pickupAddress.loading_exit_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'loading_exit_date', date)}
            />
          </View>
        )}

        {/* Yurtiçi Depo Bilgileri */}
        {showPickupWarehouse && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube-outline" size={16} color={DashboardColors.primary} />
              <Text style={styles.sectionTitle}>
                Yurtiçi Depo Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="cube-outline" size={14} color={DashboardColors.textMuted} />
                <Text style={styles.label}>Yurtiçi Depo</Text>
              </View>
              <SearchableSelect
                placeholder="Depo seçiniz..."
                value={pickupAddress.domestic_warehouse_id || undefined}
                selectedOption={(selectedOptions['pickup_domestic_warehouse'] as SearchableSelectOption) || null}
                onValueChange={(value) => updateAddress('pickup', 'domestic_warehouse_id', value || null)}
                onSelect={(option) => updateSelectedOption('pickup_domestic_warehouse', option)}
                loadOptions={loadExportWarehouses}
              />
            </View>

            <DateInput
              label="Beklenen Giriş"
              placeholder="Tarih seçiniz"
              value={pickupAddress.domestic_warehouse_expected_entry_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'domestic_warehouse_expected_entry_date', date)}
            />
            <DateInput
              label="Beklenen Çıkış"
              placeholder="Tarih seçiniz"
              value={pickupAddress.domestic_warehouse_expected_exit_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'domestic_warehouse_expected_exit_date', date)}
            />
            <DateInput
              label="Depo Giriş"
              placeholder="Tarih seçiniz"
              value={pickupAddress.domestic_warehouse_entry_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'domestic_warehouse_entry_date', date)}
            />
            <DateInput
              label="Depo Çıkış"
              placeholder="Tarih seçiniz"
              value={pickupAddress.domestic_warehouse_exit_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'domestic_warehouse_exit_date', date)}
            />
          </View>
        )}

        {/* Yurtiçi Gümrükleme Bilgileri */}
        {showPickupCustoms && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#F97316" />
              <Text style={styles.sectionTitle}>
                Yurtiçi Gümrükleme Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
                <Text style={styles.label}>Yurtiçi Gümrükleme Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={pickupAddress.domestic_customs_company_id || undefined}
                selectedOption={(selectedOptions['pickup_domestic_customs_company'] as SearchableSelectOption) || null}
                onValueChange={(value) => {
                  updateAddress('pickup', 'domestic_customs_company_id', value || null)
                  if (!value || value !== pickupAddress.domestic_customs_company_id) {
                    updateAddress('pickup', 'domestic_customs_location_id', null)
                    updateSelectedOption('pickup_domestic_customs_address', null)
                  }
                }}
                onSelect={(option) => updateSelectedOption('pickup_domestic_customs_company', option)}
                loadOptions={loadContacts}
              />
            </View>

            {pickupAddress.domestic_customs_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
                  <Text style={styles.label}>Gümrükleme Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={pickupAddress.domestic_customs_company_id}
                  value={pickupAddress.domestic_customs_location_id}
                  selectedOption={(selectedOptions['pickup_domestic_customs_address'] as AddressOption) || null}
                  addressType="pickup"
                  onValueChange={(value) => updateAddress('pickup', 'domestic_customs_location_id', value)}
                  onSelect={(option) => updateSelectedOption('pickup_domestic_customs_address', option)}
                />
              </View>
            )}

            <DateInput
              label="Beklenen Gümrük Giriş"
              placeholder="Tarih seçiniz"
              value={pickupAddress.expected_domestic_customs_entry_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'expected_domestic_customs_entry_date', date)}
            />
            <DateInput
              label="Yurtiçi Gümrük Tarihi"
              placeholder="Tarih seçiniz"
              value={pickupAddress.domestic_customs_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'domestic_customs_date', date)}
            />
            <DateInput
              label="Gümrüklemeye Giriş"
              placeholder="Tarih seçiniz"
              value={pickupAddress.domestic_customs_entry_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'domestic_customs_entry_date', date)}
            />
            <DateInput
              label="Gümrüklemeden Çıkış"
              placeholder="Tarih seçiniz"
              value={pickupAddress.domestic_customs_exit_date || ''}
              onChangeDate={(date) => updateAddress('pickup', 'domestic_customs_exit_date', date)}
            />

            {/* Gümrük Bayrakları */}
            <View style={styles.flagsContainer}>
              <Text style={styles.flagsTitle}>Gümrük Bayrakları</Text>
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
          <Ionicons name="location-outline" size={18} color={DashboardColors.info} />
          <View>
            <Text style={styles.cardTitle}>Teslim Adresi</Text>
            <Text style={styles.cardDescription}>
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

        {/* Yurtdışı Gümrükleme Bilgileri */}
        {showDeliveryCustoms && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color={DashboardColors.info} />
              <Text style={styles.sectionTitle}>
                Yurtdışı Gümrükleme Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
                <Text style={styles.label}>Yurtdışı Gümrükleme Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={deliveryAddress.intl_customs_company_id || undefined}
                selectedOption={(selectedOptions['delivery_intl_customs_company'] as SearchableSelectOption) || null}
                onValueChange={(value) => {
                  updateAddress('delivery', 'intl_customs_company_id', value || null)
                  if (!value || value !== deliveryAddress.intl_customs_company_id) {
                    updateAddress('delivery', 'intl_customs_location_id', null)
                    updateSelectedOption('delivery_intl_customs_address', null)
                  }
                }}
                onSelect={(option) => updateSelectedOption('delivery_intl_customs_company', option)}
                loadOptions={loadContacts}
              />
            </View>

            {deliveryAddress.intl_customs_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
                  <Text style={styles.label}>Gümrükleme Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={deliveryAddress.intl_customs_company_id}
                  value={deliveryAddress.intl_customs_location_id}
                  selectedOption={(selectedOptions['delivery_intl_customs_address'] as AddressOption) || null}
                  addressType="delivery"
                  onValueChange={(value) => updateAddress('delivery', 'intl_customs_location_id', value)}
                  onSelect={(option) => updateSelectedOption('delivery_intl_customs_address', option)}
                />
              </View>
            )}

            <DateInput
              label="Beklenen Gümrük Giriş"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.expected_intl_customs_entry_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'expected_intl_customs_entry_date', date)}
            />
            <DateInput
              label="Yurtdışı Gümrük Tarihi"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.intl_customs_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'intl_customs_date', date)}
            />
            <DateInput
              label="Gümrüklemeye Giriş"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.intl_customs_entry_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'intl_customs_entry_date', date)}
            />
            <DateInput
              label="Gümrüklemeden Çıkış"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.intl_customs_exit_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'intl_customs_exit_date', date)}
            />
          </View>
        )}

        {/* Yurtdışı Boşaltma Bilgileri */}
        {showDeliveryUnloading && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-outline" size={16} color={DashboardColors.info} />
              <Text style={styles.sectionTitle}>
                Yurtdışı Boşaltma Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
                <Text style={styles.label}>Boşaltma Firması</Text>
              </View>
              <SearchableSelect
                placeholder="Firma seçiniz..."
                value={deliveryAddress.unloading_company_id || undefined}
                selectedOption={(selectedOptions['delivery_unloading_company'] as SearchableSelectOption) || null}
                onValueChange={(value) => {
                  updateAddress('delivery', 'unloading_company_id', value || null)
                  if (!value || value !== deliveryAddress.unloading_company_id) {
                    updateAddress('delivery', 'unloading_location_id', null)
                    updateSelectedOption('delivery_unloading_address', null)
                  }
                }}
                onSelect={(option) => updateSelectedOption('delivery_unloading_company', option)}
                loadOptions={loadContacts}
              />
            </View>

            {deliveryAddress.unloading_company_id && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons name="location-outline" size={14} color={DashboardColors.textMuted} />
                  <Text style={styles.label}>Boşaltma Adresi</Text>
                </View>
                <AddressSelect
                  placeholder="Adres seçiniz..."
                  contactId={deliveryAddress.unloading_company_id}
                  value={deliveryAddress.unloading_location_id}
                  selectedOption={(selectedOptions['delivery_unloading_address'] as AddressOption) || null}
                  addressType="delivery"
                  onValueChange={(value) => updateAddress('delivery', 'unloading_location_id', value)}
                  onSelect={(option) => updateSelectedOption('delivery_unloading_address', option)}
                />
              </View>
            )}

            <DateInput
              label="Beklenen Teslimat"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.expected_unloading_entry_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'expected_unloading_entry_date', date)}
            />
            <DateInput
              label="Boşaltmaya Giriş"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.unloading_entry_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'unloading_entry_date', date)}
            />
            <DateInput
              label="Boşaltmadan Çıkış"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.unloading_exit_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'unloading_exit_date', date)}
            />
          </View>
        )}

        {/* Yurtdışı Depo Bilgileri */}
        {showDeliveryWarehouse && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube-outline" size={16} color={DashboardColors.info} />
              <Text style={styles.sectionTitle}>
                Yurtdışı Depo Bilgileri
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="cube-outline" size={14} color={DashboardColors.textMuted} />
                <Text style={styles.label}>Yurtdışı Depo</Text>
              </View>
              <SearchableSelect
                placeholder="Depo seçiniz..."
                value={deliveryAddress.intl_warehouse_id || undefined}
                selectedOption={(selectedOptions['delivery_intl_warehouse'] as SearchableSelectOption) || null}
                onValueChange={(value) => updateAddress('delivery', 'intl_warehouse_id', value || null)}
                onSelect={(option) => updateSelectedOption('delivery_intl_warehouse', option)}
                loadOptions={loadWarehouses}
              />
            </View>

            <DateInput
              label="Beklenen Giriş"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.intl_warehouse_expected_entry_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'intl_warehouse_expected_entry_date', date)}
            />
            <DateInput
              label="Beklenen Çıkış"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.intl_warehouse_expected_exit_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'intl_warehouse_expected_exit_date', date)}
            />
            <DateInput
              label="Depo Giriş"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.intl_warehouse_entry_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'intl_warehouse_entry_date', date)}
            />
            <DateInput
              label="Depo Çıkış"
              placeholder="Tarih seçiniz"
              value={deliveryAddress.intl_warehouse_exit_date || ''}
              onChangeDate={(date) => updateAddress('delivery', 'intl_warehouse_exit_date', date)}
            />
          </View>
        )}
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: DashboardSpacing.sm,
  },
  card: {
    padding: DashboardSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.md,
  },
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
  },
  section: {
    marginTop: DashboardSpacing.md,
    padding: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.sm,
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  fieldGroup: {
    marginBottom: DashboardSpacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: 4,
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.text,
  },
  flagsContainer: {
    marginTop: DashboardSpacing.sm,
    padding: DashboardSpacing.sm,
    borderWidth: 1,
    borderRadius: DashboardBorderRadius.sm,
    borderColor: '#FDBA74',
    backgroundColor: DashboardColors.warningBg,
  },
  flagsTitle: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: '#9A3412',
    marginBottom: DashboardSpacing.xs,
  },
  flagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
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
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.text,
    flex: 1,
  },
})
