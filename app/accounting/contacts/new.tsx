import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { Input, Button, Card } from '@/components/ui'
import { GooglePlacesAutocomplete } from '@/components/ui/GooglePlacesAutocomplete'
import { CountrySelect, StateSelect, CitySelect } from '@/components/ui/LocationSelects'
import { TaxOfficeSelect } from '@/components/ui/TaxOfficeSelect'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes
} from '@/constants/dashboard-theme'
import {
  createContact,
  ContactFormData,
  ContactType,
  ContactStatus,
  BusinessType
} from '@/services/endpoints/contacts'
import { PlaceDetails, lookupLocation } from '@/services/endpoints/locations'
import api from '@/services/api'

// Yabanci firma varsayilan vergi numarasi
const FOREIGN_DEFAULT_TAX_NUMBER = '22222222222';
// Turkiye varsayilan ID
const DEFAULT_TURKEY_ID = 228;

// Toggle Button Component
function ToggleButton({
  active,
  onClick,
  children,
  color = 'blue'
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  color?: 'blue' | 'orange'
}) {
  const activeColors = {
    blue: DashboardColors.primary,
    orange: '#FF9800'
  }

  return (
    <TouchableOpacity
      onPress={onClick}
      style={[
        styles.toggleButton,
        {
          backgroundColor: active ? activeColors[color] : DashboardColors.inputBackground,
          borderColor: active ? activeColors[color] : DashboardColors.border
        }
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.toggleButtonText,
          { color: active ? '#FFFFFF' : DashboardColors.text }
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  )
}

export default function NewContactScreen() {
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTurkish, setIsTurkish] = useState(true)
  const [queryingEfatura, setQueryingEfatura] = useState(false)
  const [efaturaInfo, setEfaturaInfo] = useState<{
    unvan?: string
    efatura_kayitli?: boolean
    earsiv_kayitli?: boolean
  } | null>(null)

  // Animasyonlu dekoratif daireler
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  useEffect(() => {
    // Orb 1 - Yukarı aşağı hareket + pulse
    orb1TranslateY.value = withRepeat(
      withTiming(15, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    )
    orb1Scale.value = withRepeat(
      withTiming(1.1, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    )

    // Orb 2 - Sağa sola hareket + pulse
    orb2TranslateX.value = withRepeat(
      withTiming(20, {
        duration: 5000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    )
    orb2Scale.value = withRepeat(
      withTiming(1.15, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    )
  }, [])

  const orb1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: orb1TranslateY.value },
      { scale: orb1Scale.value }
    ]
  }))

  const orb2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2TranslateX.value },
      { scale: orb2Scale.value }
    ]
  }))

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
  const queryEfaturaUser = useCallback(async (taxNumber: string) => {
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
        if (userData.unvan && !formData.name) {
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
    if (formData.tax_number && formData.tax_number.length >= 10 && isTurkish && formData.tax_number !== FOREIGN_DEFAULT_TAX_NUMBER) {
      const timeoutId = setTimeout(() => {
        queryEfaturaUser(formData.tax_number!);
      }, 800);

      return () => clearTimeout(timeoutId);
    } else {
      setEfaturaInfo(null);
    }
  }, [formData.tax_number, isTurkish, queryEfaturaUser]);

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
      Toast.show({
        type: 'error',
        text1: 'Lütfen formu eksiksiz doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    setIsSubmitting(true)
    try {
      const contact = await createContact(formData)

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      Toast.show({
        type: 'success',
        text1: 'Cari başarıyla oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => router.replace(`/accounting/contacts/${contact.id}` as any), 300)
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Cari oluşturulamadı',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
    { value: 'active', label: 'Aktif', color: '#10b981' },
    { value: 'passive', label: 'Pasif', color: DashboardColors.textSecondary },
    { value: 'blacklist', label: 'Kara Liste', color: '#ef4444' }
  ]

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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Dekoratif ışık efektleri - Animasyonlu */}
        <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
        <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.back()
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni Cari</Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.saveButton,
                isSubmitting && styles.saveButtonDisabled
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* CONTENT */}
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
      >
          {/* E-Fatura/E-Arsiv Logo Gosterimi */}
          {efaturaInfo && (efaturaInfo.efatura_kayitli || efaturaInfo.earsiv_kayitli) && (
            <Card style={styles.efaturaCard}>
              {efaturaInfo.efatura_kayitli && (
                <View style={styles.efaturaItem}>
                  <Text style={[styles.efaturaText, { color: '#10b981' }]}>
                    ✓ e-Fatura Kayıtlı
                  </Text>
                </View>
              )}
              {efaturaInfo.earsiv_kayitli && (
                <View style={styles.efaturaItem}>
                  <Text style={[styles.efaturaText, { color: '#10b981' }]}>
                    ✓ e-Arşiv Kayıtlı
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Cari Tipi ve Faaliyet Alanı */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: DashboardColors.text }]}>Cari Tipi ve Faaliyet Alanı</Text>

            {/* Cari Tipi */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: DashboardColors.textSecondary }]}>
                Cari Tipi <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <View style={styles.chipGroup}>
                {contactTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      formData.type === type.value && [
                        styles.chipActive,
                        { backgroundColor: DashboardColors.primary + '15', borderColor: DashboardColors.primary },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, type: type.value })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: formData.type === type.value ? DashboardColors.primary : DashboardColors.text },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.type && <Text style={[styles.errorText, { color: '#ef4444' }]}>{errors.type}</Text>}
            </View>

            {/* Faaliyet Alanı */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: DashboardColors.textSecondary }]}>Faaliyet Alanı</Text>
              <View style={styles.chipGroup}>
                {businessTypes.filter(b => b.value !== '').map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      formData.business_type === type.value && [
                        styles.chipActive,
                        { backgroundColor: DashboardColors.primary + '15', borderColor: DashboardColors.primary },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, business_type: (type.value as BusinessType) || null })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: formData.business_type === type.value ? DashboardColors.primary : DashboardColors.text },
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
            <Text style={[styles.sectionTitle, { color: DashboardColors.text }]}>Temel Bilgiler</Text>

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
                <Text style={[styles.label, { color: DashboardColors.textSecondary }]}>Yasal Tip</Text>
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
                <Text style={[styles.label, { color: DashboardColors.textSecondary }]}>Konum</Text>
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
                <Text style={[styles.noteText, { color: '#f59e0b' }]}>
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
            <Text style={[styles.sectionTitle, { color: DashboardColors.text }]}>Adres Bilgileri</Text>

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
                <Text style={[styles.coordinatesLabel, { color: DashboardColors.textSecondary }]}>
                  📍 Koordinatlar (Google Maps&apos;ten otomatik)
                </Text>
                <Text style={[styles.coordinatesText, { color: DashboardColors.textSecondary }]}>
                  Enlem: {formData.main_latitude.toFixed(6)} • Boylam: {formData.main_longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Manuel Konum Seçimi */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: DashboardColors.border }]} />
              <Text style={[styles.dividerText, { color: DashboardColors.textMuted }]}>
                veya Manuel Girdi
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: DashboardColors.border }]} />
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
            <Text style={[styles.sectionTitle, { color: DashboardColors.text }]}>Finansal Ayarlar</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: DashboardColors.textSecondary }]}>
                Para Birimi <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <View style={styles.chipGroup}>
                {currencyTypes.map((currency) => (
                  <TouchableOpacity
                    key={currency.value}
                    style={[
                      styles.chip,
                      formData.currency_type === currency.value && [
                        styles.chipActive,
                        { backgroundColor: DashboardColors.primary + '15', borderColor: DashboardColors.primary },
                      ],
                    ]}
                    onPress={() => setFormData({ ...formData, currency_type: currency.value })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: formData.currency_type === currency.value ? DashboardColors.primary : DashboardColors.text },
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
            <Text style={[styles.noteText, { color: DashboardColors.textMuted }]}>
              * Boş bırakılırsa limitsiz kredi
            </Text>
          </Card>

          {/* Müşteri Segmentasyonu - Sadece customer/both/potential için */}
          {(formData.type === 'customer' || formData.type === 'both' || formData.type === 'potential') && (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: DashboardColors.text }]}>Müşteri Segmentasyonu</Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: DashboardColors.textSecondary }]}>Müşteri Segmenti</Text>
                <View style={styles.chipGroup}>
                  {customerSegments.filter(s => s.value !== '').map((segment) => (
                    <TouchableOpacity
                      key={segment.value}
                      style={[
                        styles.chip,
                        formData.customer_segment === segment.value && [
                          styles.chipActive,
                          { backgroundColor: DashboardColors.primary + '15', borderColor: DashboardColors.primary },
                        ],
                      ]}
                      onPress={() => setFormData({ ...formData, customer_segment: segment.value as any || null })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: formData.customer_segment === segment.value ? DashboardColors.primary : DashboardColors.text },
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
              <Text style={[styles.noteText, { color: DashboardColors.textMuted }]}>
                * Varsayılan fatura vade günü
              </Text>
            </Card>
          )}

          {/* Durum ve Kategori */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: DashboardColors.text }]}>Durum ve Kategori</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: DashboardColors.textSecondary }]}>
                Durum <Text style={{ color: '#ef4444' }}>*</Text>
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
                        { color: formData.status === status.value ? status.color : DashboardColors.text },
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
        </KeyboardAwareScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  headerContainer: {
    position: 'relative',
    paddingBottom: 24,
    overflow: 'hidden'
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.5
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: DashboardSpacing.lg,
    paddingTop:0,
    gap: DashboardSpacing.md,
    paddingBottom: DashboardSpacing['4xl']
  },
  efaturaCard: {
    padding: DashboardSpacing.md,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  efaturaItem: {
    marginBottom: DashboardSpacing.xs
  },
  efaturaText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  section: {
    padding: DashboardSpacing.lg
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    marginBottom: DashboardSpacing.lg
  },
  formGroup: {
    marginBottom: DashboardSpacing.lg
  },
  label: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    marginBottom: DashboardSpacing.sm
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm
  },
  chip: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    borderWidth: 1,
    borderColor: DashboardColors.border
  },
  chipActive: {
    borderWidth: 2
  },
  chipText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500'
  },
  toggleRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.lg
  },
  toggleColumn: {
    flex: 1
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: DashboardSpacing.xs
  },
  toggleButton: {
    flex: 1,
    paddingVertical: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  statusButtons: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  statusButton: {
    flex: 1,
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.md,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    alignItems: 'center'
  },
  statusButtonActive: {
    borderWidth: 2
  },
  statusButtonText: {
    fontSize: DashboardFontSizes.md,
    fontWeight: '600'
  },
  noteText: {
    fontSize: DashboardFontSizes.xs,
    fontStyle: 'italic',
    marginTop: DashboardSpacing.xs
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    marginTop: DashboardSpacing.xs
  },
  coordinatesContainer: {
    padding: DashboardSpacing.md,
    backgroundColor: '#f3f4f6',
    borderRadius: DashboardBorderRadius.md,
    marginBottom: DashboardSpacing.md
  },
  coordinatesLabel: {
    fontSize: DashboardFontSizes.xs,
    marginBottom: 4
  },
  coordinatesText: {
    fontSize: DashboardFontSizes.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DashboardSpacing.lg
  },
  dividerLine: {
    flex: 1,
    height: 1
  },
  dividerText: {
    fontSize: DashboardFontSizes.xs,
    marginHorizontal: DashboardSpacing.md,
    textTransform: 'uppercase'
  },
  submitButton: {
    marginTop: DashboardSpacing.lg
  }
})
