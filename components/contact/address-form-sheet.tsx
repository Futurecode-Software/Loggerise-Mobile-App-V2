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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, MapPin, Check } from 'lucide-react-native';
import { Button, Input, Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  ContactAddress,
  AddressFormData,
  createContactAddress,
  updateContactAddress,
} from '@/services/endpoints/contacts';

interface AddressFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contactId: number;
  address?: ContactAddress | null;
}

type AddressType = 'billing' | 'shipping' | 'both';

const ADDRESS_TYPES: { value: AddressType; label: string }[] = [
  { value: 'billing', label: 'Fatura Adresi' },
  { value: 'shipping', label: 'Sevkiyat Adresi' },
  { value: 'both', label: 'Fatura & Sevkiyat' },
];

export function AddressFormSheet({
  visible,
  onClose,
  onSuccess,
  contactId,
  address,
}: AddressFormSheetProps) {
  const colors = Colors.light;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AddressFormData>({
    title: '',
    address_line_1: '',
    address_line_2: '',
    postal_code: '',
    phone: '',
    email: '',
    address_type: 'both',
    is_default: false,
    is_active: true,
  });

  // Form verilerini doldur (düzenleme modunda)
  useEffect(() => {
    if (visible) {
      if (address) {
        setFormData({
          title: address.title || '',
          address_line_1: address.address_line_1 || '',
          address_line_2: address.address_line_2 || '',
          country_id: address.country?.id,
          state_id: address.state?.id,
          city_id: address.city?.id,
          postal_code: address.postal_code || '',
          phone: address.phone || '',
          email: address.email || '',
          address_type: address.address_type || 'both',
          is_default: address.is_default,
          is_active: address.is_active,
        });
      } else {
        // Yeni adres - formu temizle
        setFormData({
          title: '',
          address_line_1: '',
          address_line_2: '',
          postal_code: '',
          phone: '',
          email: '',
          address_type: 'both',
          is_default: false,
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [visible, address]);

  const handleChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Hata mesajını temizle
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Adres başlığı zorunludur';
    }

    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = 'Adres zorunludur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (address) {
        // Güncelle
        await updateContactAddress(contactId, address.id, formData);
      } else {
        // Yeni oluştur
        await createContactAddress(contactId, formData);
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
            {address ? 'Adresi Düzenle' : 'Yeni Adres'}
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
            bounces={false}
            overScrollMode="never"
          >
            {/* Genel Hata */}
            {errors.submit && (
              <Card style={[styles.errorCard, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.submit}</Text>
              </Card>
            )}

            {/* Adres Başlığı */}
            <Input
              label="Adres Başlığı *"
              placeholder="Örn: Merkez Ofis, Fabrika, Depo"
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              error={errors.title}
              leftIcon={<MapPin size={18} color={colors.icon} />}
            />

            {/* Adres Satırı 1 */}
            <Input
              label="Adres *"
              placeholder="Sokak, mahalle, bina no"
              value={formData.address_line_1}
              onChangeText={(value) => handleChange('address_line_1', value)}
              error={errors.address_line_1}
              multiline
              numberOfLines={2}
            />

            {/* Adres Satırı 2 */}
            <Input
              label="Adres (devam)"
              placeholder="Kat, daire, ek bilgi"
              value={formData.address_line_2}
              onChangeText={(value) => handleChange('address_line_2', value)}
            />

            {/* Posta Kodu */}
            <Input
              label="Posta Kodu"
              placeholder="34000"
              value={formData.postal_code}
              onChangeText={(value) => handleChange('postal_code', value)}
              keyboardType="numeric"
            />

            {/* Telefon */}
            <Input
              label="Telefon"
              placeholder="+90 212 000 00 00"
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              keyboardType="phone-pad"
            />

            {/* E-posta */}
            <Input
              label="E-posta"
              placeholder="adres@firma.com"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Adres Tipi */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Adres Tipi</Text>
              <View style={styles.typeSelector}>
                {ADDRESS_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor:
                          formData.address_type === type.value ? Brand.primary : colors.card,
                        borderColor:
                          formData.address_type === type.value ? Brand.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleChange('address_type', type.value)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        {
                          color:
                            formData.address_type === type.value ? '#FFFFFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Varsayılan Adres */}
            <TouchableOpacity
              style={[styles.checkboxRow, { borderColor: colors.border }]}
              onPress={() => handleChange('is_default', !formData.is_default)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: formData.is_default ? Brand.primary : 'transparent',
                    borderColor: formData.is_default ? Brand.primary : colors.border,
                  },
                ]}
              >
                {formData.is_default && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>Varsayılan Adres</Text>
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
              title={address ? 'Güncelle' : 'Ekle'}
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
  label: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeOptionText: {
    ...Typography.bodySM,
    fontWeight: '500',
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  checkboxLabel: {
    ...Typography.bodyMD,
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
