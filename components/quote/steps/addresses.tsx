/**
 * Quote Create - Step 3: Adresler
 *
 * Yükleme ve teslimat adresi seçimi + yeni adres ekleme
 * CLAUDE.md standardına uygun - BottomSheetModal ile adres seçimi
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
import { SelectInput } from '@/components/ui'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals'
import { AddressFormSheet, AddressFormSheetRef } from '@/components/contact/address-form-sheet'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import {
  NewQuoteFormData,
  PickupType,
  DeliveryType
} from '@/services/endpoints/quotes-new-format'
import {
  ContactAddress,
  getContactAddresses
} from '@/services/endpoints/contacts'

interface QuoteCreateAddressesScreenProps {
  data: Partial<NewQuoteFormData>
  onChange: (updates: Partial<NewQuoteFormData>) => void
  onNext: () => void
  onBack: () => void
}

const PICKUP_TYPE_OPTIONS = [
  { label: 'Ön Taşıma', value: 'pre_transport' },
  { label: 'Doğrudan Adresten', value: 'direct_from_address' },
  { label: 'Müşteri Deposundan', value: 'customer_to_warehouse' }
]

const DELIVERY_TYPE_OPTIONS = [
  { label: 'Adrese Teslimat', value: 'deliver_to_address' },
  { label: 'Son Taşıma', value: 'final_transport' },
  { label: 'Depodan Teslim Alma', value: 'pickup_from_warehouse' }
]

export function QuoteCreateAddressesScreen({
  data,
  onChange,
  onNext,
  onBack
}: QuoteCreateAddressesScreenProps) {
  // Modal refs
  const pickupAddressModalRef = useRef<SearchableSelectModalRef>(null)
  const deliveryAddressModalRef = useRef<SearchableSelectModalRef>(null)
  const addressFormSheetRef = useRef<AddressFormSheetRef>(null)

  // Address data
  const [pickupAddresses, setPickupAddresses] = useState<ContactAddress[]>([])
  const [deliveryAddresses, setDeliveryAddresses] = useState<ContactAddress[]>([])
  const [isLoadingPickup, setIsLoadingPickup] = useState(false)
  const [isLoadingDelivery, setIsLoadingDelivery] = useState(false)

  // Selected address details (for display)
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<ContactAddress | null>(null)
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<ContactAddress | null>(null)

  // Address form mode (pickup or delivery)
  const [addressFormMode, setAddressFormMode] = useState<'pickup' | 'delivery'>('pickup')

  // Load addresses when customer changes
  const loadPickupAddresses = useCallback(async () => {
    if (!data.customer_id) return
    try {
      setIsLoadingPickup(true)
      const response = await getContactAddresses(data.customer_id, { is_shipping: true })
      setPickupAddresses(response.addresses || [])
    } catch (err) {
      if (__DEV__) console.error('[Addresses] Load pickup addresses error:', err)
      Toast.show({
        type: 'error',
        text1: 'Yükleme adresleri yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingPickup(false)
    }
  }, [data.customer_id])

  const loadDeliveryAddresses = useCallback(async () => {
    if (!data.customer_id) return
    try {
      setIsLoadingDelivery(true)
      const response = await getContactAddresses(data.customer_id, { is_shipping: true })
      setDeliveryAddresses(response.addresses || [])
    } catch (err) {
      if (__DEV__) console.error('[Addresses] Load delivery addresses error:', err)
      Toast.show({
        type: 'error',
        text1: 'Teslimat adresleri yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingDelivery(false)
    }
  }, [data.customer_id])

  // Load addresses on customer change
  useEffect(() => {
    if (data.customer_id) {
      loadPickupAddresses()
      loadDeliveryAddresses()
    } else {
      setPickupAddresses([])
      setDeliveryAddresses([])
      setSelectedPickupAddress(null)
      setSelectedDeliveryAddress(null)
    }
  }, [data.customer_id, loadPickupAddresses, loadDeliveryAddresses])

  // Sync selected pickup address from ID
  useEffect(() => {
    if (data.pickup_contact_address_id && pickupAddresses.length > 0) {
      const addr = pickupAddresses.find((a) => a.id === data.pickup_contact_address_id)
      setSelectedPickupAddress(addr || null)
    } else if (!data.pickup_contact_address_id) {
      setSelectedPickupAddress(null)
    }
  }, [data.pickup_contact_address_id, pickupAddresses])

  // Sync selected delivery address from ID
  useEffect(() => {
    if (data.delivery_contact_address_id && deliveryAddresses.length > 0) {
      const addr = deliveryAddresses.find((a) => a.id === data.delivery_contact_address_id)
      setSelectedDeliveryAddress(addr || null)
    } else if (!data.delivery_contact_address_id) {
      setSelectedDeliveryAddress(null)
    }
  }, [data.delivery_contact_address_id, deliveryAddresses])

  // Handlers
  const handlePickupAddressSelect = useCallback((option: SelectOption<ContactAddress>) => {
    const address = option.data!
    setSelectedPickupAddress(address)
    onChange({
      pickup_contact_address_id: address.id,
      new_pickup_address: undefined
    })
  }, [onChange])

  const handleDeliveryAddressSelect = useCallback((option: SelectOption<ContactAddress>) => {
    const address = option.data!
    setSelectedDeliveryAddress(address)
    onChange({
      delivery_contact_address_id: address.id,
      new_delivery_address: undefined
    })
  }, [onChange])

  const handleOpenNewAddressForm = useCallback((mode: 'pickup' | 'delivery') => {
    setAddressFormMode(mode)
    setTimeout(() => {
      addressFormSheetRef.current?.present()
    }, 100)
  }, [])

  const handleAddressFormSuccess = useCallback(() => {
    // Yeni adres eklendi, listeleri yenile
    if (addressFormMode === 'pickup') {
      loadPickupAddresses()
    } else {
      loadDeliveryAddresses()
    }
  }, [addressFormMode, loadPickupAddresses, loadDeliveryAddresses])

  const handleRemovePickupAddress = useCallback(() => {
    setSelectedPickupAddress(null)
    onChange({ pickup_contact_address_id: undefined })
  }, [onChange])

  const handleRemoveDeliveryAddress = useCallback(() => {
    setSelectedDeliveryAddress(null)
    onChange({ delivery_contact_address_id: undefined })
  }, [onChange])

  // Transform addresses to select options
  const pickupAddressOptions: SelectOption<ContactAddress>[] = pickupAddresses.map((addr) => ({
    value: addr.id,
    label: addr.title,
    subtitle: addr.address_line_1 || addr.address || '',
    data: addr
  }))

  const deliveryAddressOptions: SelectOption<ContactAddress>[] = deliveryAddresses.map((addr) => ({
    value: addr.id,
    label: addr.title,
    subtitle: addr.address_line_1 || addr.address || '',
    data: addr
  }))

  // Section header helper (basic-info.tsx ile aynı pattern)
  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )

  // Address display helper
  const renderSelectedAddress = (
    address: ContactAddress,
    onRemove: () => void
  ) => (
    <View style={styles.selectedAddress}>
      <View style={styles.selectedAddressIcon}>
        <Ionicons name="location" size={20} color={DashboardColors.primary} />
      </View>
      <View style={styles.selectedAddressInfo}>
        <Text style={styles.selectedAddressTitle}>{address.title}</Text>
        <Text style={styles.selectedAddressText} numberOfLines={2}>
          {address.address_line_1 || address.address}
        </Text>
        {(address.city || address.country) && (
          <Text style={styles.selectedAddressSubtext}>
            {[address.city?.name, address.country?.name].filter(Boolean).join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Ionicons name="close-circle" size={22} color={DashboardColors.danger} />
      </TouchableOpacity>
    </View>
  )

  // Address select + add new button helper
  const renderAddressSelector = (
    type: 'pickup' | 'delivery',
    modalRef: React.RefObject<SearchableSelectModalRef | null>,
    isLoading: boolean
  ) => (
    <>
      <View>
        <Text style={styles.inputLabel}>Adres Seçin</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => modalRef.current?.present()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={DashboardColors.primary} />
          ) : (
            <>
              <Ionicons name="location-outline" size={20} color={DashboardColors.textSecondary} />
              <Text style={styles.selectButtonText}>Adres seçiniz</Text>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleOpenNewAddressForm(type)}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={20} color={DashboardColors.primary} />
        <Text style={styles.addButtonText}>Yeni Adres Ekle</Text>
      </TouchableOpacity>
    </>
  )

  // Warning box for no customer
  const renderNoCustomerWarning = () => (
    <View style={styles.warningBox}>
      <Ionicons name="warning-outline" size={20} color={DashboardColors.warning} />
      <Text style={styles.warningText}>
        Adres seçmek için önce müşteri seçiniz
      </Text>
    </View>
  )

  return (
    <>
      {/* Yükleme Adresi */}
      <View style={styles.section}>
        {renderSectionHeader('Yükleme Adresi', 'location-outline')}
        <View style={styles.sectionContent}>
          <SelectInput
            label="Teslim Alma Tipi"
            placeholder="Seçiniz..."
            value={data.pickup_type}
            onValueChange={(value) => onChange({ pickup_type: value as PickupType })}
            options={PICKUP_TYPE_OPTIONS}
          />

          {!data.customer_id ? (
            renderNoCustomerWarning()
          ) : selectedPickupAddress ? (
            renderSelectedAddress(selectedPickupAddress, handleRemovePickupAddress)
          ) : (
            renderAddressSelector('pickup', pickupAddressModalRef, isLoadingPickup)
          )}
        </View>
      </View>

      {/* Teslimat Adresi */}
      <View style={styles.section}>
        {renderSectionHeader('Teslimat Adresi', 'navigate-outline')}
        <View style={styles.sectionContent}>
          <SelectInput
            label="Teslim Etme Tipi"
            placeholder="Seçiniz..."
            value={data.delivery_type}
            onValueChange={(value) => onChange({ delivery_type: value as DeliveryType })}
            options={DELIVERY_TYPE_OPTIONS}
          />

          {!data.customer_id ? (
            renderNoCustomerWarning()
          ) : selectedDeliveryAddress ? (
            renderSelectedAddress(selectedDeliveryAddress, handleRemoveDeliveryAddress)
          ) : (
            renderAddressSelector('delivery', deliveryAddressModalRef, isLoadingDelivery)
          )}
        </View>
      </View>

      {/* Pickup Address Select Modal */}
      <SearchableSelectModal
        ref={pickupAddressModalRef}
        title="Yükleme Adresi Seçin"
        options={pickupAddressOptions}
        selectedValue={data.pickup_contact_address_id}
        onSelect={handlePickupAddressSelect}
        searchPlaceholder="Adres ara..."
        emptyMessage="Adres bulunamadı"
        loading={isLoadingPickup}
      />

      {/* Delivery Address Select Modal */}
      <SearchableSelectModal
        ref={deliveryAddressModalRef}
        title="Teslimat Adresi Seçin"
        options={deliveryAddressOptions}
        selectedValue={data.delivery_contact_address_id}
        onSelect={handleDeliveryAddressSelect}
        searchPlaceholder="Adres ara..."
        emptyMessage="Adres bulunamadı"
        loading={isLoadingDelivery}
      />

      {/* Address Form Sheet (shared for pickup and delivery) */}
      {data.customer_id && (
        <AddressFormSheet
          ref={addressFormSheetRef}
          contactId={data.customer_id}
          address={null}
          onSuccess={handleAddressFormSuccess}
        />
      )}
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
  selectedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    minHeight: 72,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectedAddressIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedAddressInfo: {
    flex: 1
  },
  selectedAddressTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  selectedAddressText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  selectedAddressSubtext: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 2
  },
  removeButton: {
    padding: DashboardSpacing.xs
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.lg,
    paddingVertical: DashboardSpacing.md
  },
  addButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.warningBg,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md
  },
  warningText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: '#92400E'
  }
})
