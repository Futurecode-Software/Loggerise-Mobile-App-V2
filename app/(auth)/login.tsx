/**
 * Premium Login Screen
 *
 * Modern, zarif ve kullanıcı dostu giriş deneyimi
 * Glassmorphism, subtle animations ve refined typography
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons, FontAwesome } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated'
import { useAuth } from '@/context/auth-context'
import Toast from 'react-native-toast-message'
import {
  AuthColors,
  AuthSpacing,
  AuthBorderRadius,
  AuthFontSizes,
  AuthSizes,
  AuthShadows,
} from '@/constants/auth-styles'
import AuthHeader from '@/components/auth/AuthHeader'
import { ForgotPasswordModal, ForgotPasswordModalRef } from '@/components/modals'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function Login() {
  const router = useRouter()
  const { login, isLoading, isInitializing, isAuthenticated } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const forgotPasswordModalRef = useRef<ForgotPasswordModalRef>(null)

  // Animation values
  const buttonScale = useSharedValue(1)
  const checkboxScale = useSharedValue(1)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, router])

  // Form handlers
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi gerekli'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gerekli'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleLogin = useCallback(async () => {
    if (!validate()) {
      return
    }

    try {
      const result = await login(formData.email.trim().toLowerCase(), formData.password, rememberMe)

      if (!result.isSetupComplete) {
        Toast.show({
          type: 'info',
          text1: 'Hesabınız hala hazırlanıyor',
          text2: 'Lütfen bekleyip tekrar deneyin',
          position: 'top',
          visibilityTime: 1500
        })
      } else {
        router.replace('/(tabs)')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Giriş sırasında bir hata oluştu.'
      Toast.show({
        type: 'error',
        text1: errorMessage,
        position: 'top',
        visibilityTime: 1500
      })
    }
  }, [formData, rememberMe, login, router, validate])

  const handleForgotPassword = useCallback(() => {
    forgotPasswordModalRef.current?.present()
  }, [])

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
  }

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const handleCheckboxPress = () => {
    checkboxScale.value = withSpring(0.8, { damping: 10, stiffness: 400 })
    setTimeout(() => {
      checkboxScale.value = withSpring(1, { damping: 10, stiffness: 400 })
    }, 100)
    setRememberMe(!rememberMe)
  }

  // Input style helper
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

  const getIconColor = (fieldName: string) => {
    const isFocused = focusedField === fieldName
    const hasError = !!errors[fieldName]

    return hasError
      ? AuthColors.error
      : isFocused
      ? AuthColors.primary
      : AuthColors.iconDefault
  }

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const checkboxAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkboxScale.value }],
  }))

  const { height: screenHeight } = useWindowDimensions()
  const HEADER_HEIGHT = 220
  const formMinHeight = screenHeight - HEADER_HEIGHT

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar style="light" />

      <AuthHeader
        title="Hoş Geldiniz"
        subtitle="Görevleriniz ve projeleriniz için giriş yapın"
        iconType="login"
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={[styles.formCard, { minHeight: formMinHeight }]}>
          {/* Title Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.titleSection}
          >
            <Text style={styles.title}>Giriş Yap</Text>
            <Text style={styles.subtitle}>
              Hesabınıza erişmek için bilgilerinizi girin
            </Text>
          </Animated.View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <View style={[styles.inputWrapper, getInputStyle('email')]}>
              <View style={styles.inputIconContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={getIconColor('email')}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor={AuthColors.textPlaceholder}
                value={formData.email}
                onChangeText={(v) => updateField('email', v)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.email && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={AuthColors.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <View style={[styles.inputWrapper, getInputStyle('password')]}>
              <View style={styles.inputIconContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={getIconColor('password')}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Şifrenizi girin"
                placeholderTextColor={AuthColors.textPlaceholder}
                value={formData.password}
                onChangeText={(v) => updateField('password', v)}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={AuthColors.iconDefault}
                />
              </Pressable>
            </View>
            {errors.password && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={AuthColors.error} />
                <Text style={styles.errorText}>{errors.password}</Text>
              </View>
            )}
          </View>

          {/* Options Row */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.optionsRow}
          >
            <Pressable style={styles.rememberMe} onPress={handleCheckboxPress}>
              <Animated.View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxActive,
                  checkboxAnimStyle,
                ]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={14} color={AuthColors.white} />
                )}
              </Animated.View>
              <Text style={styles.rememberText}>Beni Hatırla</Text>
            </Pressable>
            <Pressable onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
            </Pressable>
          </Animated.View>

          {/* Login Button */}
          <AnimatedPressable
            style={[styles.loginButton, buttonAnimStyle]}
            onPress={handleLogin}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={isLoading || isInitializing}
          >
            {(isLoading || isInitializing) ? (
              <ActivityIndicator size="small" color={AuthColors.white} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
                <View style={styles.buttonIcon}>
                  <Ionicons name="arrow-forward" size={18} color={AuthColors.white} />
                </View>
              </>
            )}
          </AnimatedPressable>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(600).duration(400)}
            style={styles.divider}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Social Buttons */}
          <View style={styles.socialSection}>
            {Platform.OS === 'ios' ? (
              <View style={styles.socialButtons}>
                <Pressable style={styles.appleButton}>
                  <FontAwesome name="apple" size={20} color={AuthColors.white} />
                  <Text style={styles.appleButtonText}>Apple</Text>
                </Pressable>
                <Pressable style={styles.googleButton}>
                  <FontAwesome name="google" size={18} color={AuthColors.textPrimary} />
                  <Text style={styles.googleButtonText}>Google</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.googleButtonFull}>
                <FontAwesome name="google" size={18} color={AuthColors.textPrimary} />
                <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
              </Pressable>
            )}
          </View>

          {/* Footer */}
          <Animated.View
            entering={FadeInUp.delay(800).duration(400)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Kayıt Ol</Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>

      <ForgotPasswordModal ref={forgotPasswordModalRef} />
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
    paddingTop: AuthSpacing.lg,
    paddingBottom: AuthSpacing['5xl'],
  },
  titleSection: {
    marginBottom: AuthSpacing['2xl'],
  },
  title: {
    fontSize: AuthFontSizes['6xl'],
    fontWeight: '700',
    color: AuthColors.textPrimary,
    marginBottom: AuthSpacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.textSecondary,
  },
  inputContainer: {
    marginBottom: AuthSpacing.lg,
  },
  inputLabel: {
    fontSize: AuthFontSizes.md,
    fontWeight: '600',
    color: AuthColors.textPrimary,
    marginBottom: AuthSpacing.sm,
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
  eyeButton: {
    padding: AuthSpacing.xs,
    marginLeft: AuthSpacing.sm,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AuthSpacing.xl,
    marginTop: AuthSpacing.sm,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.sm,
  },
  checkbox: {
    width: AuthSizes.checkboxSize,
    height: AuthSizes.checkboxSize,
    borderRadius: AuthBorderRadius.sm,
    borderWidth: 2,
    borderColor: AuthColors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuthColors.white,
  },
  checkboxActive: {
    backgroundColor: AuthColors.primary,
    borderColor: AuthColors.primary,
  },
  rememberText: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.textSecondary,
  },
  forgotText: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.primary,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: AuthColors.primary,
    height: AuthSizes.buttonHeight,
    borderRadius: AuthBorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AuthSpacing.sm,
    marginBottom: AuthSpacing.xl,
    ...AuthShadows.glow,
  },
  loginButtonText: {
    color: AuthColors.white,
    fontSize: AuthFontSizes.xl,
    fontWeight: '700',
  },
  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: AuthSpacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AuthSpacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AuthColors.divider,
  },
  dividerText: {
    fontSize: AuthFontSizes.sm,
    color: AuthColors.textMuted,
    paddingHorizontal: AuthSpacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialSection: {
    marginBottom: AuthSpacing['2xl'],
  },
  socialButtons: {
    flexDirection: 'row',
    gap: AuthSpacing.md,
  },
  appleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuthColors.black,
    height: AuthSizes.socialButtonHeight,
    borderRadius: AuthBorderRadius.lg,
    gap: AuthSpacing.sm,
    ...AuthShadows.md,
  },
  appleButtonText: {
    color: AuthColors.white,
    fontSize: AuthFontSizes.lg,
    fontWeight: '600',
  },
  googleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuthColors.white,
    height: AuthSizes.socialButtonHeight,
    borderRadius: AuthBorderRadius.lg,
    borderWidth: 1.5,
    borderColor: AuthColors.inputBorder,
    gap: AuthSpacing.sm,
  },
  googleButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuthColors.white,
    height: AuthSizes.socialButtonHeight,
    borderRadius: AuthBorderRadius.lg,
    borderWidth: 1.5,
    borderColor: AuthColors.inputBorder,
    gap: AuthSpacing.sm,
  },
  googleButtonText: {
    color: AuthColors.textPrimary,
    fontSize: AuthFontSizes.lg,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
