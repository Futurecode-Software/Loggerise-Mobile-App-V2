import React, { useState, useEffect } from 'react';
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
import { ChevronLeft, User, Mail, Phone, Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { updateProfile, ProfileUpdateData } from '@/services/endpoints/profile';
import { useToast } from '@/hooks/use-toast';

export default function EditProfileScreen() {
  const colors = Colors.light;
  const { user, refreshUser } = useAuth();
  const { success, error: showError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Ad soyad zorunludur';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Ad soyad en az 2 karakter olmalidir';
    }

    if (!email.trim()) {
      newErrors.email = 'E-posta adresi zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Gecerli bir e-posta adresi giriniz';
    }

    if (phone && !/^[\d\s\-\+\(\)]{10,}$/.test(phone)) {
      newErrors.phone = 'Gecerli bir telefon numarasi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data: ProfileUpdateData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      };

      await updateProfile(data);
      await refreshUser();
      success('Başarılı', 'Profil bilgileriniz güncellendi.');
      setTimeout(() => router.back(), 1000);
    } catch (error: any) {
      console.error('Profile update error:', error);
      showError('Hata', error.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = (): boolean => {
    if (!user) return false;
    return (
      name.trim() !== (user.fullName || '') ||
      email.trim() !== (user.email || '') ||
      phone.trim() !== (user.phone || '')
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profil Duzenle</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges() || isLoading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges() || isLoading}
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
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Ad Soyad</Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: errors.name ? colors.danger : colors.border },
              ]}
            >
              <User size={20} color={colors.icon} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: '' }));
                  }
                }}
                placeholder="Adiniz ve soyadiniz"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {errors.name && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.name}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>E-posta Adresi</Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: errors.email ? colors.danger : colors.border },
              ]}
            >
              <Mail size={20} color={colors.icon} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="ornek@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.email}</Text>
            )}
            <Text style={[styles.helpText, { color: colors.textMuted }]}>
              E-posta adresinizi degistirirseniz hesabinizi tekrar dogrulamaniz gerekebilir.
            </Text>
          </View>

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Telefon Numarasi</Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: errors.phone ? colors.danger : colors.border },
              ]}
            >
              <Phone size={20} color={colors.icon} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: '' }));
                  }
                }}
                placeholder="+90 5XX XXX XX XX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{errors.phone}</Text>
            )}
            <Text style={[styles.helpText, { color: colors.textMuted }]}>
              Opsiyonel - Telefon numaraniz hesap kurtarma icin kullanilabilir.
            </Text>
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
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  helpText: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
});
