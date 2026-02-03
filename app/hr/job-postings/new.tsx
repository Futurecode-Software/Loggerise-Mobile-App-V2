/**
 * New Job Posting Screen
 *
 * Yeni iş ilanı oluşturma ekranı.
 */

import React, { useState, useCallback, useEffect } from 'react'
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
import { SelectInput } from '@/components/ui/select-input'
import { DateInput } from '@/components/ui/date-input'
import {
  createJobPosting,
  JobPostingFormData,
  EmploymentType,
  ExperienceLevel
} from '@/services/endpoints/job-postings'
import { getErrorMessage, getValidationErrors } from '@/services/api'

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

// Para birimi seçenekleri
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' }
]

export default function NewJobPostingScreen() {
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
              <Text style={styles.headerTitle}>Yeni İş İlanı</Text>
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
            <SelectInput
              label="Para Birimi"
              options={CURRENCY_OPTIONS}
              selectedValue={formData.salary_currency || 'TRY'}
              onValueChange={(value) => handleInputChange('salary_currency', value)}
            />

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
  }
})
