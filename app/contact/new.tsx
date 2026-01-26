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
  createContact,
  ContactFormData,
  ContactType,
  LegalType,
  ContactStatus,
  BusinessType,
} from '@/services/endpoints/contacts';

// Default Turkey country ID
const DEFAULT_TURKEY_ID = 228;

export default function NewContactScreen() {
  const colors = Colors.light;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    // Required fields
    type: 'customer',
    legal_type: 'company',
    name: '',
    short_name: '',
    currency_type: 'TRY',
    status: 'active',
    is_active: true,
    // Optional fields
    business_type: null,
    email: '',
    phone: '',
    fax: '',
    tax_number: '',
    tax_office_id: null,
    category: '',
    main_address: '',
    country_id: DEFAULT_TURKEY_ID,
    risk_limit: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Firma/Kişi adı zorunludur';
    }

    if (!formData.short_name?.trim()) {
      newErrors.short_name = 'Kısa ad zorunludur';
    }

    if (!formData.type) {
      newErrors.type = 'Cari tipi zorunludur';
    }

    if (!formData.legal_type) {
      newErrors.legal_type = 'Yasal tip zorunludur';
    }

    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur';
    }

    if (!formData.status) {
      newErrors.status = 'Durum zorunludur';
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
      const contact = await createContact(formData);
      Alert.alert('Başarılı', 'Cari başarıyla oluşturuldu', [
        {
          text: 'Tamam',
          onPress: () => router.replace(`/contact/${contact.id}` as any),
        },
      ]);
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Cari oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactTypes: { value: ContactType; label: string }[] = [
    { value: 'customer', label: 'Müşteri' },
    { value: 'supplier', label: 'Tedarikçi' },
    { value: 'both', label: 'Her İkisi' },
    { value: 'potential', label: 'Potansiyel' },
    { value: 'other', label: 'Diğer' },
  ];

  const legalTypes: { value: LegalType; label: string }[] = [
    { value: 'company', label: 'Şirket' },
    { value: 'individual', label: 'Bireysel' },
  ];

  const statusTypes: { value: ContactStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Aktif', color: colors.success },
    { value: 'passive', label: 'Pasif', color: colors.textMuted },
    { value: 'blacklist', label: 'Kara Liste', color: colors.danger },
  ];

  const currencyTypes = [
    { value: 'TRY', label: 'TRY - Türk Lirası' },
    { value: 'USD', label: 'USD - ABD Doları' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - İngiliz Sterlini' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Cari</Text>
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
          {/* Cari Tipi */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cari Tipi</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Tip <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <View style={styles.chipGroup}>
                {contactTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      formData.type === type.value && [
                        styles.chipActive,
                        { backgroundColor: Brand.primary + '15', borderColor: Brand.primary },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: formData.type === type.value ? Brand.primary : colors.text },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.type && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.type}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Yasal Tip <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <View style={styles.radioGroup}>
                {legalTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.radioButton,
                      formData.legal_type === type.value && [
                        styles.radioButtonActive,
                        { backgroundColor: Brand.primary + '15', borderColor: Brand.primary },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, legal_type: type.value })}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        formData.legal_type === type.value && [
                          styles.radioCircleActive,
                          { backgroundColor: Brand.primary },
                        ],
                      ]}
                    />
                    <Text
                      style={[
                        styles.radioText,
                        { color: formData.legal_type === type.value ? Brand.primary : colors.text },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Temel Bilgiler */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

            <Input
              label="Firma/Kişi Adı"
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
              error={errors.short_name}
              required
            />

            <Input
              label="Kategori"
              placeholder="Örn: VIP, Kurumsal"
              value={formData.category}
              onChangeText={(value) => setFormData({ ...formData, category: value })}
            />
          </Card>

          {/* İletişim Bilgileri */}
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

          {/* Vergi Bilgileri */}
          {formData.legal_type === 'company' && (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Vergi Bilgileri</Text>

              <Input
                label="Vergi Numarası"
                placeholder="XXXXXXXXXX"
                value={formData.tax_number}
                onChangeText={(value) => setFormData({ ...formData, tax_number: value })}
                keyboardType="numeric"
                maxLength={11}
              />

              <Text style={[styles.noteText, { color: colors.textMuted }]}>
                * Vergi dairesi seçimi için web uygulamasını kullanınız
              </Text>
            </Card>
          )}

          {/* Adres Bilgileri */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adres Bilgileri</Text>

            <Input
              label="Ana Adres"
              placeholder="Sokak, Mahalle, Bina No, Daire No"
              value={formData.main_address}
              onChangeText={(value) => setFormData({ ...formData, main_address: value })}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              * İl/İlçe seçimi için web uygulamasını kullanınız
            </Text>
          </Card>

          {/* Finansal Ayarlar */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Finansal Ayarlar</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Para Birimi <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <View style={styles.chipGroup}>
                {currencyTypes.map((currency) => (
                  <TouchableOpacity
                    key={currency.value}
                    style={[
                      styles.chip,
                      formData.currency_type === currency.value && [
                        styles.chipActive,
                        { backgroundColor: Brand.primary + '15', borderColor: Brand.primary },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, currency_type: currency.value })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            formData.currency_type === currency.value ? Brand.primary : colors.text,
                        },
                      ]}
                    >
                      {currency.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.currency_type && (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.currency_type}</Text>
              )}
            </View>

            <Input
              label={`Risk Limiti (${formData.currency_type})`}
              placeholder="Boş = Limitsiz"
              value={formData.risk_limit?.toString() || ''}
              onChangeText={(value) =>
                setFormData({ ...formData, risk_limit: value ? parseFloat(value) : null })
              }
              keyboardType="numeric"
            />
          </Card>

          {/* Durum */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Durum <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <View style={styles.statusButtons}>
                {statusTypes.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusButton,
                      formData.status === status.value && [
                        styles.statusButtonActive,
                        { borderColor: status.color },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, status: status.value })}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        {
                          color: formData.status === status.value ? status.color : colors.text,
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
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipActive: {
    borderWidth: 2,
  },
  chipText: {
    ...Typography.bodySM,
    fontWeight: '500',
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
  errorText: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
