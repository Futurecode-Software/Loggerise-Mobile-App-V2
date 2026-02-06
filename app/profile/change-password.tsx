/**
 * Şifre Değiştirme Ekranı
 *
 * CLAUDE.md form sayfası standardına uygun:
 * - LinearGradient header + animasyonlu orb'lar
 * - KeyboardAwareScrollView
 * - DashboardColors tema sistemi
 * - Şifre güç göstergesi
 */

import React, { useState, useEffect, useMemo } from 'react'
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
import { changePassword, PasswordChangeData } from '@/services/endpoints/profile'

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  // Şifre güç hesaplama
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: DashboardColors.border }

    let score = 0
    if (newPassword.length >= 8) score++
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) score++

    const configs = [
      { label: 'Zayıf', color: DashboardColors.danger },
      { label: 'Orta', color: DashboardColors.warning },
      { label: 'İyi', color: '#22C55E' },
      { label: 'Güçlü', color: DashboardColors.success }
    ]

    return {
      score,
      label: configs[Math.min(score, 3)].label,
      color: configs[Math.min(score, 3)].color
    }
  }, [newPassword])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = 'Mevcut şifre zorunludur'
    }

    if (!newPassword) {
      newErrors.newPassword = 'Yeni şifre zorunludur'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Şifre en az 8 karakter olmalıdır'
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Şifre en az bir büyük harf içermeli'
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = 'Şifre en az bir küçük harf içermeli'
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Şifre en az bir rakam içermeli'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Şifre onayı zorunludur'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmemektedir'
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'Yeni şifre mevcut şifreden farklı olmalıdır'
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
      const data: PasswordChangeData = {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      }

      await changePassword(data)

      Toast.show({
        type: 'success',
        text1: 'Şifreniz başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
      if (
        error.message?.toLowerCase().includes('current') ||
        error.message?.toLowerCase().includes('mevcut')
      ) {
        setErrors((prev) => ({ ...prev, currentPassword: 'Mevcut şifre yanlış' }))
      } else {
        Toast.show({
          type: 'error',
          text1: error.message || 'Şifre değiştirilirken bir hata oluştu',
          position: 'top',
          visibilityTime: 1500
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = currentPassword && newPassword && confirmPassword

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

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    errorKey: string,
    placeholder: string,
    helpText?: string
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          errors[errorKey] && styles.inputContainerError
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color={DashboardColors.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DashboardColors.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={DashboardColors.textMuted}
          />
        </TouchableOpacity>
      </View>
      {errors[errorKey] && (
        <Text style={styles.errorText}>{errors[errorKey]}</Text>
      )}
      {helpText && <Text style={styles.helpText}>{helpText}</Text>}
    </View>
  )

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
              <Text style={styles.headerTitle}>Şifre Değiştir</Text>
            </View>

            {/* Sağ: Kaydet Butonu */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !isFormValid}
              style={[
                styles.headerButton,
                (isSubmitting || !isFormValid) && styles.headerButtonDisabled
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
        {/* Bilgi Kutusu */}
        <View style={styles.infoBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={DashboardColors.primary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Güçlü bir şifre için en az 8 karakter, büyük ve küçük harf ile rakam
            kullanın.
          </Text>
        </View>

        {/* Mevcut Şifre */}
        {renderPasswordField(
          'Mevcut Şifre',
          currentPassword,
          handleInputChange(setCurrentPassword, 'currentPassword'),
          showCurrentPassword,
          setShowCurrentPassword,
          'currentPassword',
          'Mevcut şifrenizi girin'
        )}

        {/* Yeni Şifre */}
        {renderPasswordField(
          'Yeni Şifre',
          newPassword,
          handleInputChange(setNewPassword, 'newPassword'),
          showNewPassword,
          setShowNewPassword,
          'newPassword',
          'Yeni şifrenizi girin',
          'En az 8 karakter, büyük/küçük harf ve rakam içermeli'
        )}

        {/* Yeni Şifre (Tekrar) */}
        {renderPasswordField(
          'Yeni Şifre (Tekrar)',
          confirmPassword,
          handleInputChange(setConfirmPassword, 'confirmPassword'),
          showConfirmPassword,
          setShowConfirmPassword,
          'confirmPassword',
          'Yeni şifrenizi tekrar girin'
        )}

        {/* Şifre Güç Göstergesi */}
        {newPassword && (
          <View style={styles.strengthContainer}>
            <Text style={styles.strengthLabel}>Şifre Gücü:</Text>
            <View style={styles.strengthBars}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor:
                        i < passwordStrength.score
                          ? passwordStrength.color
                          : DashboardColors.border
                    }
                  ]}
                />
              ))}
            </View>
            <Text
              style={[styles.strengthText, { color: passwordStrength.color }]}
            >
              {passwordStrength.label}
            </Text>
          </View>
        )}
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
    minHeight: 70
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    marginBottom: DashboardSpacing.xl,
    borderWidth: 1,
    borderColor: DashboardColors.primary + '20'
  },
  infoIcon: {
    marginRight: DashboardSpacing.sm,
    marginTop: 2
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
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
  eyeButton: {
    padding: DashboardSpacing.xs
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
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  strengthLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginRight: DashboardSpacing.sm
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: DashboardSpacing.xs
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2
  },
  strengthText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    marginLeft: DashboardSpacing.sm,
    minWidth: 50
  }
})
