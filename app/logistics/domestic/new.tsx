/**
 * New Domestic Transport Order Screen
 *
 * Create new domestic transport order with customer, addresses, and items.
 * CLAUDE.md form sayfası standardına uygun - animasyonlu header + KeyboardAwareScrollView
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
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
import { DomesticFormStepper } from '@/components/domestic-form/DomesticFormStepper'
import LoadFormNavigation from '@/components/load-form/LoadFormNavigation'
import {
  createDomesticOrder,
  DomesticOrderType,
  DomesticBillingType
} from '@/services/endpoints/domestic-orders'
import api, { getErrorMessage, getValidationErrors } from '@/services/api'

// Order type options
const ORDER_TYPE_OPTIONS = [
  { label: 'Ön Taşıma', value: 'pre_carriage' },
  { label: 'Dağıtım', value: 'distribution' },
  { label: 'Şehir İçi Teslimat', value: 'city_delivery' },
  { label: 'Depo Transferi', value: 'warehouse_transfer' },
]

// Billing type options
const BILLING_TYPE_OPTIONS = [
  { label: 'Ana Faturaya Dahil', value: 'included_in_main' },
  { label: 'Ayrı Fatura', value: 'separate_invoice' },
  { label: 'Masraf Merkezi', value: 'cost_center' },
]

const TOTAL_STEPS = 3

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Global form state
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
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

  // Validate step
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.order_type) {
        newErrors.order_type = 'Sipariş tipi zorunludur'
      }
      if (!formData.customer_id) {
        newErrors.customer_id = 'Müşteri seçimi zorunludur'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        Toast.show({
          type: 'error',
          text1: Object.values(newErrors)[0],
          position: 'top',
          visibilityTime: 1500
        })
        return false
      }
    }

    return true
  }, [formData])

  // Go to next step
  const goToNextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      return
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep])
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, validateStep, completedSteps])

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // Go to specific step (from stepper)
  const goToStep = useCallback(
    (step: number) => {
      if (step <= currentStep || completedSteps.includes(step)) {
        setCurrentStep(step)
      }
    },
    [currentStep, completedSteps]
  )

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      goToPreviousStep()
    } else {
      router.back()
    }
  }, [currentStep, goToPreviousStep])

  // Submit form
  const handleSubmit = useCallback(async () => {
    // Validate step 1
    if (!validateStep(1)) {
      setCurrentStep(1)
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
  }, [formData, validateStep])

  // Customer options for select
  const customerOptions = customers.map((c) => ({
    label: c.code ? `${c.name} (${c.code})` : c.name,
    value: String(c.id),
  }))

  // Address options for select
  const addressOptions = addresses.map((a) => ({
    label: a.title || a.address || `Adres ${a.id}`,
    value: String(a.id),
  }))

  const renderGeneralStep = () => (
    <>
      <TouchableOpacity onPress={() => orderTypeRef.current?.present()} style={styles.selectTrigger}>
        <Text style={styles.selectLabel}>Sipariş Tipi *</Text>
        <View style={styles.selectValueRow}>
          <Text style={[styles.selectValue, !formData.order_type && styles.selectPlaceholder]}>
            {ORDER_TYPE_OPTIONS.find(o => o.value === formData.order_type)?.label || 'Sipariş tipi seçiniz...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
        </View>
        {errors.order_type && <Text style={styles.selectError}>{errors.order_type}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => billingTypeRef.current?.present()} style={styles.selectTrigger}>
        <Text style={styles.selectLabel}>Faturalama Tipi</Text>
        <View style={styles.selectValueRow}>
          <Text style={[styles.selectValue, !formData.billing_type && styles.selectPlaceholder]}>
            {BILLING_TYPE_OPTIONS.find(o => o.value === formData.billing_type)?.label || 'Faturalama tipi seçiniz...'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
        </View>
        {errors.billing_type && <Text style={styles.selectError}>{errors.billing_type}</Text>}
      </TouchableOpacity>

      {loadingCustomers ? (
        <View style={styles.loadingSelect}>
          <ActivityIndicator size="small" color={DashboardColors.primary} />
          <Text style={styles.loadingSelectText}>Müşteriler yükleniyor...</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => customerRef.current?.present()} style={styles.selectTrigger}>
          <Text style={styles.selectLabel}>Müşteri *</Text>
          <View style={styles.selectValueRow}>
            <Text style={[styles.selectValue, !formData.customer_id && styles.selectPlaceholder]}>
              {customerOptions.find(o => o.value === formData.customer_id)?.label || 'Müşteri seçiniz...'}
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

  const renderAddressesStep = () => (
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

  const renderItemsStep = () => (
    <View style={styles.emptyItems}>
      <Ionicons name="cube-outline" size={48} color={DashboardColors.textMuted} />
      <Text style={styles.emptyItemsText}>
        Kalemler sipariş oluşturulduktan sonra eklenebilir.
      </Text>
    </View>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderGeneralStep()
      case 2:
        return renderAddressesStep()
      case 3:
        return renderItemsStep()
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
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık ve Adım */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni İş Emri</Text>
              <Text style={styles.headerSubtitle}>
                Adım {currentStep} / {TOTAL_STEPS}
              </Text>
            </View>

            {/* Sağ: Boş alan (dengeleme için) */}
            <View style={styles.headerButton} />
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stepper */}
        <DomesticFormStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepPress={goToStep}
        />

        {/* Step Content - Scrollable with Keyboard Support */}
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bottomOffset={20}
        >
          {renderStepContent()}
        </KeyboardAwareScrollView>

        {/* Fixed Bottom Navigation */}
        <LoadFormNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          bottomInset={insets.bottom}
        />

        {/* Loading Overlay */}
        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
            <Text style={styles.loadingText}>İş emri oluşturuluyor...</Text>
          </View>
        )}
      </View>

      {/* SearchableSelectModal Components */}
      <SearchableSelectModal
        ref={orderTypeRef}
        title="Sipariş Tipi Seçiniz"
        options={ORDER_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.order_type}
        onSelect={(value) => handleInputChange('order_type', value)}
        searchPlaceholder="Sipariş tipi ara..."
        emptyMessage="Sipariş tipi bulunamadı"
      />

      <SearchableSelectModal
        ref={billingTypeRef}
        title="Faturalama Tipi Seçiniz"
        options={BILLING_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.billing_type}
        onSelect={(value) => handleInputChange('billing_type', value)}
        searchPlaceholder="Faturalama tipi ara..."
        emptyMessage="Faturalama tipi bulunamadı"
      />

      <SearchableSelectModal
        ref={customerRef}
        title="Müşteri Seçiniz"
        options={customerOptions.map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.customer_id}
        onSelect={(value) => handleInputChange('customer_id', value)}
        searchPlaceholder="Müşteri ara..."
        emptyMessage="Müşteri bulunamadı"
        loading={loadingCustomers}
      />

      <SearchableSelectModal
        ref={pickupAddressRef}
        title="Alım Adresi Seçiniz"
        options={addressOptions.map(o => ({ value: o.value, label: o.label }))}
        selectedValue={formData.pickup_address_id}
        onSelect={(value) => handleInputChange('pickup_address_id', value)}
        searchPlaceholder="Adres ara..."
        emptyMessage="Adres bulunamadı"
      />

      <SearchableSelectModal
        ref={deliveryAddressRef}
        title="Teslimat Adresi Seçiniz"
        options={addressOptions.map(o => ({ value: o.value, label: o.label }))}
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
    overflow: 'hidden',
    paddingBottom: 32
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
    minHeight: 70
  },
  headerButton: {
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
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2
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
  content: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['4xl'],
    gap: DashboardSpacing.md
  },
  // Select styles
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
  loadingSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.md
  },
  loadingSelectText: {
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
  emptyItemsText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.md,
    textAlign: 'center'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: DashboardSpacing.md,
    fontSize: DashboardFontSizes.lg,
    color: '#FFFFFF',
    fontWeight: '500'
  }
})
