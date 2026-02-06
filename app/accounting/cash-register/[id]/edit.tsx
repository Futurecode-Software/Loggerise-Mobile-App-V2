/**
 * Kasa Düzenleme Ekranı
 *
 * Modern tasarım - CLAUDE.md ilkelerine uygun
 * FormHeader component kullanır
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
import { FormHeader } from '@/components/navigation/FormHeader'
import { CURRENCY_OPTIONS } from '@/constants/currencies'
import type { CurrencyCode } from '@/constants/currencies'
import {
  getCashRegister,
  updateCashRegister,
  CashRegisterFormData
} from '@/services/endpoints/cash-registers'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function CashRegisterEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // Form state - backend validation kurallarına uygun
  const [formData, setFormData] = useState<CashRegisterFormData>({
    code: '',
    name: '',
    location: '',
    currency_type: 'TRY',
    opening_balance: 0,
    description: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Kasa verilerini yükle
  useEffect(() => {
    const loadCashRegister = async () => {
      if (!id) {
        Toast.show({
          type: 'error',
          text1: 'Geçersiz kasa ID',
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => {
          router.back()
        }, 1500)
        return
      }

      const cashRegisterId = parseInt(id, 10)
      if (isNaN(cashRegisterId) || cashRegisterId <= 0) {
        Toast.show({
          type: 'error',
          text1: 'Geçersiz kasa ID',
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => {
          router.back()
        }, 1500)
        return
      }

      try {
        const data = await getCashRegister(cashRegisterId)

        setFormData({
          code: data.code || '',
          name: data.name || '',
          location: data.location || '',
          currency_type: data.currency_type || 'TRY',
          opening_balance: data.opening_balance ?? 0,
          description: data.description || '',
          is_active: data.is_active !== false
        })
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Kasa bilgileri yüklenemedi',
          position: 'top',
          visibilityTime: 1500
        })
        setTimeout(() => {
          router.back()
        }, 1500)
      } finally {
        setIsLoading(false)
      }
    }

    loadCashRegister()
  }, [id])

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof CashRegisterFormData, value: string | number | boolean) => {
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
    if (!formData.code?.trim()) {
      newErrors.code = 'Kasa kodu zorunludur.'
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Kasa adı zorunludur.'
    }
    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur.'
    }

    // Uzunluk doğrulamaları
    if (formData.code && formData.code.length > 50) {
      newErrors.code = 'Kasa kodu en fazla 50 karakter olabilir.'
    }
    if (formData.name && formData.name.length > 255) {
      newErrors.name = 'Kasa adı en fazla 255 karakter olabilir.'
    }
    if (formData.location && formData.location.length > 255) {
      newErrors.location = 'Konum en fazla 255 karakter olabilir.'
    }

    // Bakiye kontrolü
    if (formData.opening_balance !== undefined && formData.opening_balance < 0) {
      newErrors.opening_balance = 'Bakiye negatif olamaz.'
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

    if (!id) return

    setIsSubmitting(true)
    try {
      await updateCashRegister(parseInt(id, 10), formData)

      Toast.show({
        type: 'success',
        text1: 'Kasa başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: unknown) {
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
  }, [id, formData, validateForm])

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <FormHeader
          title="Kasa Düzenle"
          onBackPress={handleBack}
          onSavePress={() => {}}
          saveDisabled
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Kasa bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Kasa Düzenle"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />

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
              <Ionicons name="wallet-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Kasa Kodu *"
              placeholder="Örn: KSA-001"
              value={formData.code}
              onChangeText={(text) => handleInputChange('code', text)}
              error={errors.code}
              maxLength={50}
            />

            <Input
              label="Kasa Adı *"
              placeholder="Örn: Ana Kasa"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
              maxLength={255}
            />

            <Input
              label="Konum"
              placeholder="Örn: Merkez Ofis"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              error={errors.location}
              maxLength={255}
            />

            <SelectInput
              label="Para Birimi *"
              options={CURRENCY_OPTIONS}
              selectedValue={formData.currency_type}
              onValueChange={(value) => handleInputChange('currency_type', value as CurrencyCode)}
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
                <Text style={styles.toggleLabel}>Aktif Kasa</Text>
                <Text style={styles.toggleDescription}>Bu kasa kullanıma açık olacak</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.md
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },
  content: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
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
