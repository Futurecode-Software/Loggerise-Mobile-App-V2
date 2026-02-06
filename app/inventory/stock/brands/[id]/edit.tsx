/**
 * Marka Duzenleme Sayfasi
 *
 * Marka duzenleme ekrani.
 * CLAUDE.md tasarim ilkelerine uyumlu.
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
import { FormHeader } from '@/components/navigation/FormHeader'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import {
  getProductBrand,
  updateProductBrand,
  BrandFormData
} from '@/services/endpoints/products'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function BrandEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // Form state
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Marka verilerini yukle
  useEffect(() => {
    const loadBrand = async () => {
      if (!id) return

      try {
        const data = await getProductBrand(parseInt(id, 10))

        setFormData({
          name: data.name || '',
          description: data.description || '',
          is_active: data.is_active !== false
        })
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Marka bilgileri yuklenemedi',
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

    loadBrand()
  }, [id])

  // Input degisiklik handler'i
  const handleInputChange = useCallback((field: keyof BrandFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Bu alan icin hatayi temizle
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Dogrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Marka adi zorunludur.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Geri butonu
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  // Form gonderimi
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lutfen zorunlu alanlari doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    if (!id) return

    setIsSubmitting(true)
    try {
      await updateProductBrand(parseInt(id, 10), formData)

      Toast.show({
        type: 'success',
        text1: 'Marka basariyla guncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      router.back()
    } catch (error: any) {
      const validationErrors = getValidationErrors(error)
      if (validationErrors) {
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
          title="Marka Duzenle"
          onBackPress={handleBack}
          onSavePress={handleSubmit}
          isSaving={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Marka bilgileri yukleniyor...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FormHeader
        title="Marka Duzenle"
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
        {/* Marka Bilgileri Bolumu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="pricetag-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Marka Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Marka Adi *"
              placeholder="Orn: Apple"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
            />

            <Input
              label="Açıklama"
              placeholder="Opsiyonel"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              error={errors.description}
              multiline
              numberOfLines={3}
            />

            <ToggleSwitch
              label="Aktif Marka"
              description="Bu marka kullanima acik olacak"
              value={formData.is_active}
              onValueChange={(value) => handleInputChange('is_active', value)}
            />
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
  }
})
