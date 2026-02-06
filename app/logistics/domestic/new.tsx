/**
 * New Domestic Transport Order Screen
 *
 * Create new domestic transport order with customer, addresses, and items.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input, DateInput } from '@/components/ui'
import { SearchableSelectModal } from '@/components/modals/SearchableSelectModal'
import {
  createDomesticOrder,
  DomesticOrderType,
  DomesticBillingType
} from '@/services/endpoints/domestic-orders'
import api, { getErrorMessage, getValidationErrors } from '@/services/api'

// Order type options
const ORDER_TYPE_OPTIONS = [
  { label: 'Sipariş tipi seçiniz...', value: '' },
  { label: 'Ön Taşıma', value: 'pre_carriage' },
  { label: 'Dağıtım', value: 'distribution' },
  { label: 'Şehir İçi Teslimat', value: 'city_delivery' },
  { label: 'Depo Transferi', value: 'warehouse_transfer' },
]

// Billing type options
const BILLING_TYPE_OPTIONS = [
  { label: 'Faturalama tipi seçiniz...', value: '' },
  { label: 'Ana Faturaya Dahil', value: 'included_in_main' },
  { label: 'Ayrı Fatura', value: 'separate_invoice' },
  { label: 'Masraf Merkezi', value: 'cost_center' },
]

// Tabs
const TABS = [
  { id: 'general', label: 'Genel', icon: 'document-text-outline' as const },
  { id: 'addresses', label: 'Adresler', icon: 'location-outline' as const },
  { id: 'items', label: 'Kalemler', icon: 'cube-outline' as const }
]

interface Customer {
  id: number
  name: string
  code?: string
}

interface Address {
  id: number
  title?: string
  address?: string
  contact_id: number
}

export default function NewDomesticOrderScreen() {
  const insets = useSafeAreaInsets()

  // Animasyonlu orb'lar için shared values
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  useEffect(() => {
    orb1TranslateY.value = withRepeat(
      withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb1Scale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb2TranslateX.value = withRepeat(
      withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb2Scale.value = withRepeat(
      withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const orb1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: orb1TranslateY.value },
      { scale: orb1Scale.value }
    ]
  }))

  const orb2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2TranslateX.value },
      { scale: orb2Scale.value }
    ]
  }))

  const [activeTab, setActiveTab] = useState('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Data for selects
  const [customers, setCustomers] = useState<Customer[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    order_type: '' as DomesticOrderType | '',
    billing_type: '' as DomesticBillingType | '',
    customer_id: '',
    pickup_address_id: '',
    delivery_address_id: '',
    pickup_expected_date: '',
    delivery_expected_date: '',
    notes: '',
    // Items will be added later
  })

  const orderTypeRef = useRef(null)
  const billingTypeRef = useRef(null)
  const customerRef = useRef(null)
  const pickupAddressRef = useRef(null)
  const deliveryAddressRef = useRef(null)

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await api.get('/contacts', {
          params: { per_page: 100, is_active: true, type: 'customer' },
        })

        let customerList: Customer[] = []
        if (response.data?.data?.contacts) {
          customerList = response.data.data.contacts
        } else if (Array.isArray(response.data?.data)) {
          customerList = response.data.data
        } else if (Array.isArray(response.data)) {
          customerList = response.data
        }

        setCustomers(customerList)
      } catch (err) {
        console.error('Failed to load customers:', err)
      } finally {
        setLoadingCustomers(false)
      }
    }

    loadCustomers()
  }, [])

  // Load addresses when customer changes
  useEffect(() => {
    if (!formData.customer_id) {
      setAddresses([])
      return
    }

    const loadAddresses = async () => {
      try {
        const response = await api.get(`/contacts/${formData.customer_id}/addresses`)

        let addressList: Address[] = []
        if (response.data?.data?.addresses) {
          addressList = response.data.data.addresses
        } else if (Array.isArray(response.data?.data)) {
          addressList = response.data.data
        } else if (Array.isArray(response.data)) {
          addressList = response.data
        }

        setAddresses(addressList)
      } catch (err) {
        console.error('Failed to load addresses:', err)
        setAddresses([])
      }
    }

    loadAddresses()
  }, [formData.customer_id])

  // Handle input change
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.order_type) {
      newErrors.order_type = 'Sipariş tipi zorunludur'
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Müşteri seçimi zorunludur'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      // Switch to tab with first error
      if (errors.order_type || errors.customer_id || errors.billing_type) {
        setActiveTab('general')
      } else if (errors.pickup_address_id || errors.delivery_address_id) {
        setActiveTab('addresses')
      }
      return
    }

    setIsSubmitting(true)
    try {
      const data: Record<string, any> = {}

      // Only send non-empty values
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          data[key] = value
        }
      })

      // Set default status
      data.status = 'draft'

      await createDomesticOrder(data)

      Toast.show({
        type: 'success',
        text1: 'İş emri oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (err: any) {
      const validationErrors = getValidationErrors(err)
      if (validationErrors) {
        const flatErrors: Record<string, string> = {}
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0]
          }
        })
        setErrors(flatErrors)
      } else {
        Toast.show({
          type: 'error',
          text1: getErrorMessage(err),
          position: 'top',
          visibilityTime: 1500
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, errors])

  // Count errors per tab
  const getTabErrorCount = useCallback((tabId: string) => {
    const tabFields: Record<string, string[]> = {
      general: ['order_type', 'billing_type', 'customer_id', 'pickup_expected_date', 'delivery_expected_date', 'notes'],
      addresses: ['pickup_address_id', 'delivery_address_id'],
      items: [],
    }

    return Object.keys(errors).filter((field) => tabFields[tabId]?.includes(field)).length
  }, [errors])

  // Customer options for select
  const customerOptions = [
    { label: 'Müşteri seçiniz...', value: '' },
    ...customers.map((c) => ({
      label: c.code ? `${c.name} (${c.code})` : c.name,
      value: String(c.id),
    })),
  ]

  // Address options for select
  const addressOptions = [
    { label: 'Adres seçiniz...', value: '' },
    ...addresses.map((a) => ({
      label: a.title || a.address || `Adres ${a.id}`,
      value: String(a.id),
    })),
  ]

  const renderGeneralTab = () => (
    <>
      <TouchableOpacity onPress={() => orderTypeRef.current?.present()} style={styles.selectTrigger}>
        <Text style={styles.selectLabel}>Siparis Tipi *</Text>
        <View style={styles.selectValueRow}>
          <Text style={[styles.selectValue, !formData.order_type && styles.selectPlaceholder]}>
            {ORDER_TYPE_OPTIONS.find(o => o.value === formData.order_type)?.label || 'Siparis tipi seciniz...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
        </View>
        {errors.order_type && <Text style={styles.selectError}>{errors.order_type}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => billingTypeRef.current?.present()} style={styles.selectTrigger}>
        <Text style={styles.selectLabel}>Faturalama Tipi</Text>
        <View style={styles.selectValueRow}>
          <Text style={[styles.selectValue, !formData.billing_type && styles.selectPlaceholder]}>
            {BILLING_TYPE_OPTIONS.find(o => o.value === formData.billing_type)?.label || 'Faturalama tipi seciniz...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
        </View>
        {errors.billing_type && <Text style={styles.selectError}>{errors.billing_type}</Text>}
      </TouchableOpacity>

      {loadingCustomers ? (
        <View style={styles.loadingSelect}>
          <ActivityIndicator size="small" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Müşteriler yükleniyor...</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => customerRef.current?.present()} style={styles.selectTrigger}>
        <Text style={styles.selectLabel}>Musteri *</Text>
        <View style={styles.selectValueRow}>
          <Text style={[styles.selectValue, !formData.customer_id && styles.selectPlaceholder]}>
            {customerOptions.find(o => o.value === formData.customer_id)?.label || 'Musteri seciniz...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
        </View>
        {errors.customer_id && <Text style={styles.selectError}>{errors.customer_id}</Text>}
      </TouchableOpacity>
      )}

      <DateInput
        label="Planlanan Alım Tarihi"
        placeholder="Tarih seçiniz"
        value={formData.pickup_expected_date}
        onChangeText={(text) => handleInputChange('pickup_expected_date', text)}
        error={errors.pickup_expected_date}
      />

      <DateInput
        label="Planlanan Teslimat Tarihi"
        placeholder="Tarih seçiniz"
        value={formData.delivery_expected_date}
        onChangeText={(text) => handleInputChange('delivery_expected_date', text)}
        error={errors.delivery_expected_date}
      />

      <Input
        label="Notlar"
        placeholder="Sipariş ile ilgili notlar..."
        value={formData.notes}
        onChangeText={(text) => handleInputChange('notes', text)}
        error={errors.notes}
        multiline
        numberOfLines={3}
      />
    </>
  )

  const renderAddressesTab = () => (
    <>
      {!formData.customer_id ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Adres seçimi için önce müşteri seçmeniz gerekmektedir.
          </Text>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Bu müşteriye tanımlı adres bulunmamaktadır.
          </Text>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={() => pickupAddressRef.current?.present()} style={styles.selectTrigger}>
            <Text style={styles.selectLabel}>Alım Adresi</Text>
            <View style={styles.selectValueRow}>
              <Text style={[styles.selectValue, !formData.pickup_address_id && styles.selectPlaceholder]}>
                {addressOptions.find(o => o.value === formData.pickup_address_id)?.label || 'Adres seçiniz...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
            </View>
            {errors.pickup_address_id && <Text style={styles.selectError}>{errors.pickup_address_id}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => deliveryAddressRef.current?.present()} style={styles.selectTrigger}>
            <Text style={styles.selectLabel}>Teslimat Adresi</Text>
            <View style={styles.selectValueRow}>
              <Text style={[styles.selectValue, !formData.delivery_address_id && styles.selectPlaceholder]}>
                {addressOptions.find(o => o.value === formData.delivery_address_id)?.label || 'Adres seçiniz...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
            </View>
            {errors.delivery_address_id && <Text style={styles.selectError}>{errors.delivery_address_id}</Text>}
          </TouchableOpacity>
        </>
      )}
    </>
  )

  const renderItemsTab = () => (
    <View style={styles.emptyItems}>
      <Ionicons name="cube-outline" size={48} color={DashboardColors.textMuted} />
      <Text style={styles.emptyItemsText}>
        Kalemler sipariş oluşturulduktan sonra eklenebilir.
      </Text>
    </View>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab()
      case 'addresses':
        return renderAddressesTab()
      case 'items':
        return renderItemsTab()
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient and animated orbs */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Dekoratif ışık efektleri - Animasyonlu */}
        <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
        <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            {/* Sol: Geri Butonu */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni İş Emri</Text>
            </View>

            {/* Sağ: Kaydet Butonu */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => {
            const errorCount = getTabErrorCount(tab.id)
            const isActive = activeTab === tab.id

            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && styles.tabActive
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <View style={styles.tabHeader}>
                  <Ionicons name={tab.icon} size={18} color={isActive ? DashboardColors.primary : DashboardColors.textSecondary} />
                  {errorCount > 0 && (
                    <View style={styles.errorBadge}>
                      <Text style={styles.errorBadgeText}>{errorCount}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                    errorCount > 0 && styles.tabTextError
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Form Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {renderTabContent()}
      </KeyboardAwareScrollView>

      {/* SearchableSelectModal Components */}
      <SearchableSelectModal
        ref={orderTypeRef}
        title="Sipariş Tipi Seçiniz"
        options={ORDER_TYPE_OPTIONS.filter(o => o.value !== '').map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.order_type}
        onSelect={(value) => handleInputChange('order_type', value)}
        searchPlaceholder="Sipariş tipi ara..."
        emptyMessage="Sipariş tipi bulunamadı"
      />

      <SearchableSelectModal
        ref={billingTypeRef}
        title="Faturalama Tipi Seçiniz"
        options={BILLING_TYPE_OPTIONS.filter(o => o.value !== '').map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.billing_type}
        onSelect={(value) => handleInputChange('billing_type', value)}
        searchPlaceholder="Faturalama tipi ara..."
        emptyMessage="Faturalama tipi bulunamadı"
      />

      <SearchableSelectModal
        ref={customerRef}
        title="Müşteri Seçiniz"
        options={customerOptions.filter(o => o.value !== '').map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.customer_id}
        onSelect={(value) => handleInputChange('customer_id', value)}
        searchPlaceholder="Müşteri ara..."
        emptyMessage="Müşteri bulunamadı"
        loading={loadingCustomers}
      />

      <SearchableSelectModal
        ref={pickupAddressRef}
        title="Alım Adresi Seçiniz"
        options={addressOptions.filter(o => o.value !== '').map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.pickup_address_id}
        onSelect={(value) => handleInputChange('pickup_address_id', value)}
        searchPlaceholder="Adres ara..."
        emptyMessage="Adres bulunamadı"
      />

      <SearchableSelectModal
        ref={deliveryAddressRef}
        title="Teslimat Adresi Seçiniz"
        options={addressOptions.filter(o => o.value !== '').map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.delivery_address_id}
        onSelect={(value) => handleInputChange('delivery_address_id', value)}
        searchPlaceholder="Adres ara..."
        emptyMessage="Adres bulunamadı"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  headerContainer: {
    position: 'relative',
    paddingBottom: 24,
    overflow: 'hidden'
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70,
    paddingBottom: DashboardSpacing.lg
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.md
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center'
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.5
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.background,
    paddingTop: 0,
  },
  tabsContent: {
    paddingHorizontal: DashboardSpacing.sm
  },
  tab: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    minWidth: 80
  },
  tabActive: {
    borderBottomColor: DashboardColors.primary
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.xs,
    gap: 4
  },
  tabText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    textAlign: 'center',
    color: DashboardColors.textSecondary
  },
  tabTextActive: {
    color: DashboardColors.primary
  },
  tabTextError: {
    color: '#DC2626'
  },
  errorBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4
  },
  errorBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl'],
    gap: DashboardSpacing.md
  },
  loadingSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.md
  },
  loadingText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  warningBox: {
    padding: DashboardSpacing.lg,
    backgroundColor: '#f5a623' + '15',
    borderRadius: DashboardBorderRadius.md
  },
  warningText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    textAlign: 'center'
  },
  emptyItems: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl']
  },
  selectTrigger: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    padding: DashboardSpacing.md
  },
  selectLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
  },
  selectValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectValue: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    flex: 1
  },
  selectPlaceholder: {
    color: DashboardColors.textMuted
  },
  selectError: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs
  },
  emptyItemsText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.md,
    textAlign: 'center'
  }
})
