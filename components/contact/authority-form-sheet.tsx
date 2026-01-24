import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, User, Check } from 'lucide-react-native';
import { Button, Input, Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  ContactAuthority,
  AuthorityFormData,
  createContactAuthority,
  updateContactAuthority,
} from '@/services/endpoints/contacts';

interface AuthorityFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contactId: number;
  authority?: ContactAuthority | null;
}

export function AuthorityFormSheet({
  visible,
  onClose,
  onSuccess,
  contactId,
  authority,
}: AuthorityFormSheetProps) {
  const colors = Colors.light;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AuthorityFormData>({
    name: '',
    title: '',
    department: '',
    phone: '',
    mobile: '',
    email: '',
    is_primary: false,
    is_active: true,
  });

  // Form verilerini doldur (düzenleme modunda)
  useEffect(() => {
    if (visible) {
      if (authority) {
        setFormData({
          name: authority.name || '',
          title: authority.title || '',
          department: authority.department || '',
          phone: authority.phone || '',
          mobile: authority.mobile || '',
          email: authority.email || '',
          is_primary: authority.is_primary,
          is_active: authority.is_active,
        });
      } else {
        // Yeni yetkili - formu temizle
        setFormData({
          name: '',
          title: '',
          department: '',
          phone: '',
          mobile: '',
          email: '',
          is_primary: false,
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [visible, authority]);

  const handleChange = (field: keyof AuthorityFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Hata mesajını temizle
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad soyad zorunludur';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (authority) {
        // Güncelle
        await updateContactAuthority(contactId, authority.id, formData);
      } else {
        // Yeni oluştur
        await createContactAuthority(contactId, formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Bir hata oluştu',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {authority ? 'Yetkiliyi Düzenle' : 'Yeni Yetkili'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Genel Hata */}
            {errors.submit && (
              <Card style={[styles.errorCard, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.submit}</Text>
              </Card>
            )}

            {/* Ad Soyad */}
            <Input
              label="Ad Soyad *"
              placeholder="Örn: Ahmet Yılmaz"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              error={errors.name}
              leftIcon={<User size={18} color={colors.icon} />}
              autoCapitalize="words"
            />

            {/* Unvan */}
            <Input
              label="Unvan"
              placeholder="Örn: Genel Müdür, Satış Müdürü"
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              autoCapitalize="words"
            />

            {/* Departman */}
            <Input
              label="Departman"
              placeholder="Örn: Satış, Muhasebe, Lojistik"
              value={formData.department}
              onChangeText={(value) => handleChange('department', value)}
              autoCapitalize="words"
            />

            {/* E-posta */}
            <Input
              label="E-posta"
              placeholder="yetkili@firma.com"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Telefon (Sabit) */}
            <Input
              label="Telefon (Sabit)"
              placeholder="+90 212 000 00 00"
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              keyboardType="phone-pad"
            />

            {/* Cep Telefonu */}
            <Input
              label="Cep Telefonu"
              placeholder="+90 532 000 00 00"
              value={formData.mobile}
              onChangeText={(value) => handleChange('mobile', value)}
              keyboardType="phone-pad"
            />

            {/* Birincil Yetkili */}
            <TouchableOpacity
              style={[styles.checkboxRow, { borderColor: colors.border }]}
              onPress={() => handleChange('is_primary', !formData.is_primary)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: formData.is_primary ? Brand.primary : 'transparent',
                    borderColor: formData.is_primary ? Brand.primary : colors.border,
                  },
                ]}
              >
                {formData.is_primary && <Check size={14} color="#FFFFFF" />}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>Birincil Yetkili</Text>
                <Text style={[styles.checkboxHint, { color: colors.textMuted }]}>
                  Ana iletişim kişisi olarak işaretlenir
                </Text>
              </View>
            </TouchableOpacity>

            {/* Aktif */}
            <TouchableOpacity
              style={[styles.checkboxRow, { borderColor: colors.border }]}
              onPress={() => handleChange('is_active', !formData.is_active)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: formData.is_active ? Brand.primary : 'transparent',
                    borderColor: formData.is_active ? Brand.primary : colors.border,
                  },
                ]}
              >
                {formData.is_active && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>Aktif</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button title="İptal" variant="outline" onPress={onClose} style={styles.footerButton} />
            <Button
              title={authority ? 'Güncelle' : 'Ekle'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.footerButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingMD,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  errorCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    ...Typography.bodySM,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    ...Typography.bodyMD,
  },
  checkboxHint: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
