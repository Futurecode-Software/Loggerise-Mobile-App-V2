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
import { User, Check, CheckCircle, X } from 'lucide-react-native';
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
  ContactAuthority,
  AuthorityFormData,
  createContactAuthority,
  updateContactAuthority,
} from '@/services/endpoints/contacts';

export interface AuthorityFormSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface AuthorityFormSheetProps {
  contactId: number;
  authority?: ContactAuthority | null;
  onSuccess: () => void;
}

export const AuthorityFormSheet = forwardRef<
  AuthorityFormSheetRef,
  AuthorityFormSheetProps
>(({ contactId, authority, onSuccess }, ref) => {
  const colors = Colors.light;
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

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
    setIsSuccess(false);
  }, [authority]);

  const handleDismiss = useCallback(() => {
    // Reset state after modal close animation
    setTimeout(() => {
      setIsSuccess(false);
      setErrors({});
    }, 200);
  }, []);

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
          {isSuccess ? 'İşlem Başarılı!' : authority ? 'Yetkiliyi Düzenle' : 'Yeni Yetkili'}
        </Text>
        {!isSuccess && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {authority ? 'Yetkili bilgilerini güncelleyin' : 'Yeni yetkili bilgilerini girin'}
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
  ), [authority, isSuccess, colors]);

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

        {/* Ad Soyad */}
        <View style={styles.inputContainer}>
          <Input
            label="Ad Soyad *"
            placeholder="Örn: Ahmet Yılmaz"
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            error={errors.name}
            leftIcon={<User size={18} color={colors.icon} />}
            autoCapitalize="words"
          />
        </View>

        {/* Unvan */}
        <View style={styles.inputContainer}>
          <Input
            label="Unvan"
            placeholder="Örn: Genel Müdür, Satış Müdürü"
            value={formData.title}
            onChangeText={(value) => handleChange('title', value)}
            autoCapitalize="words"
          />
        </View>

        {/* Departman */}
        <View style={styles.inputContainer}>
          <Input
            label="Departman"
            placeholder="Örn: Satış, Muhasebe, Lojistik"
            value={formData.department}
            onChangeText={(value) => handleChange('department', value)}
            autoCapitalize="words"
          />
        </View>

        {/* E-posta */}
        <View style={styles.inputContainer}>
          <Input
            label="E-posta"
            placeholder="yetkili@firma.com"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Telefon (Sabit) */}
        <View style={styles.inputContainer}>
          <Input
            label="Telefon (Sabit)"
            placeholder="+90 212 000 00 00"
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Cep Telefonu */}
        <View style={styles.inputContainer}>
          <Input
            label="Cep Telefonu"
            placeholder="+90 532 000 00 00"
            value={formData.mobile}
            onChangeText={(value) => handleChange('mobile', value)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Birincil Yetkili */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => handleChange('is_primary', !formData.is_primary)}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: formData.is_primary
                  ? Brand.primary
                  : 'transparent',
                borderColor: formData.is_primary ? Brand.primary : colors.border,
              },
            ]}
          >
            {formData.is_primary && <Check size={14} color="#FFFFFF" />}
          </View>
          <View style={styles.checkboxContent}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Birincil Yetkili
            </Text>
            <Text style={[styles.checkboxHint, { color: colors.textMuted }]}>
              Ana iletişim kişisi olarak işaretlenir
            </Text>
          </View>
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
                : authority
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
        {authority ? 'Yetkili güncellendi.' : 'Yeni yetkili eklendi.'}
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
});

AuthorityFormSheet.displayName = 'AuthorityFormSheet';

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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
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

export default AuthorityFormSheet;
