import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { changePassword, PasswordChangeData } from '@/services/endpoints/profile';
import { useToast } from '@/hooks/use-toast';

export default function ChangePasswordScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Mevcut sifre zorunludur';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Yeni sifre zorunludur';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Sifre en az 8 karakter olmalidir';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Sifre en az bir buyuk harf icermeli';
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = 'Sifre en az bir kucuk harf icermeli';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Sifre en az bir rakam icermeli';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Sifre onayı zorunludur';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Sifreler eslesmemektedir';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'Yeni sifre mevcut sifreden farkli olmalidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data: PasswordChangeData = {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      };

      await changePassword(data);
      success('Başarılı', 'Şifreniz başarıyla güncellendi.');
      setTimeout(() => router.back(), 1000);
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.message?.toLowerCase().includes('current') ||
          error.message?.toLowerCase().includes('mevcut')) {
        setErrors((prev) => ({ ...prev, currentPassword: 'Mevcut sifre yanlis' }));
      } else {
        showError('Hata', error.message || 'Şifre değiştirilirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = currentPassword && newPassword && confirmPassword;

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void,
    errorKey: string,
    placeholder: string,
    helpText?: string
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          { borderColor: errors[errorKey] ? colors.danger : colors.border },
        ]}
      >
        <Lock size={20} color={colors.icon} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (errors[errorKey]) {
              setErrors((prev) => ({ ...prev, [errorKey]: '' }));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          {showPassword ? (
            <EyeOff size={20} color={colors.icon} />
          ) : (
            <Eye size={20} color={colors.icon} />
          )}
        </TouchableOpacity>
      </View>
      {errors[errorKey] && (
        <Text style={[styles.errorText, { color: colors.danger }]}>{errors[errorKey]}</Text>
      )}
      {helpText && (
        <Text style={[styles.helpText, { color: colors.textMuted }]}>{helpText}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sifre Degistir</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Check size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Guclu bir sifre icin en az 8 karakter, buyuk ve kucuk harf ile rakam kullanin.
            </Text>
          </View>

          {renderPasswordField(
            'Mevcut Sifre',
            currentPassword,
            setCurrentPassword,
            showCurrentPassword,
            setShowCurrentPassword,
            'currentPassword',
            'Mevcut sifrenizi girin'
          )}

          {renderPasswordField(
            'Yeni Sifre',
            newPassword,
            setNewPassword,
            showNewPassword,
            setShowNewPassword,
            'newPassword',
            'Yeni sifrenizi girin',
            'En az 8 karakter, buyuk/kucuk harf ve rakam icermeli'
          )}

          {renderPasswordField(
            'Yeni Sifre (Tekrar)',
            confirmPassword,
            setConfirmPassword,
            showConfirmPassword,
            setShowConfirmPassword,
            'confirmPassword',
            'Yeni sifrenizi tekrar girin'
          )}

          {/* Password Strength Indicator */}
          {newPassword && (
            <View style={styles.strengthContainer}>
              <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
                Sifre Gucu:
              </Text>
              <View style={styles.strengthBars}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor:
                        newPassword.length >= 8 ? colors.success : colors.border,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor:
                        /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)
                          ? colors.success
                          : colors.border,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor: /[0-9]/.test(newPassword)
                        ? colors.success
                        : colors.border,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                        ? colors.success
                        : colors.border,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingMD,
    flex: 1,
  },
  saveButton: {
    backgroundColor: Brand.primary,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  infoBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.bodySM,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.md,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  helpText: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  strengthLabel: {
    ...Typography.bodySM,
    marginRight: Spacing.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
