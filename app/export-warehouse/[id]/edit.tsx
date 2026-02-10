/**
 * İhracat Deposu Düzenleme Ekranı
 *
 * CLAUDE.md ilkelerine uygun
 * FormHeader + KeyboardAwareScrollView + SearchableSelectModal
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
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
  getExportWarehouse,
  updateExportWarehouse,
  ExportWarehouseFormData
} from '@/services/endpoints/export-warehouses'
import {
  searchCountries,
  searchStates,
  searchCities
} from '@/services/endpoints/locations'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function EditExportWarehouseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // Form state
  const [formData, setFormData] = useState<ExportWarehouseFormData>({
    code: '',
    name: '',
    address: '',
    country_id: null,
    state_id: null,
    city_id: null,
    total_capacity: null,
    total_area_m2: null,
    contact_person: '',
    phone: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Location options
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([])
  const [stateOptions, setStateOptions] = useState<SelectOption[]>([])
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([])
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)

  // Location labels
  const [countryLabel, setCountryLabel] = useState('')
  const [stateLabel, setStateLabel] = useState('')
  const [cityLabel, setCityLabel] = useState('')

  // Modal refs
  const countryModalRef = useRef<SearchableSelectModalRef>(null)
  const stateModalRef = useRef<SearchableSelectModalRef>(null)
  const cityModalRef = useRef<SearchableSelectModalRef>(null)

  // Location loaders
  const loadCountries = async () => {
    setIsLoadingCountries(true)
    try {
      const options = await searchCountries()
      setCountryOptions(options.map(o => ({ value: o.value, label: o.label })))
      return options
    } catch {
      if (__DEV__) console.error('Countries load error')
      return []
    } finally {
      setIsLoadingCountries(false)
    }
  }

  const loadStates = async (countryId: number) => {
    setIsLoadingStates(true)
    try {
      const options = await searchStates(countryId)
      setStateOptions(options.map(o => ({ value: o.value, label: o.label })))
      return options
    } catch {
      if (__DEV__) console.error('States load error')
      return []
    } finally {
      setIsLoadingStates(false)
    }
  }

  const loadCities = async (stateId: number, countryId?: number) => {
    setIsLoadingCities(true)
    try {
      const options = await searchCities(stateId, countryId)
      setCityOptions(options.map(o => ({ value: o.value, label: o.label })))
      return options
    } catch {
      if (__DEV__) console.error('Cities load error')
      return []
    } finally {
      setIsLoadingCities(false)
    }
  }

  // Depo verilerini yükle
  useEffect(() => {
    const loadWarehouse = async () => {
      if (!id) {
        Toast.show({
          type: 'error',
          text1: 'Geçersiz depo ID',
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => router.back(), 1500)
        return
      }

      const warehouseId = parseInt(id, 10)
      if (isNaN(warehouseId) || warehouseId <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Geçersiz depo ID',
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => router.back(), 1500)
        return
      }

      try {
        // Paralel olarak depo ve ülkeleri yükle
        const [data] = await Promise.all([
          getExportWarehouse(warehouseId),
          loadCountries()
        ])

        setFormData({
          code: data.code || '',
          name: data.name || '',
          address: data.address || '',
          country_id: data.country?.id || null,
          state_id: data.state?.id || null,
          city_id: data.city?.id || null,
          total_capacity: null,
          total_area_m2: null,
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          is_active: data.is_active !== false
        })

        // Location labels
        if (data.country) {
          setCountryLabel(data.country.name)
          // İlleri yükle
          await loadStates(data.country.id)
          if (data.state) {
            setStateLabel(data.state.name)
            // Şehirleri yükle
            await loadCities(data.state.id, data.country.id)
            if (data.city) {
              setCityLabel(data.city.name)
            }
          }
        }
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Depo bilgileri yüklenemedi',
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => router.back(), 1500)
      } finally {
        setIsLoading(false)
      }
    }

    loadWarehouse()
  }, [id])

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((
    field: keyof ExportWarehouseFormData,
    value: string | number | boolean | null
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

  // Ülke seçimi
  const handleCountrySelect = (option: SelectOption) => {
    const countryId = Number(option.value)
    handleInputChange('country_id', countryId)
    setCountryLabel(option.label)

    handleInputChange('state_id', null)
    handleInputChange('city_id', null)
    setStateLabel('')
    setCityLabel('')
    setStateOptions([])
    setCityOptions([])

    loadStates(countryId)
  }

  // İl seçimi
  const handleStateSelect = (option: SelectOption) => {
    const stateId = Number(option.value)
    handleInputChange('state_id', stateId)
    setStateLabel(option.label)

    handleInputChange('city_id', null)
    setCityLabel('')
    setCityOptions([])

    loadCities(stateId, formData.country_id || undefined)
  }

  // Şehir seçimi
  const handleCitySelect = (option: SelectOption) => {
    handleInputChange('city_id', Number(option.value))
    setCityLabel(option.label)
  }

  // Form doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code?.trim()) {
      newErrors.code = 'Depo kodu zorunludur.'
    }
    if (formData.code && formData.code.length > 50) {
      newErrors.code = 'Depo kodu en fazla 50 karakter olabilir.'
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Depo adı zorunludur.'
    }
    if (formData.name && formData.name.length > 255) {
      newErrors.name = 'Depo adı en fazla 255 karakter olabilir.'
    }
    if (formData.contact_person && formData.contact_person.length > 255) {
      newErrors.contact_person = 'İletişim kişisi en fazla 255 karakter olabilir.'
    }
    if (formData.phone && formData.phone.length > 20) {
      newErrors.phone = 'Telefon en fazla 20 karakter olabilir.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

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

    if (!id) return

    setIsSubmitting(true)
    try {
      await updateExportWarehouse(parseInt(id, 10), formData)

      Toast.show({
        type: 'success',
        text1: 'Depo başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
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
          visibilityTime: 1500
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [id, formData, validateForm])

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <FormHeader
          title="Depo Düzenle"
          onBackPress={handleBack}
          onSavePress={() => {}}
          saveDisabled
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Depo bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FormHeader
        title="Depo Düzenle"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {/* Temel Bilgiler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="business-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Depo Kodu *"
              placeholder="Örn: IHR-DEP-01"
              value={formData.code}
              onChangeText={(text) => handleInputChange('code', text.toUpperCase())}
              error={errors.code}
              maxLength={50}
              autoCapitalize="characters"
            />

            <Input
              label="Depo Adı *"
              placeholder="Örn: İstanbul İhracat Deposu"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
              maxLength={255}
            />

            <Input
              label="Adres"
              placeholder="Depo adresini girin"
              value={formData.address || ''}
              onChangeText={(text) => handleInputChange('address', text)}
              error={errors.address}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Konum Bilgileri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="location-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Konum Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            {/* Ülke */}
            <View>
              <Text style={styles.inputLabel}>Ülke</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.country_id && styles.selectTriggerError]}
                onPress={() => countryModalRef.current?.present()}
              >
                <Text style={countryLabel ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
                  {countryLabel || 'Ülke seçin'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
              {errors.country_id && <Text style={styles.errorText}>{errors.country_id}</Text>}
            </View>

            {/* İl */}
            <View>
              <Text style={styles.inputLabel}>İl</Text>
              <TouchableOpacity
                style={[
                  styles.selectTrigger,
                  !formData.country_id && styles.selectTriggerDisabled,
                  errors.state_id && styles.selectTriggerError
                ]}
                onPress={() => {
                  if (formData.country_id) stateModalRef.current?.present()
                }}
                disabled={!formData.country_id}
              >
                <Text style={stateLabel ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
                  {stateLabel || (formData.country_id ? 'İl seçin' : 'Önce ülke seçin')}
                </Text>
                <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
              {errors.state_id && <Text style={styles.errorText}>{errors.state_id}</Text>}
            </View>

            {/* Şehir */}
            <View>
              <Text style={styles.inputLabel}>Şehir</Text>
              <TouchableOpacity
                style={[
                  styles.selectTrigger,
                  !formData.state_id && styles.selectTriggerDisabled,
                  errors.city_id && styles.selectTriggerError
                ]}
                onPress={() => {
                  if (formData.state_id) cityModalRef.current?.present()
                }}
                disabled={!formData.state_id}
              >
                <Text style={cityLabel ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
                  {cityLabel || (formData.state_id ? 'Şehir seçin' : 'Önce il seçin')}
                </Text>
                <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
              {errors.city_id && <Text style={styles.errorText}>{errors.city_id}</Text>}
            </View>
          </View>
        </View>

        {/* İletişim Bilgileri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="call-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="İletişim Kişisi"
              placeholder="Ad Soyad"
              value={formData.contact_person || ''}
              onChangeText={(text) => handleInputChange('contact_person', text)}
              error={errors.contact_person}
              maxLength={255}
            />

            <Input
              label="Telefon"
              placeholder="+90 216 555 0000"
              value={formData.phone || ''}
              onChangeText={(text) => handleInputChange('phone', text)}
              error={errors.phone}
              maxLength={20}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Kapasite Bilgileri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="resize-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Kapasite Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Toplam Kapasite (kg)"
              placeholder="50000"
              value={formData.total_capacity ? String(formData.total_capacity) : ''}
              onChangeText={(text) => {
                const numValue = text ? parseFloat(text) : null
                handleInputChange('total_capacity', numValue)
              }}
              error={errors.total_capacity}
              keyboardType="decimal-pad"
            />

            <Input
              label="Toplam Alan (m²)"
              placeholder="2500"
              value={formData.total_area_m2 ? String(formData.total_area_m2) : ''}
              onChangeText={(text) => {
                const numValue = text ? parseFloat(text) : null
                handleInputChange('total_area_m2', numValue)
              }}
              error={errors.total_area_m2}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Durum */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="settings-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Durum</Text>
          </View>

          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleInputChange('is_active', !formData.is_active)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Aktif Depo</Text>
                <Text style={styles.toggleDescription}>
                  Aktif olduğunda depo mal kabul edebilir
                </Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                formData.is_active && styles.toggleSwitchActive
              ]}>
                <View style={[
                  styles.toggleKnob,
                  formData.is_active && styles.toggleKnobActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* SearchableSelectModals */}
      <SearchableSelectModal
        ref={countryModalRef}
        title="Ülke Seçin"
        options={countryOptions}
        selectedValue={formData.country_id}
        onSelect={handleCountrySelect}
        loading={isLoadingCountries}
        searchPlaceholder="Ülke ara..."
        emptyMessage="Ülke bulunamadı"
      />

      <SearchableSelectModal
        ref={stateModalRef}
        title="İl Seçin"
        options={stateOptions}
        selectedValue={formData.state_id}
        onSelect={handleStateSelect}
        loading={isLoadingStates}
        searchPlaceholder="İl ara..."
        emptyMessage="İl bulunamadı"
      />

      <SearchableSelectModal
        ref={cityModalRef}
        title="Şehir Seçin"
        options={cityOptions}
        selectedValue={formData.city_id}
        onSelect={handleCitySelect}
        loading={isLoadingCities}
        searchPlaceholder="Şehir ara..."
        emptyMessage="Şehir bulunamadı"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.md
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
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

  // Input Label
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
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
    backgroundColor: DashboardColors.background
  },
  selectTriggerError: {
    borderColor: DashboardColors.danger
  },
  selectTriggerDisabled: {
    opacity: 0.5
  },
  selectTriggerText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  selectTriggerPlaceholder: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 4
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg
  },
  toggleContent: {
    flex: 1,
    marginRight: DashboardSpacing.md
  },
  toggleLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  toggleDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: DashboardColors.borderLight,
    padding: 2,
    justifyContent: 'center'
  },
  toggleSwitchActive: {
    backgroundColor: DashboardColors.primary
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff'
  },
  toggleKnobActive: {
    alignSelf: 'flex-end'
  }
})
