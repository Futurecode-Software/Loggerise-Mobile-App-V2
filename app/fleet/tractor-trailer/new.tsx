/**
 * New Tractor-Trailer Assignment Screen
 *
 * Create new tractor-trailer assignment (çekici-römork eşleştirme).
 * Matches backend Mobile API endpoint: POST /api/v1/mobile/filo-yonetimi/cekici-romork-eslestirme
 * FormHeader component kullanır.
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
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { FormHeader } from '@/components/navigation/FormHeader'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals/SearchableSelectModal'
import {
  createTractorTrailerAssignment,
  TractorTrailerAssignmentFormData
} from '@/services/endpoints/fleet'
import { getVehicles, Vehicle } from '@/services/endpoints/vehicles'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function NewTractorTrailerAssignmentScreen() {
  // Form state
  const [formData, setFormData] = useState<Partial<TractorTrailerAssignmentFormData>>({
    assigned_at: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Vehicle data
  const [tractors, setTractors] = useState<Vehicle[]>([])
  const [trailers, setTrailers] = useState<Vehicle[]>([])
  const [selectedTractor, setSelectedTractor] = useState<Vehicle | null>(null)
  const [selectedTrailer, setSelectedTrailer] = useState<Vehicle | null>(null)
  const [isLoadingTractors, setIsLoadingTractors] = useState(false)
  const [isLoadingTrailers, setIsLoadingTrailers] = useState(false)

  // Refs
  const tractorModalRef = useRef<SearchableSelectModalRef>(null)
  const trailerModalRef = useRef<SearchableSelectModalRef>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load initial data
  useEffect(() => {
    loadTractorsAndTrailers()
  }, [])

  const loadTractorsAndTrailers = async () => {
    try {
      setIsLoadingTractors(true)
      setIsLoadingTrailers(true)

      const [tractorsRes, trailersRes] = await Promise.all([
        getVehicles({ vehicle_type: 'truck_tractor', per_page: 100 }),
        getVehicles({ vehicle_type: 'trailer', per_page: 100 })
      ])

      setTractors(tractorsRes.vehicles)
      setTrailers(trailersRes.vehicles)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
      Toast.show({
        type: 'error',
        text1: 'Araçlar yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsLoadingTractors(false)
      setIsLoadingTrailers(false)
    }
  }

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

  // Handle trailer selection
  const handleTrailerSelect = useCallback((option: SelectOption) => {
    const trailer = trailers.find(t => t.id === option.value)
    if (trailer) {
      setSelectedTrailer(trailer)
      setFormData(prev => ({ ...prev, trailer_id: trailer.id }))

      if (errors.trailer_id) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors }
          delete newErrors.trailer_id
          return newErrors
        })
      }
    }
  }, [trailers, errors])

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof TractorTrailerAssignmentFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear error for this field
      if (errors[field]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [errors]
  )

  // Options for modals
  const tractorOptions: SelectOption[] = tractors.map(t => ({
    value: t.id,
    label: `${t.plate}${t.brand || t.model ? ` • ${[t.brand, t.model].filter(Boolean).join(' ')}` : ''}`,
    data: t
  }))

  const trailerOptions: SelectOption[] = trailers.map(t => ({
    value: t.id,
    label: `${t.plate}${t.brand || t.model ? ` • ${[t.brand, t.model].filter(Boolean).join(' ')}` : ''}`,
    data: t
  }))

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.tractor_id) {
      newErrors.tractor_id = 'Çekici seçimi zorunludur.'
    }

    if (!formData.trailer_id) {
      newErrors.trailer_id = 'Römork seçimi zorunludur.'
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

  // Submit handler
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
      await createTractorTrailerAssignment(formData as TractorTrailerAssignmentFormData)

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
        {/* Eşleştirme Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="git-branch-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Eşleştirme Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
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

            {/* Römork Seçimi */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Römork *</Text>
              {selectedTrailer ? (
                <View style={styles.selectedItem}>
                  <View style={styles.selectedItemIcon}>
                    <Ionicons name="cart" size={18} color={DashboardColors.primary} />
                  </View>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>{selectedTrailer.plate}</Text>
                    {(selectedTrailer.brand || selectedTrailer.model) && (
                      <Text style={styles.selectedItemCode}>
                        {[selectedTrailer.brand, selectedTrailer.model].filter(Boolean).join(' ')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedTrailer(null)
                      setFormData(prev => ({ ...prev, trailer_id: undefined }))
                    }}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={DashboardColors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => trailerModalRef.current?.present()}
                  disabled={isLoadingTrailers}
                >
                  {isLoadingTrailers ? (
                    <ActivityIndicator size="small" color={DashboardColors.primary} />
                  ) : (
                    <>
                      <Ionicons name="cart-outline" size={18} color={DashboardColors.textSecondary} />
                      <Text style={styles.selectButtonText}>Römork seçiniz</Text>
                      <Ionicons name="chevron-forward" size={18} color={DashboardColors.textMuted} />
                    </>
                  )}
                </TouchableOpacity>
              )}
              {errors.trailer_id && <Text style={styles.errorText}>{errors.trailer_id}</Text>}
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
        ref={tractorModalRef}
        title="Çekici Seçin"
        options={tractorOptions}
        selectedValue={selectedTractor?.id}
        onSelect={handleTractorSelect}
        searchPlaceholder="Çekici ara..."
        emptyMessage="Çekici bulunamadı"
        loading={isLoadingTractors}
      />

      <SearchableSelectModal
        ref={trailerModalRef}
        title="Römork Seçin"
        options={trailerOptions}
        selectedValue={selectedTrailer?.id}
        onSelect={handleTrailerSelect}
        searchPlaceholder="Römork ara..."
        emptyMessage="Römork bulunamadı"
        loading={isLoadingTrailers}
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
