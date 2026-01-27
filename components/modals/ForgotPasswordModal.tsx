import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mail, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import CustomBottomSheet from './CustomBottomSheet';
import { Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export interface ForgotPasswordModalRef {
  present: () => void;
  dismiss: () => void;
}

/**
 * Forgot Password Bottom Sheet Modal
 *
 * Minimal modal for password reset - just email input and send button
 * Shows success state after email is sent
 */
const ForgotPasswordModal = forwardRef<ForgotPasswordModalRef>((props, ref) => {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { forgotPassword, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  // Expose present/dismiss methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
    },
  }));

  const handleDismiss = () => {
    // Reset state when modal is closed
    setTimeout(() => {
      setEmail('');
      setError('');
      setIsSent(false);
    }, 200);
  };

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
      // Auto close after 3 seconds
      setTimeout(() => {
        bottomSheetRef.current?.dismiss();
      }, 3000);
    }
  };

  const renderContent = () => {
    if (isSent) {
      return (
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
            <CheckCircle size={28} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            E-posta Gönderildi!
          </Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            Şifre sıfırlama bağlantısı{'\n'}
            <Text style={{ fontWeight: '600' }}>{email}</Text>
            {'\n'}adresine gönderildi.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.formContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Şifrenizi mi Unuttunuz?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          E-posta adresinize sıfırlama bağlantısı göndereceğiz
        </Text>

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
      </View>
    );
  };

  return (
    <CustomBottomSheet
      ref={bottomSheetRef}
      snapPoints={isSent ? ['25%'] : ['32%']}
      onDismiss={handleDismiss}
    >
      {renderContent()}
    </CustomBottomSheet>
  );
});

ForgotPasswordModal.displayName = 'ForgotPasswordModal';

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 0,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.headingMD,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  sendButton: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
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
  // Success State
  successContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    ...Typography.headingMD,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  successText: {
    ...Typography.bodySM,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ForgotPasswordModal;
