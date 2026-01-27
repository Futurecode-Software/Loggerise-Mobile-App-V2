import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Dimensions,
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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';
import { Button, Input, Divider } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAuth } from '@/context/auth-context';

const { height } = Dimensions.get('window');

// Logo images
const LogoWhite = require('@/assets/images/logo-white.png');

// Google Logo Component
const GoogleLogo = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <G>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </G>
  </Svg>
);

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
      <View style={styles.container}>
        <LinearGradient
          colors={[Brand.primary, Brand.primaryLight, Brand.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingContainer}
        >
          <Image
            source={LogoWhite}
            style={styles.logo}
            resizeMode="contain"
          />
        </LinearGradient>
      </View>
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
    <View style={styles.container}>
      <LinearGradient
        colors={[Brand.primary, Brand.primaryLight, Brand.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Header with Back Button */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Top Section - Logo & Title */}
            <View style={styles.topSection}>
              <Image
                source={LogoWhite}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.welcomeTitle}>Kayıt Ol</Text>
              <Text style={styles.welcomeSubtitle}>Hemen başlamak için bilgilerinizi girin</Text>
            </View>

            {/* Bottom Section - White Card with Form */}
            <View style={styles.formCard}>
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
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  { borderColor: colors.border, backgroundColor: '#FFFFFF' },
                  (isLoading || isGoogleLoading) && styles.googleButtonDisabled,
                ]}
                onPress={handleGoogleRegister}
                disabled={isLoading || isGoogleLoading}
              >
                {!isGoogleLoading && <GoogleLogo size={22} />}
                <Text style={[styles.googleButtonText, { color: colors.text }]}>
                  {isGoogleLoading ? 'Kayıt yapılıyor...' : 'Google ile Kayıt Ol'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>veya e-posta ile</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Form */}
              <View style={styles.formContainer}>{renderStep()}</View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (isLoading || isGoogleLoading) && styles.submitButtonDisabled,
                ]}
                onPress={currentStep === STEPS.length - 1 ? handleRegister : handleNext}
                disabled={isLoading || isGoogleLoading}
              >
                <LinearGradient
                  colors={[Brand.primary, Brand.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading
                      ? 'Kayıt yapılıyor...'
                      : currentStep === STEPS.length - 1
                      ? 'Kayıt Ol'
                      : 'Devam Et'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 0,
    height: Platform.OS === 'ios' ? 8 : 38,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
  },
  logoImage: {
    width: 160,
    height: 45,
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 180,
    height: 50,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    ...Shadows.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySM,
    flex: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.bodySM,
    marginHorizontal: Spacing.lg,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  stepLine: {
    width: 50,
    height: 2,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  formContainer: {
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    ...Typography.bodyMD,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  footerText: {
    ...Typography.bodySM,
  },
  footerLink: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
});
