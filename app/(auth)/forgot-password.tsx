/**
 * Premium Forgot Password Screen
 *
 * Modern şifre sıfırlama deneyimi
 * Clean design ve user-friendly flow
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
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
  withSpring,
  FadeInDown,
} from 'react-native-reanimated'
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function ForgotPassword() {
  const router = useRouter()
  const { height: screenHeight } = useWindowDimensions()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Animation values
  const buttonScale = useSharedValue(1)

  const validate = () => {
    if (!email.trim()) {
      setError('E-posta adresi gerekli')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Geçerli bir e-posta adresi girin')
      return false
    }
    setError('')
    return true
  }

  const startCountdown = () => {
    setCountdown(60)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendReset = async () => {
    if (validate()) {
      setIsLoading(true)
      try {
        // API call would go here
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSent(true)
        startCountdown()
        Toast.show({
          type: 'success',
          text1: 'E-posta gönderildi!',
          text2: 'Gelen kutunuzu kontrol edin',
          position: 'top',
          visibilityTime: 2000
        })
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Bir hata oluştu',
          text2: 'Lütfen tekrar deneyin',
          position: 'top',
          visibilityTime: 1500
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleResend = async () => {
    if (countdown === 0) {
      await handleSendReset()
    }
  }

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
  }

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const getInputStyle = () => {
    const isFocused = focusedField === 'email'
    const hasError = !!error

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

  const HEADER_HEIGHT = 220
  const formMinHeight = screenHeight - HEADER_HEIGHT

  if (isSent) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar style="light" />

        <AuthHeader
          title="E-posta Gönderildi"
          subtitle="Gelen kutunuzu kontrol edin"
          iconType="none"
        />

        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={[styles.formCard, { minHeight: formMinHeight }]}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={AuthColors.success} />
            </View>

            {/* Success Message */}
            <Text style={styles.successTitle}>E-postanızı Kontrol Edin</Text>
            <Text style={styles.successText}>
              Şifre sıfırlama bağlantısı{'\n'}
              <Text style={styles.emailText}>{email}</Text>
              {'\n'}adresine gönderildi.
            </Text>

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Yeniden gönder ({countdown}s)
                </Text>
              ) : (
                <Pressable onPress={handleResend} disabled={isLoading}>
                  <View style={styles.resendButton}>
                    <Ionicons name="refresh" size={18} color={AuthColors.primary} />
                    <Text style={styles.resendText}>Yeniden Gönder</Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Back to Login Button */}
            <AnimatedPressable
              style={[styles.backToLoginButton, buttonAnimStyle]}
              onPress={() => router.replace('/(auth)/login')}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Text style={styles.backToLoginButtonText}>Giriş Sayfasına Dön</Text>
            </AnimatedPressable>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar style="light" />

      <AuthHeader
        title="Şifrenizi mi Unuttunuz?"
        subtitle="E-posta adresinize sıfırlama bağlantısı göndereceğiz"
        iconType="none"
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
            <Text style={styles.title}>Şifre Sıfırlama</Text>
            <Text style={styles.subtitle}>
              Kayıtlı e-posta adresinizi girin
            </Text>
          </Animated.View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <View style={[styles.inputWrapper, getInputStyle()]}>
              <View style={styles.inputIconContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={error ? AuthColors.error : focusedField === 'email' ? AuthColors.primary : AuthColors.iconDefault}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor={AuthColors.textPlaceholder}
                value={email}
                onChangeText={(v) => {
                  setEmail(v)
                  if (error) setError('')
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={AuthColors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Send Button */}
          <AnimatedPressable
            style={[styles.sendButton, buttonAnimStyle]}
            onPress={handleSendReset}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={AuthColors.white} />
            ) : (
              <>
                <Text style={styles.sendButtonText}>Sıfırlama Bağlantısı Gönder</Text>
                <View style={styles.buttonIcon}>
                  <Ionicons name="send" size={18} color={AuthColors.white} />
                </View>
              </>
            )}
          </AnimatedPressable>

          {/* Footer */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Şifrenizi hatırladınız mı? </Text>
            <Pressable onPress={() => router.back()}>
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
    marginBottom: AuthSpacing['2xl'],
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
  sendButton: {
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
  sendButtonText: {
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
  // Success Screen
  successIconContainer: {
    alignItems: 'center',
    marginBottom: AuthSpacing['2xl'],
    marginTop: AuthSpacing['3xl'],
  },
  successTitle: {
    fontSize: AuthFontSizes['5xl'],
    fontWeight: '700',
    color: AuthColors.textPrimary,
    textAlign: 'center',
    marginBottom: AuthSpacing.md,
  },
  successText: {
    fontSize: AuthFontSizes.lg,
    color: AuthColors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: AuthSpacing['3xl'],
  },
  emailText: {
    fontWeight: '600',
    color: AuthColors.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: AuthSpacing['3xl'],
  },
  countdownText: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.textMuted,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.xs,
  },
  resendText: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.primary,
    fontWeight: '600',
  },
  backToLoginButton: {
    backgroundColor: AuthColors.primary,
    height: AuthSizes.buttonHeight,
    borderRadius: AuthBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...AuthShadows.glow,
  },
  backToLoginButtonText: {
    color: AuthColors.white,
    fontSize: AuthFontSizes.xl,
    fontWeight: '700',
  },
})
