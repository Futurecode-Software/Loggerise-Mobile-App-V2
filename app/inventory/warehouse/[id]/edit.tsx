/**
 * Warehouse Edit Screen
 *
 * Depo düzenleme ekranı.
 * Backend MobileUpdateWarehouseRequest validation kurallarına uyumlu.
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import { FormHeader } from '@/components/navigation/FormHeader'
import { FormSection } from '@/components/form/FormSection'
import { Toggle } from '@/components/ui/Toggle'
import {
  DashboardColors,
  DashboardSpacing
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import {
  getWarehouse,
  updateWarehouse,
  WarehouseFormData
} from '@/services/endpoints/warehouses'
import { getErrorMessage, flattenValidationErrors } from '@/services/api'

export default function WarehouseEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // Form state - backend validation kurallarına uygun
  const [formData, setFormData] = useState<WarehouseFormData>({
    code: '',
    name: '',
    address: '',
    postal_code: '',
    phone: '',
    email: '',
    manager: '',
    notes: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Depo verilerini yükle
  useEffect(() => {
    const loadWarehouse = async () => {
      if (!id) return

      try {
        const data = await getWarehouse(parseInt(id, 10))

        setFormData({
          code: data.code || '',
          name: data.name || '',
          address: data.address || '',
          postal_code: data.postal_code || '',
          phone: data.phone || '',
          email: data.email || '',
          manager: data.manager || '',
          notes: data.notes || '',
          is_active: data.is_active !== false
        })
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Depo bilgileri yüklenemedi',
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

    loadWarehouse()
  }, [id])

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof WarehouseFormData, value: any) => {
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
      newErrors.code = 'Depo kodu zorunludur.'
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Depo adı zorunludur.'
    }

    // Email doğrulama
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.'
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
      await updateWarehouse(parseInt(id, 10), formData)

      Toast.show({
        type: 'success',
        text1: 'Depo başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
      const flatErrors = flattenValidationErrors(error)
      if (flatErrors) {
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
          title="Depo Düzenle"
          onBackPress={handleBack}
          onSavePress={() => {}}
          isSaving={false}
          saveDisabled={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Depo bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FormHeader
        title="Depo Düzenle"
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
        <FormSection title="Temel Bilgiler" icon="business-outline">
            <Input
              label="Depo Kodu *"
              placeholder="Örn: DEP001"
              value={formData.code}
              onChangeText={(text) => handleInputChange('code', text.toUpperCase())}
              error={errors.code}
              autoCapitalize="characters"
              maxLength={50}
            />

            <Input
              label="Depo Adı *"
              placeholder="Örn: Merkez Depo"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
              maxLength={255}
            />

            <Input
              label="Adres"
              placeholder="Opsiyonel"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              error={errors.address}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Posta Kodu"
              placeholder="Opsiyonel"
              value={formData.postal_code}
              onChangeText={(text) => handleInputChange('postal_code', text)}
              error={errors.postal_code}
            />
        </FormSection>

        {/* İletişim Bilgileri Bölümü */}
        <FormSection title="İletişim Bilgileri" icon="call-outline">
            <Input
              label="Telefon"
              placeholder="Opsiyonel"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            <Input
              label="E-posta"
              placeholder="Opsiyonel"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Depo Sorumlusu"
              placeholder="Opsiyonel"
              value={formData.manager}
              onChangeText={(text) => handleInputChange('manager', text)}
              error={errors.manager}
            />
        </FormSection>

        {/* Diğer Bilgiler Bölümü */}
        <FormSection title="Diğer Bilgiler" icon="document-text-outline">
          <Input
            label="Notlar"
            placeholder="Opsiyonel"
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            error={errors.notes}
            multiline
            numberOfLines={4}
          />

          <Toggle
            label="Aktif Depo"
            description="Bu depo kullanıma açık olacak"
            value={formData.is_active}
            onValueChange={(value) => handleInputChange('is_active', value)}
          />
        </FormSection>
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
    fontSize: DashboardSpacing.base,
    color: DashboardColors.textSecondary
  },
  content: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl']
  }
})
