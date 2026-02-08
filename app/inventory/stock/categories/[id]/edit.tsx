/**
 * Kategori Düzenleme Sayfası
 *
 * Mevcut kategoriyi düzenleme ekranı.
 * CLAUDE.md tasarım ilkelerine uygun - animasyonlu header orb'ları.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { SearchableSelectModal, SearchableSelectModalRef } from '@/components/modals/SearchableSelectModal'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import {
  getProductCategory,
  updateProductCategory,
  getProductCategories,
  CategoryFormData,
  ProductCategory
} from '@/services/endpoints/products'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const categoryId = id ? parseInt(id, 10) : null

  // State
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [parentCategories, setParentCategories] = useState<ProductCategory[]>([])
  const [isLoadingParents, setIsLoadingParents] = useState(true)

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: null,
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const parentCategoryModalRef = useRef<SearchableSelectModalRef>(null)

  // Kategori verilerini çek
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!categoryId) {
        setIsLoadingData(false)
        return
      }

      try {
        const data = await getProductCategory(categoryId)
        setFormData({
          name: data.name,
          description: data.description || '',
          parent_id: data.parent_id || null,
          is_active: data.is_active
        })
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: err instanceof Error ? err.message : 'Kategori yüklenemedi',
          position: 'top',
          visibilityTime: 1500
        })
        router.back()
      } finally {
        setIsLoadingData(false)
      }
    }
    fetchCategoryData()
  }, [categoryId])

  // Parent kategorileri çek
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const response = await getProductCategories({ is_active: true, per_page: 100 })
        // Kendisini filtreleme - döngüyü önlemek için
        setParentCategories(response.categories.filter(cat => cat.id !== categoryId))
      } catch (err) {
        if (__DEV__) console.error('Failed to fetch parent categories:', err)
      } finally {
        setIsLoadingParents(false)
      }
    }
    fetchParentCategories()
  }, [categoryId])

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof CategoryFormData, value: any) => {
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

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Kategori adı zorunludur.'
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
    if (!categoryId) return

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
      await updateProductCategory(categoryId, formData)

      Toast.show({
        type: 'success',
        text1: 'Kategori başarıyla güncellendi',
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
  }, [categoryId, formData, validateForm])

  // Parent category options for select
  const parentOptions = parentCategories.map((cat) => ({
    label: cat.name,
    value: String(cat.id)
  }))

  return (
    <View style={styles.container}>
      <FormHeader
        title="Kategori Düzenle"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting || isLoadingData}
      />

      {/* Form Content */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {isLoadingData ? (
          // Loading skeleton
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Skeleton width={36} height={36} borderRadius={12} />
              <Skeleton width={150} height={20} />
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.skeletonInput}>
                <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={48} borderRadius={12} />
              </View>
              <View style={styles.skeletonInput}>
                <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={80} borderRadius={12} />
              </View>
              <View style={styles.skeletonInput}>
                <Skeleton width={90} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={48} borderRadius={12} />
              </View>
            </View>
          </View>
        ) : (
          // Form content
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="folder-outline" size={18} color={DashboardColors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Kategori Bilgileri</Text>
            </View>

            <View style={styles.sectionContent}>
              <Input
                label="Kategori Adı *"
                placeholder="Örn: Elektronik"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                error={errors.name}
                maxLength={255}
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

              {/* Üst Kategori Seçimi */}
              <View style={styles.selectWrapper}>
                <Text style={styles.selectLabel}>Üst Kategori</Text>
                {isLoadingParents ? (
                  <View style={styles.loadingParent}>
                    <ActivityIndicator size="small" color={DashboardColors.primary} />
                    <Text style={styles.loadingText}>Kategoriler yükleniyor...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.selectTrigger, errors.parent_id && styles.selectTriggerError]}
                    onPress={() => parentCategoryModalRef.current?.present()}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectTriggerText, !formData.parent_id && styles.selectTriggerPlaceholder]}>
                      {parentOptions.find(opt => opt.value === String(formData.parent_id))?.label || 'Üst kategori seçin (opsiyonel)'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
                  </TouchableOpacity>
                )}
                {errors.parent_id && <Text style={styles.errorText}>{errors.parent_id}</Text>}
                <Text style={styles.selectHint}>
                  Boş bırakırsanız ana kategori olarak kalır
                </Text>
              </View>

              <ToggleSwitch
                label="Aktif Kategori"
                description="Bu kategori kullanıma açık olacak"
                value={formData.is_active}
                onValueChange={(value) => handleInputChange('is_active', value)}
              />
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>

      <SearchableSelectModal
        ref={parentCategoryModalRef}
        title="Üst Kategori Seçin"
        options={parentOptions}
        selectedValue={formData.parent_id ? String(formData.parent_id) : ''}
        onSelect={(option) => handleInputChange('parent_id', option.value ? Number(option.value) : null)}
        searchPlaceholder="Ara..."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
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
  skeletonInput: {
    marginBottom: DashboardSpacing.md
  },
  selectWrapper: {
    gap: DashboardSpacing.xs
  },
  selectLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    minHeight: 48
  },
  selectTriggerError: {
    borderColor: DashboardColors.danger
  },
  selectTriggerText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  selectTriggerPlaceholder: {
    color: DashboardColors.textMuted
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 4
  },
  selectHint: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.xs
  },
  loadingParent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md
  },
  loadingText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  }
})
