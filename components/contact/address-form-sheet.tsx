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
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  ContactAddress,
  AddressFormData,
  createContactAddress,
  updateContactAddress,
} from '@/services/endpoints/contacts';

export interface AddressFormSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface AddressFormSheetProps {
  contactId: number;
  address?: ContactAddress | null;
  onSuccess: () => void;
}

type AddressType = 'billing' | 'shipping' | 'both';

const ADDRESS_TYPES: { value: AddressType; label: string }[] = [
  { value: 'billing', label: 'Fatura Adresi' },
  { value: 'shipping', label: 'Sevkiyat Adresi' },
  { value: 'both', label: 'Fatura & Sevkiyat' },
];

const AddressFormSheet = forwardRef<AddressFormSheetRef, AddressFormSheetProps>(
  ({ contactId, address, onSuccess }, ref) => {
    const colors = Colors.light;
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);

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

    // Expose present/dismiss methods to parent
    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    // Snap points - tek sabit yükseklik (sürüklenmeyi önler)
    const snapPoints = useMemo(() => (isSuccess ? ['30%'] : ['85%']), [isSuccess]);
    const initialIndex = useMemo(() => 0, []);

    // iOS-like spring animation
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 80,
      overshootClamping: true,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
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
      setIsSuccess(false);
    }, [address]);

    const handleDismiss = useCallback(() => {
      // Reset state after modal close animation
      setTimeout(() => {
        setIsSuccess(false);
        setErrors({});
      }, 200);
    }, []);

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

    const renderHeader = useCallback(() => (
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
    ), [address, isSuccess, colors]);

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

          {/* Adres Satırı 1 */}
          <View style={styles.inputContainer}>
            <Input
              label="Adres *"
              placeholder="Sokak, mahalle, bina no"
              value={formData.address_line_1}
              onChangeText={(value) => handleChange('address_line_1', value)}
              error={errors.address_line_1}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Adres Satırı 2 */}
          <View style={styles.inputContainer}>
            <Input
              label="Adres (devam)"
              placeholder="Kat, daire, ek bilgi"
              value={formData.address_line_2}
              onChangeText={(value) => handleChange('address_line_2', value)}
            />
          </View>

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
                        formData.address_type === type.value
                          ? Brand.primary
                          : colors.card,
                      borderColor:
                        formData.address_type === type.value
                          ? Brand.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => handleChange('address_type', type.value)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      {
                        color:
                          formData.address_type === type.value
                            ? '#FFFFFF'
                            : colors.textSecondary,
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
            style={styles.checkboxRow}
            onPress={() => handleChange('is_default', !formData.is_default)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: formData.is_default
                    ? Brand.primary
                    : 'transparent',
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
                  backgroundColor: formData.is_active
                    ? Brand.primary
                    : 'transparent',
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
                {loading
                  ? 'Kaydediliyor...'
                  : address
                  ? 'Güncelle'
                  : 'Ekle'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    );

    const renderSuccessContent = () => (
      <View style={styles.successContainer}>
        <View
          style={[styles.successIcon, { backgroundColor: colors.successLight }]}
        >
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
  field: {
    marginBottom: Spacing.md,
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
    paddingVertical: Spacing.sm,
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
  submitButton: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
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
