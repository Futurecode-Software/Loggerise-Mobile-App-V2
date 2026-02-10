/**
 * Yeni İhracat Deposu Malı Ekranı
 *
 * CLAUDE.md ilkelerine uygun
 * 3 adımlı stepper: Yük Ara → Yük Bilgi + Depo Seç → Mal Bilgileri
 * FormHeader + KeyboardAwareScrollView + SearchableSelectModal
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { FormHeader } from '@/components/navigation/FormHeader'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals'
import {
  createExportWarehouseItem,
  searchLoad,
  LoadSearchResult,
  ExportWarehouseItemFormData,
  PACKAGE_TYPES,
  getPackageTypeLabel
} from '@/services/endpoints/export-warehouse-items'
import {
  getExportWarehouses,
  ExportWarehouse
} from '@/services/endpoints/export-warehouses'
import { getErrorMessage, getValidationErrors } from '@/services/api'

type Step = 'load-search' | 'load-info' | 'item-form'

const STEPS = [
  { id: 'load-search' as const, label: 'Yük Ara', icon: 'search-outline' as const },
  { id: 'load-info' as const, label: 'Yük & Depo', icon: 'business-outline' as const },
  { id: 'item-form' as const, label: 'Mal Bilgileri', icon: 'cube-outline' as const },
]

export default function NewExportWarehouseItemScreen() {
  // Stepper state
  const [currentStep, setCurrentStep] = useState<Step>('load-search')

  // Yük arama state
  const [loadNumberInput, setLoadNumberInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLoad, setSelectedLoad] = useState<LoadSearchResult | null>(null)

  // Depo seçimi state
  const [warehouses, setWarehouses] = useState<ExportWarehouse[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<ExportWarehouse | null>(null)
  const warehouseModalRef = useRef<SearchableSelectModalRef>(null)
  const [warehouseLabel, setWarehouseLabel] = useState('')

  // Paket tipi state
  const packageTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const [packageTypeLabel, setPackageTypeLabel] = useState(getPackageTypeLabel('pallet'))

  // Form state
  const [formData, setFormData] = useState<ExportWarehouseItemFormData>({
    load_id: 0,
    export_warehouse_id: 0,
    description: '',
    package_type: 'pallet',
    package_count: 1,
    gross_weight_kg: 0,
    volume_m3: null,
    customer_reference: '',
    invoice_no: '',
    declaration_no: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Depoları yükle
  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    setIsLoadingWarehouses(true)
    try {
      const response = await getExportWarehouses({ status: true })
      setWarehouses(response.warehouses)
    } catch {
      if (__DEV__) console.error('Warehouses load error')
    } finally {
      setIsLoadingWarehouses(false)
    }
  }

  // Yük ara
  const handleSearchLoad = useCallback(async () => {
    if (!loadNumberInput.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen yük numarası girin',
        position: 'top',
        visibilityTime: 1500,
      })
      return
    }

    setIsSearching(true)
    try {
      const load = await searchLoad(loadNumberInput.trim())
      setSelectedLoad(load)

      // Yükten gelen bilgileri form'a doldur
      setFormData(prev => ({
        ...prev,
        load_id: load.id,
        description: load.cargo_name || '',
        declaration_no: load.declaration_no || '',
      }))

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setCurrentStep('load-info')
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Yük bulunamadı',
        position: 'top',
        visibilityTime: 1500,
      })
    } finally {
      setIsSearching(false)
    }
  }, [loadNumberInput])

  // Depo seçimi
  const handleWarehouseSelect = (option: SelectOption) => {
    const warehouse = warehouses.find(w => w.id === Number(option.value))
    if (warehouse) {
      setSelectedWarehouse(warehouse)
      setWarehouseLabel(`${warehouse.name} (${warehouse.code})`)
      setFormData(prev => ({
        ...prev,
        export_warehouse_id: warehouse.id,
      }))
    }
  }

  // Paket tipi seçimi
  const handlePackageTypeSelect = (option: SelectOption) => {
    setPackageTypeLabel(option.label)
    setFormData(prev => ({
      ...prev,
      package_type: String(option.value),
    }))
  }

  // Adım 2'den adım 3'e geç
  const handleContinueToForm = () => {
    if (!selectedWarehouse) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen bir depo seçin',
        position: 'top',
        visibilityTime: 1500,
      })
      return
    }
    setCurrentStep('item-form')
  }

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((
    field: keyof ExportWarehouseItemFormData,
    value: string | number | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Form doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.description?.trim()) {
      newErrors.description = 'Mal açıklaması zorunludur.'
    }
    if (!formData.package_type) {
      newErrors.package_type = 'Paket tipi zorunludur.'
    }
    if (!formData.package_count || formData.package_count < 1) {
      newErrors.package_count = 'Paket sayısı en az 1 olmalıdır.'
    }
    if (!formData.gross_weight_kg || formData.gross_weight_kg <= 0) {
      newErrors.gross_weight_kg = 'Brüt ağırlık zorunludur.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Geri butonu
  const handleBack = useCallback(() => {
    if (currentStep === 'item-form') {
      setCurrentStep('load-info')
    } else if (currentStep === 'load-info') {
      setSelectedLoad(null)
      setCurrentStep('load-search')
    } else {
      router.back()
    }
  }, [currentStep])

  // Form gönderimi
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen zorunlu alanları doldurunuz',
        position: 'top',
        visibilityTime: 1500,
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createExportWarehouseItem(formData)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Mal başarıyla kaydedildi',
        position: 'top',
        visibilityTime: 1500,
      })
      router.back()
    } catch (error: unknown) {
      const validationErrors = getValidationErrors(error)
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
          text1: getErrorMessage(error),
          position: 'top',
          visibilityTime: 1500,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

  // Stepper gösterimi
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  // Depo options
  const warehouseOptions: SelectOption[] = warehouses.map(w => ({
    value: w.id,
    label: `${w.name} (${w.code})`,
  }))

  // Paket tipi options
  const packageTypeOptions: SelectOption[] = PACKAGE_TYPES.map(t => ({
    value: t.value,
    label: t.label,
  }))

  return (
    <View style={styles.container}>
      <FormHeader
        title="Yeni Mal"
        onBackPress={handleBack}
        onSavePress={currentStep === 'item-form' ? handleSubmit : undefined}
        isSaving={isSubmitting}
      />

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isActive = step.id === currentStep

          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted,
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                isCompleted && styles.stepLabelCompleted,
              ]}>
                {step.label}
              </Text>
              {index < STEPS.length - 1 && (
                <View style={[
                  styles.stepConnector,
                  isCompleted && styles.stepConnectorCompleted,
                ]} />
              )}
            </View>
          )
        })}
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {/* ADIM 1: Yük Ara */}
        {currentStep === 'load-search' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="search-outline" size={18} color={DashboardColors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Yük Ara</Text>
            </View>

            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Malın ait olacağı yükün numarasını girin ve arayın.
              </Text>

              <View style={styles.searchRow}>
                <View style={styles.searchInputWrapper}>
                  <Input
                    label="Yük Numarası *"
                    placeholder="Örn: YK-2025-001"
                    value={loadNumberInput}
                    onChangeText={setLoadNumberInput}
                    autoCapitalize="characters"
                    returnKeyType="search"
                    onSubmitEditing={handleSearchLoad}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                onPress={handleSearchLoad}
                disabled={isSearching}
                activeOpacity={0.7}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="search" size={18} color="#fff" />
                    <Text style={styles.searchButtonText}>Yük Ara</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ADIM 2: Yük Bilgileri + Depo Seçimi */}
        {currentStep === 'load-info' && selectedLoad && (
          <>
            {/* Yük Bilgi Kartı */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Yük Bilgileri</Text>
              </View>

              <View style={styles.sectionContent}>
                <View style={styles.loadInfoCard}>
                  <View style={styles.loadInfoRow}>
                    <Text style={styles.loadInfoLabel}>Yük No</Text>
                    <Text style={styles.loadInfoValue}>{selectedLoad.load_number}</Text>
                  </View>
                  {selectedLoad.cargo_name && (
                    <View style={styles.loadInfoRow}>
                      <Text style={styles.loadInfoLabel}>Kargo</Text>
                      <Text style={styles.loadInfoValue}>{selectedLoad.cargo_name}</Text>
                    </View>
                  )}
                  {selectedLoad.customer && (
                    <View style={styles.loadInfoRow}>
                      <Text style={styles.loadInfoLabel}>Müşteri</Text>
                      <Text style={styles.loadInfoValue}>
                        {selectedLoad.customer.short_name || selectedLoad.customer.name}
                      </Text>
                    </View>
                  )}
                  {selectedLoad.position && (
                    <View style={styles.loadInfoRow}>
                      <Text style={styles.loadInfoLabel}>Pozisyon</Text>
                      <Text style={styles.loadInfoValue}>{selectedLoad.position.position_number}</Text>
                    </View>
                  )}
                  {selectedLoad.declaration_no && (
                    <View style={styles.loadInfoRow}>
                      <Text style={styles.loadInfoLabel}>Deklarasyon</Text>
                      <Text style={styles.loadInfoValue}>{selectedLoad.declaration_no}</Text>
                    </View>
                  )}
                </View>

                <Pressable
                  style={styles.changeLoadButton}
                  onPress={() => {
                    setSelectedLoad(null)
                    setCurrentStep('load-search')
                  }}
                >
                  <Ionicons name="swap-horizontal" size={16} color={DashboardColors.primary} />
                  <Text style={styles.changeLoadText}>Yükü Değiştir</Text>
                </Pressable>
              </View>
            </View>

            {/* Depo Seçimi */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="business-outline" size={18} color={DashboardColors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Depo Seçimi</Text>
              </View>

              <View style={styles.sectionContent}>
                <Text style={styles.sectionDescription}>
                  Malların bekleyeceği depoyu seçin.
                </Text>

                <View>
                  <Text style={styles.inputLabel}>Depo *</Text>
                  <TouchableOpacity
                    style={[styles.selectTrigger, errors.export_warehouse_id && styles.selectTriggerError]}
                    onPress={() => warehouseModalRef.current?.present()}
                  >
                    <Text style={warehouseLabel ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
                      {warehouseLabel || 'Depo seçin'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
                  </TouchableOpacity>
                  {errors.export_warehouse_id && (
                    <Text style={styles.errorText}>{errors.export_warehouse_id}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    !selectedWarehouse && styles.continueButtonDisabled,
                  ]}
                  onPress={handleContinueToForm}
                  disabled={!selectedWarehouse}
                  activeOpacity={0.7}
                >
                  <Text style={styles.continueButtonText}>Devam Et</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ADIM 3: Mal Bilgileri */}
        {currentStep === 'item-form' && (
          <>
            {/* Mal Detayları */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="cube-outline" size={18} color={DashboardColors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Mal Detayları</Text>
              </View>

              <View style={styles.sectionContent}>
                <Input
                  label="Mal Açıklaması *"
                  placeholder="Malın detaylı açıklamasını girin"
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  error={errors.description}
                  maxLength={500}
                  multiline
                  numberOfLines={3}
                />

                {/* Paket Tipi */}
                <View>
                  <Text style={styles.inputLabel}>Paket Tipi *</Text>
                  <TouchableOpacity
                    style={[styles.selectTrigger, errors.package_type && styles.selectTriggerError]}
                    onPress={() => packageTypeModalRef.current?.present()}
                  >
                    <Text style={styles.selectTriggerText}>
                      {packageTypeLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
                  </TouchableOpacity>
                  {errors.package_type && (
                    <Text style={styles.errorText}>{errors.package_type}</Text>
                  )}
                </View>

                <Input
                  label="Paket Sayısı *"
                  placeholder="Örn: 10"
                  value={formData.package_count ? String(formData.package_count) : ''}
                  onChangeText={(text) => {
                    const numValue = text ? parseInt(text, 10) : 0
                    handleInputChange('package_count', numValue)
                  }}
                  error={errors.package_count}
                  keyboardType="number-pad"
                />

                <Input
                  label="Brüt Ağırlık (kg) *"
                  placeholder="Örn: 1500"
                  value={formData.gross_weight_kg ? String(formData.gross_weight_kg) : ''}
                  onChangeText={(text) => {
                    const numValue = text ? parseFloat(text) : 0
                    handleInputChange('gross_weight_kg', numValue)
                  }}
                  error={errors.gross_weight_kg}
                  keyboardType="decimal-pad"
                />

                <Input
                  label="Hacim (m³)"
                  placeholder="Örn: 5.5"
                  value={formData.volume_m3 ? String(formData.volume_m3) : ''}
                  onChangeText={(text) => {
                    const numValue = text ? parseFloat(text) : null
                    handleInputChange('volume_m3', numValue)
                  }}
                  error={errors.volume_m3}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Ek Bilgiler */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="information-circle-outline" size={18} color={DashboardColors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Ek Bilgiler</Text>
              </View>

              <View style={styles.sectionContent}>
                <Input
                  label="Müşteri Referansı"
                  placeholder="Örn: REF-ABC-123"
                  value={formData.customer_reference || ''}
                  onChangeText={(text) => handleInputChange('customer_reference', text)}
                  maxLength={100}
                />

                <Input
                  label="Fatura Numarası"
                  placeholder="Örn: INV-2025-001"
                  value={formData.invoice_no || ''}
                  onChangeText={(text) => handleInputChange('invoice_no', text)}
                  maxLength={100}
                />

                <Input
                  label="Gümrük Deklarasyon No"
                  placeholder="Örn: DEC-ABC1234XYZ"
                  value={formData.declaration_no || ''}
                  onChangeText={(text) => handleInputChange('declaration_no', text)}
                  maxLength={100}
                />

                <Input
                  label="Notlar"
                  placeholder="Ek notlar..."
                  value={formData.notes || ''}
                  onChangeText={(text) => handleInputChange('notes', text)}
                  maxLength={1000}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      {/* SearchableSelectModals */}
      <SearchableSelectModal
        ref={warehouseModalRef}
        title="Depo Seçin"
        options={warehouseOptions}
        selectedValue={formData.export_warehouse_id || null}
        onSelect={handleWarehouseSelect}
        loading={isLoadingWarehouses}
        searchPlaceholder="Depo ara..."
        emptyMessage="Depo bulunamadı"
      />

      <SearchableSelectModal
        ref={packageTypeModalRef}
        title="Paket Tipi Seçin"
        options={packageTypeOptions}
        selectedValue={formData.package_type}
        onSelect={handlePackageTypeSelect}
        searchPlaceholder="Paket tipi ara..."
        emptyMessage="Paket tipi bulunamadı"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl'],
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    backgroundColor: DashboardColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DashboardColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: DashboardColors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: DashboardColors.success,
  },
  stepNumber: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textMuted,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '500',
    color: DashboardColors.textMuted,
  },
  stepLabelActive: {
    color: DashboardColors.primary,
    fontWeight: '600',
  },
  stepLabelCompleted: {
    color: DashboardColors.success,
    fontWeight: '600',
  },
  stepConnector: {
    width: 20,
    height: 2,
    backgroundColor: DashboardColors.borderLight,
    marginHorizontal: DashboardSpacing.xs,
  },
  stepConnectorCompleted: {
    backgroundColor: DashboardColors.success,
  },

  // Sections
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  sectionContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md,
  },
  sectionDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    height: 48,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff',
  },

  // Load Info Card
  loadInfoCard: {
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    gap: DashboardSpacing.sm,
  },
  loadInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.xs,
  },
  loadInfoLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    fontWeight: '500',
  },
  loadInfoValue: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textPrimary,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  changeLoadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.xs,
    paddingVertical: DashboardSpacing.sm,
  },
  changeLoadText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.primary,
    fontWeight: '600',
  },

  // Continue Button
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    height: 48,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff',
  },

  // Input Label
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs,
  },

  // Select Trigger
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.background,
  },
  selectTriggerError: {
    borderColor: DashboardColors.danger,
  },
  selectTriggerText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
  },
  selectTriggerPlaceholder: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 4,
  },
})
