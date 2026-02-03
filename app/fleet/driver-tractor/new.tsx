/**
 * New Driver-Tractor Assignment Screen
 *
 * Yeni sürücü-çekici eşleştirmesi oluşturma ekranı.
 * Backend: POST /api/v1/mobile/filo-yonetimi/surucu-cekici-eslestirme
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
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import SearchableSelectModal, { SearchableSelectModalRef, SelectOption } from '@/components/modals/SearchableSelectModal'
import {
  createDriverTractorAssignment,
  DriverTractorAssignmentFormData
} from '@/services/endpoints/fleet'
import { getVehicles, Vehicle } from '@/services/endpoints/vehicles'
import { getEmployees, Employee } from '@/services/endpoints/employees'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function NewDriverTractorAssignmentScreen() {
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

  // Form state
  const [formData, setFormData] = useState<Partial<DriverTractorAssignmentFormData>>({
    assigned_at: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Data state
  const [drivers, setDrivers] = useState<Employee[]>([])
  const [tractors, setTractors] = useState<Vehicle[]>([])
  const [selectedDriver, setSelectedDriver] = useState<Employee | null>(null)
  const [selectedTractor, setSelectedTractor] = useState<Vehicle | null>(null)
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)
  const [isLoadingTractors, setIsLoadingTractors] = useState(false)

  // Refs
  const driverModalRef = useRef<SearchableSelectModalRef>(null)
  const tractorModalRef = useRef<SearchableSelectModalRef>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoadingDrivers(true)
      setIsLoadingTractors(true)

      const [driversRes, tractorsRes] = await Promise.all([
        getEmployees({ per_page: 100 }),
        getVehicles({ vehicle_type: 'truck_tractor', per_page: 100 })
      ])

      setDrivers(driversRes.employees)
      setTractors(tractorsRes.vehicles)
    } catch (error) {
      console.error('Failed to load initial data:', error)
      Toast.show({
        type: 'error',
        text1: 'Veriler yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingDrivers(false)
      setIsLoadingTractors(false)
    }
  }

  // Handle driver selection
  const handleDriverSelect = useCallback((option: SelectOption) => {
    const driver = drivers.find(d => d.id === option.value)
    if (driver) {
      setSelectedDriver(driver)
      setFormData(prev => ({ ...prev, employee_id: driver.id }))

      if (errors.employee_id) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors }
          delete newErrors.employee_id
          return newErrors
        })
      }
    }
  }, [drivers, errors])

  // Handle tractor selection
  const handleTractorSelect = useCallback((option: SelectOption) => {
    const tractor = tractors.find(t => t.id === option.value)
    if (tractor) {
      setSelectedTractor(tractor)
      setFormData(prev => ({ ...prev, tractor_id: tractor.id }))

      if (errors.tractor_id) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors }
          delete newErrors.tractor_id
          return newErrors
        })
      }
    }
  }, [tractors, errors])

  // Options for modals
  const driverOptions: SelectOption[] = drivers.map(d => ({
    value: d.id,
    label: `${d.first_name} ${d.last_name}${d.phone_1 ? ` • ${d.phone_1}` : ''}`,
    data: d
  }))

  const tractorOptions: SelectOption[] = tractors.map(t => ({
    value: t.id,
    label: `${t.plate}${t.brand || t.model ? ` • ${[t.brand, t.model].filter(Boolean).join(' ')}` : ''}`,
    data: t
  }))

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof DriverTractorAssignmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Bu alan için hatayı temizle
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.employee_id) {
      newErrors.employee_id = 'Sürücü seçimi zorunludur.'
    }

    if (!formData.tractor_id) {
      newErrors.tractor_id = 'Çekici seçimi zorunludur.'
    }

    if (!formData.assigned_at) {
      newErrors.assigned_at = 'Atanma tarihi zorunludur.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Geri butonu
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  // Form gönderimi
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen zorunlu alanları doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createDriverTractorAssignment(formData as DriverTractorAssignmentFormData)

      Toast.show({
        type: 'success',
        text1: 'Eşleştirme başarıyla oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
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
          visibilityTime: 1500
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

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

            {/* Orta: Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni Eşleştirme</Text>
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

      {/* Form Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {/* Temel Bilgiler Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Eşleştirme Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            {/* Sürücü Seçimi */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Sürücü *</Text>
              {selectedDriver ? (
                <View style={styles.selectedItem}>
                  <View style={styles.selectedItemIcon}>
                    <Ionicons name="person" size={18} color={DashboardColors.primary} />
                  </View>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>
                      {selectedDriver.first_name} {selectedDriver.last_name}
                    </Text>
                    {selectedDriver.phone_1 && (
                      <Text style={styles.selectedItemCode}>{selectedDriver.phone_1}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDriver(null)
                      setFormData(prev => ({ ...prev, employee_id: undefined }))
                    }}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={DashboardColors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => driverModalRef.current?.present()}
                  disabled={isLoadingDrivers}
                >
                  {isLoadingDrivers ? (
                    <ActivityIndicator size="small" color={DashboardColors.primary} />
                  ) : (
                    <>
                      <Ionicons name="person-outline" size={18} color={DashboardColors.textSecondary} />
                      <Text style={styles.selectButtonText}>Sürücü seçiniz</Text>
                      <Ionicons name="chevron-forward" size={18} color={DashboardColors.textMuted} />
                    </>
                  )}
                </TouchableOpacity>
              )}
              {errors.employee_id && <Text style={styles.errorText}>{errors.employee_id}</Text>}
            </View>

            {/* Çekici Seçimi */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Çekici *</Text>
              {selectedTractor ? (
                <View style={styles.selectedItem}>
                  <View style={styles.selectedItemIcon}>
                    <Ionicons name="car" size={18} color={DashboardColors.primary} />
                  </View>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>{selectedTractor.plate}</Text>
                    {(selectedTractor.brand || selectedTractor.model) && (
                      <Text style={styles.selectedItemCode}>
                        {[selectedTractor.brand, selectedTractor.model].filter(Boolean).join(' ')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedTractor(null)
                      setFormData(prev => ({ ...prev, tractor_id: undefined }))
                    }}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={DashboardColors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => tractorModalRef.current?.present()}
                  disabled={isLoadingTractors}
                >
                  {isLoadingTractors ? (
                    <ActivityIndicator size="small" color={DashboardColors.primary} />
                  ) : (
                    <>
                      <Ionicons name="car-outline" size={18} color={DashboardColors.textSecondary} />
                      <Text style={styles.selectButtonText}>Çekici seçiniz</Text>
                      <Ionicons name="chevron-forward" size={18} color={DashboardColors.textMuted} />
                    </>
                  )}
                </TouchableOpacity>
              )}
              {errors.tractor_id && <Text style={styles.errorText}>{errors.tractor_id}</Text>}
            </View>

            <DateInput
              label="Atanma Tarihi *"
              value={formData.assigned_at || ''}
              onChangeDate={(date) => handleInputChange('assigned_at', date)}
              error={errors.assigned_at}
              required
            />

            <Input
              label="Notlar"
              placeholder="İsteğe bağlı notlar"
              value={formData.notes || ''}
              onChangeText={(text) => handleInputChange('notes', text)}
              error={errors.notes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Modals */}
      <SearchableSelectModal
        ref={driverModalRef}
        title="Sürücü Seçin"
        options={driverOptions}
        selectedValue={selectedDriver?.id}
        onSelect={handleDriverSelect}
        searchPlaceholder="Sürücü ara..."
        emptyMessage="Sürücü bulunamadı"
        loading={isLoadingDrivers}
      />

      <SearchableSelectModal
        ref={tractorModalRef}
        title="Çekici Seçin"
        options={tractorOptions}
        selectedValue={selectedTractor?.id}
        onSelect={handleTractorSelect}
        searchPlaceholder="Çekici ara..."
        emptyMessage="Çekici bulunamadı"
        loading={isLoadingTractors}
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
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
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
  fieldContainer: {
    gap: DashboardSpacing.xs
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: 4
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.background,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  selectButtonText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.primaryGlow,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    gap: DashboardSpacing.sm
  },
  selectedItemIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedItemInfo: {
    flex: 1
  },
  selectedItemName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  selectedItemCode: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  removeButton: {
    padding: 4
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: 4
  }
})
