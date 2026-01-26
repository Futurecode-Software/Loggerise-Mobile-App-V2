import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useToast } from '@/hooks/use-toast';
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Button, Card, Select } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  createCrmCustomer,
  CrmCustomerFormData,
  CrmCustomerStatus,
  LegalType,
} from '@/services/endpoints/crm-customers';
import {
  searchCountries,
  searchStates,
  searchCities,
  searchTaxOffices,
  TURKEY_ID,
  FOREIGN_DEFAULT_TAX_NUMBER,
  Country,
  State,
  City,
  TaxOffice,
} from '@/services/endpoints/locations';

export default function NewCrmCustomerScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTurkish, setIsTurkish] = useState(true);
  const [formData, setFormData] = useState<CrmCustomerFormData>({
    legal_type: 'company',
    name: '',
    short_name: '',
    email: '',
    phone: '',
    category: '',
    status: 'active',
    is_active: true,
    currency_type: 'TRY',
    country_id: TURKEY_ID,
    tax_number: '',
    main_address: '',
    risk_limit: 0,
    notes: '',
  });

  // Location states
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [taxOffices, setTaxOffices] = useState<TaxOffice[]>([]);

  // Loading states
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingTaxOffices, setLoadingTaxOffices] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    loadCountries();
    loadStates(TURKEY_ID);
    loadTaxOffices();
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (formData.country_id) {
      loadStates(formData.country_id);
      // Clear state and city when country changes
      setFormData((prev) => ({ ...prev, main_state_id: undefined, main_city_id: undefined }));
    }
  }, [formData.country_id]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.main_state_id) {
      loadCities(formData.main_state_id);
      // Clear city when state changes
      setFormData((prev) => ({ ...prev, main_city_id: undefined }));
    }
  }, [formData.main_state_id]);

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const data = await searchCountries();
      setCountries(data);
    } catch (err) {
      console.error('Failed to load countries:', err);
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadStates = async (countryId: number) => {
    setLoadingStates(true);
    try {
      const data = await searchStates(countryId);
      setStates(data);
    } catch (err) {
      console.error('Failed to load states:', err);
    } finally {
      setLoadingStates(false);
    }
  };

  const loadCities = async (stateId: number) => {
    setLoadingCities(true);
    try {
      const data = await searchCities(stateId);
      setCities(data);
    } catch (err) {
      console.error('Failed to load cities:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadTaxOffices = async () => {
    setLoadingTaxOffices(true);
    try {
      const data = await searchTaxOffices();
      setTaxOffices(data);
    } catch (err) {
      console.error('Failed to load tax offices:', err);
    } finally {
      setLoadingTaxOffices(false);
    }
  };

  const handleLocationToggle = (isDomestic: boolean) => {
    setIsTurkish(isDomestic);

    if (isDomestic) {
      // Domestic: Set Turkey, clear tax number if it was foreign default
      setFormData((prev) => ({
        ...prev,
        country_id: TURKEY_ID,
        tax_number: prev.tax_number === FOREIGN_DEFAULT_TAX_NUMBER ? '' : prev.tax_number,
      }));
    } else {
      // Foreign: Clear country, set default tax number, clear tax office, clear state/city
      setFormData((prev) => ({
        ...prev,
        country_id: undefined,
        tax_number: !prev.tax_number ? FOREIGN_DEFAULT_TAX_NUMBER : prev.tax_number,
        tax_office_id: undefined,
        main_state_id: undefined,
        main_city_id: undefined,
      }));
    }
  };

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
      showError('Hata', 'Lütfen formu eksiksiz doldurunuz');
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = await createCrmCustomer(formData);
      success('Başarılı', 'CRM müşterisi başarıyla oluşturuldu');
      setTimeout(() => router.replace(`/crm/customers/${customer.id}` as any), 1000);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Müşteri oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title="Yeni CRM Müşterisi"
        showBackButton
        rightIcons={
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

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

            {/* Legal Type & Location Toggle */}
            <View style={styles.toggleRow}>
              {/* Legal Type */}
              <View style={styles.toggleGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Yasal Tip <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      formData.legal_type === 'company' && [
                        styles.toggleButtonActive,
                        { backgroundColor: '#2196F3' + '20', borderColor: '#2196F3' },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, legal_type: 'company' })}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        { color: formData.legal_type === 'company' ? '#2196F3' : colors.text },
                      ]}
                    >
                      Şirket
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      formData.legal_type === 'individual' && [
                        styles.toggleButtonActive,
                        { backgroundColor: '#2196F3' + '20', borderColor: '#2196F3' },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, legal_type: 'individual' })}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        { color: formData.legal_type === 'individual' ? '#2196F3' : colors.text },
                      ]}
                    >
                      Bireysel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Toggle */}
              <View style={styles.toggleGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Konum</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      isTurkish && [
                        styles.toggleButtonActive,
                        { backgroundColor: '#FF9800' + '20', borderColor: '#FF9800' },
                      ],
                    ]}
                    onPress={() => handleLocationToggle(true)}
                  >
                    <Text
                      style={[styles.toggleText, { color: isTurkish ? '#FF9800' : colors.text }]}
                    >
                      Yurtiçi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      !isTurkish && [
                        styles.toggleButtonActive,
                        { backgroundColor: '#FF9800' + '20', borderColor: '#FF9800' },
                      ],
                    ]}
                    onPress={() => handleLocationToggle(false)}
                  >
                    <Text
                      style={[styles.toggleText, { color: !isTurkish ? '#FF9800' : colors.text }]}
                    >
                      Yurtdışı
                    </Text>
                  </TouchableOpacity>
                </View>
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
              label="Kategori"
              placeholder="Örn: Perakende, Toptan"
              value={formData.category}
              onChangeText={(value) => setFormData({ ...formData, category: value })}
            />
          </Card>

          {/* Tax & Location Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Vergi ve Konum Bilgileri
            </Text>

            {/* Tax Office - Only for domestic */}
            {isTurkish && (
              <Select
                label="Vergi Dairesi"
                data={taxOffices.map((office) => ({
                  label: office.name,
                  value: office.id.toString(),
                }))}
                value={formData.tax_office_id?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, tax_office_id: value ? Number(value) : undefined })
                }
                placeholder="Vergi dairesi seçiniz"
                loading={loadingTaxOffices}
              />
            )}

            <Input
              label="Vergi Numarası"
              placeholder="XXXXXXXXXX"
              value={formData.tax_number}
              onChangeText={(value) => setFormData({ ...formData, tax_number: value })}
              keyboardType="numeric"
            />

            {/* Country - Only for foreign */}
            {!isTurkish && (
              <Select
                label="Ülke"
                data={countries.map((country) => ({
                  label: country.name,
                  value: country.id.toString(),
                }))}
                value={formData.country_id?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, country_id: value ? Number(value) : undefined })
                }
                placeholder="Ülke seçiniz"
                loading={loadingCountries}
              />
            )}

            <Input
              label="Ana Adres"
              placeholder="Adres giriniz"
              value={formData.main_address}
              onChangeText={(value) => setFormData({ ...formData, main_address: value })}
              multiline
              numberOfLines={3}
            />

            <Select
              label={isTurkish ? 'İl' : 'Eyalet/Bölge'}
              data={states.map((state) => ({
                label: state.name,
                value: state.id.toString(),
              }))}
              value={formData.main_state_id?.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, main_state_id: value ? Number(value) : undefined })
              }
              placeholder={isTurkish ? 'İl seçiniz' : 'Eyalet seçiniz'}
              loading={loadingStates}
            />

            <Select
              label={isTurkish ? 'İlçe' : 'Şehir'}
              data={cities.map((city) => ({
                label: city.name,
                value: city.id.toString(),
              }))}
              value={formData.main_city_id?.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, main_city_id: value ? Number(value) : undefined })
              }
              placeholder={isTurkish ? 'İlçe seçiniz' : 'Şehir seçiniz'}
              loading={loadingCities}
              disabled={!formData.main_state_id}
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
          </Card>

          {/* Financial Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Finansal Bilgiler</Text>

            <Select
              label="Para Birimi"
              data={[
                { label: 'TRY - Türk Lirası', value: 'TRY' },
                { label: 'USD - Amerikan Doları', value: 'USD' },
                { label: 'EUR - Euro', value: 'EUR' },
                { label: 'GBP - İngiliz Sterlini', value: 'GBP' },
              ]}
              value={formData.currency_type}
              onValueChange={(value) => setFormData({ ...formData, currency_type: value })}
              placeholder="Para birimi seçiniz"
            />

            <Input
              label={`Risk Limiti (${formData.currency_type || 'TRY'})`}
              placeholder="Sınırsız kredi için boş bırakın"
              value={formData.risk_limit?.toString()}
              onChangeText={(value) =>
                setFormData({ ...formData, risk_limit: value ? Number(value) : undefined })
              }
              keyboardType="numeric"
            />

            <Input
              label="Notlar"
              placeholder="Bu müşteri hakkında dahili notlar..."
              value={formData.notes}
              onChangeText={(value) => setFormData({ ...formData, notes: value })}
              multiline
              numberOfLines={4}
            />
          </Card>

          {/* Status */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Durum</Text>
              <View style={styles.statusButtons}>
                {[
                  { value: 'active', label: 'Aktif', color: colors.success },
                  { value: 'passive', label: 'Pasif', color: colors.textMuted },
                  { value: 'blacklist', label: 'Kara Liste', color: colors.danger },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
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
  toggleRow: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleGroup: {
    flex: 1,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderWidth: 2,
  },
  toggleText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  statusButton: {
    flex: 1,
    minWidth: '30%',
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
    ...Typography.bodySM,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
