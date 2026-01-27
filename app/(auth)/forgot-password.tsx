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
import { Mail, ChevronLeft, CheckCircle, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { useAuth } from '@/context/auth-context';

const { height } = Dimensions.get('window');

// Logo images
const LogoWhite = require('@/assets/images/logo-white.png');

export default function ForgotPasswordScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const { forgotPassword, isLoading, isAuthenticated, isInitializing, isSetupComplete } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Redirect if authenticated - don't show forgot-password page at all
  useEffect(() => {
    if (isAuthenticated) {
      if (isSetupComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/setup-status');
      }
    }
  }, [isAuthenticated, isSetupComplete]);

  // Don't show page while checking auth state or if already authenticated
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

  const validate = () => {
    if (!email) {
      setError('E-posta adresi gerekli');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendReset = async () => {
    if (validate()) {
      await forgotPassword(email);
      setIsSent(true);
      startCountdown();
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (countdown === 0) {
      await forgotPassword(email);
      startCountdown();
    }
  };

  if (isSent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Brand.primary, Brand.primaryLight, Brand.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.successFullContainer}>
            {/* Top Section */}
            <View style={styles.topSection}>
              <Image
                source={LogoWhite}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Success Card */}
            <View style={styles.successCard}>
              <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
                <CheckCircle size={48} color={colors.success} />
              </View>

              <Text style={[styles.successTitle, { color: colors.text }]}>
                E-postanızı Kontrol Edin
              </Text>

              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                Şifre sıfırlama bağlantısı{'\n'}
                <Text style={{ fontWeight: '600' }}>{email}</Text>
                {'\n'}adresine gönderildi.
              </Text>

              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={[styles.countdownText, { color: colors.textMuted }]}>
                    Yeniden gönder ({countdown}s)
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResend}
                    disabled={isLoading}
                  >
                    <RotateCcw size={16} color={Brand.primary} />
                    <Text style={[styles.resendText, { color: Brand.primary }]}>
                      Yeniden Gönder
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <LinearGradient
                  colors={[Brand.primary, Brand.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.backToLoginButtonGradient}
                >
                  <Text style={styles.backToLoginButtonText}>Giriş Sayfasına Dön</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Brand.primary, Brand.primaryLight, Brand.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
            overScrollMode="never"
          >
            {/* Top Section - Logo & Title */}
            <View style={styles.topSection}>
              <Image
                source={LogoWhite}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.welcomeTitle}>Şifrenizi mi Unuttunuz?</Text>
              <Text style={styles.welcomeSubtitle}>
                E-posta adresinize sıfırlama bağlantısı göndereceğiz
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Input
                label="E-posta"
                placeholder="ornek@email.com"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={error}
                leftIcon={<Mail size={20} color={colors.icon} />}
                containerStyle={styles.inputContainer}
              />

              <TouchableOpacity
                style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                onPress={handleSendReset}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[Brand.primary, Brand.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendButtonGradient}
                >
                  <Text style={styles.sendButtonText}>
                    {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Şifrenizi hatırladınız mı?{' '}
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
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  sendButton: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  // Success Screen Styles
  successFullContainer: {
    flex: 1,
  },
  successCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.lg,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  successTitle: {
    ...Typography.headingLG,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    lineHeight: 24,
  },
  resendContainer: {
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['3xl'],
  },
  countdownText: {
    ...Typography.bodyMD,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resendText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  backToLoginButton: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  backToLoginButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
