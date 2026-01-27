/**
 * Setup Status Screen
 *
 * Shows account setup progress for newly registered users.
 * Polls the backend to check when tenant database is ready.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Check, Loader2, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { checkSetupStatus, SetupStatusResult } from '@/services/endpoints/auth';
import { useAuth } from '@/context/auth-context';

const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds default
const MAX_POLL_ATTEMPTS = 60; // 5 minutes max (60 * 5s)

interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
}

export default function SetupStatusScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const { logout, isAuthenticated } = useAuth();

  // Use ref to immediately stop polling (state updates are async)
  const shouldStopPolling = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Hesabınız hazırlanıyor...');
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [steps, setSteps] = useState<SetupStep[]>([
    { id: 'tenant', label: 'Firma hesabı oluşturuluyor', completed: false },
    { id: 'database', label: 'Veritabanı hazırlanıyor', completed: false },
    { id: 'settings', label: 'Ayarlar yapılandırılıyor', completed: false },
    { id: 'ready', label: 'Hesabınız hazır!', completed: false },
  ]);

  // Spinning animation for loader
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue]);

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Progress animation for steps
  const progressStep = (stepIndex: number) => {
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        completed: index <= stepIndex,
      }))
    );
  };

  // Stop all polling and clear timers
  const stopPolling = useCallback(() => {
    shouldStopPolling.current = true;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Navigate to login immediately
  const goToLogin = useCallback(() => {
    stopPolling();
    router.replace('/(auth)/login');
  }, [stopPolling]);

  // Handle logout and go back to login
  const handleBackToLogin = useCallback(async () => {
    // FIRST: Stop polling immediately
    stopPolling();

    // THEN: Wait for logout to complete (state must be cleared before navigation)
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }

    // FINALLY: Navigate to login after state is cleared
    router.replace('/(auth)/login');
  }, [stopPolling, logout]);

  // If user is not authenticated, go to login immediately
  useEffect(() => {
    if (!isAuthenticated) {
      goToLogin();
    }
  }, [isAuthenticated, goToLogin]);

  // Poll setup status
  useEffect(() => {
    let currentAttempts = 0;
    shouldStopPolling.current = false;

    const checkStatus = async () => {
      // Check ref immediately (not state)
      if (shouldStopPolling.current) {
        console.log('Setup status: Polling stopped');
        return;
      }

      try {
        setIsChecking(true);
        const status: SetupStatusResult = await checkSetupStatus();

        // Check again after API call
        if (shouldStopPolling.current) return;

        // Update message from backend
        if (status.message) {
          setStatusMessage(status.message);
        }
        if (status.estimated_time) {
          setEstimatedTime(status.estimated_time);
        }

        // Handle different statuses
        if (status.setup_status === 'active') {
          // Setup complete!
          progressStep(3);
          setIsChecking(false);
          setStatusMessage('Hesabınız hazır!');

          // Wait a moment to show completion, then navigate
          setTimeout(() => {
            if (!shouldStopPolling.current) {
              router.replace('/(tabs)');
            }
          }, 1500);
          return;
        }

        if (status.setup_status === 'failed') {
          // Setup failed
          setIsFailed(true);
          setIsChecking(false);
          setError(status.error || 'Hesap kurulumu başarısız oldu.');
          return;
        }

        // Still setting up - update progress based on attempts
        const currentStep = Math.min(Math.floor(currentAttempts / 4), 2);
        progressStep(currentStep);

        // Continue polling
        currentAttempts++;
        setAttempts(currentAttempts);

        if (currentAttempts < MAX_POLL_ATTEMPTS && !shouldStopPolling.current) {
          // Use retry_after from backend or default interval
          const pollInterval = (status.retry_after || 5) * 1000;
          pollTimerRef.current = setTimeout(checkStatus, pollInterval);
        } else if (currentAttempts >= MAX_POLL_ATTEMPTS) {
          setError('Kurulum beklenenden uzun sürüyor. Lütfen daha sonra tekrar deneyin.');
          setIsChecking(false);
        }
      } catch (err: any) {
        // Check ref after error
        if (shouldStopPolling.current) return;

        console.log('Setup status check error:', err);

        // Check if it's an authentication error (401)
        const errorMessage = err?.message || '';
        const isAuthError = errorMessage.includes('Unauthenticated') ||
                           errorMessage.includes('Unauthorized') ||
                           errorMessage.includes('401') ||
                           err?.response?.status === 401;

        if (isAuthError) {
          // User logged out, stop polling and navigate to login
          console.log('Setup status: Auth error, going to login');
          goToLogin();
          return;
        }

        // Continue polling on other errors (tenant might still be setting up)
        currentAttempts++;
        setAttempts(currentAttempts);

        if (currentAttempts < MAX_POLL_ATTEMPTS && !shouldStopPolling.current) {
          pollTimerRef.current = setTimeout(checkStatus, DEFAULT_POLL_INTERVAL);
        } else if (currentAttempts >= MAX_POLL_ATTEMPTS) {
          setError('Kurulum durumu kontrol edilemedi. Lütfen tekrar giriş yapın.');
          setIsChecking(false);
        }
      }
    };

    // Only start polling if authenticated
    if (isAuthenticated) {
      checkStatus();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, []); // Empty deps - only run once on mount

  const renderStep = (step: SetupStep, index: number) => {
    const isActive = !step.completed && (index === 0 || steps[index - 1].completed);

    return (
      <View key={step.id} style={styles.stepRow}>
        <View
          style={[
            styles.stepIndicator,
            {
              backgroundColor: step.completed
                ? Brand.primary
                : isActive
                ? colors.surface
                : colors.card,
              borderColor: step.completed || isActive ? Brand.primary : colors.border,
            },
          ]}
        >
          {step.completed ? (
            <Check size={16} color="#FFFFFF" />
          ) : isActive ? (
            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              <Loader2 size={16} color={Brand.primary} />
            </Animated.View>
          ) : (
            <Text style={[styles.stepNumber, { color: colors.textMuted }]}>
              {index + 1}
            </Text>
          )}
        </View>
        <Text
          style={[
            styles.stepLabel,
            {
              color: step.completed
                ? Brand.primary
                : isActive
                ? colors.text
                : colors.textMuted,
              fontWeight: isActive || step.completed ? '600' : '400',
            },
          ]}
        >
          {step.label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isFailed
                ? colors.danger + '15'
                : Brand.primary + '15',
            },
          ]}
        >
          {isFailed ? (
            <AlertTriangle size={48} color={colors.danger} />
          ) : (
            <Building2 size={48} color={Brand.primary} />
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: isFailed ? colors.danger : colors.text }]}>
          {isFailed ? 'Kurulum Başarısız' : 'Hesabınız Hazırlanıyor'}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isFailed
            ? 'Hesap kurulumu sırasında bir sorun oluştu.'
            : statusMessage}
        </Text>

        {/* Estimated Time */}
        {estimatedTime && !isFailed && (
          <Text style={[styles.estimatedTime, { color: colors.textMuted }]}>
            Tahmini süre: {estimatedTime}
          </Text>
        )}

        {/* Steps */}
        {!isFailed && (
          <View style={[styles.stepsContainer, { backgroundColor: colors.surface }]}>
            {steps.map((step, index) => renderStep(step, index))}
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15' }]}>
            <AlertTriangle size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Footer / Action Button */}
        {isFailed || error ? (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Brand.primary }]}
            onPress={handleBackToLogin}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Tekrar Giriş Yap</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.footer, { color: colors.textMuted }]}>
            Lütfen bu sayfadan ayrılmayın...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.headingLG,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  estimatedTime: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  stepsContainer: {
    width: '100%',
    borderRadius: 12,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  stepLabel: {
    ...Typography.bodyMD,
    flex: 1,
  },
  errorContainer: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySM,
    flex: 1,
  },
  footer: {
    ...Typography.bodySM,
    marginTop: Spacing['2xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing['2xl'],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
  },
  backButtonText: {
    ...Typography.bodyMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
