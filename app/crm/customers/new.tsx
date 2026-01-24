import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { Input, Button, Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  createCrmCustomer,
  CrmCustomerFormData,
  CrmCustomerStatus,
  CustomerSegment,
  LegalType,
} from '@/services/endpoints/crm-customers';

export default function NewCrmCustomerScreen() {
  const colors = Colors.light;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CrmCustomerFormData>({
    legal_type: 'company',
    name: '',
    short_name: '',
    email: '',
    phone: '',
    category: '',
    status: 'active',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Müşteri adı zorunludur';
    }

    if (!formData.legal_type) {
      newErrors.legal_type = 'Yasal tip zorunludur';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Hata', 'Lütfen formu eksiksiz doldurunuz');
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = await createCrmCustomer(formData);
      Alert.alert('Başarılı', 'CRM müşterisi başarıyla oluşturuldu', [
        {
          text: 'Tamam',
          onPress: () => router.replace(`/crm/customers/${customer.id}` as any),
        },
      ]);
    } catch (err) {
      Alert.alert(
        'Hata',
        err instanceof Error ? err.message : 'Müşteri oluşturulamadı'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni CRM Müşterisi</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: isSubmitting ? colors.border : Brand.primary },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

            {/* Legal Type */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Yasal Tip <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    formData.legal_type === 'company' && [
                      styles.radioButtonActive,
                      { backgroundColor: Brand.primary + '15', borderColor: Brand.primary },
                    ],
                  ]}
                  onPress={() => setFormData({ ...formData, legal_type: 'company' })}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formData.legal_type === 'company' && [
                        styles.radioCircleActive,
                        { backgroundColor: Brand.primary },
                      ],
                    ]}
                  />
                  <Text
                    style={[
                      styles.radioText,
                      { color: formData.legal_type === 'company' ? Brand.primary : colors.text },
                    ]}
                  >
                    Şirket
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    formData.legal_type === 'individual' && [
                      styles.radioButtonActive,
                      { backgroundColor: Brand.primary + '15', borderColor: Brand.primary },
                    ],
                  ]}
                  onPress={() => setFormData({ ...formData, legal_type: 'individual' })}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      formData.legal_type === 'individual' && [
                        styles.radioCircleActive,
                        { backgroundColor: Brand.primary },
                      ],
                    ]}
                  />
                  <Text
                    style={[
                      styles.radioText,
                      { color: formData.legal_type === 'individual' ? Brand.primary : colors.text },
                    ]}
                  >
                    Bireysel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label="Müşteri Adı"
              placeholder="Örn: ABC Lojistik A.Ş."
              value={formData.name}
              onChangeText={(value) => setFormData({ ...formData, name: value })}
              error={errors.name}
              required
            />

            <Input
              label="Kısa Ad"
              placeholder="Örn: ABC"
              value={formData.short_name}
              onChangeText={(value) => setFormData({ ...formData, short_name: value })}
            />

            <Input
              label="Kod"
              placeholder="Otomatik oluşturulacak"
              value={formData.code}
              onChangeText={(value) => setFormData({ ...formData, code: value })}
              editable={false}
            />

            <Input
              label="Kategori"
              placeholder="Örn: Perakende, Toptan"
              value={formData.category}
              onChangeText={(value) => setFormData({ ...formData, category: value })}
            />
          </Card>

          {/* Contact Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>İletişim Bilgileri</Text>

            <Input
              label="E-posta"
              placeholder="ornek@sirket.com"
              value={formData.email}
              onChangeText={(value) => setFormData({ ...formData, email: value })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Telefon"
              placeholder="+90 XXX XXX XX XX"
              value={formData.phone}
              onChangeText={(value) => setFormData({ ...formData, phone: value })}
              keyboardType="phone-pad"
            />

            <Input
              label="Faks"
              placeholder="+90 XXX XXX XX XX"
              value={formData.fax}
              onChangeText={(value) => setFormData({ ...formData, fax: value })}
              keyboardType="phone-pad"
            />
          </Card>

          {/* Company Information */}
          {formData.legal_type === 'company' && (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Firma Bilgileri</Text>

              <Input
                label="Vergi Numarası"
                placeholder="XXXXXXXXXX"
                value={formData.tax_number}
                onChangeText={(value) => setFormData({ ...formData, tax_number: value })}
                keyboardType="numeric"
              />

              {/* Note: Tax Office ID would require an AsyncSelect component */}
              <Text style={[styles.noteText, { color: colors.textMuted }]}>
                * Vergi dairesi seçimi için web uygulamasını kullanınız
              </Text>
            </Card>
          )}

          {/* Status */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Durum</Text>
              <View style={styles.statusButtons}>
                {[
                  { value: 'active', label: 'Aktif', color: colors.success },
                  { value: 'passive', label: 'Pasif', color: colors.textMuted },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusButton,
                      formData.status === status.value && [
                        styles.statusButtonActive,
                        { borderColor: status.color },
                      ],
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, status: status.value as CrmCustomerStatus })
                    }
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        {
                          color:
                            formData.status === status.value ? status.color : colors.text,
                        },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Submit Button */}
          <Button
            title={isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            variant="primary"
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  saveButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  radioButtonActive: {
    borderWidth: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
    marginRight: Spacing.sm,
  },
  radioCircleActive: {
    borderWidth: 6,
    borderColor: '#FFFFFF',
  },
  radioText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statusButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 2,
  },
  statusButtonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  noteText: {
    ...Typography.bodyXS,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
