/**
 * New Job Application Screen
 *
 * Yeni başvuru oluşturma ekranı.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
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
import { FormHeader } from '@/components/navigation/FormHeader'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { SearchableSelectModal, SearchableSelectModalRef } from '@/components/modals/SearchableSelectModal'
import { DateInput } from '@/components/ui/date-input'
import {
  createJobApplication,
  JobApplicationFormData,
  ApplicationStatus
} from '@/services/endpoints/job-applications'
import { getJobPostings, JobPosting } from '@/services/endpoints/job-postings'
import { getErrorMessage, getValidationErrors } from '@/services/api'

const STATUS_OPTIONS = [
  { label: 'Başvuru Alındı', value: 'başvuru_alındı' },
  { label: 'Değerlendiriliyor', value: 'değerlendiriliyor' },
  { label: 'Mülakat Planlandı', value: 'mülakat_planlandı' },
  { label: 'Onaylandı', value: 'onaylandı' },
  { label: 'Reddedildi', value: 'reddedildi' },
  { label: 'İptal Edildi', value: 'iptal_edildi' }
]

export default function NewJobApplicationScreen() {
  // Modal refs
  const jobPostingModalRef = useRef<SearchableSelectModalRef>(null)
  const statusModalRef = useRef<SearchableSelectModalRef>(null)

  // Form state
  const [formData, setFormData] = useState<JobApplicationFormData>({
    job_posting_id: undefined,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    cv_file: undefined,
    application_date: new Date().toISOString().split('T')[0],
    status: 'başvuru_alındı',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Job postings
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loadingJobPostings, setLoadingJobPostings] = useState(false)

  // Fetch job postings
  useEffect(() => {
    const fetchJobPostings = async () => {
      setLoadingJobPostings(true)
      try {
        const response = await getJobPostings({ per_page: 100, is_active: true })
        setJobPostings(response.jobPostings)
      } catch (err) {
        console.error('Failed to load job postings:', err)
      } finally {
        setLoadingJobPostings(false)
      }
    }
    fetchJobPostings()
  }, [])

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof JobApplicationFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Auto-fill position
      if (field === 'job_posting_id' && value) {
        const selectedJobPosting = jobPostings.find((jp) => jp.id === value)
        if (selectedJobPosting) {
          setFormData((prev) => ({ ...prev, position: selectedJobPosting.position }))
        }
      }

      if (errors[field]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [errors, jobPostings]
  )

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Ad zorunludur.'
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Soyad zorunludur.'
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'E-posta zorunludur.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin.'
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Telefon zorunludur.'
    }
    if (!formData.position?.trim()) {
      newErrors.position = 'Pozisyon zorunludur.'
    }
    if (!formData.application_date) {
      newErrors.application_date = 'Başvuru tarihi zorunludur.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Back
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  // Submit
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
      await createJobApplication(formData)

      Toast.show({
        type: 'success',
        text1: 'Başvuru başarıyla oluşturuldu',
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

  const jobPostingOptions = jobPostings.map((jp) => ({
    label: jp.title,
    value: jp.id,
    subtitle: jp.position
  }))

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Yeni Başvuru"
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
        {/* Başvurucu Bilgileri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Başvurucu Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Ad *"
              placeholder="Adı girin"
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              error={errors.first_name}
            />

            <Input
              label="Soyad *"
              placeholder="Soyadı girin"
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              error={errors.last_name}
            />

            <Input
              label="E-posta *"
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Telefon *"
              placeholder="+90 5XX XXX XX XX"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              error={errors.phone}
            />
          </View>
        </View>

        {/* İş İlanı ve Pozisyon */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="briefcase-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>İş İlanı</Text>
          </View>

          <View style={styles.sectionContent}>
            <View>
              <Text style={styles.inputLabel}>İş İlanı (Opsiyonel)</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.job_posting_id && styles.selectTriggerError]}
                onPress={() => jobPostingModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.selectTriggerText,
                  !formData.job_posting_id && styles.selectTriggerPlaceholder
                ]}>
                  {formData.job_posting_id
                    ? jobPostingOptions.find(opt => opt.value === formData.job_posting_id)?.label
                    : 'İş ilanı seçin'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.job_posting_id && <Text style={styles.errorText}>{errors.job_posting_id}</Text>}
            </View>

            <Input
              label="Başvurulan Pozisyon *"
              placeholder="Pozisyon adı"
              value={formData.position}
              onChangeText={(value) => handleInputChange('position', value)}
              error={errors.position}
            />
          </View>
        </View>

        {/* Başvuru Detayları */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Başvuru Detayları</Text>
          </View>

          <View style={styles.sectionContent}>
            <DateInput
              label="Başvuru Tarihi *"
              value={formData.application_date}
              onChangeDate={(value) => handleInputChange('application_date', value)}
              error={errors.application_date}
            />

            <View>
              <Text style={styles.inputLabel}>Durum</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.status && styles.selectTriggerError]}
                onPress={() => statusModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={styles.selectTriggerText}>
                  {STATUS_OPTIONS.find(opt => opt.value === formData.status)?.label || 'Başvuru Alındı'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
            </View>

            <Input
              label="Notlar"
              placeholder="Değerlendirme notları..."
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={4}
              error={errors.notes}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Modals */}
      <SearchableSelectModal
        ref={jobPostingModalRef}
        title="İş İlanı Seçin"
        options={jobPostingOptions}
        selectedValue={formData.job_posting_id}
        onSelect={(option) => handleInputChange('job_posting_id', option.value || undefined)}
        searchPlaceholder="İlan ara..."
        loading={loadingJobPostings}
      />

      <SearchableSelectModal
        ref={statusModalRef}
        title="Durum Seçin"
        options={STATUS_OPTIONS}
        selectedValue={formData.status}
        onSelect={(option) => handleInputChange('status', option.value as ApplicationStatus)}
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
  selectTriggerPlaceholder: {
    color: DashboardColors.textMuted
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 4
  }
})
