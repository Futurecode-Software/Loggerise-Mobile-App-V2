/**
 * New Employee Screen
 *
 * Yeni çalışan oluşturma ekranı.
 * Backend StoreEmployeeRequest validation kurallarına uyumlu.
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
import { Input } from '@/components/ui'
import { SearchableSelectModal, SearchableSelectModalRef } from '@/components/modals/SearchableSelectModal'
import {
  createEmployee,
  EmployeeFormData,
  EmploymentStatus,
  ContractType,
  Position,
  Gender,
  MaritalStatus
} from '@/services/endpoints/employees'
import { getErrorMessage, getValidationErrors } from '@/services/api'

// İstihdam durumu seçenekleri
const EMPLOYMENT_STATUS_OPTIONS = [
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'passive' },
  { label: 'İzinde', value: 'on_leave' },
  { label: 'Askıya Alındı', value: 'suspended' },
  { label: 'İşten Ayrıldı', value: 'terminated' }
]

// Sözleşme tipi seçenekleri
const CONTRACT_TYPE_OPTIONS = [
  { label: 'Tam Zamanlı', value: 'full_time' },
  { label: 'Yarı Zamanlı', value: 'part_time' },
  { label: 'Geçici', value: 'temporary' },
  { label: 'Sezonluk', value: 'seasonal' },
  { label: 'Stajyer', value: 'internship' },
  { label: 'Serbest', value: 'freelance' }
]

// Pozisyon seçenekleri
const POSITION_OPTIONS = [
  { label: 'Ofis Personeli', value: 'office_staff' },
  { label: 'Sürücü', value: 'driver' },
  { label: 'Beyaz Yaka', value: 'white_collar' },
  { label: 'Mavi Yaka', value: 'blue_collar' },
  { label: 'Yönetici', value: 'manager' },
  { label: 'Süpervizör', value: 'supervisor' },
  { label: 'Teknisyen', value: 'technician' },
  { label: 'Mühendis', value: 'engineer' },
  { label: 'Muhasebeci', value: 'accountant' },
  { label: 'Satış Temsilcisi', value: 'sales_representative' },
  { label: 'Müşteri Hizmetleri', value: 'customer_service' },
  { label: 'Depo Personeli', value: 'warehouse_staff' },
  { label: 'Güvenlik', value: 'security' },
  { label: 'Temizlik Personeli', value: 'cleaning_staff' },
  { label: 'Stajyer', value: 'intern' },
  { label: 'Diğer', value: 'other' }
]

// Cinsiyet seçenekleri
const GENDER_OPTIONS = [
  { label: 'Erkek', value: 'male' },
  { label: 'Kadın', value: 'female' },
  { label: 'Diğer', value: 'other' }
]

// Medeni durum seçenekleri
const MARITAL_STATUS_OPTIONS = [
  { label: 'Bekar', value: 'single' },
  { label: 'Evli', value: 'married' },
  { label: 'Boşanmış', value: 'divorced' },
  { label: 'Dul', value: 'widowed' }
]

export default function NewEmployeeScreen() {
  const insets = useSafeAreaInsets()

  // Modal refs
  const genderModalRef = useRef<SearchableSelectModalRef>(null)
  const maritalStatusModalRef = useRef<SearchableSelectModalRef>(null)
  const employmentStatusModalRef = useRef<SearchableSelectModalRef>(null)
  const contractTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const positionModalRef = useRef<SearchableSelectModalRef>(null)

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

  // Form state - backend validation kurallarına uygun
  const [formData, setFormData] = useState<EmployeeFormData>({
    citizenship_no: '',
    first_name: '',
    last_name: '',
    phone_1: '',
    email: '',
    employment_status: 'active',
    status: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof EmployeeFormData, value: any) => {
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

  // Backend validation kurallarına uygun doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Zorunlu alanlar
    if (!formData.citizenship_no?.trim()) {
      newErrors.citizenship_no = 'TC Kimlik No zorunludur.'
    } else if (formData.citizenship_no.length > 11) {
      newErrors.citizenship_no = 'TC Kimlik No en fazla 11 karakter olabilir.'
    }

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Ad zorunludur.'
    } else if (formData.first_name.length > 100) {
      newErrors.first_name = 'Ad en fazla 100 karakter olabilir.'
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Soyad zorunludur.'
    } else if (formData.last_name.length > 100) {
      newErrors.last_name = 'Soyad en fazla 100 karakter olabilir.'
    }

    if (!formData.phone_1?.trim()) {
      newErrors.phone_1 = 'Telefon zorunludur.'
    } else if (formData.phone_1.length > 20) {
      newErrors.phone_1 = 'Telefon en fazla 20 karakter olabilir.'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-posta adresi zorunludur.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.'
    } else if (formData.email.length > 255) {
      newErrors.email = 'E-posta en fazla 255 karakter olabilir.'
    }

    if (!formData.employment_status) {
      newErrors.employment_status = 'İstihdam durumu zorunludur.'
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
      await createEmployee(formData)

      Toast.show({
        type: 'success',
        text1: 'Çalışan başarıyla oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
      const validationErrors = getValidationErrors(error)
      if (validationErrors) {
        // Laravel hatalarını düz objeye çevir
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
              <Text style={styles.headerTitle}>Yeni Çalışan</Text>
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
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="TC Kimlik No *"
              placeholder="11 haneli TC kimlik numarası"
              value={formData.citizenship_no}
              onChangeText={(text) => handleInputChange('citizenship_no', text)}
              error={errors.citizenship_no}
              keyboardType="numeric"
              maxLength={11}
            />

            <Input
              label="Ad *"
              placeholder="Örn: Ahmet"
              value={formData.first_name}
              onChangeText={(text) => handleInputChange('first_name', text)}
              error={errors.first_name}
              maxLength={100}
            />

            <Input
              label="Soyad *"
              placeholder="Örn: Yılmaz"
              value={formData.last_name}
              onChangeText={(text) => handleInputChange('last_name', text)}
              error={errors.last_name}
              maxLength={100}
            />

            <Input
              label="Personel Kodu"
              placeholder="Opsiyonel"
              value={formData.employee_code}
              onChangeText={(text) => handleInputChange('employee_code', text)}
              error={errors.employee_code}
              maxLength={50}
            />

            <Input
              label="SGK Numarası"
              placeholder="Opsiyonel"
              value={formData.sgk_number}
              onChangeText={(text) => handleInputChange('sgk_number', text)}
              error={errors.sgk_number}
              maxLength={50}
            />

            {/* Cinsiyet */}
            <View>
              <Text style={styles.inputLabel}>Cinsiyet</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.gender && styles.selectTriggerError]}
                onPress={() => genderModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.selectTriggerText,
                  !formData.gender && styles.selectTriggerPlaceholder
                ]}>
                  {formData.gender
                    ? GENDER_OPTIONS.find(opt => opt.value === formData.gender)?.label
                    : 'Seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>

            {/* Medeni Durum */}
            <View>
              <Text style={styles.inputLabel}>Medeni Durum</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.marital_status && styles.selectTriggerError]}
                onPress={() => maritalStatusModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.selectTriggerText,
                  !formData.marital_status && styles.selectTriggerPlaceholder
                ]}>
                  {formData.marital_status
                    ? MARITAL_STATUS_OPTIONS.find(opt => opt.value === formData.marital_status)?.label
                    : 'Seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.marital_status && <Text style={styles.errorText}>{errors.marital_status}</Text>}
            </View>
          </View>
        </View>

        {/* İletişim Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="call-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Telefon *"
              placeholder="Örn: 0555 123 45 67"
              value={formData.phone_1}
              onChangeText={(text) => handleInputChange('phone_1', text)}
              error={errors.phone_1}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <Input
              label="Telefon 2"
              placeholder="Opsiyonel"
              value={formData.phone_2}
              onChangeText={(text) => handleInputChange('phone_2', text)}
              error={errors.phone_2}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <Input
              label="E-posta *"
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={255}
            />

            <Input
              label="Ev Telefonu"
              placeholder="Opsiyonel"
              value={formData.home_phone}
              onChangeText={(text) => handleInputChange('home_phone', text)}
              error={errors.home_phone}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <Input
              label="Acil Durum Telefon"
              placeholder="Opsiyonel"
              value={formData.emergency_phone_1}
              onChangeText={(text) => handleInputChange('emergency_phone_1', text)}
              error={errors.emergency_phone_1}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>
        </View>

        {/* İstihdam Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="briefcase-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>İstihdam Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            {/* İstihdam Durumu */}
            <View>
              <Text style={styles.inputLabel}>İstihdam Durumu *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.employment_status && styles.selectTriggerError]}
                onPress={() => employmentStatusModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={styles.selectTriggerText}>
                  {EMPLOYMENT_STATUS_OPTIONS.find(opt => opt.value === formData.employment_status)?.label || 'Aktif'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.employment_status && <Text style={styles.errorText}>{errors.employment_status}</Text>}
            </View>

            {/* Sözleşme Tipi */}
            <View>
              <Text style={styles.inputLabel}>Sözleşme Tipi</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.contract_type && styles.selectTriggerError]}
                onPress={() => contractTypeModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.selectTriggerText,
                  !formData.contract_type && styles.selectTriggerPlaceholder
                ]}>
                  {formData.contract_type
                    ? CONTRACT_TYPE_OPTIONS.find(opt => opt.value === formData.contract_type)?.label
                    : 'Seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.contract_type && <Text style={styles.errorText}>{errors.contract_type}</Text>}
            </View>

            {/* Pozisyon */}
            <View>
              <Text style={styles.inputLabel}>Pozisyon</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.position && styles.selectTriggerError]}
                onPress={() => positionModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.selectTriggerText,
                  !formData.position && styles.selectTriggerPlaceholder
                ]}>
                  {formData.position
                    ? POSITION_OPTIONS.find(opt => opt.value === formData.position)?.label
                    : 'Seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}
            </View>

            {/* Aktif/Pasif Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleInputChange('status', !formData.status)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Aktif Çalışan</Text>
                <Text style={styles.toggleDescription}>Bu çalışan kullanıma açık olacak</Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                formData.status && styles.toggleSwitchActive
              ]}>
                <View style={[
                  styles.toggleKnob,
                  formData.status && styles.toggleKnobActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Modals */}
      <SearchableSelectModal
        ref={genderModalRef}
        title="Cinsiyet"
        options={GENDER_OPTIONS}
        selectedValue={formData.gender}
        onSelect={(option) => handleInputChange('gender', option.value as Gender)}
      />
      <SearchableSelectModal
        ref={maritalStatusModalRef}
        title="Medeni Durum"
        options={MARITAL_STATUS_OPTIONS}
        selectedValue={formData.marital_status}
        onSelect={(option) => handleInputChange('marital_status', option.value as MaritalStatus)}
      />
      <SearchableSelectModal
        ref={employmentStatusModalRef}
        title="İstihdam Durumu"
        options={EMPLOYMENT_STATUS_OPTIONS}
        selectedValue={formData.employment_status}
        onSelect={(option) => handleInputChange('employment_status', option.value as EmploymentStatus)}
      />
      <SearchableSelectModal
        ref={contractTypeModalRef}
        title="Sözleşme Tipi"
        options={CONTRACT_TYPE_OPTIONS}
        selectedValue={formData.contract_type}
        onSelect={(option) => handleInputChange('contract_type', option.value as ContractType)}
      />
      <SearchableSelectModal
        ref={positionModalRef}
        title="Pozisyon"
        options={POSITION_OPTIONS}
        selectedValue={formData.position}
        onSelect={(option) => handleInputChange('position', option.value as Position)}
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
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    marginBottom: 8
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: 14,
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectTriggerError: {
    borderColor: DashboardColors.error
  },
  selectTriggerText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    flex: 1
  },
  selectTriggerPlaceholder: {
    color: DashboardColors.textSecondary
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.error,
    marginTop: 4
  }
})
