import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header';
import { userManagementService } from '../../services/api/userManagementService';
import { Colors, Spacing, Typography, BorderRadius, Shadows, Brand } from '@/constants/theme';
import { User, Role } from '../../types/user';

interface UserFormScreenProps {
  userId?: number;
}

const ROLE_LABELS: Record<string, string> = {
  'Süper Yönetici': 'Süper Yönetici',
  'İK Müdürü': 'İK Müdürü',
  'Lojistik Müdürü': 'Lojistik Müdürü',
  'Lojistik Operatörü': 'Lojistik Operatörü',
  'Muhasebeci': 'Muhasebeci',
};

// Use colors from theme
const colors = Colors.light;

export const UserFormScreen: React.FC<UserFormScreenProps> = ({ userId }) => {
  const isEditing = !!userId;

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load roles
  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await userManagementService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
      Alert.alert('Hata', 'Roller yüklenirken bir hata oluştu.');
    }
  }, []);

  // Load user data (if editing)
  const loadUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const user = await userManagementService.getUser(userId);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles.map(r => r.name),
      });
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Hata', 'Kullanıcı yüklenirken bir hata oluştu.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadRoles();
    if (isEditing) {
      loadUser();
    }
  }, [isEditing, loadRoles, loadUser]);

  // Toggle role
  const toggleRole = useCallback((roleName: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter(r => r !== roleName)
        : [...prev.roles, roleName],
    }));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad Soyad zorunludur.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi zorunludur.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Şifre zorunludur.';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Şifre en az 8 karakter olmalıdır.';
      }
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Şifre onayı eşleşmiyor.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEditing]);

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        ...(formData.password && {
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        }),
        roles: formData.roles,
      };

      if (isEditing && userId) {
        await userManagementService.updateUser(userId, payload);
        Alert.alert('Başarılı', 'Kullanıcı başarıyla güncellendi.');
      } else {
        await userManagementService.createUser(payload);
        Alert.alert('Başarılı', 'Kullanıcı başarıyla oluşturuldu.');
      }

      router.back();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, isEditing, userId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <FullScreenHeader
        title={isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        subtitle="Kullanıcı bilgilerini girin"
        showBackButton
        rightIcons={
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.7}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

      {/* Content Area */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Temel Bilgiler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Ad Soyad <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ad Soyad"
              value={formData.name}
              onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
              autoCapitalize="words"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              E-posta <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={text => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
        </View>

        {/* Şifre Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Şifre Bilgileri</Text>
          {isEditing && (
            <Text style={styles.sectionDescription}>
              Şifreyi değiştirmek istemiyorsanız boş bırakın.
            </Text>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Şifre {!isEditing && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="••••••••"
              value={formData.password}
              onChangeText={text => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Şifre Onayı {!isEditing && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.input, errors.password_confirmation && styles.inputError]}
              placeholder="••••••••"
              value={formData.password_confirmation}
              onChangeText={text =>
                setFormData(prev => ({ ...prev, password_confirmation: text }))
              }
              secureTextEntry
            />
            {errors.password_confirmation && (
              <Text style={styles.errorText}>{errors.password_confirmation}</Text>
            )}
          </View>
        </View>

        {/* Rol Atamaları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rol Atamaları</Text>
          {userId === 1 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ İlk kullanıcının rolü değiştirilemez. Bu kullanıcı daima Süper Admin
                yetkilerine sahiptir.
              </Text>
            </View>
          )}

          <View style={styles.rolesContainer}>
            {roles.map(role => (
              <TouchableOpacity
                key={role.id}
                style={styles.roleItem}
                onPress={() => toggleRole(role.name)}
                disabled={userId === 1}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.roles.includes(role.name) && styles.checkboxChecked,
                  ]}
                >
                  {formData.roles.includes(role.name) && (
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
                  )}
                </View>
                <Text style={styles.roleText}>
                  {ROLE_LABELS[role.name] || role.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    ...Typography.headingMD,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.bodySM,
    color: colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
  },
  rolesContainer: {
    gap: 12,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    ...Typography.bodyMD,
    color: colors.text,
  },
});
