/**
 * Edit Job Application Screen
 *
 * Başvuru düzenleme ekranı.
 */

import { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
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
import { Input } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-input'
import {
  getJobApplication,
  updateJobApplication,
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

export default function EditJobApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  // Animasyonlu orb'lar
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Job postings
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [loadingJobPostings, setLoadingJobPostings] = useState(false)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const [applicationData, jobPostingsResponse] = await Promise.all([
          getJobApplication(parseInt(id, 10)),
          getJobPostings({ per_page: 100, is_active: true })
        ])

        setFormData({
          job_posting_id: applicationData.job_posting_id || undefined,
          first_name: applicationData.first_name,
          last_name: applicationData.last_name,
          email: applicationData.email,
          phone: applicationData.phone,
          position: applicationData.position,
          cv_file: undefined,
          application_date: applicationData.application_date,
          status: applicationData.status,
          notes: applicationData.notes || ''
        })

        setJobPostings(jobPostingsResponse.jobPostings)
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: getErrorMessage(err),
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => {
          router.back()
        }, 1500)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

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
    if (!id || !validateForm()) {
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
      await updateJobApplication(parseInt(id, 10), formData)

      Toast.show({
        type: 'success',
        text1: 'Başvuru başarıyla güncellendi',
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
  }, [id, formData, validateForm])

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
          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Başvuru Düzenle</Text>
              </View>
              <View style={styles.saveButton} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Başvuru bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  const jobPostingOptions = jobPostings.map((jp) => ({
    label: jp.title,
    value: jp.id,
    subtitle: jp.position
  }))

  return (
    <View style={styles.container}>
      {/* Header */}
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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Başvuru Düzenle</Text>
            </View>

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
            <SearchableSelect
              label="İş İlanı (Opsiyonel)"
              value={formData.job_posting_id || 0}
              onValueChange={(value) => handleInputChange('job_posting_id', value || undefined)}
              options={jobPostingOptions}
              placeholder="İş ilanı seçin"
              searchPlaceholder="İlan ara..."
              loading={loadingJobPostings}
              error={errors.job_posting_id}
            />

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

            <SelectInput
              label="Durum"
              options={STATUS_OPTIONS}
              selectedValue={formData.status || 'başvuru_alındı'}
              onValueChange={(value) => handleInputChange('status', value as ApplicationStatus)}
              error={errors.status}
            />

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
  }
})
