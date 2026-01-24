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
import { Mail, ChevronLeft, CheckCircle, RotateCcw } from 'lucide-react-native';
import { Button, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { useAuth } from '@/context/auth-context';

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
          <View style={styles.placeholder} />
        </View>

        <View style={styles.successContainer}>
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

          <Button
            title="Giriş Sayfasına Dön"
            onPress={() => router.replace('/(auth)/login')}
            variant="outline"
            fullWidth
            size="lg"
            style={styles.backToLoginButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.placeholder} />
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
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
            <Mail size={64} color={Brand.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Şifrenizi mi Unuttunuz?
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            E-posta adresinize sıfırlama bağlantısı göndereceğiz.
          </Text>

          {/* Form */}
          <View style={styles.formContainer}>
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
            />

            <Button
              title="Sıfırlama Bağlantısı Gönder"
              onPress={handleSendReset}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    ...Typography.headingXL,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  formContainer: {
    flex: 1,
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
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
    marginTop: Spacing.md,
  },
});
