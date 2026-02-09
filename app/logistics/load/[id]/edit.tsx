/**
 * Edit Load Screen - 6 Step Wizard
 *
 * Web versiyonu ile %100 uyumlu - Mevcut yükü düzenleme
 * CLAUDE.md form sayfası standardına uygun - animasyonlu header + KeyboardAwareScrollView
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
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
import { LoadFormStepper } from '@/components/load-form/LoadFormStepper'
import LoadFormNavigation from '@/components/load-form/LoadFormNavigation'
import Step1BasicInfo from '@/components/load-form/Step1BasicInfo'
import Step2LoadItems, { type LoadItem } from '@/components/load-form/Step2LoadItems'
import Step3Addresses, { type LoadAddress, type SelectedOptionsMap } from '@/components/load-form/Step3Addresses'
import Step4Pricing, { type LoadPricingItem } from '@/components/load-form/Step4Pricing'
import Step5InvoiceDeclaration from '@/components/load-form/Step5InvoiceDeclaration'
import Step6CustomsDocuments from '@/components/load-form/Step6CustomsDocuments'
import {
  getLoad,
  updateLoad,
  cleanAddressForSubmit,
  type LoadFormData
} from '@/services/endpoints/loads'

// SelectOption tipi
interface SelectOption {
  label: string
  value: number
  subtitle?: string
}

const TOTAL_STEPS = 6

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

export default function EditLoadScreen() {
  const insets = useSafeAreaInsets()
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const isMountedRef = useRef(true)

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

  // Parse ID safely
  const loadId = React.useMemo(() => {
    const idStr = Array.isArray(rawId) ? rawId[0] : rawId
    if (!idStr) return null
    const parsed = parseInt(idStr, 10)
    return isNaN(parsed) ? null : parsed
  }, [rawId])

  // Global form state
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Form data state
  const [formData, setFormData] = useState<LoadFormData>({
    is_active: true,
    publish_to_pool: false,
    estimated_value_currency: 'TRY',
  })

  // Items state
  const [items, setItems] = useState<LoadItem[]>([getDefaultLoadItem()])
  const [addresses, setAddresses] = useState<LoadAddress[]>([])
  const [pricingItems, setPricingItems] = useState<LoadPricingItem[]>([])

  // Firma seçim state'leri
  const [selectedCustomer, setSelectedCustomer] = useState<SelectOption | null>(null)
  const [selectedSender, setSelectedSender] = useState<SelectOption | null>(null)
  const [selectedManufacturer, setSelectedManufacturer] = useState<SelectOption | null>(null)
  const [selectedReceiver, setSelectedReceiver] = useState<SelectOption | null>(null)

  // Step3 adres seçim state'leri (firma/depo/adres isimleri)
  const [addressSelections, setAddressSelections] = useState<SelectedOptionsMap>({})

  // Hata state'i
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Load existing data
  useEffect(() => {
    const fetchLoad = async () => {
      if (!loadId) {
        Toast.show({
          type: 'error',
          text1: 'Geçersiz yük ID',
          position: 'top',
          visibilityTime: 1500
        })
        setIsLoading(false)
        return
      }

      try {
        const load = await getLoad(loadId)
        if (!isMountedRef.current) return

        // Map load to form data
        const mappedFormData: LoadFormData = {
          cargo_name: load.cargo_name || '',
          cargo_name_foreign: load.cargo_name_foreign || '',
          direction: load.direction || undefined,
          vehicle_type: load.vehicle_type || '',
          loading_type: load.loading_type || '',
          transport_speed: load.transport_speed || '',
          cargo_class: load.cargo_class || '',
          load_type: load.load_type,
          status: load.status,
          customer_id: load.customer_id,
          sender_company_id: load.sender_company_id,
          manufacturer_company_id: load.manufacturer_company_id,
          receiver_company_id: load.receiver_company_id,
          freight_fee: load.freight_fee,
          freight_fee_currency: load.freight_fee_currency || 'TRY',
          freight_fee_exchange_rate: load.freight_fee_exchange_rate,
          declaration_no: load.declaration_no || '',
          declaration_submission_date: load.declaration_submission_date || '',
          declaration_ready_date: load.declaration_ready_date || '',
          declaration_inspection_date: load.declaration_inspection_date || '',
          declaration_clearance_date: load.declaration_clearance_date || '',
          cargo_invoice_no: load.cargo_invoice_no || '',
          cargo_invoice_date: load.cargo_invoice_date || '',
          estimated_cargo_value: load.estimated_cargo_value?.toString() || '',
          estimated_value_currency: load.estimated_value_currency || 'TRY',
          estimated_value_exchange_rate: load.estimated_value_exchange_rate?.toString() || '',
          delivery_terms: load.delivery_terms || '',
          gtip_hs_code: load.gtip_hs_code || '',
          atr_no: load.atr_no || '',
          regime_no: load.regime_no || '',
          invoice_document: load.invoice_document,
          atr_document: load.atr_document,
          packing_list_document: load.packing_list_document,
          origin_certificate_document: load.origin_certificate_document,
          health_certificate_document: load.health_certificate_document,
          eur1_document: load.eur1_document,
          t1_t2_document: load.t1_t2_document,
          is_active: load.is_active,
          publish_to_pool: false,
        }
        setFormData(mappedFormData)

        // Map items
        if (load.items && load.items.length > 0) {
          const mappedItems: LoadItem[] = load.items.map((item) => ({
            id: item.id,
            cargo_name: item.cargo_name || '',
            cargo_name_foreign: item.cargo_name_foreign || '',
            package_type: item.package_type || '',
            package_count: item.package_count || 0,
            piece_count: item.piece_count || 0,
            gross_weight: item.gross_weight?.toString() || '0',
            net_weight: item.net_weight?.toString() || '0',
            volumetric_weight: item.volumetric_weight?.toString() || '0',
            lademetre_weight: item.lademetre_weight?.toString() || '0',
            total_chargeable_weight: item.total_chargeable_weight?.toString() || '0',
            width: item.width?.toString() || '0',
            height: item.height?.toString() || '0',
            length: item.length?.toString() || '0',
            volume: item.volume?.toString() || '0',
            lademetre: item.lademetre?.toString() || '0',
            is_stackable: item.is_stackable || false,
            stackable_rows: item.stackable_rows || null,
            is_hazardous: item.is_hazardous || false,
            hazmat_un_no: item.hazmat_un_no || '',
            hazmat_class: item.hazmat_class || '',
            hazmat_page_no: item.hazmat_page_no || '',
            hazmat_packing_group: item.hazmat_packing_group || '',
            hazmat_flash_point: item.hazmat_flash_point || '0',
            hazmat_description: item.hazmat_description || '',
          }))
          setItems(mappedItems)
        }

        // Map addresses - ensure sort_order is set with defaults
        if (load.addresses && load.addresses.length > 0) {
          const mappedAddresses = load.addresses.map((addr, index) => ({
            ...addr,
            sort_order: addr.sort_order ?? index,
            pickup_type: addr.pickup_type ?? null,
            delivery_type: addr.delivery_type ?? null,
          })) as LoadAddress[]
          setAddresses(mappedAddresses)

          // Adres seçim bilgilerini (firma/depo isimleri) selectedOptions'a aktar
          const selections: SelectedOptionsMap = {}
          for (const addr of load.addresses) {
            // Yükleme/Boşaltma firması
            if (addr.type === 'pickup' && addr.loadingCompany) {
              selections['pickup_loading_company'] = {
                label: addr.loadingCompany.name,
                value: addr.loadingCompany.id,
              }
            }
            if (addr.type === 'pickup' && addr.loadingLocation) {
              selections['pickup_loading_address'] = {
                label: addr.loadingLocation.title || addr.loadingLocation.address || '',
                value: addr.loadingLocation.id,
                address: addr.loadingLocation.address,
              }
            }

            // Yurtiçi depo
            if (addr.type === 'pickup' && addr.domesticWarehouse) {
              selections['pickup_domestic_warehouse'] = {
                label: addr.domesticWarehouse.name || '',
                value: addr.domesticWarehouse.id,
                subtitle: addr.domesticWarehouse.code,
              }
            }

            // Yurtiçi gümrükleme firması
            if (addr.type === 'pickup' && addr.domesticCustomsCompany) {
              selections['pickup_domestic_customs_company'] = {
                label: addr.domesticCustomsCompany.name,
                value: addr.domesticCustomsCompany.id,
              }
            }
            if (addr.type === 'pickup' && addr.domesticCustomsLocation) {
              selections['pickup_domestic_customs_address'] = {
                label: addr.domesticCustomsLocation.title || addr.domesticCustomsLocation.address || '',
                value: addr.domesticCustomsLocation.id,
                address: addr.domesticCustomsLocation.address,
              }
            }

            // Yurtdışı gümrükleme firması
            if (addr.type === 'delivery' && addr.intlCustomsCompany) {
              selections['delivery_intl_customs_company'] = {
                label: addr.intlCustomsCompany.name,
                value: addr.intlCustomsCompany.id,
              }
            }
            if (addr.type === 'delivery' && addr.intlCustomsLocation) {
              selections['delivery_intl_customs_address'] = {
                label: addr.intlCustomsLocation.title || addr.intlCustomsLocation.address || '',
                value: addr.intlCustomsLocation.id,
                address: addr.intlCustomsLocation.address,
              }
            }

            // Boşaltma firması
            if (addr.type === 'delivery' && addr.unloadingCompany) {
              selections['delivery_unloading_company'] = {
                label: addr.unloadingCompany.name,
                value: addr.unloadingCompany.id,
              }
            }
            if (addr.type === 'delivery' && addr.unloadingLocation) {
              selections['delivery_unloading_address'] = {
                label: addr.unloadingLocation.title || addr.unloadingLocation.address || '',
                value: addr.unloadingLocation.id,
                address: addr.unloadingLocation.address,
              }
            }

            // Yurtdışı depo
            if (addr.type === 'delivery' && addr.intlWarehouse) {
              selections['delivery_intl_warehouse'] = {
                label: addr.intlWarehouse.name || '',
                value: addr.intlWarehouse.id,
                subtitle: addr.intlWarehouse.code,
              }
            }
          }
          setAddressSelections(selections)
        }

        // Map pricing items
        if (load.pricing_items && load.pricing_items.length > 0) {
          const mappedPricing: LoadPricingItem[] = load.pricing_items.map((pItem: any) => ({
            id: pItem.id,
            load_id: pItem.load_id,
            product_id: pItem.product_id || null,
            product: pItem.product || null,
            description: pItem.description || '',
            quantity: pItem.quantity?.toString() || '1',
            unit: pItem.unit || 'SET',
            unit_price: pItem.unit_price?.toString() || '0',
            currency: pItem.currency || 'TRY',
            exchange_rate: pItem.exchange_rate?.toString() || '1',
            vat_rate: pItem.vat_rate?.toString() || '0',
            vat_amount: pItem.vat_amount?.toString() || '0',
            discount_rate: pItem.discount_rate?.toString() || '0',
            discount_amount: pItem.discount_amount?.toString() || '0',
            sub_total: pItem.sub_total?.toString() || '0',
            total: pItem.total?.toString() || '0',
            sort_order: pItem.sort_order || 0,
            is_active: pItem.is_active !== false,
          }))
          setPricingItems(mappedPricing)
        }

        // Set selected companies
        if (load.customer) {
          setSelectedCustomer({
            label: load.customer.name,
            value: load.customer.id,
            subtitle: load.customer.code,
          })
        }
        if (load.sender_company) {
          setSelectedSender({
            label: load.sender_company.name,
            value: load.sender_company.id,
            subtitle: load.sender_company.code,
          })
        }
        if (load.manufacturer_company) {
          setSelectedManufacturer({
            label: load.manufacturer_company.name,
            value: load.manufacturer_company.id,
            subtitle: load.manufacturer_company.code,
          })
        }
        if (load.receiver_company) {
          setSelectedReceiver({
            label: load.receiver_company.name,
            value: load.receiver_company.id,
            subtitle: load.receiver_company.code,
          })
        }
      } catch (err) {
        if (__DEV__) console.error('Load fetch error:', err)
        if (isMountedRef.current) {
          Toast.show({
            type: 'error',
            text1: err instanceof Error ? err.message : 'Yük yüklenemedi',
            position: 'top',
            visibilityTime: 1500
          })
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchLoad()
  }, [loadId])

  // Form data güncelleme
  const updateFormData = useCallback((field: keyof LoadFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
  const validateStep = useCallback((step: number): boolean => {
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
  }, [formData, items, addresses])

  // Go to next step
  const goToNextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      return
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep])
    }

    // Move to next step
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
      // Sadece tamamlanmış veya önceki step'lere gidilebilir
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

  const handleSubmit = async () => {
    if (!loadId) {
      Toast.show({
        type: 'error',
        text1: 'Geçersiz yük ID',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    // Tüm adımları validate et
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step)
        return
      }
    }

    // Form verilerini hazırla - empty strings'leri null'a çevir
    const cleanedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
    ) as LoadFormData

    const submitData: LoadFormData = {
      ...cleanedFormData,
      items: items.map((item) => ({
        ...(item.id ? { id: item.id } : {}), // Keep existing item IDs for updates
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
        hazmat_description: item.hazmat_description,
      })) as LoadFormData['items'],
      addresses: addresses.map(cleanAddressForSubmit) as LoadFormData['addresses'],
      // Clean pricing items
      pricing_items: pricingItems.map((pItem) => ({
        ...(pItem.id ? { id: pItem.id } : {}),
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
        is_active: pItem.is_active !== false,
      })) as unknown as LoadFormData['pricing_items'],
    }

    try {
      setIsSubmitting(true)
      const response = await updateLoad(loadId, submitData)

      if (response) {
        Toast.show({
          type: 'success',
          text1: 'Yük başarıyla güncellendi',
          position: 'top',
          visibilityTime: 1500
        })
        router.back()
      }
    } catch (error: any) {
      if (__DEV__) console.error('Load update error:', error)
      Toast.show({
        type: 'error',
        text1: error?.message || 'Yük güncellenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
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
            isDirectionLocked={false}
          />
        )
      case 2:
        return <Step2LoadItems items={items} setItems={setItems} />
      case 3:
        return (
          <Step3Addresses
            addresses={addresses}
            setAddresses={setAddresses}
            selectedOptions={addressSelections}
            onSelectedOptionsChange={setAddressSelections}
          />
        )
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

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
          <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Yük Düzenle</Text>
              </View>

              <View style={styles.headerButton} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingStateText}>Yük bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  const headerTitle =
    formData.direction === 'export'
      ? 'İhracat Yükü Düzenle'
      : formData.direction === 'import'
        ? 'İthalat Yükü Düzenle'
        : 'Yük Düzenle'

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
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>
                Adım {currentStep} / {TOTAL_STEPS}
              </Text>
            </View>

            {/* Sağ: Kaydet Butonu */}
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.headerButton}
              disabled={isSubmitting}
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

      {/* Content */}
      <View style={styles.content}>
        {/* Stepper */}
        <LoadFormStepper
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
          {renderStep()}
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

      </View>

      {/* Loading Overlay - container'ın child'ı olarak tam ekran kaplar */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Yük güncelleniyor...</Text>
        </View>
      )}
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
    paddingBottom: DashboardSpacing['4xl']
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: DashboardSpacing['4xl']
  },
  loadingStateText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
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
