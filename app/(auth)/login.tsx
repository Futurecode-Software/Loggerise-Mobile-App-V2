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
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, CheckSquare, Square, AlertCircle } from 'lucide-react-native';
import { Button, Input, Divider } from '@/components/ui';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAuth } from '@/context/auth-context';

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Image
            source={LogoDark}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={LogoDark}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Lojistik ve Finans Yonetimi
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* API Error Message */}
            {(error || googleError) && (
              <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15' }]}>
                <AlertCircle size={20} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error || googleError}
                </Text>
              </View>
            )}

            <Input
              label="E-posta"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              leftIcon={<Mail size={20} color={colors.icon} />}
            />

            <Input
              label="Şifre"
              placeholder="Şifrenizi girin"
              value={password}
              onChangeText={(value) => handleInputChange('password', value)}
              isPassword
              autoComplete="password"
              error={errors.password}
              leftIcon={<Lock size={20} color={colors.icon} />}
            />

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                {rememberMe ? (
                  <CheckSquare size={20} color={Brand.primary} />
                ) : (
                  <Square size={20} color={colors.icon} />
                )}
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>
                  Beni hatırla
                </Text>
              </TouchableOpacity>

              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={[styles.forgotText, { color: Brand.primary }]}>
                    Şifremi unuttum
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Login Button */}
            <Button
              title="Giriş Yap"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading || isGoogleLoading}
              fullWidth
              size="lg"
              style={styles.loginButton}
            />

            {/* Divider */}
            <Divider text="veya" />

            {/* Google Login */}
            <Button
              title="Google ile Giriş Yap"
              onPress={handleGoogleLogin}
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
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  logo: {
    width: 220,
    height: 60,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyMD,
  },
  formContainer: {
    flex: 1,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rememberText: {
    ...Typography.bodyMD,
  },
  forgotText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: Spacing.lg,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  footerText: {
    ...Typography.bodyMD,
  },
  footerLink: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
