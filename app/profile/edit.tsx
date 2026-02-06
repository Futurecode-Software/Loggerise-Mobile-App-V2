/**
 * Profil Düzenleme Ekranı
 *
 * CLAUDE.md form sayfası standardına uygun:
 * - LinearGradient header + animasyonlu orb'lar
 * - KeyboardAwareScrollView
 * - DashboardColors tema sistemi
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { useAuth } from '@/context/auth-context'
import { updateProfile, ProfileUpdateData } from '@/services/endpoints/profile'

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  // Kullanıcı verilerini form'a yükle
  useEffect(() => {
    if (user) {
      setName(user.fullName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Ad soyad zorunludur'
    } else if (name.trim().length < 2) {
      newErrors.name = 'Ad soyad en az 2 karakter olmalıdır'
    }

    if (!email.trim()) {
      newErrors.email = 'E-posta adresi zorunludur'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz'
    }

    if (phone && !/^[\d\s\-\+\(\)]{10,}$/.test(phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBack = () => {
    router.back()
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const data: ProfileUpdateData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined
      }

      await updateProfile(data)
      await refreshUser()

      Toast.show({
        type: 'success',
        text1: 'Profil bilgileriniz güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Profil güncellenirken bir hata oluştu',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = (): boolean => {
    if (!user) return false
    return (
      name.trim() !== (user.fullName || '') ||
      email.trim() !== (user.email || '') ||
      phone.trim() !== (user.phone || '')
    )
  }

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    key: string
  ) => (text: string) => {
    setter(text)
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
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
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Profil Düzenle</Text>
            </View>

            {/* Sağ: Kaydet Butonu */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !hasChanges()}
              style={[
                styles.headerButton,
                (isSubmitting || !hasChanges()) && styles.headerButtonDisabled
              ]}
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
        {/* Ad Soyad */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Ad Soyad</Text>
          <View
            style={[
              styles.inputContainer,
              errors.name && styles.inputContainerError
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={DashboardColors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={handleInputChange(setName, 'name')}
              placeholder="Adınız ve soyadınız"
              placeholderTextColor={DashboardColors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* E-posta */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>E-posta Adresi</Text>
          <View
            style={[
              styles.inputContainer,
              errors.email && styles.inputContainerError
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={DashboardColors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={handleInputChange(setEmail, 'email')}
              placeholder="ornek@email.com"
              placeholderTextColor={DashboardColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          <Text style={styles.helpText}>
            E-posta adresinizi değiştirirseniz hesabınızı tekrar doğrulamanız
            gerekebilir.
          </Text>
        </View>

        {/* Telefon */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Telefon Numarası</Text>
          <View
            style={[
              styles.inputContainer,
              errors.phone && styles.inputContainerError
            ]}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color={DashboardColors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={handleInputChange(setPhone, 'phone')}
              placeholder="+90 5XX XXX XX XX"
              placeholderTextColor={DashboardColors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          <Text style={styles.helpText}>
            Opsiyonel - Telefon numaranız hesap kurtarma için kullanılabilir.
          </Text>
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
    minHeight: 70,
    paddingBottom: DashboardSpacing.lg
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerButtonDisabled: {
    opacity: 0.5
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
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl']
  },
  fieldContainer: {
    marginBottom: DashboardSpacing.xl
  },
  label: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    paddingHorizontal: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  inputContainerError: {
    borderColor: DashboardColors.danger
  },
  inputIcon: {
    marginRight: DashboardSpacing.sm
  },
  input: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingVertical: DashboardSpacing.md
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs
  },
  helpText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.xs
  }
})
