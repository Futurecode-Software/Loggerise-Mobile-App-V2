import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Lock,
  Building2,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { Button, Input, Divider } from '@/components/ui';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAuth } from '@/context/auth-context';

const STEPS = ['Hesap', 'Sirket'];

export default function RegisterScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const { register, isLoading, isInitializing, error, clearError, isAuthenticated } = useAuth();
  const {
    signIn: googleSignIn,
    isLoading: isGoogleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth();

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
      clearGoogleError();
    };
  }, []);

  // Navigate when authenticated (for Google sign-in)
  // New users need to go through setup, so redirect to setup-status
  // Redirect immediately when authenticated - don't show register page at all
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(auth)/setup-status');
    }
  }, [isAuthenticated]);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (error) {
      clearError();
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Ad soyad gerekli';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'E-posta gerekli';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Geçerli bir e-posta girin';
      }
      if (!formData.password) {
        newErrors.password = 'Şifre gerekli';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Şifre en az 8 karakter olmalı';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifre tekrarı gerekli';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
    } else if (step === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Firma adı gerekli';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleRegister = async () => {
    if (validateStep(currentStep)) {
      try {
        await register({
          fullName: formData.fullName.trim(),
          companyName: formData.companyName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          passwordConfirmation: formData.confirmPassword,
        });
        // Navigate to setup status screen for new registrations
        // The setup screen will poll and redirect to tabs when ready
        router.replace('/(auth)/setup-status');
      } catch (err) {
        // Error is handled by auth context
        console.log('Register error:', err);
      }
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await googleSignIn();
      // Navigation is handled by the isAuthenticated effect
    } catch (err) {
      // Error is already handled by the hook
      console.log('Google register error:', err);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <React.Fragment key={step}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    index <= currentStep ? Brand.primary : colors.surface,
                  borderColor:
                    index <= currentStep ? Brand.primary : colors.border,
                },
              ]}
            >
              {index < currentStep ? (
                <Check size={14} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    { color: index <= currentStep ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color: index <= currentStep ? Brand.primary : colors.textMuted,
                },
              ]}
            >
              {step}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor:
                    index < currentStep ? Brand.primary : colors.border,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // Don't show register page while checking auth state or if already authenticated
  if (isInitializing || isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Input
              label="Ad Soyad"
              placeholder="Adınızı ve soyadınızı girin"
              value={formData.fullName}
              onChangeText={(v) => updateField('fullName', v)}
              error={errors.fullName}
              leftIcon={<User size={20} color={colors.icon} />}
              autoCapitalize="words"
            />
            <Input
              label="E-posta"
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              leftIcon={<Mail size={20} color={colors.icon} />}
            />
            <Input
              label="Şifre"
              placeholder="En az 8 karakter"
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              isPassword
              autoComplete="new-password"
              error={errors.password}
              leftIcon={<Lock size={20} color={colors.icon} />}
            />
            <Input
              label="Şifre Tekrar"
              placeholder="Şifrenizi tekrar girin"
              value={formData.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              isPassword
              autoComplete="new-password"
              error={errors.confirmPassword}
              leftIcon={<Lock size={20} color={colors.icon} />}
            />
          </>
        );
      case 1:
        return (
          <>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Firma Bilgileri
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Loggerise'da kullanacaginiz firma adini girin. Bu isim faturalarinizda
              ve raporlarinizda gorunecektir.
            </Text>

            <Input
              label="Firma Adi"
              placeholder="Ornek Lojistik Ltd. Sti."
              value={formData.companyName}
              onChangeText={(v) => updateField('companyName', v)}
              error={errors.companyName}
              leftIcon={<Building2 size={20} color={colors.icon} />}
              autoCapitalize="words"
            />

            {/* API Error */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15' }]}>
                <AlertCircle size={20} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Kayıt Ol</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Google Error */}
          {googleError && (
            <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15' }]}>
              <AlertCircle size={20} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {googleError}
              </Text>
            </View>
          )}

          {/* Google Register */}
          <Button
            title="Google ile Kayıt Ol"
            onPress={handleGoogleRegister}
            variant="outline"
            fullWidth
            size="lg"
            loading={isGoogleLoading}
            disabled={isLoading || isGoogleLoading}
            icon={
              !isGoogleLoading ? (
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
              ) : undefined
            }
          />

          <Divider text="veya e-posta ile" />

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form */}
          <View style={styles.formContainer}>{renderStep()}</View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtons, { borderTopColor: colors.border }]}>
          {currentStep === STEPS.length - 1 ? (
            <Button
              title="Kayıt Ol"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading || isGoogleLoading}
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              title="Devam Et"
              onPress={handleNext}
              disabled={isGoogleLoading}
              fullWidth
              size="lg"
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Login Link */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Zaten hesabınız var mı?{' '}
        </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: Brand.primary }]}>
              Giriş Yap
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingMD,
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySM,
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing['2xl'],
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  stepNumber: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  stepLabel: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  formContainer: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    ...Typography.bodyMD,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  bottomButtons: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  footerText: {
    ...Typography.bodyMD,
  },
  footerLink: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
