/**
 * Premium Setup Status Screen
 *
 * Elegant progress tracking ile hesap kurulum durumu
 * Logo, animated indicators ve smooth transitions
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { useAuth } from '@/context/auth-context'
import { checkSetupStatus } from '@/services/endpoints/auth'
import {
  AuthColors,
  AuthSpacing,
  AuthBorderRadius,
  AuthFontSizes,
  AuthSizes,
  AuthShadows,
  AuthAnimations,
} from '@/constants/auth-styles'

const LogoWhite = require('../../assets/images/logo-white.png')

const DEFAULT_POLL_INTERVAL = 5000
const MAX_POLL_ATTEMPTS = 60

interface SetupStep {
  id: string
  label: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  completed: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function SetupStatus() {
  const { logout, isAuthenticated, refreshSetupStatus } = useAuth()

  const shouldStopPolling = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('Hesabınız hazırlanıyor...')
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [isFailed, setIsFailed] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'tenant',
      label: 'Firma Hesabı',
      description: 'Hesap oluşturuluyor',
      icon: 'business-outline',
      completed: false,
    },
    {
      id: 'database',
      label: 'Veritabanı',
      description: 'Veriler hazırlanıyor',
      icon: 'server-outline',
      completed: false,
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      description: 'Yapılandırılıyor',
      icon: 'settings-outline',
      completed: false,
    },
    {
      id: 'ready',
      label: 'Tamamlandı',
      description: 'Hesabınız hazır!',
      icon: 'checkmark-circle-outline',
      completed: false,
    },
  ])

  // Animations
  const pulseAnim = useSharedValue(1)
  const rotateAnim = useSharedValue(0)
  const progressAnim = useSharedValue(0)
  const successScale = useSharedValue(0)
  const buttonScale = useSharedValue(1)
  const floatAnim = useSharedValue(0)
  const headerFadeIn = useSharedValue(0)
  const headerSlideUp = useSharedValue(30)
  const glowPulse = useSharedValue(1)

  // Header animations
  useEffect(() => {
    headerFadeIn.value = withTiming(1, {
      duration: AuthAnimations.timing.slow,
      easing: Easing.out(Easing.cubic),
    })
    headerSlideUp.value = withTiming(0, {
      duration: AuthAnimations.timing.slow,
      easing: Easing.out(Easing.cubic),
    })

    // Floating animation for decorative icons
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )

    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )
  }, [])

  useEffect(() => {
    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    )

    // Rotate animation for loading
    rotateAnim.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    )
  }, [pulseAnim, rotateAnim])

  useEffect(() => {
    const completedCount = steps.filter((s) => s.completed).length
    const progress = completedCount / steps.length
    progressAnim.value = withTiming(progress, {
      duration: AuthAnimations.timing.slow,
      easing: Easing.out(Easing.cubic),
    })
  }, [steps, progressAnim])

  useEffect(() => {
    if (isComplete) {
      successScale.value = withSpring(1, { damping: 12, stiffness: 200 })
    }
  }, [isComplete, successScale])

  const progressStep = (stepIndex: number) => {
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        completed: index <= stepIndex,
      }))
    )
  }

  const stopPolling = useCallback(() => {
    shouldStopPolling.current = true
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const goToLogin = useCallback(() => {
    stopPolling()
    router.replace('/(auth)/login')
  }, [stopPolling])

  const handleBackToLogin = useCallback(async () => {
    stopPolling()

    try {
      await logout()
    } catch (err) {
      if (__DEV__) console.error('Logout error:', err)
    }

    router.replace('/(auth)/login')
  }, [stopPolling, logout])

  // Auth context'i güncelle ve NavigationController'a bırak
  const completeSetupAndNavigate = useCallback(async () => {
    setIsLoadingDashboard(true)
    setStatusMessage('Hesabınız hazırlanıyor...')

    try {
      // Auth context'i güncelle - NavigationController otomatik yönlendirecek
      // Dashboard verileri dashboard ekranında lazy load edilecek
      await refreshSetupStatus()
    } catch (err) {
      if (__DEV__) console.error('Setup status refresh error:', err)
      // Hata durumunda kullanıcıya bilgi ver
      setError('Hesap durumu güncellenemedi. Lütfen tekrar deneyin.')
      setIsFailed(true)
    } finally {
      setIsLoadingDashboard(false)
    }
  }, [refreshSetupStatus])

  useEffect(() => {
    if (!isAuthenticated) {
      goToLogin()
    }
  }, [isAuthenticated, goToLogin])

  useEffect(() => {
    let currentAttempts = 0
    shouldStopPolling.current = false

    const checkStatus = async () => {
      if (shouldStopPolling.current) {
        return
      }

      try {
        const status = await checkSetupStatus()

        if (shouldStopPolling.current) return

        if (status.message) {
          setStatusMessage(status.message)
        }
        if (status.estimated_time) {
          setEstimatedTime(status.estimated_time)
        }

        if (status.setup_status === 'active') {
          stopPolling()
          progressStep(3)
          setStatusMessage('Hesabınız hazır!')
          setIsComplete(true)
          completeSetupAndNavigate()
          return
        }

        if (status.setup_status === 'failed') {
          setIsFailed(true)
          setError(status.error || 'Hesap kurulumu başarısız oldu.')
          return
        }

        const currentStep = Math.min(Math.floor(currentAttempts / 4), 2)
        progressStep(currentStep)

        currentAttempts++

        if (currentAttempts < MAX_POLL_ATTEMPTS && !shouldStopPolling.current) {
          const pollInterval = (status.retry_after || 5) * 1000
          pollTimerRef.current = setTimeout(checkStatus, pollInterval)
        } else if (currentAttempts >= MAX_POLL_ATTEMPTS) {
          setError('Kurulum beklenenden uzun sürüyor. Lütfen daha sonra tekrar deneyin.')
        }
      } catch (err) {
        if (shouldStopPolling.current) return

        if (__DEV__) console.log('Setup status check error:', err)

        const error = err as Error & { response?: { status?: number } }
        const errorMessage = error?.message || ''
        const isAuthError =
          errorMessage.includes('Unauthenticated') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('401') ||
          error?.response?.status === 401

        if (isAuthError) {
          goToLogin()
          return
        }

        currentAttempts++

        if (currentAttempts < MAX_POLL_ATTEMPTS && !shouldStopPolling.current) {
          pollTimerRef.current = setTimeout(checkStatus, DEFAULT_POLL_INTERVAL)
        } else if (currentAttempts >= MAX_POLL_ATTEMPTS) {
          setError('Kurulum durumu kontrol edilemedi. Lütfen tekrar giriş yapın.')
        }
      }
    }

    if (isAuthenticated) {
      checkStatus()
    }

    return () => {
      stopPolling()
    }
  }, [isAuthenticated, goToLogin, stopPolling, completeSetupAndNavigate])

  // Animated styles
  const headerContentStyle = useAnimatedStyle(() => ({
    opacity: headerFadeIn.value,
    transform: [{ translateY: headerSlideUp.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowPulse.value }],
    opacity: interpolate(glowPulse.value, [1, 1.1], [0.3, 0.5]),
  }))

  const primaryIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnim.value, [0, 1], [0, -12]) },
      { rotate: `${interpolate(floatAnim.value, [0, 1], [-5, 5])}deg` },
    ],
    opacity: interpolate(floatAnim.value, [0, 0.5, 1], [0.15, 0.2, 0.15]),
  }))

  const secondaryIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatAnim.value, [0, 1], [0, 8]) },
    ],
    opacity: 0.08,
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }))

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }))

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }))

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }))

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
  }

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }))

  const renderStep = (step: SetupStep, index: number) => {
    const isActive = !step.completed && (index === 0 || steps[index - 1].completed)

    return (
      <View key={step.id} style={styles.stepRow}>
        <View
          style={[
            styles.stepIndicator,
            step.completed && styles.stepIndicatorCompleted,
            isActive && styles.stepIndicatorActive,
          ]}
        >
          {step.completed ? (
            <Ionicons name="checkmark" size={18} color={AuthColors.white} />
          ) : isActive ? (
            <Animated.View style={rotateStyle}>
              <Ionicons name="sync" size={18} color={AuthColors.primary} />
            </Animated.View>
          ) : (
            <Ionicons name={step.icon} size={18} color={AuthColors.textMuted} />
          )}
        </View>

        <View style={styles.stepContent}>
          <Text
            style={[
              styles.stepLabel,
              step.completed && styles.stepLabelCompleted,
              isActive && styles.stepLabelActive,
            ]}
          >
            {step.label}
          </Text>
          <Text style={styles.stepDescription}>
            {isActive ? statusMessage : step.description}
          </Text>
        </View>

        {step.completed && (
          <View style={styles.stepCheckmark}>
            <Ionicons name="checkmark-circle" size={20} color={AuthColors.success} />
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>


      {/* Header with Logo */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#022920', '#044134', '#054a3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative Elements */}
        <Animated.View style={[styles.glowOrb, glowStyle]} />

        <Animated.View style={[styles.decorativePrimary, primaryIconStyle]}>
          <Ionicons name="rocket-outline" size={100} color={AuthColors.white} />
        </Animated.View>

        <Animated.View style={[styles.decorativeSecondary, secondaryIconStyle]}>
          <Ionicons name="sparkles-outline" size={60} color={AuthColors.white} />
        </Animated.View>

        {/* Glass orbs */}
        <View style={styles.glassOrb1} />
        <View style={styles.glassOrb2} />

        {/* Header Content */}
        <Animated.View style={[styles.headerContent, headerContentStyle]}>
          <Image
            source={LogoWhite}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.headerTitle}>
            {isComplete
              ? 'Tebrikler!'
              : isFailed
              ? 'Kurulum Başarısız'
              : 'Hesabınız Hazırlanıyor'}
          </Text>

          <Text style={styles.headerSubtitle}>
            {isComplete
              ? 'Hesabınız başarıyla oluşturuldu'
              : isFailed
              ? 'Hesap kurulumu sırasında bir sorun oluştu'
              : 'Lütfen bekleyin, bu işlem birkaç dakika sürebilir'}
          </Text>
        </Animated.View>

        {/* Curve overlay */}
        <View style={styles.curveOverlay} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Progress Bar */}
        {!isFailed && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressBarStyle]}>
                <LinearGradient
                  colors={[AuthColors.primary, AuthColors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <Text style={styles.progressText}>
              {isLoadingDashboard
                ? 'Veriler yükleniyor...'
                : `${Math.round(steps.filter((s) => s.completed).length / steps.length * 100)}% tamamlandı`}
            </Text>
          </View>
        )}

        {/* Steps */}
        {!isFailed && !isLoadingDashboard && (
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => renderStep(step, index))}
          </View>
        )}

        {/* Loading Dashboard Message */}
        {isLoadingDashboard && (
          <View style={styles.loadingDashboardContainer}>
            <Ionicons name="cloud-download-outline" size={32} color={AuthColors.primary} />
            <Text style={styles.loadingDashboardText}>
              Dashboard verileri hazırlanıyor...
            </Text>
            <Text style={styles.loadingDashboardSubtext}>
              Firma bilgileri ve istatistikler yükleniyor
            </Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color={AuthColors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Button */}
        {(isFailed || error) && (
          <View style={styles.actionSection}>
            <AnimatedPressable
              style={[styles.actionButton, buttonAnimStyle]}
              onPress={handleBackToLogin}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
            >
              <Ionicons name="refresh" size={20} color={AuthColors.white} />
              <Text style={styles.actionButtonText}>Tekrar Dene</Text>
            </AnimatedPressable>
          </View>
        )}

        {/* Footer Message */}
        {!isFailed && !error && !isComplete && !isLoadingDashboard && (
          <View style={styles.footerSection}>
            <View style={styles.footerIcon}>
              <Ionicons name="information-circle-outline" size={18} color={AuthColors.textMuted} />
            </View>
            <Text style={styles.footerText}>
              Lütfen bu sayfadan ayrılmayın. Kurulum tamamlandığında otomatik olarak yönlendirileceksiniz.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuthColors.white,
  },
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: AuthSpacing['4xl'],
    paddingHorizontal: AuthSpacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
    minHeight: 240,
  },
  headerContent: {
    zIndex: 10,
  },
  logo: {
    width: AuthSizes.logoWidth,
    height: AuthSizes.logoHeight,
    marginLeft: -12,
    marginBottom: AuthSpacing.lg,
  },
  headerTitle: {
    fontSize: AuthFontSizes['5xl'],
    fontWeight: '700',
    color: AuthColors.textOnDark,
    marginBottom: AuthSpacing.sm,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: AuthFontSizes.lg,
    color: AuthColors.textOnDarkMuted,
    lineHeight: 22,
    maxWidth: '85%',
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: AuthColors.white,
    borderTopLeftRadius: AuthSpacing['3xl'],
    borderTopRightRadius: AuthSpacing['3xl'],
  },
  // Decorative elements
  glowOrb: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  decorativePrimary: {
    position: 'absolute',
    top: 30,
    right: 10,
  },
  decorativeSecondary: {
    position: 'absolute',
    top: 100,
    right: 80,
  },
  glassOrb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassOrb2: {
    position: 'absolute',
    bottom: 50,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  // Content
  content: {
    flex: 1,
    paddingHorizontal: AuthSpacing['2xl'],
    backgroundColor: AuthColors.white,
  },
  // Progress
  progressSection: {
    marginBottom: AuthSpacing.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: AuthColors.inputBackground,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: AuthSpacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: AuthFontSizes.sm,
    color: AuthColors.textMuted,
    textAlign: 'right',
  },
  // Steps
  stepsContainer: {
    backgroundColor: AuthColors.white,
    borderRadius: AuthBorderRadius.xl,
    padding: AuthSpacing.lg,
    gap: AuthSpacing.md,
    ...AuthShadows.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.md,
    paddingVertical: AuthSpacing.sm,
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuthColors.inputBackground,
    borderWidth: 2,
    borderColor: AuthColors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorCompleted: {
    backgroundColor: AuthColors.success,
    borderColor: AuthColors.success,
  },
  stepIndicatorActive: {
    backgroundColor: AuthColors.primaryGlow,
    borderColor: AuthColors.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: AuthFontSizes.lg,
    fontWeight: '600',
    color: AuthColors.textMuted,
    marginBottom: 2,
  },
  stepLabelCompleted: {
    color: AuthColors.success,
  },
  stepLabelActive: {
    color: AuthColors.primary,
  },
  stepDescription: {
    fontSize: AuthFontSizes.sm,
    color: AuthColors.textMuted,
  },
  stepCheckmark: {
    marginLeft: AuthSpacing.sm,
  },
  // Loading Dashboard
  loadingDashboardContainer: {
    alignItems: 'center',
    padding: AuthSpacing['2xl'],
    backgroundColor: AuthColors.primaryGlow,
    borderRadius: AuthBorderRadius.xl,
    gap: AuthSpacing.md,
  },
  loadingDashboardText: {
    fontSize: AuthFontSizes.lg,
    fontWeight: '600',
    color: AuthColors.primary,
    textAlign: 'center',
  },
  loadingDashboardSubtext: {
    fontSize: AuthFontSizes.sm,
    color: AuthColors.textSecondary,
    textAlign: 'center',
  },
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AuthSpacing.sm,
    marginTop: AuthSpacing.xl,
    padding: AuthSpacing.lg,
    backgroundColor: AuthColors.errorLight,
    borderRadius: AuthBorderRadius.lg,
    borderWidth: 1,
    borderColor: AuthColors.errorBorder,
  },
  errorText: {
    flex: 1,
    fontSize: AuthFontSizes.base,
    color: AuthColors.error,
    lineHeight: 22,
  },
  // Action
  actionSection: {
    marginTop: AuthSpacing['2xl'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AuthSpacing.sm,
    height: AuthSizes.buttonHeight,
    backgroundColor: AuthColors.primary,
    borderRadius: AuthBorderRadius.lg,
    ...AuthShadows.glow,
  },
  actionButtonText: {
    fontSize: AuthFontSizes.xl,
    fontWeight: '700',
    color: AuthColors.white,
  },
  // Footer
  footerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AuthSpacing.sm,
    marginTop: 'auto',
    paddingVertical: AuthSpacing.xl,
    paddingHorizontal: AuthSpacing.md,
  },
  footerIcon: {
    marginTop: 2,
  },
  footerText: {
    flex: 1,
    fontSize: AuthFontSizes.sm,
    color: AuthColors.textMuted,
    lineHeight: 20,
  },
})
