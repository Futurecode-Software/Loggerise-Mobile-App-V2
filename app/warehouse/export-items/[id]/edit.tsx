/**
 * İhracat Deposu Malı Düzenleme Ekranı
 *
 * CLAUDE.md ilkelerine uygun
 * FormHeader + KeyboardAwareScrollView + SearchableSelectModal
 * load_id, position_id, customer_id değiştirilemez (backend kuralı)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
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
import { FormHeader } from '@/components/navigation/FormHeader'
import {
  SearchableSelectModal,
  SearchableSelectModalRef,
  SelectOption
} from '@/components/modals'
import {
  getExportWarehouseItem,
  updateExportWarehouseItem,
  ExportWarehouseItemUpdateData,
  PACKAGE_TYPES,
  getPackageTypeLabel
} from '@/services/endpoints/export-warehouse-items'
import {
  getExportWarehouses,
  ExportWarehouse
} from '@/services/endpoints/export-warehouses'
import { getErrorMessage, getValidationErrors } from '@/services/api'

export default function EditExportWarehouseItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const itemId = id ? parseInt(id, 10) : null

  // Form state
  const [formData, setFormData] = useState<ExportWarehouseItemUpdateData>({
    export_warehouse_id: undefined,
    description: '',
    package_type: 'pallet',
    package_count: 1,
    gross_weight_kg: 0,
    volume_m3: null,
    customer_reference: '',
    invoice_no: '',
    declaration_no: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingItem, setIsLoadingItem] = useState(true)

  // Read-only bilgiler (yük, müşteri, pozisyon)
  const [loadNumber, setLoadNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [itemNumber, setItemNumber] = useState('')

  // Depo seçimi
  const [warehouses, setWarehouses] = useState<ExportWarehouse[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false)
  const [warehouseLabel, setWarehouseLabel] = useState('')
  const warehouseModalRef = useRef<SearchableSelectModalRef>(null)

  // Paket tipi
  const packageTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const [packageTypeLabel, setPackageTypeLabel] = useState('')

  // Mevcut veriyi yükle
  useEffect(() => {
    if (!itemId) return
    loadItemData()
    loadWarehouses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  const loadItemData = async () => {
    if (!itemId) return

    setIsLoadingItem(true)
    try {
      const item = await getExportWarehouseItem(itemId)

      setFormData({
        export_warehouse_id: item.export_warehouse_id,
        description: item.description || '',
        package_type: item.package_type || 'pallet',
        package_count: item.package_count || 1,
        gross_weight_kg: item.gross_weight_kg || 0,
        volume_m3: item.volume_m3 || null,
        customer_reference: item.customer_reference || '',
        invoice_no: item.invoice_no || '',
        declaration_no: item.declaration_no || '',
        notes: item.notes || '',
      })

      // Read-only bilgiler
      setItemNumber(item.item_number || '')
      setLoadNumber(item.load?.load_number || '')
      setCustomerName(
        item.customer?.short_name || item.customer?.name || ''
      )

      // Label'ları set et
      if (item.warehouse) {
        setWarehouseLabel(`${item.warehouse.name} (${item.warehouse.code})`)
      }
      if (item.package_type) {
        setPackageTypeLabel(getPackageTypeLabel(item.package_type))
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Mal bilgileri yüklenemedi',
        position: 'top',
        visibilityTime: 1500,
      })
      router.back()
    } finally {
      setIsLoadingItem(false)
    }
  }

  const loadWarehouses = async () => {
    setIsLoadingWarehouses(true)
    try {
      const response = await getExportWarehouses({ status: true })
      setWarehouses(response.warehouses)
    } catch {
      if (__DEV__) console.error('Warehouses load error')
    } finally {
      setIsLoadingWarehouses(false)
    }
  }

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((
    field: keyof ExportWarehouseItemUpdateData,
    value: string | number | null
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Depo seçimi
  const handleWarehouseSelect = (option: SelectOption) => {
    const warehouse = warehouses.find(w => w.id === Number(option.value))
    if (warehouse) {
      setWarehouseLabel(`${warehouse.name} (${warehouse.code})`)
      handleInputChange('export_warehouse_id', warehouse.id)
    }
  }

  // Paket tipi seçimi
  const handlePackageTypeSelect = (option: SelectOption) => {
    setPackageTypeLabel(option.label)
    handleInputChange('package_type', String(option.value))
  }

  // Form doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.description?.trim()) {
      newErrors.description = 'Mal açıklaması zorunludur.'
    }
    if (!formData.package_type) {
      newErrors.package_type = 'Paket tipi zorunludur.'
    }
    if (!formData.package_count || formData.package_count < 1) {
      newErrors.package_count = 'Paket sayısı en az 1 olmalıdır.'
    }
    if (!formData.gross_weight_kg || formData.gross_weight_kg <= 0) {
      newErrors.gross_weight_kg = 'Brüt ağırlık zorunludur.'
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
    if (!itemId) return

    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen zorunlu alanları doldurunuz',
        position: 'top',
        visibilityTime: 1500,
      })
      return
    }

    setIsSubmitting(true)
    try {
      await updateExportWarehouseItem(itemId, formData)

      Toast.show({
        type: 'success',
        text1: 'Mal başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500,
      })
      router.back()
    } catch (error: unknown) {
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
          visibilityTime: 1500,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [itemId, formData, validateForm])

  // Depo options
  const warehouseOptions: SelectOption[] = warehouses.map(w => ({
    value: w.id,
    label: `${w.name} (${w.code})`,
  }))

  // Paket tipi options
  const packageTypeOptions: SelectOption[] = PACKAGE_TYPES.map(t => ({
    value: t.value,
    label: t.label,
  }))

  // Yükleniyor
  if (isLoadingItem) {
    return (
      <View style={styles.container}>
        <FormHeader
          title="Mal Düzenle"
          onBackPress={handleBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FormHeader
        title="Mal Düzenle"
        onBackPress={handleBack}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bottomOffset={20}
      >
        {/* Read-only Bilgiler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="lock-closed-outline" size={18} color={DashboardColors.textMuted} />
            </View>
            <Text style={styles.sectionTitle}>Değiştirilemez Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Mal No</Text>
              <Text style={styles.readOnlyValue}>{itemNumber}</Text>
            </View>
            {loadNumber ? (
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyLabel}>Yük No</Text>
                <Text style={styles.readOnlyValue}>{loadNumber}</Text>
              </View>
            ) : null}
            {customerName ? (
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyLabel}>Müşteri</Text>
                <Text style={styles.readOnlyValue}>{customerName}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Depo Seçimi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="business-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Depo</Text>
          </View>

          <View style={styles.sectionContent}>
            <View>
              <Text style={styles.inputLabel}>Depo</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.export_warehouse_id && styles.selectTriggerError]}
                onPress={() => warehouseModalRef.current?.present()}
              >
                <Text style={warehouseLabel ? styles.selectTriggerText : styles.selectTriggerPlaceholder}>
                  {warehouseLabel || 'Depo seçin'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
              {errors.export_warehouse_id && (
                <Text style={styles.errorText}>{errors.export_warehouse_id}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Mal Detayları */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cube-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Mal Detayları</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Mal Açıklaması *"
              placeholder="Malın detaylı açıklamasını girin"
              value={formData.description || ''}
              onChangeText={(text) => handleInputChange('description', text)}
              error={errors.description}
              maxLength={500}
              multiline
              numberOfLines={3}
            />

            {/* Paket Tipi */}
            <View>
              <Text style={styles.inputLabel}>Paket Tipi *</Text>
              <TouchableOpacity
                style={[styles.selectTrigger, errors.package_type && styles.selectTriggerError]}
                onPress={() => packageTypeModalRef.current?.present()}
              >
                <Text style={styles.selectTriggerText}>
                  {packageTypeLabel}
                </Text>
                <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
              {errors.package_type && (
                <Text style={styles.errorText}>{errors.package_type}</Text>
              )}
            </View>

            <Input
              label="Paket Sayısı *"
              placeholder="Örn: 10"
              value={formData.package_count ? String(formData.package_count) : ''}
              onChangeText={(text) => {
                const numValue = text ? parseInt(text, 10) : 0
                handleInputChange('package_count', numValue)
              }}
              error={errors.package_count}
              keyboardType="number-pad"
            />

            <Input
              label="Brüt Ağırlık (kg) *"
              placeholder="Örn: 1500"
              value={formData.gross_weight_kg ? String(formData.gross_weight_kg) : ''}
              onChangeText={(text) => {
                const numValue = text ? parseFloat(text) : 0
                handleInputChange('gross_weight_kg', numValue)
              }}
              error={errors.gross_weight_kg}
              keyboardType="decimal-pad"
            />

            <Input
              label="Hacim (m³)"
              placeholder="Örn: 5.5"
              value={formData.volume_m3 ? String(formData.volume_m3) : ''}
              onChangeText={(text) => {
                const numValue = text ? parseFloat(text) : null
                handleInputChange('volume_m3', numValue)
              }}
              error={errors.volume_m3}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Ek Bilgiler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="information-circle-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Ek Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Müşteri Referansı"
              placeholder="Örn: REF-ABC-123"
              value={formData.customer_reference || ''}
              onChangeText={(text) => handleInputChange('customer_reference', text)}
              maxLength={100}
            />

            <Input
              label="Fatura Numarası"
              placeholder="Örn: INV-2025-001"
              value={formData.invoice_no || ''}
              onChangeText={(text) => handleInputChange('invoice_no', text)}
              maxLength={100}
            />

            <Input
              label="Gümrük Deklarasyon No"
              placeholder="Örn: DEC-ABC1234XYZ"
              value={formData.declaration_no || ''}
              onChangeText={(text) => handleInputChange('declaration_no', text)}
              maxLength={100}
            />

            <Input
              label="Notlar"
              placeholder="Ek notlar..."
              value={formData.notes || ''}
              onChangeText={(text) => handleInputChange('notes', text)}
              maxLength={1000}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* SearchableSelectModals */}
      <SearchableSelectModal
        ref={warehouseModalRef}
        title="Depo Seçin"
        options={warehouseOptions}
        selectedValue={formData.export_warehouse_id || null}
        onSelect={handleWarehouseSelect}
        loading={isLoadingWarehouses}
        searchPlaceholder="Depo ara..."
        emptyMessage="Depo bulunamadı"
      />

      <SearchableSelectModal
        ref={packageTypeModalRef}
        title="Paket Tipi Seçin"
        options={packageTypeOptions}
        selectedValue={formData.package_type || null}
        onSelect={handlePackageTypeSelect}
        searchPlaceholder="Paket tipi ara..."
        emptyMessage="Paket tipi bulunamadı"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl'],
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.md,
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
  },

  // Sections
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  sectionContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md,
  },

  // Read-only rows
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.md,
    backgroundColor: DashboardColors.background,
    borderRadius: DashboardBorderRadius.lg,
  },
  readOnlyLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textPrimary,
    fontWeight: '600',
  },

  // Input Label
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs,
  },

  // Select Trigger
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    backgroundColor: DashboardColors.background,
  },
  selectTriggerError: {
    borderColor: DashboardColors.danger,
  },
  selectTriggerText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
  },
  selectTriggerPlaceholder: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted,
  },
  errorText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.danger,
    marginTop: 4,
  },
})
