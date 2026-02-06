/**
 * New Load Screen - 6 Step Wizard
 *
 * Web versiyonu ile %100 uyumlu - Müşteri/Firma seçimleri, fiyatlandırma kalemleri
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
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
import LoadFormProgress from '@/components/load-form/LoadFormProgress'
import LoadFormNavigation from '@/components/load-form/LoadFormNavigation'
import Step1BasicInfo from '@/components/load-form/Step1BasicInfo'
import Step2LoadItems, { type LoadItem } from '@/components/load-form/Step2LoadItems'
import Step3Addresses, { type LoadAddress } from '@/components/load-form/Step3Addresses'
import Step4Pricing, { type LoadPricingItem } from '@/components/load-form/Step4Pricing'
import Step5InvoiceDeclaration from '@/components/load-form/Step5InvoiceDeclaration'
import Step6CustomsDocuments from '@/components/load-form/Step6CustomsDocuments'
import { createLoad, type LoadFormData } from '@/services/endpoints/loads'

// SelectOption tipi
interface SelectOption {
  label: string
  value: number
  subtitle?: string
}

const STEPS = [
  { id: 1, title: 'Temel Bilgiler', description: 'Yük hakkında temel bilgiler' },
  { id: 2, title: 'Yük Kalemleri', description: 'Yük kalemlerini ekleyin' },
  { id: 3, title: 'Adresler', description: 'Alış ve teslim adresleri' },
  { id: 4, title: 'Fiyatlandırma', description: 'Navlun fiyatlandırması' },
  { id: 5, title: 'Beyanname ve Fatura', description: 'Gümrük ve fatura bilgileri' },
  { id: 6, title: 'Gümrük ve Belgeler', description: 'GTIP, ATR ve belge durumları' },
]

// Default load item
const getDefaultLoadItem = (): LoadItem => ({
  cargo_name: '',
  cargo_name_foreign: '',
  package_type: '',
  package_count: 0,
  piece_count: 0,
  gross_weight: '0',
  net_weight: '0',
  volumetric_weight: '0',
  lademetre_weight: '0',
  total_chargeable_weight: '0',
  width: '0',
  height: '0',
  length: '0',
  volume: '0',
  lademetre: '0',
  is_stackable: false,
  stackable_rows: null,
  is_hazardous: false,
  hazmat_un_no: '',
  hazmat_class: '',
  hazmat_page_no: '',
  hazmat_packing_group: '',
  hazmat_flash_point: '0',
  hazmat_description: '',
})

export default function NewLoadScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ direction?: string }>()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Animated orbs for header
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

  // Form data state
  const [formData, setFormData] = useState<LoadFormData>({
    direction: (params.direction as 'import' | 'export') || undefined,
    is_active: true,
    publish_to_pool: false,
    estimated_value_currency: 'TRY',
  })

  // Items state - ayrı state olarak yönetmek daha performanslı
  const [items, setItems] = useState<LoadItem[]>([getDefaultLoadItem()])
  const [addresses, setAddresses] = useState<LoadAddress[]>([])
  const [pricingItems, setPricingItems] = useState<LoadPricingItem[]>([])

  // Firma seçim state'leri
  const [selectedCustomer, setSelectedCustomer] = useState<SelectOption | null>(null)
  const [selectedSender, setSelectedSender] = useState<SelectOption | null>(null)
  const [selectedManufacturer, setSelectedManufacturer] = useState<SelectOption | null>(null)
  const [selectedReceiver, setSelectedReceiver] = useState<SelectOption | null>(null)

  // Hata state'i
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form data güncelleme
  const updateFormData = useCallback((field: keyof LoadFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Hata temizle
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Müşteri seçim handler'ı
  const handleCustomerChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedCustomer(option)
      updateFormData('customer_id', option?.value)
    },
    [updateFormData]
  )

  // Gönderici firma seçim handler'ı
  const handleSenderChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedSender(option)
      updateFormData('sender_company_id', option?.value)
    },
    [updateFormData]
  )

  // Üretici firma seçim handler'ı
  const handleManufacturerChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedManufacturer(option)
      updateFormData('manufacturer_company_id', option?.value)
    },
    [updateFormData]
  )

  // Alıcı firma seçim handler'ı
  const handleReceiverChange = useCallback(
    async (option: SelectOption | null) => {
      setSelectedReceiver(option)
      updateFormData('receiver_company_id', option?.value)
    },
    [updateFormData]
  )

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.direction) {
        newErrors.direction = 'Yük yönü zorunludur'
      }
      if (!formData.loading_type) {
        newErrors.loading_type = 'Yükleme tipi zorunludur'
      }
      if (!formData.transport_speed) {
        newErrors.transport_speed = 'Taşıma hızı zorunludur'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        Toast.show({
          type: 'error',
          text1: 'Lütfen zorunlu alanları doldurunuz',
          position: 'top',
          visibilityTime: 1500
        })
        return false
      }
    }

    if (step === 2) {
      if (items.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'En az bir yük kalemi eklemelisiniz',
          position: 'top',
          visibilityTime: 1500
        })
        return false
      }

      // Mal adı kontrolü
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.cargo_name || !item.cargo_name.trim()) {
          Toast.show({
            type: 'error',
            text1: `Kalem #${i + 1}: Mal adı zorunludur`,
            position: 'top',
            visibilityTime: 1500
          })
          return false
        }
      }

      // Tehlikeli madde kontrolü
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.is_hazardous) {
          if (!item.hazmat_un_no || !item.hazmat_un_no.trim()) {
            Toast.show({
              type: 'error',
              text1: `Kalem #${i + 1}: Tehlikeli madde için UN No zorunludur`,
              position: 'top',
              visibilityTime: 1500
            })
            return false
          }
          if (!item.hazmat_class || !item.hazmat_class.trim()) {
            Toast.show({
              type: 'error',
              text1: `Kalem #${i + 1}: Tehlikeli madde için Sınıf zorunludur`,
              position: 'top',
              visibilityTime: 1500
            })
            return false
          }
        }
      }
    }

    if (step === 3) {
      if (addresses.length < 2) {
        Toast.show({
          type: 'error',
          text1: 'Alış ve teslim adreslerini ekleyiniz',
          position: 'top',
          visibilityTime: 1500
        })
        return false
      }

      const pickupAddress = addresses.find((a) => a.type === 'pickup')
      const deliveryAddress = addresses.find((a) => a.type === 'delivery')

      if (!pickupAddress?.pickup_type) {
        Toast.show({
          type: 'error',
          text1: 'Teslim alma tipi seçiniz',
          position: 'top',
          visibilityTime: 1500
        })
        return false
      }
      if (!deliveryAddress?.delivery_type) {
        Toast.show({
          type: 'error',
          text1: 'Teslim etme tipi seçiniz',
          position: 'top',
          visibilityTime: 1500
        })
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleStepClick = (stepId: number) => {
    // Önceki adımları validate et
    for (let i = 1; i < stepId; i++) {
      if (!validateStep(i)) {
        return
      }
    }
    setCurrentStep(stepId)
  }

  const handleBack = () => {
    router.back()
  }

  const handleSubmit = async () => {
    // Tüm adımları validate et
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step)
        return
      }
    }

    // Form verilerini hazırla - empty strings'leri null'a çevir
    const cleanedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    ) as LoadFormData

    const submitData: LoadFormData = {
      ...cleanedFormData,
      items: items.map((item) => ({
        cargo_name: item.cargo_name,
        cargo_name_foreign: item.cargo_name_foreign,
        package_type: item.package_type,
        package_count: item.package_count,
        piece_count: item.piece_count,
        gross_weight: parseFloat(item.gross_weight) || 0,
        net_weight: parseFloat(item.net_weight) || 0,
        volumetric_weight: parseFloat(item.volumetric_weight) || 0,
        lademetre_weight: parseFloat(item.lademetre_weight) || 0,
        total_chargeable_weight: parseFloat(item.total_chargeable_weight) || 0,
        width: parseFloat(item.width) || 0,
        height: parseFloat(item.height) || 0,
        length: parseFloat(item.length) || 0,
        volume: parseFloat(item.volume) || 0,
        lademetre: parseFloat(item.lademetre) || 0,
        is_stackable: item.is_stackable,
        stackable_rows: item.stackable_rows,
        is_hazardous: item.is_hazardous,
        hazmat_un_no: item.hazmat_un_no,
        hazmat_class: item.hazmat_class,
        hazmat_page_no: item.hazmat_page_no,
        hazmat_packing_group: item.hazmat_packing_group,
        hazmat_flash_point: item.hazmat_flash_point,
        hazmat_description: item.hazmat_description
      })) as LoadFormData['items'],
      addresses: addresses as LoadFormData['addresses'],
      // Clean pricing items - remove nested 'product' object and convert values
      pricing_items: pricingItems.map((pItem) => ({
        product_id: pItem.product_id || null,
        description: pItem.description || '',
        quantity: parseFloat(pItem.quantity as string) || 1,
        unit: pItem.unit || 'NIU',
        unit_price: parseFloat(pItem.unit_price as string) || 0,
        currency: pItem.currency || 'TRY',
        exchange_rate: parseFloat(pItem.exchange_rate as string) || 1,
        vat_rate: parseFloat(pItem.vat_rate as string) || 0,
        vat_amount: parseFloat(pItem.vat_amount as string) || 0,
        discount_rate: parseFloat(pItem.discount_rate as string) || 0,
        discount_amount: parseFloat(pItem.discount_amount as string) || 0,
        sub_total: parseFloat(pItem.sub_total as string) || 0,
        total: parseFloat(pItem.total as string) || 0,
        sort_order: pItem.sort_order || 0,
        is_active: pItem.is_active !== false
      })) as unknown as LoadFormData['pricing_items']
    }

    try {
      setIsSubmitting(true)
      const response = await createLoad(submitData)

      if (response) {
        Toast.show({
          type: 'success',
          text1: 'Yük başarıyla oluşturuldu',
          position: 'top',
          visibilityTime: 1500
        })
        router.back()
      }
    } catch (error: any) {
      console.error('Load creation error:', error)
      Toast.show({
        type: 'error',
        text1: error?.message || 'Yük oluşturulamadı',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            data={formData}
            updateFormData={updateFormData}
            errors={errors}
            selectedCustomer={selectedCustomer}
            selectedSender={selectedSender}
            selectedManufacturer={selectedManufacturer}
            selectedReceiver={selectedReceiver}
            onCustomerChange={handleCustomerChange}
            onSenderChange={handleSenderChange}
            onManufacturerChange={handleManufacturerChange}
            onReceiverChange={handleReceiverChange}
            isDirectionLocked={!!params.direction}
          />
        )
      case 2:
        return <Step2LoadItems items={items} setItems={setItems} />
      case 3:
        return <Step3Addresses addresses={addresses} setAddresses={setAddresses} />
      case 4:
        return <Step4Pricing items={pricingItems} setItems={setPricingItems} />
      case 5:
        return <Step5InvoiceDeclaration data={formData} updateFormData={updateFormData} />
      case 6:
        return <Step6CustomsDocuments data={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  const headerTitle = formData.direction === 'export'
    ? 'Yeni İhracat Yükü'
    : formData.direction === 'import'
      ? 'Yeni İthalat Yükü'
      : 'Yeni Yük Ekle'

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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık ve Alt Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>
                Adım {currentStep} / {STEPS.length}
              </Text>
            </View>

            {/* Sağ: Kaydet Butonu (sadece son adımda) */}
            {currentStep === STEPS.length ? (
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
            ) : (
              <View style={styles.saveButton} />
            )}
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {/* Progress Steps */}
        <LoadFormProgress steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} />

        {/* Form Content */}
        <View style={styles.formContent}>
          {renderStep()}
        </View>

        {/* Navigation Buttons */}
        <LoadFormNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </KeyboardAwareScrollView>
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
    textAlign: 'center',
    marginBottom: 2
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
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
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingTop:0,
    paddingBottom: DashboardSpacing['3xl']
  },
  formContent: {
    marginTop: DashboardSpacing.md
  }
})
