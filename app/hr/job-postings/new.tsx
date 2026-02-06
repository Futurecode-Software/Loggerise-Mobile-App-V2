/**
 * New Job Posting Screen
 *
 * Yeni iş ilanı oluşturma ekranı.
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
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
import { FormHeader } from '@/components/navigation/FormHeader'
import { Input } from '@/components/ui'
import { SearchableSelectModal, SearchableSelectModalRef } from '@/components/modals/SearchableSelectModal'
import { DateInput } from '@/components/ui/date-input'
import {
  createJobPosting,
  JobPostingFormData,
  EmploymentType,
  ExperienceLevel
} from '@/services/endpoints/job-postings'
import { getErrorMessage, getValidationErrors } from '@/services/api'
import { CURRENCY_OPTIONS } from '@/constants/currencies'

// İstihdam türü seçenekleri
const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Tam Zamanlı', value: 'full_time' },
  { label: 'Yarı Zamanlı', value: 'part_time' },
  { label: 'Sözleşmeli', value: 'contract' },
  { label: 'Staj', value: 'internship' },
  { label: 'Uzaktan', value: 'remote' }
]

// Deneyim seviyesi seçenekleri
const EXPERIENCE_LEVEL_OPTIONS = [
  { label: 'Giriş Seviyesi', value: 'entry' },
  { label: 'Junior', value: 'junior' },
  { label: 'Mid-Level', value: 'mid' },
  { label: 'Senior', value: 'senior' },
  { label: 'Uzman', value: 'expert' }
]

export default function NewJobPostingScreen() {
  // Modal refs
  const employmentTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const experienceLevelModalRef = useRef<SearchableSelectModalRef>(null)
  const salaryCurrencyModalRef = useRef<SearchableSelectModalRef>(null)

  // Form state
  const [formData, setFormData] = useState<JobPostingFormData>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    position: '',
    location: '',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: undefined,
    salary_max: undefined,
    salary_currency: 'TRY',
    application_deadline: undefined,
    is_public: false,
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof JobPostingFormData, value: any) => {
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

  // Doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Zorunlu alanlar
    if (!formData.title?.trim()) {
      newErrors.title = 'İlan başlığı zorunludur.'
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'İlan açıklaması zorunludur.'
    }
    if (!formData.position?.trim()) {
      newErrors.position = 'Pozisyon zorunludur.'
    }
    if (!formData.employment_type) {
      newErrors.employment_type = 'İstihdam türü zorunludur.'
    }
    if (!formData.experience_level) {
      newErrors.experience_level = 'Deneyim seviyesi zorunludur.'
    }

    // Maaş doğrulaması
    if (formData.salary_min && formData.salary_max) {
      if (formData.salary_max < formData.salary_min) {
        newErrors.salary_max = 'Maksimum maaş, minimum maaştan küçük olamaz.'
      }
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
      await createJobPosting(formData)

      Toast.show({
        type: 'success',
        text1: 'İş ilanı başarıyla oluşturuldu',
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
        title="Yeni İş İlanı"
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
              <Ionicons name="briefcase-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="İlan Başlığı *"
              placeholder="Örn: Senior React Developer"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              error={errors.title}
            />

            <Input
              label="Pozisyon *"
              placeholder="Örn: Frontend Developer"
              value={formData.position}
              onChangeText={(text) => handleInputChange('position', text)}
              error={errors.position}
            />

            <Input
              label="Lokasyon"
              placeholder="Örn: İstanbul, Türkiye"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              error={errors.location}
            />

            <View>
              <Text style={styles.inputLabel}>İstihdam Türü *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.employment_type && styles.selectTriggerError]}
                onPress={() => employmentTypeModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={styles.selectTriggerText}>
                  {EMPLOYMENT_TYPE_OPTIONS.find(opt => opt.value === formData.employment_type)?.label || 'Seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.employment_type && <Text style={styles.errorText}>{errors.employment_type}</Text>}
            </View>

            <View>
              <Text style={styles.inputLabel}>Deneyim Seviyesi *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.experience_level && styles.selectTriggerError]}
                onPress={() => experienceLevelModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={styles.selectTriggerText}>
                  {EXPERIENCE_LEVEL_OPTIONS.find(opt => opt.value === formData.experience_level)?.label || 'Seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.experience_level && <Text style={styles.errorText}>{errors.experience_level}</Text>}
            </View>
          </View>
        </View>

        {/* Açıklama Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Açıklama</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="İlan Açıklaması *"
              placeholder="İlan açıklamasını girin..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              error={errors.description}
              multiline
              numberOfLines={6}
            />

            <Input
              label="Aranan Nitelikler"
              placeholder="Aranan nitelikleri girin..."
              value={formData.requirements}
              onChangeText={(text) => handleInputChange('requirements', text)}
              error={errors.requirements}
              multiline
              numberOfLines={4}
            />

            <Input
              label="Sorumluluklar"
              placeholder="Sorumlulukları girin..."
              value={formData.responsibilities}
              onChangeText={(text) => handleInputChange('responsibilities', text)}
              error={errors.responsibilities}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Maaş Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cash-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Maaş Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <View>
              <Text style={styles.inputLabel}>Para Birimi</Text>
              <TouchableOpacity
                style={styles.selectTrigger}
                onPress={() => salaryCurrencyModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={styles.selectTriggerText}>
                  {CURRENCY_OPTIONS.find(opt => opt.value === formData.salary_currency)?.label || 'TRY'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Minimum Maaş"
              placeholder="0"
              value={formData.salary_min?.toString() || ''}
              onChangeText={(text) => {
                const numValue = parseFloat(text) || undefined
                handleInputChange('salary_min', numValue)
              }}
              error={errors.salary_min}
              keyboardType="decimal-pad"
            />

            <Input
              label="Maksimum Maaş"
              placeholder="0"
              value={formData.salary_max?.toString() || ''}
              onChangeText={(text) => {
                const numValue = parseFloat(text) || undefined
                handleInputChange('salary_max', numValue)
              }}
              error={errors.salary_max}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Başvuru Ayarları Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="settings-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Başvuru Ayarları</Text>
          </View>

          <View style={styles.sectionContent}>
            <DateInput
              label="Başvuru Son Tarihi"
              value={formData.application_deadline || ''}
              onChangeDate={(value) => handleInputChange('application_deadline', value)}
              error={errors.application_deadline}
            />

            {/* Herkese Açık Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleInputChange('is_public', !formData.is_public)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Herkese Açık</Text>
                <Text style={styles.toggleDescription}>İlan herkese görünür olsun</Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                formData.is_public && styles.toggleSwitchActive
              ]}>
                <View style={[
                  styles.toggleKnob,
                  formData.is_public && styles.toggleKnobActive
                ]} />
              </View>
            </TouchableOpacity>

            {/* Aktif Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleInputChange('is_active', !formData.is_active)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Aktif</Text>
                <Text style={styles.toggleDescription}>İlan aktif olsun</Text>
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

      {/* Modals */}
      <SearchableSelectModal
        ref={employmentTypeModalRef}
        title="İstihdam Türü Seçin"
        options={EMPLOYMENT_TYPE_OPTIONS}
        selectedValue={formData.employment_type}
        onSelect={(option) => handleInputChange('employment_type', option.value as EmploymentType)}
      />

      <SearchableSelectModal
        ref={experienceLevelModalRef}
        title="Deneyim Seviyesi Seçin"
        options={EXPERIENCE_LEVEL_OPTIONS}
        selectedValue={formData.experience_level}
        onSelect={(option) => handleInputChange('experience_level', option.value as ExperienceLevel)}
      />

      <SearchableSelectModal
        ref={salaryCurrencyModalRef}
        title="Para Birimi Seçin"
        options={CURRENCY_OPTIONS}
        selectedValue={formData.salary_currency}
        onSelect={(option) => handleInputChange('salary_currency', String(option.value))}
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
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    minHeight: 48
  },
  selectTriggerError: {
    borderColor: DashboardColors.danger
  },
  selectTriggerText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 4
  }
})
