import React, { useState, useCallback, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Button, Card } from '@/components/ui';
import { GooglePlacesAutocomplete } from '@/components/ui/GooglePlacesAutocomplete';
import { CountrySelect, StateSelect, CitySelect } from '@/components/ui/LocationSelects';
import { TaxOfficeSelect } from '@/components/ui/TaxOfficeSelect';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  getContact,
  updateContact,
  ContactFormData,
  ContactType,
  LegalType,
  ContactStatus,
  BusinessType,
} from '@/services/endpoints/contacts';
import { PlaceDetails, lookupLocation } from '@/services/endpoints/locations';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

// Yabanci firma varsayilan vergi numarasi
const FOREIGN_DEFAULT_TAX_NUMBER = '22222222222';
// Turkiye varsayilan ID
const DEFAULT_TURKEY_ID = 228;

// Toggle Button Component
function ToggleButton({
  active,
  onClick,
  children,
  color = 'blue',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: 'blue' | 'orange';
}) {
  const colors = Colors.light;
  const activeColors = {
    blue: Brand.primary,
    orange: '#FF9800',
  };

  return (
    <TouchableOpacity
      onPress={onClick}
      style={[
        styles.toggleButton,
        {
          backgroundColor: active ? activeColors[color] : colors.surface,
          borderColor: active ? activeColors[color] : colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.toggleButtonText,
          { color: active ? '#FFFFFF' : colors.text },
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = Number(id);
  
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTurkish, setIsTurkish] = useState(true);
  const [queryingEfatura, setQueryingEfatura] = useState(false);
  const [efaturaInfo, setEfaturaInfo] = useState<{
    unvan?: string;
    efatura_kayitli?: boolean;
    earsiv_kayitli?: boolean;
  } | null>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    // Required fields
    type: 'customer',
    business_type: null,
    legal_type: 'company',
    name: '',
    short_name: '',
    currency_type: 'TRY',
    status: 'active',
    is_active: true,
    // Optional fields
    email: '',
    phone: '',
    fax: '',
    tax_number: '',
    tax_office_id: null,
    category: '',
    main_address: '',
    country_id: DEFAULT_TURKEY_ID,
    main_state_id: null,
    main_city_id: null,
    main_latitude: null,
    main_longitude: null,
    main_place_id: null,
    main_formatted_address: null,
    risk_limit: null,
    // Müşteri segment alanları
    customer_segment: null,
    credit_rating: null,
    default_payment_terms: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load contact data
  useEffect(() => {
    const loadContact = async () => {
      if (!contactId) {
        showError('Hata', 'Cari ID bulunamadı');
        router.back();
        return;
      }

      try {
        setIsLoading(true);
        const contact = await getContact(contactId);

        // Set location type based on country
        const isDomestic = contact.country_id === DEFAULT_TURKEY_ID;
        setIsTurkish(isDomestic);

        // Populate form data
        setFormData({
          type: contact.type,
          business_type: contact.business_type || null,
          legal_type: contact.legal_type || 'company',
          name: contact.name || '',
          short_name: contact.short_name || '',
          currency_type: contact.currency_type || 'TRY',
          status: contact.status,
          is_active: contact.is_active,
          email: contact.email || '',
          phone: contact.phone || '',
          fax: '',
          tax_number: contact.tax_number || '',
          tax_office_id: contact.tax_office?.id || null,
          category: contact.category || '',
          main_address: contact.main_address || '',
          country_id: contact.country_id || DEFAULT_TURKEY_ID,
          main_state_id: contact.main_state_id || null,
          main_city_id: contact.main_city_id || null,
          main_latitude: contact.main_latitude || null,
          main_longitude: contact.main_longitude || null,
          main_place_id: contact.main_place_id || null,
          main_formatted_address: contact.main_formatted_address || null,
          risk_limit: contact.risk_limit || null,
          customer_segment: contact.customer_segment || null,
          credit_rating: contact.credit_rating || null,
          default_payment_terms: contact.default_payment_terms || null,
        });
      } catch (err) {
        showError('Hata', err instanceof Error ? err.message : 'Cari bilgisi yüklenemedi');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadContact();
  }, [contactId]);

  // Yurtici/Yurtdisi toggle handler
  const handleLocationToggle = useCallback((isDomestic: boolean) => {
    setIsTurkish(isDomestic);

    if (isDomestic) {
      // Yurtici: Turkiye sec, vergi no temizle
      setFormData(prev => ({
        ...prev,
        country_id: DEFAULT_TURKEY_ID,
        tax_number: '',
        main_state_id: null,
        main_city_id: null,
      }));
      setEfaturaInfo(null);
    } else {
      // Yurtdisi: Ulke temizle, vergi no otomatik doldur
      setFormData(prev => ({
        ...prev,
        country_id: undefined,
        tax_number: FOREIGN_DEFAULT_TAX_NUMBER,
        tax_office_id: null,
        main_state_id: null,
        main_city_id: null,
      }));
      setEfaturaInfo(null);
    }
  }, []);

  // E-Fatura kullanici bilgisi sorgulama
  const queryEfaturaUser = useCallback(async (taxNumber: string, currentName: string = '') => {
    if (!taxNumber || taxNumber.length < 10 || !isTurkish || taxNumber === FOREIGN_DEFAULT_TAX_NUMBER) {
      setEfaturaInfo(null);
      return;
    }

    setQueryingEfatura(true);
    try {
      const response = await api.get('/invoice-data/efatura-user/query', {
        params: { tax_number: taxNumber },
      });

      if (response.data.success && response.data.data) {
        const userData = response.data.data;

        setEfaturaInfo({
          unvan: userData.unvan || undefined,
          efatura_kayitli: userData.efatura_kayitli ?? undefined,
          earsiv_kayitli: userData.earsiv_kayitli ?? undefined,
        });

        // Form alanlarini doldur
        if (userData.unvan && !currentName) {
          setFormData(prev => ({ ...prev, name: userData.unvan }));
        }
      } else {
        setEfaturaInfo(null);
      }
    } catch (error: any) {
      // E-Finans ayarlari yapilandirilmamissa sessizce gec (400 error)
      // Diger hatalarda da kullaniciyi rahatsiz etme
      if (error?.response?.status === 400) {
        console.log('[E-Fatura] E-Finans ayarlari yapilandirilmamis, sorgulama atlanacak');
      } else {
        console.error('E-Fatura API Hatasi:', error);
      }
      setEfaturaInfo(null);
    } finally {
      setQueryingEfatura(false);
    }
  }, [isTurkish, formData.name]);

  // Vergi numarasi degistiginde sorgula (debounce ile)
  useEffect(() => {
    const taxNumber = formData.tax_number || '';
    if (taxNumber.length >= 10 && isTurkish && taxNumber !== FOREIGN_DEFAULT_TAX_NUMBER) {
      const timeoutId = setTimeout(() => {
        queryEfaturaUser(taxNumber, formData.name || '');
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setEfaturaInfo(null);
    }
  }, [formData.tax_number, formData.name, isTurkish, queryEfaturaUser]);

  const handleMainAddressPlaceSelect = async (place: PlaceDetails | null) => {
    if (!place) return;

    const updated = {
      main_address: place.formatted_address || place.address,
      main_formatted_address: place.formatted_address,
      main_latitude: place.latitude,
      main_longitude: place.longitude,
      main_place_id: place.place_id,
    };

    // Location lookup
    if (place.country_code || place.country || place.state || place.city) {
      try {
        const locationIds = await lookupLocation(place);
        if (locationIds.country_id) {
          setFormData(prev => ({
            ...prev,
            ...updated,
            country_id: locationIds.country_id,
            main_state_id: locationIds.state_id || null,
            main_city_id: locationIds.city_id || null,
          }));
          return;
        }
      } catch (error) {
        console.error('Location lookup error:', error);
      }
    }

    setFormData(prev => ({ ...prev, ...updated }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Firma/Kişi adı zorunludur';
    }

    if (!formData.short_name?.trim()) {
      newErrors.short_name = 'Kısa ad zorunludur';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
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

    if (!formData.main_address?.trim()) {
      newErrors.main_address = 'Ana adres zorunludur';
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
      await updateContact(contactId, formData);
      success('Başarılı', 'Cari başarıyla güncellendi');
      router.replace(`/contact/${contactId}` as any);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Cari güncellenemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactTypes: { value: ContactType; label: string }[] = [
    { value: 'customer', label: 'Müşteri' },
    { value: 'supplier', label: 'Tedarikçi' },
    { value: 'both', label: 'Her İkisi' },
    { value: 'self', label: 'Kendi Şirketim' },
    { value: 'potential', label: 'Potansiyel' },
    { value: 'other', label: 'Diğer' },
  ];

  const businessTypes: { value: BusinessType | ''; label: string }[] = [
    { value: '', label: 'Seçiniz...' },
    { value: 'customs_agent', label: 'Gümrük Müşaviri' },
    { value: 'logistics_partner', label: 'Lojistik Ortağı' },
    { value: 'bank', label: 'Banka' },
    { value: 'insurance', label: 'Sigorta' },
    { value: 'other', label: 'Diğer' },
  ];

  const statusTypes: { value: ContactStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Aktif', color: colors.success },
    { value: 'passive', label: 'Pasif', color: colors.textMuted },
    { value: 'blacklist', label: 'Kara Liste', color: colors.danger },
  ];

  const currencyTypes = [
    { value: 'TRY', label: 'TRY' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
  ];

  const customerSegments = [
    { value: '', label: 'Seçiniz...' },
    { value: 'enterprise', label: 'Kurumsal' },
    { value: 'mid_market', label: 'Orta Ölçek' },
    { value: 'small_business', label: 'Küçük İşletme' },
    { value: 'individual', label: 'Bireysel' },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Cari Düzenle" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cari bilgisi yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title="Cari Düzenle"
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
          {/* E-Fatura/E-Arsiv Logo Gosterimi */}
          {efaturaInfo && (efaturaInfo.efatura_kayitli || efaturaInfo.earsiv_kayitli) && (
            <Card style={styles.efaturaCard}>
              {efaturaInfo.efatura_kayitli && (
                <View style={styles.efaturaItem}>
                  <Text style={[styles.efaturaText, { color: colors.success }]}>
                    ✓ e-Fatura Kayıtlı
                  </Text>
                </View>
              )}
              {efaturaInfo.earsiv_kayitli && (
                <View style={styles.efaturaItem}>
                  <Text style={[styles.efaturaText, { color: colors.success }]}>
                    ✓ e-Arşiv Kayıtlı
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Cari Tipi ve Faaliyet Alanı */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cari Tipi ve Faaliyet Alanı</Text>

            {/* Cari Tipi */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Cari Tipi <Text style={{ color: colors.danger }}>*</Text>
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

            {/* Faaliyet Alanı */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Faaliyet Alanı</Text>
              <View style={styles.chipGroup}>
                {businessTypes.filter(b => b.value !== '').map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      formData.business_type === type.value && [
                        styles.chipActive,
                        { backgroundColor: Brand.primary + '15', borderColor: Brand.primary },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, business_type: (type.value as BusinessType) || null })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: formData.business_type === type.value ? Brand.primary : colors.text },
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

            {/* Legal Type ve Yurtici/Yurtdisi Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleColumn}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Yasal Tip</Text>
                <View style={styles.toggleGroup}>
                  <ToggleButton
                    active={formData.legal_type === 'company'}
                    onClick={() => setFormData({ ...formData, legal_type: 'company' })}
                    color="blue"
                  >
                    Şirket
                  </ToggleButton>
                  <ToggleButton
                    active={formData.legal_type === 'individual'}
                    onClick={() => setFormData({ ...formData, legal_type: 'individual' })}
                    color="blue"
                  >
                    Bireysel
                  </ToggleButton>
                </View>
              </View>

              <View style={styles.toggleColumn}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Konum</Text>
                <View style={styles.toggleGroup}>
                  <ToggleButton
                    active={isTurkish}
                    onClick={() => handleLocationToggle(true)}
                    color="orange"
                  >
                    Yurt İçi
                  </ToggleButton>
                  <ToggleButton
                    active={!isTurkish}
                    onClick={() => handleLocationToggle(false)}
                    color="orange"
                  >
                    Yurt Dışı
                  </ToggleButton>
                </View>
              </View>
            </View>

            {/* Vergi Dairesi - Sadece Turk firmalari icin */}
            {isTurkish && (
              <TaxOfficeSelect
                label="Vergi Dairesi"
                value={formData.tax_office_id}
                onChange={(value) => setFormData({ ...formData, tax_office_id: value })}
                error={errors.tax_office_id}
                placeholder="Vergi dairesi ara..."
              />
            )}

            {/* Vergi Numarası */}
            <View>
              <Input
                label={
                  queryingEfatura
                    ? 'Vergi Numarası (Sorgulanıyor...)'
                    : 'Vergi Numarası'
                }
                placeholder="1234567890"
                value={formData.tax_number}
                onChangeText={(value) => setFormData({ ...formData, tax_number: value })}
                keyboardType="numeric"
                maxLength={11}
              />
              {!isTurkish && formData.tax_number === FOREIGN_DEFAULT_TAX_NUMBER && (
                <Text style={[styles.noteText, { color: colors.warning }]}>
                  * Yabancı firma varsayılan vergi numarası
                </Text>
              )}
            </View>

            {/* Country Select - Sadece yurtdisi firmalar icin */}
            {!isTurkish && (
              <CountrySelect
                label="Ülke"
                value={formData.country_id}
                onChange={(value) => setFormData({ ...formData, country_id: value ? Number(value) : undefined })}
                error={errors.country_id}
                placeholder="Ülke seçiniz"
              />
            )}

            <Input
              label="Kısa Ad"
              placeholder="Örn: ABC"
              value={formData.short_name}
              onChangeText={(value) => setFormData({ ...formData, short_name: value })}
              error={errors.short_name}
              required
            />

            <Input
              label="E-posta"
              placeholder="info@abc.com"
              value={formData.email}
              onChangeText={(value) => setFormData({ ...formData, email: value })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
            />

            <Input
              label="Telefon"
              placeholder="+90 212 555 1234"
              value={formData.phone}
              onChangeText={(value) => setFormData({ ...formData, phone: value })}
              keyboardType="phone-pad"
            />
          </Card>

          {/* Adres Bilgileri */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adres Bilgileri</Text>

            {/* Google Places Autocomplete */}
            <GooglePlacesAutocomplete
              label="Adres Ara (Google Maps)"
              placeholder="Adres aramak için yazmaya başlayın..."
              value={formData.main_formatted_address || formData.main_address}
              onChange={(value) => setFormData({ ...formData, main_address: value })}
              onPlaceSelect={handleMainAddressPlaceSelect}
            />

            <Input
              label="Ana Adres"
              placeholder="Sokak, Mahalle, Bina No, Daire No"
              value={formData.main_address}
              onChangeText={(value) => setFormData({ ...formData, main_address: value })}
              multiline
              numberOfLines={3}
              error={errors.main_address}
              required
            />

            {/* Koordinat Bilgisi */}
            {formData.main_latitude && formData.main_longitude && (
              <View style={styles.coordinatesContainer}>
                <Text style={[styles.coordinatesLabel, { color: colors.textMuted }]}>
                  📍 Koordinatlar (Google Maps'ten otomatik)
                </Text>
                <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
                  Enlem: {formData.main_latitude.toFixed(6)} • Boylam: {formData.main_longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Manuel Konum Seçimi */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                veya Manuel Girdi
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* İl */}
            <StateSelect
              label={isTurkish ? 'İl' : 'Eyalet/Bölge'}
              countryId={formData.country_id}
              value={formData.main_state_id}
              onChange={(value) => {
                setFormData({ ...formData, main_state_id: value ? Number(value) : null, main_city_id: null });
              }}
              placeholder={isTurkish ? 'İl seçiniz' : 'Eyalet seçiniz'}
            />

            {/* İlçe */}
            <CitySelect
              label={isTurkish ? 'İlçe' : 'Şehir'}
              stateId={formData.main_state_id}
              countryId={formData.country_id}
              value={formData.main_city_id}
              onChange={(value) => setFormData({ ...formData, main_city_id: value ? Number(value) : null })}
              placeholder={isTurkish ? 'İlçe seçiniz' : 'Şehir seçiniz'}
            />
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
                        { color: formData.currency_type === currency.value ? Brand.primary : colors.text },
                      ]}
                    >
                      {currency.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              * Boş bırakılırsa limitsiz kredi
            </Text>
          </Card>

          {/* Müşteri Segmentasyonu - Sadece customer/both/potential için */}
          {(formData.type === 'customer' || formData.type === 'both' || formData.type === 'potential') && (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Müşteri Segmentasyonu</Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Müşteri Segmenti</Text>
                <View style={styles.chipGroup}>
                  {customerSegments.filter(s => s.value !== '').map((segment) => (
                    <TouchableOpacity
                      key={segment.value}
                      style={[
                        styles.chip,
                        formData.customer_segment === segment.value && [
                          styles.chipActive,
                          { backgroundColor: Brand.primary + '15', borderColor: Brand.primary },
                        ],
                      ]}
                      onPress={() => setFormData({ ...formData, customer_segment: segment.value as any || null })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: formData.customer_segment === segment.value ? Brand.primary : colors.text },
                        ]}
                      >
                        {segment.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                label="Kredi Notu (1-10)"
                placeholder="1=Çok Düşük, 10=Mükemmel"
                value={formData.credit_rating?.toString() || ''}
                onChangeText={(value) => {
                  const num = value ? parseInt(value, 10) : null;
                  if (num === null || (num >= 1 && num <= 10)) {
                    setFormData({ ...formData, credit_rating: num });
                  }
                }}
                keyboardType="numeric"
              />

              <Input
                label="Varsayılan Ödeme Vadesi (gün)"
                placeholder="Örn: 30"
                value={formData.default_payment_terms?.toString() || ''}
                onChangeText={(value) => {
                  const num = value ? parseInt(value, 10) : null;
                  setFormData({ ...formData, default_payment_terms: num });
                }}
                keyboardType="numeric"
              />
              <Text style={[styles.noteText, { color: colors.textMuted }]}>
                * Varsayılan fatura vade günü
              </Text>
            </Card>
          )}

          {/* Durum ve Kategori */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum ve Kategori</Text>

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
                        { color: formData.status === status.value ? status.color : colors.text },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Kategori"
              placeholder="Örn: VIP, Kurumsal"
              value={formData.category}
              onChangeText={(value) => setFormData({ ...formData, category: value })}
            />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  efaturaCard: {
    padding: Spacing.md,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  efaturaItem: {
    marginBottom: Spacing.xs,
  },
  efaturaText: {
    ...Typography.bodySM,
    fontWeight: '600',
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
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleColumn: {
    flex: 1,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    ...Typography.bodySM,
    fontWeight: '600',
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
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  coordinatesContainer: {
    padding: Spacing.md,
    backgroundColor: '#f3f4f6',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  coordinatesLabel: {
    ...Typography.bodyXS,
    marginBottom: 4,
  },
  coordinatesText: {
    ...Typography.bodySM,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.bodyXS,
    marginHorizontal: Spacing.md,
    textTransform: 'uppercase',
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
