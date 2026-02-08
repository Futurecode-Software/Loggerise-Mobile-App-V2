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
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import { FormHeader } from '@/components/navigation/FormHeader'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { SearchableSelectModal, SearchableSelectModalRef, SelectOption } from '@/components/modals/SearchableSelectModal'
import {
  createDriverTractorAssignment,
  DriverTractorAssignmentFormData
} from '@/services/endpoints/fleet'
import { getVehicles, Vehicle } from '@/services/endpoints/vehicles'
import { getEmployees, Employee } from '@/services/endpoints/employees'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function NewDriverTractorAssignmentScreen() {
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
      if (__DEV__) console.error('Failed to load initial data:', error)
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
      {/* Header */}
      <FormHeader
        title="Yeni Eşleştirme"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />

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
  content: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
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
