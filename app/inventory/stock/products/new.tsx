/**
 * New Product Screen
 *
 * Yeni ürün oluşturma ekranı - CLAUDE.md tasarım ilkeleri ile uyumlu
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
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
import { SearchableSelectModal, SearchableSelectModalRef } from '@/components/modals/SearchableSelectModal'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import {
  createProduct,
  getProductBrands,
  getProductCategories,
  getProductModels,
  ProductFormData,
  ProductBrand,
  ProductCategory,
  ProductModel
} from '@/services/endpoints/products'
import { getErrorMessage, getValidationErrors } from '@/services/api'

// Ürün tipi seçenekleri
const PRODUCT_TYPE_OPTIONS = [
  { label: 'Mal', value: 'goods' },
  { label: 'Hizmet', value: 'service' }
]

// Birim seçenekleri
const UNIT_OPTIONS = [
  { label: 'Adet (NIU)', value: 'NIU' },
  { label: 'Kilogram (KGM)', value: 'KGM' },
  { label: 'Ton (TNE)', value: 'TNE' },
  { label: 'Litre (LTR)', value: 'LTR' },
  { label: 'Metre (MTR)', value: 'MTR' },
  { label: 'Metrekare (MTK)', value: 'MTK' },
  { label: 'Metreküp (MTQ)', value: 'MTQ' },
  { label: 'Kutu (BX)', value: 'BX' },
  { label: 'Takım (SET)', value: 'SET' },
  { label: 'Gün (DAY)', value: 'DAY' },
  { label: 'Ay (MON)', value: 'MON' },
  { label: 'Yıl (ANN)', value: 'ANN' },
  { label: 'Saat (HUR)', value: 'HUR' }
]

export default function NewProductScreen() {

  // Options state
  const [brands, setBrands] = useState<ProductBrand[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [models, setModels] = useState<ProductModel[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    code: '',
    description: '',
    product_type: 'goods',
    unit: 'NIU',
    product_brand_id: undefined,
    product_model_id: undefined,
    product_category_id: undefined,
    purchase_price: undefined,
    sale_price: undefined,
    vat_rate: undefined,
    min_stock_level: undefined,
    max_stock_level: undefined,
    barcode: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal refs
  const productTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const unitModalRef = useRef<SearchableSelectModalRef>(null)
  const brandModalRef = useRef<SearchableSelectModalRef>(null)
  const categoryModalRef = useRef<SearchableSelectModalRef>(null)
  const modelModalRef = useRef<SearchableSelectModalRef>(null)

  // Seçenekleri yükle
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true)
        const [brandsRes, categoriesRes, modelsRes] = await Promise.all([
          getProductBrands({ is_active: true, per_page: 100 }),
          getProductCategories({ is_active: true, per_page: 100 }),
          getProductModels({ is_active: true, per_page: 100 })
        ])
        setBrands(brandsRes.brands)
        setCategories(categoriesRes.categories)
        setModels(modelsRes.models)
      } catch (err) {
        console.error('Failed to fetch options:', err)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [])

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

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
      newErrors.name = 'Ürün adı zorunludur.'
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
      await createProduct(formData)

      Toast.show({
        type: 'success',
        text1: 'Ürün başarıyla oluşturuldu',
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
  }, [formData, validateForm])

  // Select options
  const brandOptions = brands.map((brand) => ({
    label: brand.name,
    value: String(brand.id)
  }))

  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: String(cat.id)
  }))

  const modelOptions = models.map((model) => ({
    label: model.name,
    value: String(model.id)
  }))

  return (
    <View style={styles.container}>
      <FormHeader
        title="Yeni Ürün"
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
        {/* Temel Bilgiler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cube-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Ürün Adı *"
              placeholder="Örn: iPhone 15 Pro"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              error={errors.name}
            />

            <Input
              label="Ürün Kodu"
              placeholder="Opsiyonel"
              value={formData.code}
              onChangeText={(text) => handleInputChange('code', text)}
              error={errors.code}
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

            <View>
              <Text style={styles.inputLabel}>Ürün Tipi *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.product_type && styles.selectTriggerError]}
                onPress={() => productTypeModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectTriggerText, !formData.product_type && styles.selectTriggerPlaceholder]}>
                  {PRODUCT_TYPE_OPTIONS.find(opt => opt.value === formData.product_type)?.label || 'Ürün tipi seçin'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.product_type && <Text style={styles.errorText}>{errors.product_type}</Text>}
            </View>

            <View>
              <Text style={styles.inputLabel}>Birim *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.unit && styles.selectTriggerError]}
                onPress={() => unitModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectTriggerText, !formData.unit && styles.selectTriggerPlaceholder]}>
                  {UNIT_OPTIONS.find(opt => opt.value === formData.unit)?.label || 'Birim seçin'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
            </View>
          </View>
        </View>

        {/* Kategorilendirme */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="folder-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Kategorilendirme</Text>
          </View>

          <View style={styles.sectionContent}>
            {isLoadingOptions ? (
              <View style={styles.loadingOptionsContainer}>
                <ActivityIndicator size="small" color={DashboardColors.primary} />
                <Text style={styles.loadingOptionsText}>Seçenekler yükleniyor...</Text>
              </View>
            ) : (
              <>
                <View>
                  <Text style={styles.inputLabel}>Marka</Text>
                  <TouchableOpacity
                    style={styles.selectTrigger}
                    onPress={() => brandModalRef.current?.present()}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectTriggerText, !formData.product_brand_id && styles.selectTriggerPlaceholder]}>
                      {brandOptions.find(opt => opt.value === String(formData.product_brand_id))?.label || 'Marka seçin'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View>
                  <Text style={styles.inputLabel}>Kategori</Text>
                  <TouchableOpacity
                    style={styles.selectTrigger}
                    onPress={() => categoryModalRef.current?.present()}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectTriggerText, !formData.product_category_id && styles.selectTriggerPlaceholder]}>
                      {categoryOptions.find(opt => opt.value === String(formData.product_category_id))?.label || 'Kategori seçin'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View>
                  <Text style={styles.inputLabel}>Model</Text>
                  <TouchableOpacity
                    style={styles.selectTrigger}
                    onPress={() => modelModalRef.current?.present()}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectTriggerText, !formData.product_model_id && styles.selectTriggerPlaceholder]}>
                      {modelOptions.find(opt => opt.value === String(formData.product_model_id))?.label || 'Model seçin'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Fiyatlandırma */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cash-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Fiyatlandırma</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Alış Fiyatı"
              placeholder="0.00"
              value={formData.purchase_price?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('purchase_price', text ? parseFloat(text) : undefined)
              }
              error={errors.purchase_price}
              keyboardType="decimal-pad"
            />

            <Input
              label="Satış Fiyatı"
              placeholder="0.00"
              value={formData.sale_price?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('sale_price', text ? parseFloat(text) : undefined)
              }
              error={errors.sale_price}
              keyboardType="decimal-pad"
            />

            <Input
              label="KDV Oranı (%)"
              placeholder="0"
              value={formData.vat_rate?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('vat_rate', text ? parseFloat(text) : undefined)
              }
              error={errors.vat_rate}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Stok Bilgileri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="stats-chart-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Stok Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Minimum Stok Seviyesi"
              placeholder="0"
              value={formData.min_stock_level?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('min_stock_level', text ? parseInt(text, 10) : undefined)
              }
              error={errors.min_stock_level}
              keyboardType="number-pad"
            />

            <Input
              label="Maksimum Stok Seviyesi"
              placeholder="0"
              value={formData.max_stock_level?.toString() || ''}
              onChangeText={(text) =>
                handleInputChange('max_stock_level', text ? parseInt(text, 10) : undefined)
              }
              error={errors.max_stock_level}
              keyboardType="number-pad"
            />

            <Input
              label="Barkod"
              placeholder="Opsiyonel"
              value={formData.barcode}
              onChangeText={(text) => handleInputChange('barcode', text)}
              error={errors.barcode}
            />
          </View>
        </View>

        {/* Diğer */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="settings-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Diğer</Text>
          </View>

          <View style={styles.sectionContent}>
            <ToggleSwitch
              label="Aktif Ürün"
              description="Bu ürün kullanıma açık olacak"
              value={formData.is_active}
              onValueChange={(value) => handleInputChange('is_active', value)}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Select Modals */}
      <SearchableSelectModal
        ref={productTypeModalRef}
        title="Ürün Tipi Seçin"
        options={PRODUCT_TYPE_OPTIONS}
        selectedValue={formData.product_type}
        onSelect={(option) => handleInputChange('product_type', option.value)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={unitModalRef}
        title="Birim Seçin"
        options={UNIT_OPTIONS}
        selectedValue={formData.unit}
        onSelect={(option) => handleInputChange('unit', option.value)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={brandModalRef}
        title="Marka Seçin"
        options={brandOptions}
        selectedValue={formData.product_brand_id ? String(formData.product_brand_id) : undefined}
        onSelect={(option) => handleInputChange('product_brand_id', option.value ? Number(option.value) : undefined)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={categoryModalRef}
        title="Kategori Seçin"
        options={categoryOptions}
        selectedValue={formData.product_category_id ? String(formData.product_category_id) : undefined}
        onSelect={(option) => handleInputChange('product_category_id', option.value ? Number(option.value) : undefined)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={modelModalRef}
        title="Model Seçin"
        options={modelOptions}
        selectedValue={formData.product_model_id ? String(formData.product_model_id) : undefined}
        onSelect={(option) => handleInputChange('product_model_id', option.value ? Number(option.value) : undefined)}
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
  loadingOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md
  },
  loadingOptionsText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
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
  }
})
