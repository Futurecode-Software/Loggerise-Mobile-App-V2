/**
 * Premium Setup Status Screen
 *
 * Elegant progress tracking ile hesap kurulum durumu
 * Animated indicators ve smooth transitions
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated'
import { useAuth } from '@/context/auth-context'
import { checkSetupStatus } from '@/services/endpoints/auth'
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
  const { logout, isAuthenticated } = useAuth()

  const shouldStopPolling = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('Hesabınız hazırlanıyor...')
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [isFailed, setIsFailed] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
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
      console.error('Logout error:', err)
    }

    router.replace('/(auth)/login')
  }, [stopPolling, logout])

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
          progressStep(3)
          setStatusMessage('Hesabınız hazır!')
          setIsComplete(true)
          Toast.show({
            type: 'success',
            text1: 'Hesabınız hazır!',
            position: 'top',
            visibilityTime: 1500
          })

          setTimeout(() => {
            if (!shouldStopPolling.current) {
              router.replace('/(tabs)')
            }
          }, 2000)
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

        console.log('Setup status check error:', err)

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
  }, [isAuthenticated, goToLogin, stopPolling])

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#F0FDF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Header Icon */}
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          style={styles.headerSection}
        >
          <Animated.View
            style={[
              styles.iconContainer,
              isFailed && styles.iconContainerError,
              isComplete && styles.iconContainerSuccess,
              !isFailed && !isComplete && pulseStyle,
            ]}
          >
            {isComplete ? (
              <Animated.View style={successIconStyle}>
                <Ionicons name="checkmark-circle" size={56} color={AuthColors.success} />
              </Animated.View>
            ) : isFailed ? (
              <Ionicons name="alert-circle" size={56} color={AuthColors.error} />
            ) : (
              <Ionicons name="rocket-outline" size={48} color={AuthColors.primary} />
            )}
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(200).duration(400)}
            style={[
              styles.title,
              isFailed && styles.titleError,
              isComplete && styles.titleSuccess,
            ]}
          >
            {isComplete
              ? 'Tebrikler!'
              : isFailed
              ? 'Kurulum Başarısız'
              : 'Hesabınız Hazırlanıyor'}
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.subtitle}
          >
            {isComplete
              ? 'Hesabınız başarıyla oluşturuldu'
              : isFailed
              ? 'Hesap kurulumu sırasında bir sorun oluştu'
              : statusMessage}
          </Animated.Text>

          {estimatedTime && !isFailed && !isComplete && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={styles.estimatedContainer}
            >
              <Ionicons name="time-outline" size={16} color={AuthColors.textMuted} />
              <Text style={styles.estimatedText}>Tahmini: {estimatedTime}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Progress Bar */}
        {!isFailed && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.progressSection}
          >
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
              {Math.round(steps.filter((s) => s.completed).length / steps.length * 100)}% tamamlandı
            </Text>
          </Animated.View>
        )}

        {/* Steps */}
        {!isFailed && (
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => renderStep(step, index))}
          </View>
        )}

        {/* Error Message */}
        {error && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.errorContainer}
          >
            <Ionicons name="warning-outline" size={20} color={AuthColors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
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
        {!isFailed && !error && !isComplete && (
          <Animated.View
            entering={FadeInUp.delay(500).duration(400)}
            style={styles.footerSection}
          >
            <View style={styles.footerIcon}>
              <Ionicons name="information-circle-outline" size={18} color={AuthColors.textMuted} />
            </View>
            <Text style={styles.footerText}>
              Lütfen bu sayfadan ayrılmayın. Kurulum tamamlandığında otomatik olarak yönlendirileceksiniz.
            </Text>
          </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: AuthSpacing['2xl'],
    paddingTop: AuthSpacing['4xl'],
  },
  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: AuthSpacing['3xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AuthColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AuthSpacing.xl,
  },
  iconContainerError: {
    backgroundColor: AuthColors.errorLight,
  },
  iconContainerSuccess: {
    backgroundColor: AuthColors.successLight,
  },
  title: {
    fontSize: AuthFontSizes['5xl'],
    fontWeight: '700',
    color: AuthColors.textPrimary,
    marginBottom: AuthSpacing.sm,
    textAlign: 'center',
  },
  titleError: {
    color: AuthColors.error,
  },
  titleSuccess: {
    color: AuthColors.success,
  },
  subtitle: {
    fontSize: AuthFontSizes.lg,
    color: AuthColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  estimatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.xs,
    marginTop: AuthSpacing.md,
    paddingHorizontal: AuthSpacing.lg,
    paddingVertical: AuthSpacing.sm,
    backgroundColor: AuthColors.inputBackground,
    borderRadius: AuthBorderRadius.full,
  },
  estimatedText: {
    fontSize: AuthFontSizes.sm,
    color: AuthColors.textMuted,
  },
  // Progress
  progressSection: {
    marginBottom: AuthSpacing['2xl'],
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
