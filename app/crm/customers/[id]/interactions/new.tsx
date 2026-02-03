import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import { Input } from '@/components/ui'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import {
  createInteraction,
  InteractionFormData,
  InteractionType,
  InteractionStatus,
} from '@/services/endpoints/customer-interactions'

const INTERACTION_TYPES = [
  { value: 'meeting', label: 'Toplantı', icon: 'people-outline' },
  { value: 'call', label: 'Arama', icon: 'call-outline' },
  { value: 'email', label: 'E-posta', icon: 'mail-outline' },
  { value: 'follow_up', label: 'Takip', icon: 'time-outline' },
] as const

export default function NewInteractionScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const customerId = parseInt(id, 10)

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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<InteractionFormData>({
    interaction_type: 'meeting',
    subject: '',
    description: '',
    interaction_date: new Date().toISOString().split('T')[0],
    next_followup_date: '',
    status: 'pending',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.interaction_type) {
      newErrors.interaction_type = 'Görüşme tipi zorunludur'
    }

    if (!formData.subject?.trim()) {
      newErrors.subject = 'Konu zorunludur'
    }

    if (!formData.interaction_date) {
      newErrors.interaction_date = 'Görüşme tarihi zorunludur'
    }

    // Validate date format
    if (formData.interaction_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.interaction_date)) {
      newErrors.interaction_date = 'Geçersiz tarih formatı'
    }

    // Validate follow-up date if provided
    if (
      formData.next_followup_date &&
      !/^\d{4}-\d{2}-\d{2}$/.test(formData.next_followup_date)
    ) {
      newErrors.next_followup_date = 'Geçersiz tarih formatı'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen formu eksiksiz doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createInteraction(customerId, formData)
      Toast.show({
        type: 'success',
        text1: 'Görüşme başarıyla oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Görüşme oluşturulamadı',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni Görüşme</Text>
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
        {/* Görüşme Tipi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="apps-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Görüşme Tipi</Text>
          </View>

          <View style={styles.sectionContent}>
            <View style={styles.typeGrid}>
              {INTERACTION_TYPES.map((type) => {
                const isActive = formData.interaction_type === type.value

                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeCard,
                      isActive && styles.typeCardActive
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, interaction_type: type.value as InteractionType })
                    }
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={isActive ? DashboardColors.primary : DashboardColors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        isActive && styles.typeLabelActive
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {errors.interaction_type && (
              <Text style={styles.errorText}>
                {errors.interaction_type}
              </Text>
            )}
          </View>
        </View>

        {/* Görüşme Detayları */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Görüşme Detayları</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Konu *"
              placeholder="Görüşme konusu"
              value={formData.subject}
              onChangeText={(value) => setFormData({ ...formData, subject: value })}
              error={errors.subject}
            />

            <Input
              label="Açıklama"
              placeholder="Görüşme notları ve detayları..."
              value={formData.description}
              onChangeText={(value) => setFormData({ ...formData, description: value })}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Tarihler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="calendar-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Tarihler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Görüşme Tarihi *"
              placeholder="YYYY-MM-DD"
              value={formData.interaction_date}
              onChangeText={(value) => setFormData({ ...formData, interaction_date: value })}
              error={errors.interaction_date}
            />

            <Input
              label="Sonraki Takip Tarihi"
              placeholder="YYYY-MM-DD"
              value={formData.next_followup_date}
              onChangeText={(value) => setFormData({ ...formData, next_followup_date: value })}
              error={errors.next_followup_date}
            />
          </View>
        </View>

        {/* Durum */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="flag-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Durum</Text>
          </View>

          <View style={styles.sectionContent}>
            <View style={styles.statusButtons}>
              {[
                { value: 'pending', label: 'Beklemede', color: DashboardColors.warning },
                { value: 'completed', label: 'Tamamlandı', color: DashboardColors.success },
                { value: 'cancelled', label: 'İptal Edildi', color: DashboardColors.textMuted },
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    formData.status === status.value && [
                      styles.statusButtonActive,
                      { borderColor: status.color },
                    ],
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      status: status.value as InteractionStatus,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      {
                        color: formData.status === status.value ? status.color : DashboardColors.textPrimary,
                      },
                    ]}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: DashboardSpacing.lg,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 2,
    borderColor: DashboardColors.borderLight,
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background
  },
  typeCardActive: {
    borderColor: DashboardColors.primary,
    backgroundColor: DashboardColors.primaryGlow
  },
  typeLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  typeLabelActive: {
    color: DashboardColors.primary
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm
  },
  statusButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    alignItems: 'center',
    backgroundColor: DashboardColors.background
  },
  statusButtonActive: {
    borderWidth: 2
  },
  statusButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.sm
  }
})
