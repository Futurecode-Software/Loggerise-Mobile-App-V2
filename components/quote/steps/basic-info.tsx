/**
 * Quote Create - Step 1: Temel Bilgiler
 *
 * Müşteri, tarihler, transport bilgileri
 * CLAUDE.md standardına uygun - BottomSheetModal ile müşteri seçimi
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { DateInput } from '@/components/ui'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { NewQuoteFormData, Direction } from '@/services/endpoints/quotes-new-format'
import { Contact, getContacts } from '@/services/endpoints/contacts'

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
  // Modal refs
  const customerModalRef = useRef<SearchableSelectModalRef>(null)
  const directionModalRef = useRef<SearchableSelectModalRef>(null)
  const vehicleTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const loadingTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const loadTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const transportSpeedModalRef = useRef<SearchableSelectModalRef>(null)

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Contact | null>(null)

  // Load contacts on mount
  useEffect(() => {
    loadContacts()
  }, [])

  // Sync selected customer from data
  useEffect(() => {
    if (data.customer_id && data.customer && !selectedCustomer) {
      setSelectedCustomer({
        id: data.customer_id,
        name: data.customer.name,
        short_name: data.customer.short_name
      } as Contact)
    }
  }, [data.customer_id, data.customer, selectedCustomer])

  const loadContacts = async () => {
    try {
      setIsLoadingContacts(true)
      const response = await getContacts({
        type: 'customer',
        include_potential: true,
        is_active: true,
        per_page: 100
      })
      setContacts(response.contacts || [])
    } catch (err) {
      if (__DEV__) console.error('[BasicInfo] Load contacts error:', err)
      Toast.show({
        type: 'error',
        text1: 'Müşteriler yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingContacts(false)
    }
  }

  // Transform contacts to select options
  const customerOptions: SelectOption<Contact>[] = contacts.map((contact) => ({
    value: contact.id,
    label: contact.name,
    subtitle: contact.code ? `Kod: ${contact.code}` : undefined,
    data: contact
  }))

  // Handle customer selection
  const handleCustomerSelect = useCallback((option: SelectOption<Contact>) => {
    const contact = option.data!
    setSelectedCustomer(contact)
    onChange({
      customer_id: contact.id,
      customer: {
        id: contact.id,
        name: contact.name,
        short_name: contact.short_name || contact.name
      }
    })
  }, [onChange])

  // Transform options to SelectOption format
  const directionOptions: SelectOption[] = DIRECTION_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label
  }))

  const vehicleTypeOptions: SelectOption[] = VEHICLE_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label
  }))

  const loadingTypeOptions: SelectOption[] = LOADING_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label
  }))

  const loadTypeOptions: SelectOption[] = LOAD_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label
  }))

  const transportSpeedOptions: SelectOption[] = TRANSPORT_SPEED_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label
  }))

  // Get selected label helper
  const getSelectedLabel = (value: string | undefined, options: { label: string; value: string }[]) => {
    if (!value) return null
    return options.find((opt) => opt.value === value)?.label || null
  }

  // Render section header
  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )

  return (
    <>
      {/* Müşteri Bilgileri */}
      <View style={styles.section}>
        {renderSectionHeader('Müşteri Bilgileri', 'person-outline')}
        <View style={styles.sectionContent}>
          <Text style={styles.inputLabel}>Müşteri *</Text>
          {selectedCustomer ? (
            <View style={styles.selectedItem}>
              <View style={styles.selectedItemIcon}>
                <Ionicons name="person" size={20} color={DashboardColors.primary} />
              </View>
              <View style={styles.selectedItemInfo}>
                <Text style={styles.selectedItemName}>{selectedCustomer.name}</Text>
                {selectedCustomer.code && (
                  <Text style={styles.selectedItemCode}>Kod: {selectedCustomer.code}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCustomer(null)
                  onChange({ customer_id: undefined, customer: undefined })
                }}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={22} color={DashboardColors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => customerModalRef.current?.present()}
              disabled={isLoadingContacts}
            >
              {isLoadingContacts ? (
                <ActivityIndicator size="small" color={DashboardColors.primary} />
              ) : (
                <>
                  <Ionicons name="person-outline" size={20} color={DashboardColors.textSecondary} />
                  <Text style={styles.selectButtonText}>Müşteri seçiniz</Text>
                  <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tarihler */}
      <View style={styles.section}>
        {renderSectionHeader('Tarihler', 'calendar-outline')}
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <DateInput
                label="Teklif Tarihi *"
                value={data.quote_date || ''}
                onChangeText={(value) => onChange({ quote_date: value })}
                required
              />
            </View>

            <View style={styles.halfColumn}>
              <DateInput
                label="Geçerlilik Tarihi *"
                value={data.valid_until || ''}
                onChangeText={(value) => onChange({ valid_until: value })}
                required
                minimumDate={data.quote_date}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Transport Bilgileri */}
      <View style={styles.section}>
        {renderSectionHeader('Taşıma Bilgileri', 'car-outline')}
        <View style={styles.sectionContent}>
          {/* Yük Yönü */}
          <View>
            <Text style={styles.inputLabel}>Yük Yönü</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => directionModalRef.current?.present()}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color={data.direction ? DashboardColors.primary : DashboardColors.textSecondary} />
              <Text style={[styles.selectButtonText, data.direction && styles.selectButtonTextSelected]}>
                {getSelectedLabel(data.direction, DIRECTION_OPTIONS) || 'Seçiniz...'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Araç Tipi */}
          <View>
            <Text style={styles.inputLabel}>Araç Tipi</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => vehicleTypeModalRef.current?.present()}
            >
              <Ionicons name="car-outline" size={20} color={data.vehicle_type ? DashboardColors.primary : DashboardColors.textSecondary} />
              <Text style={[styles.selectButtonText, data.vehicle_type && styles.selectButtonTextSelected]}>
                {getSelectedLabel(data.vehicle_type, VEHICLE_TYPE_OPTIONS) || 'Seçiniz...'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            {/* Yükleme Tipi */}
            <View style={styles.halfColumn}>
              <Text style={styles.inputLabel}>Yükleme Tipi *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => loadingTypeModalRef.current?.present()}
              >
                <Text style={[styles.selectButtonText, data.loading_type && styles.selectButtonTextSelected]}>
                  {getSelectedLabel(data.loading_type, LOADING_TYPE_OPTIONS) || 'Seçiniz...'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Yük Tipi */}
            <View style={styles.halfColumn}>
              <Text style={styles.inputLabel}>Yük Tipi</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => loadTypeModalRef.current?.present()}
              >
                <Text style={[styles.selectButtonText, data.load_type && styles.selectButtonTextSelected]}>
                  {getSelectedLabel(data.load_type, LOAD_TYPE_OPTIONS) || 'Seçiniz...'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Yük Taşıma Hızı */}
          <View>
            <Text style={styles.inputLabel}>Yük Taşıma Hızı *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => transportSpeedModalRef.current?.present()}
            >
              <Ionicons name="speedometer-outline" size={20} color={data.transport_speed ? DashboardColors.primary : DashboardColors.textSecondary} />
              <Text style={[styles.selectButtonText, data.transport_speed && styles.selectButtonTextSelected]}>
                {getSelectedLabel(data.transport_speed, TRANSPORT_SPEED_OPTIONS) || 'Seçiniz...'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Customer Select Modal */}
      <SearchableSelectModal
        ref={customerModalRef}
        title="Müşteri Seçin"
        options={customerOptions}
        selectedValue={selectedCustomer?.id}
        onSelect={handleCustomerSelect}
        searchPlaceholder="Müşteri ara..."
        emptyMessage="Müşteri bulunamadı"
        loading={isLoadingContacts}
      />

      {/* Direction Select Modal */}
      <SearchableSelectModal
        ref={directionModalRef}
        title="Yük Yönü Seçin"
        options={directionOptions}
        selectedValue={data.direction}
        onSelect={(option) => onChange({ direction: option.value as Direction })}
        searchPlaceholder="Ara..."
        emptyMessage="Sonuç bulunamadı"
      />

      {/* Vehicle Type Select Modal */}
      <SearchableSelectModal
        ref={vehicleTypeModalRef}
        title="Araç Tipi Seçin"
        options={vehicleTypeOptions}
        selectedValue={data.vehicle_type}
        onSelect={(option) => onChange({ vehicle_type: option.value as string })}
        searchPlaceholder="Araç tipi ara..."
        emptyMessage="Sonuç bulunamadı"
      />

      {/* Loading Type Select Modal */}
      <SearchableSelectModal
        ref={loadingTypeModalRef}
        title="Yükleme Tipi Seçin"
        options={loadingTypeOptions}
        selectedValue={data.loading_type}
        onSelect={(option) => onChange({ loading_type: option.value as string })}
        searchPlaceholder="Ara..."
        emptyMessage="Sonuç bulunamadı"
      />

      {/* Load Type Select Modal */}
      <SearchableSelectModal
        ref={loadTypeModalRef}
        title="Yük Tipi Seçin"
        options={loadTypeOptions}
        selectedValue={data.load_type}
        onSelect={(option) => onChange({ load_type: option.value as 'full' | 'partial' })}
        searchPlaceholder="Ara..."
        emptyMessage="Sonuç bulunamadı"
      />

      {/* Transport Speed Select Modal */}
      <SearchableSelectModal
        ref={transportSpeedModalRef}
        title="Yük Taşıma Hızı Seçin"
        options={transportSpeedOptions}
        selectedValue={data.transport_speed}
        onSelect={(option) => onChange({ transport_speed: option.value as string })}
        searchPlaceholder="Ara..."
        emptyMessage="Sonuç bulunamadı"
      />
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  sectionContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    minHeight: 48
  },
  selectButtonText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },
  selectButtonTextSelected: {
    color: DashboardColors.textPrimary
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    minHeight: 56,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectedItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedItemInfo: {
    flex: 1
  },
  selectedItemName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  selectedItemCode: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  removeButton: {
    padding: DashboardSpacing.xs
  },
  row: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  halfColumn: {
    flex: 1
  },
  bottomActions: {
    marginTop: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl
  },
  nextButtonText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: '#FFFFFF'
  }
})
