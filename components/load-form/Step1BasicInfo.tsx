/**
 * Step1BasicInfo - Temel Bilgiler
 *
 * Web versiyonu ile %100 uyumlu - SearchableSelectModal ile modernize edildi
 */

import React, { useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, Checkbox, SearchableSelect } from '@/components/ui'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals/SearchableSelectModal'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import type { LoadFormData } from '@/services/endpoints/loads'
import api from '@/services/api'

interface SelectOptionLocal {
  label: string
  value: number
  subtitle?: string
}

interface Step1BasicInfoProps {
  data: LoadFormData
  updateFormData: (field: keyof LoadFormData, value: any) => void
  errors?: Record<string, string>
  selectedCustomer?: SelectOptionLocal | null
  selectedSender?: SelectOptionLocal | null
  selectedManufacturer?: SelectOptionLocal | null
  selectedReceiver?: SelectOptionLocal | null
  onCustomerChange?: (option: SelectOptionLocal | null) => void
  onSenderChange?: (option: SelectOptionLocal | null) => void
  onManufacturerChange?: (option: SelectOptionLocal | null) => void
  onReceiverChange?: (option: SelectOptionLocal | null) => void
  onAddCustomerClick?: () => void
  onAddSenderClick?: () => void
  onAddManufacturerClick?: () => void
  onAddReceiverClick?: () => void
  isDirectionLocked?: boolean
}

// Yük Yönü seçenekleri
const DIRECTION_OPTIONS: SelectOption[] = [
  { label: 'İhracat (IHR)', value: 'export' },
  { label: 'İthalat (ITH)', value: 'import' },
]

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
]

// Yükleme tipi seçenekleri
const LOADING_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Karışık', value: 'karisik' },
]

// Yük tipi seçenekleri
const LOAD_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Komple', value: 'full' },
  { label: 'Parsiyel', value: 'partial' },
]

// Taşıma hızı seçenekleri
const TRANSPORT_SPEED_OPTIONS: SelectOption[] = [
  { label: 'Expres', value: 'expres' },
  { label: 'Normal', value: 'normal' },
]

// Yük sınıfı seçenekleri
const CARGO_CLASS_OPTIONS: SelectOption[] = [
  { label: 'Genel Kargo', value: 'general' },
  { label: 'Konteyner', value: 'container' },
  { label: 'Tehlikeli Madde', value: 'hazardous' },
  { label: 'Soğuk Zincir', value: 'cold_chain' },
  { label: 'Proje Kargo', value: 'project' },
]

// Firma arama API fonksiyonu
const loadContacts = async (searchQuery: string): Promise<SelectOptionLocal[]> => {
  try {
    const response = await api.get('/contacts', {
      params: { search: searchQuery, include_potential: true, per_page: 20 },
    })
    const contacts = response.data.data?.contacts || response.data.data || []
    return contacts.map((contact: any) => ({
      value: contact.id || contact.value,
      label: contact.name || contact.label,
      subtitle: contact.code || contact.short_name,
    }))
  } catch (error) {
    if (__DEV__) console.error('Error loading contacts:', error)
    return []
  }
}

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
  // Modal refs
  const directionModalRef = useRef<SearchableSelectModalRef>(null)
  const vehicleTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const loadingTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const loadTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const transportSpeedModalRef = useRef<SearchableSelectModalRef>(null)
  const cargoClassModalRef = useRef<SearchableSelectModalRef>(null)

  // Get selected label
  const getSelectedLabel = (value: string | undefined, options: SelectOption[]): string => {
    if (!value) return ''
    const option = options.find((opt) => opt.value === value)
    return option?.label || ''
  }

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
    const selectedLabel = getSelectedLabel(value, options)

    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {label} {required && <Text style={{ color: DashboardColors.danger }}>*</Text>}
        </Text>
        <TouchableOpacity
          style={[
            styles.selectButton,
            error && styles.selectButtonError,
            disabled && styles.selectButtonDisabled,
          ]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <View style={styles.selectButtonContent}>
            <Text
              style={[
                styles.selectButtonText,
                !selectedLabel && styles.selectButtonPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedLabel || 'Seçiniz'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
          </View>
        </TouchableOpacity>
        {disabled && isDirectionLocked && (
          <Text style={styles.infoText}>
            Yük yönü bu sayfadan otomatik belirlendi
          </Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    )
  }

  return (
    <>
      <View style={styles.container}>
        {/* Temel Bilgiler Kartı */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Temel Bilgiler</Text>
          <Text style={styles.cardDescription}>
            Yük hakkında temel bilgileri girin
          </Text>

          {/* Müşteri Seçimi */}
          {onCustomerChange && (
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Müşteri <Text style={{ color: DashboardColors.danger }}>*</Text>
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
                        onCustomerChange(null)
                        updateFormData('customer_id', undefined)
                      }
                    }}
                    onSelect={(option) => {
                      if (option) {
                        onCustomerChange({
                          label: option.label,
                          value: option.value as number,
                          subtitle: option.subtitle,
                        })
                        updateFormData('customer_id', option.value)
                      }
                    }}
                    loadOptions={loadContacts}
                    renderOption={(option) => (
                      <View>
                        <Text style={styles.optionLabel}>
                          {option.label}
                        </Text>
                        {option.subtitle && (
                          <Text style={styles.optionSubtitle}>
                            {option.subtitle}
                          </Text>
                        )}
                      </View>
                    )}
                  />
                </View>
                {onAddCustomerClick && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddCustomerClick}
                  >
                    <Ionicons name="add" size={20} color={DashboardColors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {errors.customer_id && (
                <Text style={styles.errorText}>
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
            <Text style={styles.checkboxLabel}>
              Yük Havuzunda yayınla
            </Text>
          </View>
        </Card>

        {/* Firma Bilgileri Kartı */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Firma Bilgileri</Text>
          <Text style={styles.cardDescription}>
            Gönderici, üretici ve alıcı firma bilgileri
          </Text>

          {/* Gönderici Firma */}
          {onSenderChange && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Gönderici Firma</Text>
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
                        onSenderChange(null)
                        updateFormData('sender_company_id', undefined)
                      }
                    }}
                    onSelect={(option) => {
                      if (option) {
                        onSenderChange({
                          label: option.label,
                          value: option.value as number,
                          subtitle: option.subtitle,
                        })
                        updateFormData('sender_company_id', option.value)
                      }
                    }}
                    loadOptions={loadContacts}
                  />
                </View>
                {onAddSenderClick && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddSenderClick}
                  >
                    <Ionicons name="add" size={20} color={DashboardColors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Üretici Firma */}
          {onManufacturerChange && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Üretici Firma</Text>
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
                        onManufacturerChange(null)
                        updateFormData('manufacturer_company_id', undefined)
                      }
                    }}
                    onSelect={(option) => {
                      if (option) {
                        onManufacturerChange({
                          label: option.label,
                          value: option.value as number,
                          subtitle: option.subtitle,
                        })
                        updateFormData('manufacturer_company_id', option.value)
                      }
                    }}
                    loadOptions={loadContacts}
                  />
                </View>
                {onAddManufacturerClick && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddManufacturerClick}
                  >
                    <Ionicons name="add" size={20} color={DashboardColors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Alıcı Firma */}
          {onReceiverChange && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Alıcı Firma</Text>
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
                        onReceiverChange(null)
                        updateFormData('receiver_company_id', undefined)
                      }
                    }}
                    onSelect={(option) => {
                      if (option) {
                        onReceiverChange({
                          label: option.label,
                          value: option.value as number,
                          subtitle: option.subtitle,
                        })
                        updateFormData('receiver_company_id', option.value)
                      }
                    }}
                    loadOptions={loadContacts}
                  />
                </View>
                {onAddReceiverClick && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={onAddReceiverClick}
                  >
                    <Ionicons name="add" size={20} color={DashboardColors.textMuted} />
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
  )
}

const styles = StyleSheet.create({
  container: {
    gap: DashboardSpacing.sm,
  },
  card: {
    padding: DashboardSpacing.md,
  },
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.md,
  },
  fieldGroup: {
    marginBottom: DashboardSpacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.text,
    marginBottom: 4,
  },
  selectButton: {
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface,
    height: 48,
  },
  selectButtonError: {
    borderColor: DashboardColors.danger,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.text,
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  selectButtonPlaceholder: {
    color: DashboardColors.textMuted,
  },
  selectWithAddButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DashboardSpacing.xs,
  },
  selectFlex: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.text,
  },
  optionSubtitle: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.sm,
  },
  checkboxLabel: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.text,
  },
  infoText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 4,
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 2,
  },
})
