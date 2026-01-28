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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userManagementService } from '../../services/api/userManagementService';
import { colors } from '../../constants/colors';
import { User, Role } from '../../types/user';

type RouteParams = {
  UserForm: {
    userId?: number;
  };
};

const ROLE_LABELS: Record<string, string> = {
  'Süper Yönetici': 'Süper Yönetici',
  'İK Müdürü': 'İK Müdürü',
  'Lojistik Müdürü': 'Lojistik Müdürü',
  'Lojistik Operatörü': 'Lojistik Operatörü',
  'Muhasebeci': 'Muhasebeci',
};

export const UserFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'UserForm'>>();
  const { userId } = route.params || {};

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
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId, navigation]);

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

      navigation.goBack();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, isEditing, userId, navigation]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              <Icon name="alert" size={20} color={colors.warning.DEFAULT} />
              <Text style={styles.warningText}>
                İlk kullanıcının rolü değiştirilemez. Bu kullanıcı daima Süper Admin
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
                    <Icon name="check" size={16} color="#fff" />
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

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Güncelle' : 'Oluştur'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  required: {
    color: colors.danger.DEFAULT,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.gray[900],
  },
  inputError: {
    borderColor: colors.danger.DEFAULT,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger.DEFAULT,
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning.light,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning.DEFAULT,
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
    borderColor: colors.gray[300],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary.DEFAULT,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
