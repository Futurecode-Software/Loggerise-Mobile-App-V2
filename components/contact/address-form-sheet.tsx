import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MapPin, Check, CheckCircle, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { Input } from '@/components/ui';
import { GooglePlacesAutocomplete } from '@/components/ui/GooglePlacesAutocomplete';
import { CountrySelect, StateSelect, CitySelect } from '@/components/ui/LocationSelects';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  ContactAddress,
  AddressFormData,
  createContactAddress,
  updateContactAddress,
} from '@/services/endpoints/contacts';
import { PlaceDetails, lookupLocation } from '@/services/endpoints/locations';

export interface AddressFormSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface AddressFormSheetProps {
  contactId: number;
  address?: ContactAddress | null;
  onSuccess: () => void;
}

export const AddressFormSheet = forwardRef<AddressFormSheetRef, AddressFormSheetProps>(
  ({ contactId, address, onSuccess }, ref) => {
    const colors = Colors.light;
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState<AddressFormData>({
      title: '',
      address: '',
      country_id: undefined,
      state_id: undefined,
      city_id: undefined,
      postal_code: '',
      phone: '',
      fax: '',
      email: '',
      latitude: null,
      longitude: null,
      place_id: null,
      formatted_address: null,
      is_main: false,
      is_billing: false,
      is_shipping: false,
      is_default: false,
      is_active: true,
    });

    // Expose present/dismiss methods to parent
    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    // Snap points - tek sabit yükseklik (sürüklenmeyi önler)
    const snapPoints = useMemo(() => (isSuccess ? ['30%'] : ['90%']), [isSuccess]);
    const initialIndex = useMemo(() => 0, []);

    // iOS-like spring animation
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 80,
      overshootClamping: true,
      stiffness: 500,
    });

    // Backdrop - arka plana tıklayınca kapatır
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    // Form verilerini doldur (düzenleme modunda)
    useEffect(() => {
      if (address) {
        setFormData({
          title: address.title || '',
          address: address.address_line_1 || '',
          country_id: address.country?.id,
          state_id: address.state?.id,
          city_id: address.city?.id,
          postal_code: address.postal_code || '',
          phone: address.phone || '',
          email: address.email || '',
          is_main: false, // Backend'de yok, is_default kullanıyoruz
          is_billing: address.address_type === 'billing' || address.address_type === 'both',
          is_shipping: address.address_type === 'shipping' || address.address_type === 'both',
          is_default: address.is_default,
          is_active: address.is_active,
          // Google Maps fields - mevcut adreste yok ama gönderebiliriz
          latitude: null,
          longitude: null,
          place_id: null,
          formatted_address: null,
        });
      } else {
        // Yeni adres - formu temizle
        setFormData({
          title: '',
          address: '',
          country_id: undefined,
          state_id: undefined,
          city_id: undefined,
          postal_code: '',
          phone: '',
          fax: '',
          email: '',
          latitude: null,
          longitude: null,
          place_id: null,
          formatted_address: null,
          is_main: false,
          is_billing: false,
          is_shipping: false,
          is_default: false,
          is_active: true,
        });
      }
      setErrors({});
      setIsSuccess(false);
    }, [address]);

    const handleDismiss = useCallback(() => {
      // Reset state after modal close animation
      setTimeout(() => {
        setIsSuccess(false);
        setErrors({});
      }, 200);
    }, []);

    const handleChange = (field: keyof AddressFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Hata mesajını temizle
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

    /**
     * Google Places seçildiğinde
     */
    const handlePlaceSelect = async (place: PlaceDetails | null) => {
      if (!place) return;

      const updated = {
        ...formData,
        address: place.formatted_address || place.address,
        formatted_address: place.formatted_address,
        latitude: place.latitude,
        longitude: place.longitude,
        place_id: place.place_id,
        postal_code: place.postal_code || formData.postal_code,
      };

      // Location lookup - Google'dan gelen adres bilgilerini database ID'lerine çevir
      if (place.country_code || place.country || place.state || place.city) {
        try {
          const locationIds = await lookupLocation(place);
          if (locationIds.country_id) updated.country_id = locationIds.country_id;
          if (locationIds.state_id) updated.state_id = locationIds.state_id;
          if (locationIds.city_id) updated.city_id = locationIds.city_id;
        } catch (error) {
          console.error('Location lookup error:', error);
        }
      }

      setFormData(updated);
    };

    const validate = (): boolean => {
      const newErrors: Record<string, string> = {};

      if (!formData.title.trim()) {
        newErrors.title = 'Adres başlığı zorunludur';
      }

      if (!formData.address.trim()) {
        newErrors.address = 'Adres zorunludur';
      }

      if (!formData.country_id) {
        newErrors.country_id = 'Ülke seçimi zorunludur';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
      if (!validate()) return;

      setLoading(true);
      try {
        // Backend'e gönderilecek data hazırla
        const payload = {
          ...formData,
          // Backend validation'a uygun format
          country_id: formData.country_id,
          state_id: formData.state_id || undefined,
          city_id: formData.city_id || undefined,
        };

        if (address) {
          // Güncelle
          await updateContactAddress(contactId, address.id, payload);
        } else {
          // Yeni oluştur
          await createContactAddress(contactId, payload);
        }
        setIsSuccess(true);
        onSuccess();
        // Auto close after 1.5 seconds
        setTimeout(() => {
          bottomSheetRef.current?.dismiss();
        }, 1500);
      } catch (error) {
        setErrors({
          submit: error instanceof Error ? error.message : 'Bir hata oluştu',
        });
      } finally {
        setLoading(false);
      }
    };

    const renderHeader = useCallback(
      () => (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isSuccess ? 'İşlem Başarılı!' : address ? 'Adresi Düzenle' : 'Yeni Adres'}
            </Text>
            {!isSuccess && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {address ? 'Adres bilgilerini güncelleyin' : 'Yeni adres bilgilerini girin'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.dismiss()}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ),
      [address, isSuccess, colors]
    );

    const renderFormContent = () => (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Genel Hata */}
          {errors.submit && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {errors.submit}
            </Text>
          )}

          {/* Adres Başlığı */}
          <View style={styles.inputContainer}>
            <Input
              label="Adres Başlığı *"
              placeholder="Örn: Merkez Ofis, Fabrika, Depo"
              value={formData.title}
              onChangeText={(value) => handleChange('title', value)}
              error={errors.title}
              leftIcon={<MapPin size={18} color={colors.icon} />}
            />
          </View>

          {/* Google Places Autocomplete */}
          <GooglePlacesAutocomplete
            label="Adres Ara (Google Maps)"
            placeholder="Adres aramak için yazmaya başlayın..."
            value={formData.formatted_address || formData.address}
            onChange={(value) => handleChange('address', value)}
            onPlaceSelect={handlePlaceSelect}
            error={errors.address}
          />

          {/* Açık Adres */}
          <View style={styles.inputContainer}>
            <Input
              label="Açık Adres *"
              placeholder="Cadde, sokak, bina no, daire no"
              value={formData.address}
              onChangeText={(value) => handleChange('address', value)}
              error={errors.address}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Koordinat Bilgisi (readonly) */}
          {formData.latitude && formData.longitude && (
            <View style={styles.coordinatesContainer}>
              <Text style={[styles.coordinatesLabel, { color: colors.textMuted }]}>
                📍 Koordinatlar (Google Maps&apos;ten otomatik)
              </Text>
              <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
                Enlem: {formData.latitude.toFixed(6)} • Boylam: {formData.longitude.toFixed(6)}
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

          {/* Ülke */}
          <CountrySelect
            label="Ülke *"
            value={formData.country_id}
            onChange={(value) =>
              handleChange('country_id', value ? Number(value) : undefined)
            }
            error={errors.country_id}
            placeholder="Ülke seçiniz"
          />

          {/* İl */}
          <StateSelect
            label="İl *"
            countryId={formData.country_id}
            value={formData.state_id}
            onChange={(value) =>
              handleChange('state_id', value ? Number(value) : undefined)
            }
            error={errors.state_id}
            placeholder="İl seçiniz"
          />

          {/* İlçe */}
          <CitySelect
            label="İlçe *"
            stateId={formData.state_id}
            countryId={formData.country_id}
            value={formData.city_id}
            onChange={(value) =>
              handleChange('city_id', value ? Number(value) : undefined)
            }
            error={errors.city_id}
            placeholder="İlçe seçiniz"
          />

          {/* Posta Kodu */}
          <View style={styles.inputContainer}>
            <Input
              label="Posta Kodu"
              placeholder="34000"
              value={formData.postal_code}
              onChangeText={(value) => handleChange('postal_code', value)}
              keyboardType="numeric"
            />
          </View>

          {/* Telefon */}
          <View style={styles.inputContainer}>
            <Input
              label="Telefon"
              placeholder="+90 212 000 00 00"
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Fax */}
          <View style={styles.inputContainer}>
            <Input
              label="Fax"
              placeholder="+90 212 000 00 01"
              value={formData.fax}
              onChangeText={(value) => handleChange('fax', value)}
              keyboardType="phone-pad"
            />
          </View>

          {/* E-posta */}
          <View style={styles.inputContainer}>
            <Input
              label="E-posta"
              placeholder="adres@firma.com"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Adres Türü */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Adres Türü</Text>
            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleChange('is_main', !formData.is_main)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: formData.is_main ? Brand.primary : 'transparent',
                      borderColor: formData.is_main ? Brand.primary : colors.border,
                    },
                  ]}
                >
                  {formData.is_main && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  Ana Adres
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleChange('is_billing', !formData.is_billing)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: formData.is_billing ? Brand.primary : 'transparent',
                      borderColor: formData.is_billing ? Brand.primary : colors.border,
                    },
                  ]}
                >
                  {formData.is_billing && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  Fatura Adresi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleChange('is_shipping', !formData.is_shipping)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: formData.is_shipping ? Brand.primary : 'transparent',
                      borderColor: formData.is_shipping ? Brand.primary : colors.border,
                    },
                  ]}
                >
                  {formData.is_shipping && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  Teslimat Adresi
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Varsayılan Adres */}
          <TouchableOpacity
            style={styles.checkboxRow}
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
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Varsayılan Adres
            </Text>
          </TouchableOpacity>

          {/* Aktif */}
          <TouchableOpacity
            style={styles.checkboxRow}
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
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Aktif
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={[Brand.primary, Brand.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Kaydediliyor...' : address ? 'Güncelle' : 'Ekle'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    );

    const renderSuccessContent = () => (
      <View style={styles.successContainer}>
        <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
          <CheckCircle size={28} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>
          İşlem Başarılı!
        </Text>
        <Text style={[styles.successText, { color: colors.textSecondary }]}>
          {address ? 'Adres güncellendi.' : 'Yeni adres eklendi.'}
        </Text>
      </View>
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={initialIndex}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
        animateOnMount={true}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={handleDismiss}
      >
        {renderHeader()}
        {isSuccess ? renderSuccessContent() : renderFormContent()}
      </BottomSheetModal>
    );
  }
);

AddressFormSheet.displayName = 'AddressFormSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...Typography.headingLG,
    marginBottom: 2,
  },
  subtitle: {
    ...Typography.bodySM,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  errorText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
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
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  checkboxGroup: {
    gap: Spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
  submitButton: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Success State
  successContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: {
    ...Typography.headingMD,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  successText: {
    ...Typography.bodySM,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AddressFormSheet;
