/**
 * Yeni Banka Hesabı Ekranı
 *
 * Modern tasarım - CLAUDE.md ilkelerine uygun
 * Referans: cash-register/new.tsx
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import { createBank, BankFormData, CurrencyType } from '@/services/endpoints/banks'
import { getErrorMessage, getValidationErrors } from '@/services/api'

// Para birimi seçenekleri (CLAUDE.md'deki desteklenen döviz kodları)
const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP' },
  { label: 'Avustralya Doları (AUD)', value: 'AUD' },
  { label: 'Danimarka Kronu (DKK)', value: 'DKK' },
  { label: 'İsviçre Frangı (CHF)', value: 'CHF' },
  { label: 'İsveç Kronu (SEK)', value: 'SEK' },
  { label: 'Kanada Doları (CAD)', value: 'CAD' },
  { label: 'Kuveyt Dinarı (KWD)', value: 'KWD' },
  { label: 'Norveç Kronu (NOK)', value: 'NOK' },
  { label: 'Suudi Arabistan Riyali (SAR)', value: 'SAR' },
  { label: 'Japon Yeni (JPY)', value: 'JPY' },
  { label: 'Bulgar Levası (BGN)', value: 'BGN' },
  { label: 'Rumen Leyi (RON)', value: 'RON' },
  { label: 'Rus Rublesi (RUB)', value: 'RUB' },
  { label: 'Çin Yuanı (CNY)', value: 'CNY' },
  { label: 'Pakistan Rupisi (PKR)', value: 'PKR' },
  { label: 'Katar Riyali (QAR)', value: 'QAR' },
  { label: 'Güney Kore Wonu (KRW)', value: 'KRW' },
  { label: 'Azerbaycan Manatı (AZN)', value: 'AZN' },
  { label: 'BAE Dirhemi (AED)', value: 'AED' }
]

export default function NewBankAccountScreen() {
  const insets = useSafeAreaInsets()

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

  // Form state - backend validation kurallarına uygun
  const [formData, setFormData] = useState<BankFormData>({
    name: '',
    bank_code: '',
    branch: '',
    branch_code: '',
    account_number: '',
    iban: '',
    currency_type: 'TRY',
    opening_balance: 0,
    description: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof BankFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Bu alan için hatayı temizle
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Backend validation kurallarına uygun doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Zorunlu alanlar
    if (!formData.name?.trim()) {
      newErrors.name = 'Banka adı zorunludur.'
    }
    if (!formData.branch?.trim()) {
      newErrors.branch = 'Şube adı zorunludur.'
    }
    if (!formData.branch_code?.trim()) {
      newErrors.branch_code = 'Şube kodu zorunludur.'
    }
    if (!formData.account_number?.trim()) {
      newErrors.account_number = 'Hesap numarası zorunludur.'
    }
    if (!formData.iban?.trim()) {
      newErrors.iban = 'IBAN zorunludur.'
    }
    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur.'
    }

    // Uzunluk doğrulamaları
    if (formData.bank_code && formData.bank_code.length > 10) {
      newErrors.bank_code = 'Banka kodu en fazla 10 karakter olabilir.'
    }
    if (formData.branch && formData.branch.length > 255) {
      newErrors.branch = 'Şube adı en fazla 255 karakter olabilir.'
    }
    if (formData.branch_code && formData.branch_code.length > 10) {
      newErrors.branch_code = 'Şube kodu en fazla 10 karakter olabilir.'
    }
    if (formData.account_number && formData.account_number.length > 50) {
      newErrors.account_number = 'Hesap numarası en fazla 50 karakter olabilir.'
    }
    if (formData.iban && formData.iban.length > 34) {
      newErrors.iban = 'IBAN en fazla 34 karakter olabilir.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Geri butonu
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  // Form gönderimi
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen zorunlu alanları doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createBank(formData)

      Toast.show({
        type: 'success',
        text1: 'Banka hesabı başarıyla oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
      const validationErrors = getValidationErrors(error)
      if (validationErrors) {
        // Laravel hatalarını düz objeye çevir
        const flatErrors: Record<string, string> = {}
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0]
          }
        })
        setErrors(flatErrors)
      } else {
        Toast.show({
          type: 'error',
          text1: getErrorMessage(error),
          position: 'top',
          visibilityTime: 1500
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Başlık */}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni Banka Hesabı</Text>
            </View>

            {/* Sağ: Kaydet Butonu */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
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
        {/* Temel Bilgiler Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="business-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Banka Adı *"
              placeholder="Örn: Ziraat Bankası"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
              maxLength={255}
            />

            <Input
              label="Banka Kodu"
              placeholder="Opsiyonel"
              value={formData.bank_code}
              onChangeText={(text) => handleInputChange('bank_code', text)}
              error={errors.bank_code}
              maxLength={10}
            />

            <Input
              label="Şube Adı *"
              placeholder="Örn: Kadıköy Şubesi"
              value={formData.branch}
              onChangeText={(text) => handleInputChange('branch', text)}
              error={errors.branch}
              maxLength={255}
            />

            <Input
              label="Şube Kodu *"
              placeholder="Örn: 1234"
              value={formData.branch_code}
              onChangeText={(text) => handleInputChange('branch_code', text)}
              error={errors.branch_code}
              maxLength={10}
            />
          </View>
        </View>

        {/* Hesap Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="card-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Hesap Numarası *"
              placeholder="Örn: 12345678"
              value={formData.account_number}
              onChangeText={(text) => handleInputChange('account_number', text)}
              error={errors.account_number}
              keyboardType="numeric"
              maxLength={50}
            />

            <Input
              label="IBAN *"
              placeholder="Örn: TR330006100519786457841326"
              value={formData.iban}
              onChangeText={(text) => handleInputChange('iban', text.toUpperCase())}
              error={errors.iban}
              autoCapitalize="characters"
              maxLength={34}
            />

            <SelectInput
              label="Para Birimi *"
              options={CURRENCY_OPTIONS}
              selectedValue={formData.currency_type}
              onValueChange={(value) => handleInputChange('currency_type', value as CurrencyType)}
              error={errors.currency_type}
            />

            <Input
              label="Açılış Bakiyesi"
              placeholder="0.00"
              value={formData.opening_balance ? String(formData.opening_balance) : ''}
              onChangeText={(text) => {
                const numValue = parseFloat(text) || 0
                handleInputChange('opening_balance', numValue)
              }}
              error={errors.opening_balance}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Diğer Bilgiler Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Diğer Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Açıklama"
              placeholder="Opsiyonel"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              error={errors.description}
              multiline
              numberOfLines={3}
            />

            {/* Aktif/Pasif Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleInputChange('is_active', !formData.is_active)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Aktif Hesap</Text>
                <Text style={styles.toggleDescription}>Bu hesap kullanıma açık olacak</Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                formData.is_active && styles.toggleSwitchActive
              ]}>
                <View style={[
                  styles.toggleKnob,
                  formData.is_active && styles.toggleKnobActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: DashboardSpacing.lg
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
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
    overflow: 'hidden'
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg
  },
  toggleContent: {
    flex: 1,
    marginRight: DashboardSpacing.md
  },
  toggleLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  toggleDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: DashboardColors.borderLight,
    padding: 2,
    justifyContent: 'center'
  },
  toggleSwitchActive: {
    backgroundColor: DashboardColors.primary
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff'
  },
  toggleKnobActive: {
    alignSelf: 'flex-end'
  }
})
