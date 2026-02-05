/**
 * İş İlanı Düzenleme Sayfası
 *
 * Mevcut iş ilanını güncelleme - CLAUDE.md tasarım ilkeleri ile uyumlu
 */

import { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
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
import { FormHeader } from '@/components/navigation/FormHeader'
import { Input } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import { DateInput } from '@/components/ui/date-input'
import {
  getJobPosting,
  updateJobPosting,
  JobPostingFormData,
  EmploymentType,
  ExperienceLevel
} from '@/services/endpoints/job-postings'
import { getErrorMessage, getValidationErrors } from '@/services/api'
import { CURRENCY_OPTIONS } from '@/constants/currencies'

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Tam Zamanlı', value: 'full_time' },
  { label: 'Yarı Zamanlı', value: 'part_time' },
  { label: 'Sözleşmeli', value: 'contract' },
  { label: 'Staj', value: 'internship' },
  { label: 'Uzaktan', value: 'remote' }
]

const EXPERIENCE_LEVEL_OPTIONS = [
  { label: 'Giriş Seviyesi', value: 'entry' },
  { label: 'Junior', value: 'junior' },
  { label: 'Mid-Level', value: 'mid' },
  { label: 'Senior', value: 'senior' },
  { label: 'Uzman', value: 'expert' }
]

export default function EditJobPostingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch job posting
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const data = await getJobPosting(parseInt(id, 10))
        setFormData({
          title: data.title,
          description: data.description,
          requirements: data.requirements || '',
          responsibilities: data.responsibilities || '',
          position: data.position,
          location: data.location || '',
          employment_type: data.employment_type,
          experience_level: data.experience_level,
          salary_min: data.salary_min || undefined,
          salary_max: data.salary_max || undefined,
          salary_currency: data.salary_currency,
          application_deadline: data.application_deadline || undefined,
          is_public: data.is_public,
          is_active: data.is_active
        })
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: getErrorMessage(err),
          position: 'top',
          visibilityTime: 1500
        })
        router.back()
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
   
  }, [id])

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

    if (!id) return

    setIsSubmitting(true)
    try {
      await updateJobPosting(parseInt(id, 10), formData)

      Toast.show({
        type: 'success',
        text1: 'İş ilanı başarıyla güncellendi',
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
  }, [id, formData, validateForm])

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={DashboardColors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="İlan Düzenle"
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
              <Ionicons name="information-circle-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>

            <Input
              label="İlan Başlığı *"
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              error={errors.title}
              placeholder="Örn: Senior React Developer"
            />

            <Input
              label="Pozisyon *"
              value={formData.position}
              onChangeText={(value) => handleInputChange('position', value)}
              error={errors.position}
              placeholder="Örn: Yazılım Geliştirici"
            />

            <Input
              label="Lokasyon"
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              error={errors.location}
              placeholder="Örn: İstanbul"
            />

            <SelectInput
              label="İstihdam Türü *"
              options={EMPLOYMENT_TYPE_OPTIONS}
              selectedValue={formData.employment_type}
              onValueChange={(value) => handleInputChange('employment_type', value as EmploymentType)}
              error={errors.employment_type}
            />

            <SelectInput
              label="Deneyim Seviyesi *"
              options={EXPERIENCE_LEVEL_OPTIONS}
              selectedValue={formData.experience_level}
              onValueChange={(value) => handleInputChange('experience_level', value as ExperienceLevel)}
              error={errors.experience_level}
            />
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
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={6}
              error={errors.description}
              placeholder="İlan hakkında detaylı açıklama..."
            />

            <Input
              label="Aranan Nitelikler"
              value={formData.requirements}
              onChangeText={(value) => handleInputChange('requirements', value)}
              multiline
              numberOfLines={4}
              error={errors.requirements}
              placeholder="Adayda aranılan nitelikler..."
            />

            <Input
              label="Sorumluluklar"
              value={formData.responsibilities}
              onChangeText={(value) => handleInputChange('responsibilities', value)}
              multiline
              numberOfLines={4}
              error={errors.responsibilities}
              placeholder="Pozisyon sorumlulukları..."
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
            <SelectInput
              label="Para Birimi"
              options={CURRENCY_OPTIONS}
              selectedValue={formData.salary_currency || 'TRY'}
              onValueChange={(value) => handleInputChange('salary_currency', value)}
            />

            <Input
              label="Minimum Maaş"
              value={formData.salary_min?.toString() || ''}
              onChangeText={(value) =>
                handleInputChange('salary_min', value ? parseFloat(value) : undefined)
              }
              keyboardType="decimal-pad"
              error={errors.salary_min}
              placeholder="0.00"
            />

            <Input
              label="Maksimum Maaş"
              value={formData.salary_max?.toString() || ''}
              onChangeText={(value) =>
                handleInputChange('salary_max', value ? parseFloat(value) : undefined)
              }
              keyboardType="decimal-pad"
              error={errors.salary_max}
              placeholder="0.00"
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
                <Text style={styles.toggleDescription}>İlan herkese görünür olacak</Text>
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
                <Text style={styles.toggleLabel}>Aktif İlan</Text>
                <Text style={styles.toggleDescription}>İlan aktif olacak</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
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
  }
})
