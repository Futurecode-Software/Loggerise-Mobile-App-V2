import React, { useState, useEffect, useRef } from 'react';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Mail, Lock, CheckSquare, Square, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';
import { Button, Input, Divider } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAuth } from '@/context/auth-context';
import ForgotPasswordModal, { ForgotPasswordModalRef } from '@/components/modals/ForgotPasswordModal';

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

const { height } = Dimensions.get('window');

// Logo images
const LogoDark = require('@/assets/images/logo-dark.png');
const LogoWhite = require('@/assets/images/logo-white.png');

export default function LoginScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const { login, isLoading, isInitializing, error, clearError, isAuthenticated, isSetupComplete } = useAuth();
  const {
    signIn: googleSignIn,
    isLoading: isGoogleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth();

  const forgotPasswordModalRef = useRef<ForgotPasswordModalRef>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Clear auth error when component mounts or when user types
  useEffect(() => {
    return () => {
      clearError();
      clearGoogleError();
    };
  }, []);

  // Navigate when authenticated (for Google sign-in)
  // Redirect immediately when authenticated - don't show login page at all
  useEffect(() => {
    if (isAuthenticated) {
      // Navigate based on setup status
      if (isSetupComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/setup-status');
      }
    }
  }, [isAuthenticated, isSetupComplete]);

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    // Clear errors when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) {
      clearError();
    }
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!password) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        const result = await login(email, password, rememberMe);
        // Navigate based on setup status
        if (result.isSetupComplete) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/setup-status');
        }
      } catch (err) {
        // Error is already handled by auth context
        console.log('Login error:', err);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
      // Navigation is handled by the isAuthenticated effect
    } catch (err) {
      // Error is already handled by the hook
      console.log('Google login error:', err);
    }
  };

  // Don't show login page while checking auth state or if already authenticated
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

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <LinearGradient
          colors={[Brand.primary, Brand.primaryLight, Brand.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
        {/* Header Space - invisible header to match register/forgot-password pages */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header} />
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
            {/* Top Section - Logo & Welcome */}
            <View style={styles.topSection}>
              <Image
                source={LogoWhite}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
              <Text style={styles.welcomeSubtitle}>Devam etmek için bilgilerinizi girin</Text>
            </View>

            {/* Bottom Section - White Card with Form */}
            <View style={styles.formCard}>
              {/* API Error Message */}
              {(error || googleError) && (
                <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15' }]}>
                  <AlertCircle size={20} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {error || googleError}
                  </Text>
                </View>
              )}

              {/* Email Input */}
              <Input
                label="E-posta Adresi"
                placeholder="ornek@email.com"
                value={email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                leftIcon={<Mail size={20} color={colors.icon} />}
                containerStyle={styles.inputContainer}
              />

              {/* Password Input */}
              <Input
                label="Şifre"
                placeholder="••••••••"
                value={password}
                onChangeText={(value) => handleInputChange('password', value)}
                isPassword
                autoComplete="password"
                error={errors.password}
                leftIcon={<Lock size={20} color={colors.icon} />}
                containerStyle={styles.inputContainer}
              />

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe ? (
                    <CheckSquare size={18} color={Brand.primary} />
                  ) : (
                    <Square size={18} color={colors.icon} />
                  )}
                  <Text style={[styles.rememberText, { color: colors.textSecondary }]}>
                    Beni hatırla
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => forgotPasswordModalRef.current?.present()}>
                  <Text style={[styles.forgotText, { color: Brand.primary }]}>
                    Şifremi unuttum?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  (isLoading || isGoogleLoading) && styles.signInButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                <LinearGradient
                  colors={[Brand.primary, Brand.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInButtonGradient}
                >
                  <Text style={styles.signInButtonText}>
                    {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>veya</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Google Login Button */}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  { borderColor: colors.border, backgroundColor: '#FFFFFF' },
                  (isLoading || isGoogleLoading) && styles.googleButtonDisabled,
                ]}
                onPress={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                {!isGoogleLoading && <GoogleLogo size={22} />}
                <Text style={[styles.googleButtonText, { color: colors.text }]}>
                  {isGoogleLoading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Hesabınız yok mu?{' '}
                </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={[styles.footerLink, { color: Brand.primary }]}>
                      Kayıt Ol
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal ref={forgotPasswordModalRef} />
    </BottomSheetModalProvider>
    </GestureHandlerRootView>
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
    height: Platform.OS === 'ios' ? 8 : 38,
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
    paddingBottom: Spacing['4xl'],
    ...Shadows.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySM,
    flex: 1,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rememberText: {
    ...Typography.bodySM,
  },
  forgotText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  signInButton: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing['2xl'],
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.bodySM,
    marginHorizontal: Spacing.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing['2xl'],
    ...Shadows.sm,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  footerText: {
    ...Typography.bodySM,
  },
  footerLink: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
});
