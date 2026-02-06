/**
 * CRM Müşteri Düzenleme Sayfası
 *
 * CLAUDE.md form sayfası standardına uygun modern tasarım.
 * Referans: app/crm/customers/new.tsx
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getCrmCustomer,
  updateCrmCustomer,
  CrmCustomerFormData,
  CrmCustomerStatus,
} from '@/services/endpoints/crm-customers'
import {
  searchCountries,
  searchStates,
  searchCities,
  searchTaxOffices,
  TURKEY_ID,
  FOREIGN_DEFAULT_TAX_NUMBER,
  LocationOption,
} from '@/services/endpoints/locations'

export default function EditCrmCustomerScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const customerId = parseInt(id, 10)

  // Animasyonlu orb'lar için shared values
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  useEffect(() => {
    orb1TranslateY.value = withRepeat(
      withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb1Scale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb2TranslateX.value = withRepeat(
      withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
    orb2Scale.value = withRepeat(
      withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Location states (kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [countries, setCountries] = useState<LocationOption[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [states, setStates] = useState<LocationOption[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cities, setCities] = useState<LocationOption[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [taxOffices, setTaxOffices] = useState<LocationOption[]>([])

  // Loading states (kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingStates, setLoadingStates] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingCities, setLoadingCities] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch customer data and initial location data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load countries and tax offices in parallel
        const [customerData, countriesData, taxOfficesData] = await Promise.all([
          getCrmCustomer(customerId),
          searchCountries(),
          searchTaxOffices(),
        ]);

        setCountries(countriesData);
        setTaxOffices(taxOfficesData);

        // Determine if customer is domestic (Turkey) or foreign
        const customerIsTurkish =
          !customerData.country_id || customerData.country_id === TURKEY_ID;
        setIsTurkish(customerIsTurkish);

        // Load states for the customer's country
        const countryIdToUse = customerData.country_id || TURKEY_ID;
        const statesData = await searchStates(countryIdToUse);
        setStates(statesData);

        // Load cities if customer has a state
        if (customerData.main_state_id) {
          const citiesData = await searchCities(customerData.main_state_id);
          setCities(citiesData);
        }

        // Pre-populate form with customer data
        setFormData({
          legal_type: customerData.legal_type || 'company',
          name: customerData.name || '',
          short_name: customerData.short_name || '',
          code: customerData.code || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          fax: customerData.fax || '',
          category: customerData.category || '',
          tax_number: customerData.tax_number || '',
          tax_office_id: customerData.tax_office_id,
          status: customerData.status || 'active',
          is_active: customerData.is_active ?? true,
          currency_type: customerData.currency_type || 'TRY',
          country_id: customerData.country_id || TURKEY_ID,
          main_address: customerData.main_address || '',
          main_state_id: customerData.main_state_id,
          main_city_id: customerData.main_city_id,
          risk_limit: customerData.risk_limit,
          notes: customerData.notes || '',
        });
      } catch (err) {
        console.error('Fetch customer error:', err);
        setError(err instanceof Error ? err.message : 'Müşteri bilgileri yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  // Load states when country changes (kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCountryChange = async (countryId: number | undefined) => {
    if (countryId) {
      setFormData((prev) => ({
        ...prev,
        country_id: countryId,
        main_state_id: undefined,
        main_city_id: undefined,
      }))
      setLoadingStates(true)
      try {
        const data = await searchStates(countryId)
        setStates(data)
        setCities([])
      } catch (err) {
        console.error('Failed to load states:', err)
      } finally {
        setLoadingStates(false)
      }
    }
  }

  // Load cities when state changes (kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStateChange = async (stateId: number | undefined) => {
    if (stateId) {
      setFormData((prev) => ({ ...prev, main_state_id: stateId, main_city_id: undefined }))
      setLoadingCities(true)
      try {
        const data = await searchCities(stateId)
        setCities(data)
      } catch (err) {
        console.error('Failed to load cities:', err)
      } finally {
        setLoadingCities(false)
      }
    }
  }

  const handleLocationToggle = async (isDomestic: boolean) => {
    setIsTurkish(isDomestic);

    if (isDomestic) {
      // Domestic: Set Turkey, clear tax number if it was foreign default
      setFormData((prev) => ({
        ...prev,
        country_id: TURKEY_ID,
        tax_number: prev.tax_number === FOREIGN_DEFAULT_TAX_NUMBER ? '' : prev.tax_number,
        main_state_id: undefined,
        main_city_id: undefined,
      }));
      // Load Turkey states
      setLoadingStates(true);
      try {
        const data = await searchStates(TURKEY_ID);
        setStates(data);
        setCities([]);
      } catch (err) {
        console.error('Failed to load states:', err);
      } finally {
        setLoadingStates(false);
      }
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
      setStates([]);
      setCities([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Müşteri adı zorunludur'
    }

    if (!formData.legal_type) {
      newErrors.legal_type = 'Yasal tip zorunludur'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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
      await updateCrmCustomer(customerId, formData)
      Toast.show({
        type: 'success',
        text1: 'CRM müşterisi başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Müşteri güncellenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  // Section Header Component
  const renderSectionHeader = (title: string, icon: keyof typeof Ionicons.glyphMap) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Müşteri Düzenle</Text>
              </View>
              <View style={styles.headerButton} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Müşteri bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Müşteri Düzenle</Text>
              </View>
              <View style={styles.headerButton} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>
        <View style={styles.errorState}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color={DashboardColors.danger} />
          </View>
          <Text style={styles.errorTitle}>Bir hata oluştu</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient and animated orbs */}
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
            {/* Sol: Geri Butonu */}
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Müşteri Düzenle</Text>
            </View>

            {/* Sağ: Kaydet Butonu */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.headerButton, isSubmitting && styles.headerButtonDisabled]}
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

      {/* Form Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {/* Temel Bilgiler */}
        <View style={styles.section}>
          {renderSectionHeader('Temel Bilgiler', 'person-outline')}
          <View style={styles.sectionContent}>
            {/* Legal Type & Location Toggle */}
            <View style={styles.toggleRow}>
              {/* Legal Type */}
              <View style={styles.toggleGroup}>
                <Text style={styles.inputLabel}>
                  Yasal Tip <Text style={{ color: DashboardColors.danger }}>*</Text>
                </Text>
                <View style={styles.chipGroup}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      formData.legal_type === 'company' && styles.chipActive
                    ]}
                    onPress={() => setFormData({ ...formData, legal_type: 'company' })}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.legal_type === 'company' && styles.chipTextActive
                    ]}>
                      Şirket
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      formData.legal_type === 'individual' && styles.chipActive
                    ]}
                    onPress={() => setFormData({ ...formData, legal_type: 'individual' })}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.legal_type === 'individual' && styles.chipTextActive
                    ]}>
                      Bireysel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Toggle */}
              <View style={styles.toggleGroup}>
                <Text style={styles.inputLabel}>Konum</Text>
                <View style={styles.chipGroup}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      isTurkish && styles.chipActiveOrange
                    ]}
                    onPress={() => handleLocationToggle(true)}
                  >
                    <Text style={[
                      styles.chipText,
                      isTurkish && styles.chipTextActive
                    ]}>
                      Yurtiçi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      !isTurkish && styles.chipActiveOrange
                    ]}
                    onPress={() => handleLocationToggle(false)}
                  >
                    <Text style={[
                      styles.chipText,
                      !isTurkish && styles.chipTextActive
                    ]}>
                      Yurtdışı
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Müşteri Adı <Text style={{ color: DashboardColors.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => setFormData({ ...formData, name: value })}
                placeholder="Örn: ABC Lojistik A.Ş."
                placeholderTextColor={DashboardColors.textMuted}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kısa Ad</Text>
              <TextInput
                style={styles.input}
                value={formData.short_name}
                onChangeText={(value) => setFormData({ ...formData, short_name: value })}
                placeholder="Örn: ABC"
                placeholderTextColor={DashboardColors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kod</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.code}
                editable={false}
                placeholder="Otomatik oluşturulmuş"
                placeholderTextColor={DashboardColors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kategori</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(value) => setFormData({ ...formData, category: value })}
                placeholder="Örn: Perakende, Toptan"
                placeholderTextColor={DashboardColors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Vergi ve Konum Bilgileri */}
        <View style={styles.section}>
          {renderSectionHeader('Vergi ve Konum Bilgileri', 'document-text-outline')}
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vergi Numarası</Text>
              <TextInput
                style={styles.input}
                value={formData.tax_number}
                onChangeText={(value) => setFormData({ ...formData, tax_number: value })}
                placeholder="XXXXXXXXXX"
                placeholderTextColor={DashboardColors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ana Adres</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.main_address}
                onChangeText={(value) => setFormData({ ...formData, main_address: value })}
                placeholder="Adres giriniz"
                placeholderTextColor={DashboardColors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* İletişim Bilgileri */}
        <View style={styles.section}>
          {renderSectionHeader('İletişim Bilgileri', 'call-outline')}
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => setFormData({ ...formData, email: value })}
                placeholder="ornek@sirket.com"
                placeholderTextColor={DashboardColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => setFormData({ ...formData, phone: value })}
                placeholder="+90 XXX XXX XX XX"
                placeholderTextColor={DashboardColors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Faks</Text>
              <TextInput
                style={styles.input}
                value={formData.fax}
                onChangeText={(value) => setFormData({ ...formData, fax: value })}
                placeholder="+90 XXX XXX XX XX"
                placeholderTextColor={DashboardColors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Finansal Bilgiler */}
        <View style={styles.section}>
          {renderSectionHeader('Finansal Bilgiler', 'wallet-outline')}
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Para Birimi</Text>
              <View style={styles.chipGroup}>
                {['TRY', 'USD', 'EUR', 'GBP'].map((currency) => (
                  <TouchableOpacity
                    key={currency}
                    style={[
                      styles.chip,
                      formData.currency_type === currency && styles.chipActive
                    ]}
                    onPress={() => setFormData({ ...formData, currency_type: currency })}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.currency_type === currency && styles.chipTextActive
                    ]}>
                      {currency}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Risk Limiti ({formData.currency_type || 'TRY'})</Text>
              <TextInput
                style={styles.input}
                value={formData.risk_limit?.toString()}
                onChangeText={(value) =>
                  setFormData({ ...formData, risk_limit: value ? Number(value) : undefined })
                }
                placeholder="Sınırsız kredi için boş bırakın"
                placeholderTextColor={DashboardColors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notlar</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => setFormData({ ...formData, notes: value })}
                placeholder="Bu müşteri hakkında dahili notlar..."
                placeholderTextColor={DashboardColors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Durum */}
        <View style={styles.section}>
          {renderSectionHeader('Durum', 'flag-outline')}
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Müşteri Durumu</Text>
              <View style={styles.statusButtons}>
                {[
                  { value: 'active', label: 'Aktif', color: DashboardColors.success },
                  { value: 'passive', label: 'Pasif', color: DashboardColors.warning },
                  { value: 'blacklist', label: 'Kara Liste', color: DashboardColors.danger },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusButton,
                      formData.status === status.value && [
                        styles.statusButtonActive,
                        { borderColor: status.color, backgroundColor: status.color + '15' }
                      ]
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, status: status.value as CrmCustomerStatus })
                    }
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: formData.status === status.value ? status.color : DashboardColors.textSecondary }
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>Güncelle</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: DashboardSpacing['2xl'] }} />
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
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70,
    paddingBottom: DashboardSpacing.lg
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerButtonDisabled: {
    opacity: 0.5
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.md
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center'
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
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden',
    ...DashboardShadows.sm
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  sectionContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },
  toggleRow: {
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.md
  },
  toggleGroup: {
    flex: 1
  },
  inputGroup: {
    marginBottom: DashboardSpacing.sm
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
  },
  input: {
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    minHeight: 48
  },
  inputError: {
    borderColor: DashboardColors.danger
  },
  inputDisabled: {
    backgroundColor: DashboardColors.borderLight,
    color: DashboardColors.textMuted
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginTop: DashboardSpacing.xs
  },
  chip: {
    paddingVertical: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  chipActive: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  chipActiveOrange: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B'
  },
  chipText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary
  },
  chipTextActive: {
    color: '#fff'
  },
  statusButtons: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
    flexWrap: 'wrap'
  },
  statusButton: {
    flex: 1,
    minWidth: '30%',
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    alignItems: 'center',
    backgroundColor: DashboardColors.background
  },
  statusButtonActive: {
    borderWidth: 2
  },
  statusButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.md
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff'
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl']
  },
  errorIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorSubtitle: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  },
  retryButton: {
    marginTop: DashboardSpacing.xl,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary
  },
  retryButtonText: {
    color: '#fff',
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  }
})
