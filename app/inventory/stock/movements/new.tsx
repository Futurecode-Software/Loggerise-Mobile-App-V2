/**
 * New Stock Movement Screen
 *
 * Yeni stok hareketi oluşturma ekranı - CLAUDE.md tasarım ilkeleri ile uyumlu
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import {
  createStockMovement,
  StockMovementFormData,
  MANUAL_MOVEMENT_TYPES
} from '@/services/endpoints/stock-movements'
import { getProducts, Product } from '@/services/endpoints/products'
import { getWarehouses, Warehouse } from '@/services/endpoints/warehouses'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function NewMovementScreen() {
  // Products and warehouses for selection
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Form state
  const [formData, setFormData] = useState<Partial<StockMovementFormData>>({
    product_id: undefined,
    warehouse_id: undefined,
    movement_type: 'in',
    quantity: undefined,
    unit_cost: undefined,
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const movementTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const productModalRef = useRef<SearchableSelectModalRef>(null)
  const warehouseModalRef = useRef<SearchableSelectModalRef>(null)

  // Fetch products and warehouses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, warehousesRes] = await Promise.all([
          getProducts({ is_active: true, per_page: 100 }),
          getWarehouses({ is_active: true, per_page: 100 })
        ])
        setProducts(productsRes.products)
        setWarehouses(warehousesRes.warehouses)
      } catch (err) {
        if (__DEV__) console.error('Failed to fetch data:', err)
        Toast.show({
          type: 'error',
          text1: 'Ürün ve depo listesi yüklenemedi',
          position: 'top',
          visibilityTime: 1500
        })
      } finally {
        setIsLoadingData(false)
      }
    }
    fetchData()
  }, [])

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof StockMovementFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      if (errors[field]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [errors]
  )

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_id) {
      newErrors.product_id = 'Ürün seçimi zorunludur.'
    }
    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Depo seçimi zorunludur.'
    }
    if (!formData.movement_type) {
      newErrors.movement_type = 'Hareket tipi zorunludur.'
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Geçerli bir miktar giriniz.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Geri butonu
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  // Submit handler
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
      await createStockMovement(formData as StockMovementFormData)

      Toast.show({
        type: 'success',
        text1: 'Stok hareketi başarıyla oluşturuldu',
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

  // Options for select inputs
  const productOptions = products.map((p) => ({
    label: `${p.name}${p.code ? ` (${p.code})` : ''}`,
    value: String(p.id)
  }))

  const warehouseOptions = warehouses.map((w) => ({
    label: `${w.name}${w.code ? ` (${w.code})` : ''}`,
    value: String(w.id)
  }))

  const movementTypeOptions = MANUAL_MOVEMENT_TYPES.map((t) => ({
    label: t.label,
    value: t.value
  }))

  if (isLoadingData) {
    return (
      <View style={styles.container}>
        <FormHeader
          title="Yeni Stok Hareketi"
          onBackPress={handleBack}
          onSavePress={handleSubmit}
          isSaving={false}
        />

        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FormHeader
        title="Yeni Stok Hareketi"
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
        {/* Hareket Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="swap-horizontal-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Hareket Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <View>
              <Text style={styles.inputLabel}>Hareket Tipi *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.movement_type && styles.selectTriggerError]}
                onPress={() => movementTypeModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectTriggerText, !formData.movement_type && styles.selectTriggerPlaceholder]}>
                  {movementTypeOptions.find(opt => opt.value === formData.movement_type)?.label || 'Hareket tipi seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.movement_type && <Text style={styles.errorText}>{errors.movement_type}</Text>}
            </View>

            <View>
              <Text style={styles.inputLabel}>Ürün *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.product_id && styles.selectTriggerError]}
                onPress={() => productModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectTriggerText, !formData.product_id && styles.selectTriggerPlaceholder]}>
                  {productOptions.find(opt => opt.value === String(formData.product_id))?.label || 'Ürün seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.product_id && <Text style={styles.errorText}>{errors.product_id}</Text>}
            </View>

            <View>
              <Text style={styles.inputLabel}>Depo *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.warehouse_id && styles.selectTriggerError]}
                onPress={() => warehouseModalRef.current?.present()}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectTriggerText, !formData.warehouse_id && styles.selectTriggerPlaceholder]}>
                  {warehouseOptions.find(opt => opt.value === String(formData.warehouse_id))?.label || 'Depo seçiniz'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={DashboardColors.textSecondary} />
              </TouchableOpacity>
              {errors.warehouse_id && <Text style={styles.errorText}>{errors.warehouse_id}</Text>}
            </View>

            <Input
              label="Miktar *"
              placeholder="Örn: 100"
              value={formData.quantity ? String(formData.quantity) : ''}
              onChangeText={(text) =>
                handleInputChange('quantity', text ? parseFloat(text) : undefined)
              }
              error={errors.quantity}
              keyboardType="decimal-pad"
            />

            <Input
              label="Birim Maliyet"
              placeholder="Opsiyonel"
              value={formData.unit_cost ? String(formData.unit_cost) : ''}
              onChangeText={(text) =>
                handleInputChange('unit_cost', text ? parseFloat(text) : undefined)
              }
              error={errors.unit_cost}
              keyboardType="decimal-pad"
            />

            <Input
              label="Notlar"
              placeholder="Opsiyonel"
              value={formData.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
              error={errors.notes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <SearchableSelectModal
        ref={movementTypeModalRef}
        title="Hareket Tipi"
        options={movementTypeOptions}
        selectedValue={formData.movement_type || ''}
        onSelect={(option) => handleInputChange('movement_type', option.value)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={productModalRef}
        title="Ürün"
        options={productOptions}
        selectedValue={formData.product_id ? String(formData.product_id) : undefined}
        onSelect={(option) => handleInputChange('product_id', option.value ? Number(option.value) : undefined)}
        searchPlaceholder="Ara..."
      />

      <SearchableSelectModal
        ref={warehouseModalRef}
        title="Depo"
        options={warehouseOptions}
        selectedValue={formData.warehouse_id ? String(formData.warehouse_id) : undefined}
        onSelect={(option) => handleInputChange('warehouse_id', option.value ? Number(option.value) : undefined)}
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
