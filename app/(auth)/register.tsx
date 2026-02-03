/**
 * Premium Register Screen
 *
 * Multi-step kayıt wizard'ı
 * Glassmorphism, smooth transitions ve elegant step indicators
 */

import React, { useState, useCallback, Fragment, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
  SlideInRight,
  SlideOutLeft,
  Easing,
} from 'react-native-reanimated'
import { useAuth, RegisterData } from '@/context/auth-context'
import Toast from 'react-native-toast-message'
import {
  AuthColors,
  AuthSpacing,
  AuthBorderRadius,
  AuthFontSizes,
  AuthSizes,
  AuthShadows,
  AuthAnimations,
} from '@/constants/auth-styles'
import AuthHeader from '@/components/auth/AuthHeader'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface StepConfig {
  id: string
  title: string
  icon: keyof typeof Ionicons.glyphMap
}

const STEPS: StepConfig[] = [
  { id: 'account', title: 'Hesap', icon: 'person-outline' },
  { id: 'company', title: 'Firma', icon: 'business-outline' },
]

export default function Register() {
  const router = useRouter()
  const { register, isLoading, isInitializing, isAuthenticated } = useAuth()
  const { height: screenHeight } = useWindowDimensions()

  // Navigation is handled by NavigationController in _layout.tsx
  // No need to manually redirect here

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Animation values
  const buttonScale = useSharedValue(1)
  const stepProgress = useSharedValue(0)

  useEffect(() => {
    stepProgress.value = withTiming(currentStep / (STEPS.length - 1), {
      duration: AuthAnimations.timing.slow,
      easing: Easing.out(Easing.cubic),
    })
  }, [currentStep, stepProgress])

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = useCallback(
    (step: number) => {
      const newErrors: Record<string, string> = {}

      if (step === 0) {
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Ad soyad gerekli'
        }
        if (!formData.email.trim()) {
          newErrors.email = 'E-posta gerekli'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Geçerli bir e-posta girin'
        }
        if (!formData.password) {
          newErrors.password = 'Şifre gerekli'
        } else if (formData.password.length < 8) {
          newErrors.password = 'Şifre en az 8 karakter olmalı'
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Şifre tekrarı gerekli'
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Şifreler eşleşmiyor'
        }
      } else if (step === 1) {
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Firma adı gerekli'
        }
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [formData]
  )

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }, [currentStep, validateStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      router.back()
    }
  }, [currentStep, router])

  const handleRegister = useCallback(async () => {
    if (validateStep(currentStep)) {
      try {
        const registerData: RegisterData = {
          fullName: formData.fullName.trim(),
          companyName: formData.companyName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          passwordConfirmation: formData.confirmPassword,
        }
        const result = await register(registerData)
        if (!result.isSetupComplete) {
          router.replace('/(auth)/setup-status')
        } else {
          router.replace('/(tabs)')
        }
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Kayıt sırasında bir hata oluştu',
          position: 'top',
          visibilityTime: 1500
        })
      }
    }
  }, [currentStep, formData, register, router, validateStep])

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
  }

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const getInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName
    const hasError = !!errors[fieldName]

    return {
      borderColor: hasError
        ? AuthColors.error
        : isFocused
        ? AuthColors.primary
        : AuthColors.inputBorder,
      backgroundColor: isFocused
        ? AuthColors.inputBackgroundFocused
        : AuthColors.inputBackground,
    }
  }

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isPending = index > currentStep

        return (
          <Fragment key={step.id}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isActive && styles.stepCircleActive,
                  isPending && styles.stepCirclePending,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color={AuthColors.white} />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={
                      isActive ? AuthColors.white : AuthColors.textMuted
                    }
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isCompleted && styles.stepLabelCompleted,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {step.title}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View style={styles.stepConnector}>
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && styles.stepLineCompleted,
                  ]}
                />
              </View>
            )}
          </Fragment>
        )
      })}
    </View>
  )

  const renderInput = (
    field: string,
    placeholder: string,
    icon: keyof typeof Ionicons.glyphMap,
    options: {
      secureTextEntry?: boolean
      keyboardType?: 'default' | 'email-address'
      autoCapitalize?: 'none' | 'words'
      autoComplete?: string
    } = {}
  ) => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputWrapper, getInputStyle(field)]}>
        <View style={styles.inputIconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={
              focusedField === field
                ? AuthColors.primary
                : errors[field]
                ? AuthColors.error
                : AuthColors.iconDefault
            }
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={AuthColors.textPlaceholder}
          value={formData[field as keyof typeof formData]}
          onChangeText={(v) => updateField(field, v)}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          secureTextEntry={options.secureTextEntry}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'none'}
          autoComplete={options.autoComplete as any}
        />
      </View>
      {errors[field] && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={AuthColors.error} />
          <Text style={styles.errorText}>{errors[field]}</Text>
        </View>
      )}
    </View>
  )

  const renderAccountStep = () => (
    <Animated.View
      key="account"
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Hesap Bilgileri</Text>
        <Text style={styles.stepDescription}>
          Loggerise hesabınızı oluşturmak için bilgilerinizi girin
        </Text>
      </View>

      {renderInput('fullName', 'Adınızı ve soyadınızı girin', 'person-outline', {
        autoCapitalize: 'words',
      })}
      {renderInput('email', 'ornek@email.com', 'mail-outline', {
        keyboardType: 'email-address',
        autoComplete: 'email',
      })}
      {renderInput('password', 'En az 8 karakter', 'lock-closed-outline', {
        secureTextEntry: true,
        autoComplete: 'new-password',
      })}
      {renderInput('confirmPassword', 'Şifrenizi tekrar girin', 'lock-closed-outline', {
        secureTextEntry: true,
        autoComplete: 'new-password',
      })}
    </Animated.View>
  )

  const renderCompanyStep = () => (
    <Animated.View
      key="company"
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.stepContent}
    >
      <View style={styles.stepHeader}>
        <View style={styles.stepIconBadge}>
          <Ionicons name="business" size={32} color={AuthColors.primary} />
        </View>
        <Text style={styles.stepTitle}>Firma Bilgileri</Text>
        <Text style={styles.stepDescription}>
          Loggerise&apos;da kullanacağınız firma adını girin. Bu isim faturalarınızda
          ve raporlarınızda görünecektir.
        </Text>
      </View>

      {renderInput('companyName', 'Örnek Lojistik Ltd. Şti.', 'business-outline', {
        autoCapitalize: 'words',
      })}

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="shield-checkmark" size={18} color={AuthColors.success} />
          </View>
          <Text style={styles.featureText}>Güvenli veri saklama</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="sync" size={18} color={AuthColors.success} />
          </View>
          <Text style={styles.featureText}>Gerçek zamanlı senkronizasyon</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="analytics" size={18} color={AuthColors.success} />
          </View>
          <Text style={styles.featureText}>Detaylı raporlama araçları</Text>
        </View>
      </View>
    </Animated.View>
  )

  const HEADER_HEIGHT = 220
  const formMinHeight = screenHeight - HEADER_HEIGHT

  if (isInitializing || isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AuthColors.white} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar style="light" />

      <AuthHeader
        title="Hesap Oluştur"
        subtitle="Hemen başlamak için bilgilerinizi girin"
        iconType="register"
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.formCard, { minHeight: formMinHeight }]}>
          {/* Step Indicator */}
          <View>
            {renderStepIndicator()}
          </View>

          {/* Step Content */}
          <View style={styles.formContainer}>
            {currentStep === 0 && renderAccountStep()}
            {currentStep === 1 && renderCompanyStep()}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Back Button - only show if not first step */}
            {currentStep > 0 && (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={20} color={AuthColors.textSecondary} />
                <Text style={styles.backButtonText}>Geri</Text>
              </Pressable>
            )}

            {/* Primary Button */}
            <AnimatedPressable
              style={[
                styles.primaryButton,
                currentStep === 0 && styles.primaryButtonFull,
                buttonAnimStyle,
              ]}
              onPress={currentStep === STEPS.length - 1 ? handleRegister : handleNext}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={AuthColors.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {currentStep === STEPS.length - 1 ? 'Kayıt Ol' : 'Devam Et'}
                  </Text>
                  <View style={styles.buttonIcon}>
                    <Ionicons
                      name={currentStep === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'}
                      size={18}
                      color={AuthColors.white}
                    />
                  </View>
                </>
              )}
            </AnimatedPressable>
          </View>

          {/* Footer */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.footerLink}>Giriş Yap</Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuthColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: AuthColors.white,
    paddingHorizontal: AuthSpacing['2xl'],
    paddingTop: AuthSpacing['2xl'],
    paddingBottom: AuthSpacing['5xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AuthSpacing['2xl'],
    paddingHorizontal: AuthSpacing.lg,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: AuthSizes.stepIndicatorSize,
    height: AuthSizes.stepIndicatorSize,
    borderRadius: AuthSizes.stepIndicatorSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AuthSpacing.xs,
  },
  stepCircleCompleted: {
    backgroundColor: AuthColors.success,
  },
  stepCircleActive: {
    backgroundColor: AuthColors.primary,
    ...AuthShadows.glow,
  },
  stepCirclePending: {
    backgroundColor: AuthColors.inputBackground,
    borderWidth: 2,
    borderColor: AuthColors.inputBorder,
  },
  stepLabel: {
    fontSize: AuthFontSizes.sm,
    fontWeight: '500',
    color: AuthColors.textMuted,
  },
  stepLabelCompleted: {
    color: AuthColors.success,
  },
  stepLabelActive: {
    color: AuthColors.primary,
    fontWeight: '600',
  },
  stepConnector: {
    flex: 1,
    paddingHorizontal: AuthSpacing.sm,
    marginBottom: AuthSpacing.xl,
  },
  stepLine: {
    height: 2,
    backgroundColor: AuthColors.inputBorder,
    borderRadius: 1,
  },
  stepLineCompleted: {
    backgroundColor: AuthColors.success,
  },
  // Form
  formContainer: {
    flex: 1,
    marginBottom: AuthSpacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: AuthSpacing.xl,
  },
  stepIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AuthColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AuthSpacing.lg,
  },
  stepTitle: {
    fontSize: AuthFontSizes['4xl'],
    fontWeight: '700',
    color: AuthColors.textPrimary,
    marginBottom: AuthSpacing.sm,
  },
  stepDescription: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.textSecondary,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: AuthSpacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AuthBorderRadius.lg,
    borderWidth: 1.5,
    height: AuthSizes.inputHeight,
    paddingHorizontal: AuthSpacing.lg,
    ...AuthShadows.sm,
  },
  inputIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: AuthSpacing.md,
  },
  input: {
    flex: 1,
    fontSize: AuthFontSizes.lg,
    color: AuthColors.textPrimary,
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.xs,
    marginTop: AuthSpacing.sm,
    paddingHorizontal: AuthSpacing.xs,
  },
  errorText: {
    fontSize: AuthFontSizes.sm,
    color: AuthColors.error,
  },
  // Feature List
  featureList: {
    marginTop: AuthSpacing['2xl'],
    backgroundColor: AuthColors.successLight,
    borderRadius: AuthBorderRadius.lg,
    padding: AuthSpacing.lg,
    gap: AuthSpacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AuthColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.textPrimary,
    fontWeight: '500',
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: AuthSpacing.md,
    marginBottom: AuthSpacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AuthSpacing.xs,
    height: AuthSizes.buttonHeight,
    paddingHorizontal: AuthSpacing.xl,
    borderRadius: AuthBorderRadius.lg,
    backgroundColor: AuthColors.inputBackground,
  },
  backButtonText: {
    fontSize: AuthFontSizes.lg,
    color: AuthColors.textSecondary,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AuthSpacing.sm,
    height: AuthSizes.buttonHeight,
    borderRadius: AuthBorderRadius.lg,
    backgroundColor: AuthColors.primary,
    ...AuthShadows.glow,
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: AuthFontSizes.xl,
    color: AuthColors.white,
    fontWeight: '700',
  },
  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: AuthSpacing['2xl'],
  },
  footerText: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.textSecondary,
  },
  footerLink: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.primary,
    fontWeight: '600',
  },
})
