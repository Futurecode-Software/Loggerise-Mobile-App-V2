/**
 * New Tire Screen
 *
 * Yeni lastik oluşturma ekranı - CLAUDE.md standartlarına uyumlu
 * FormHeader component kullanır
 * Backend endpoint: POST /api/v1/mobile/filo-yonetimi/lastik-deposu
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native'
import { router } from 'expo-router'
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
import { SearchableSelectModal, SearchableSelectModalRef, SelectOption } from '@/components/modals/SearchableSelectModal'
import { DateInput } from '@/components/ui/date-input'
import { FormHeader } from '@/components/navigation/FormHeader'
import api, { getErrorMessage, getValidationErrors } from '@/services/api'

// Lastik tipi seçenekleri
const TIRE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Yaz Lastiği', value: 'summer' },
  { label: 'Kış Lastiği', value: 'winter' },
  { label: 'Dört Mevsim', value: 'all_season' }
]

// Kondisyon seçenekleri
const CONDITION_OPTIONS: SelectOption[] = [
  { label: 'Yeni', value: 'new' },
  { label: 'İyi', value: 'good' },
  { label: 'Orta', value: 'fair' },
  { label: 'Eskimiş', value: 'worn' },
  { label: 'Hasarlı', value: 'damaged' }
]

export default function NewTireScreen() {
  // Form state
  const [formData, setFormData] = useState<{
    serial_number: string
    brand: string
    model: string
    size: string
    dot_code?: string
    tire_type: string
    tread_depth?: string
    purchase_date?: string
    purchase_price?: string
    supplier?: string
    condition: string
    warehouse_location?: string
    notes?: string
  }>({
    serial_number: '',
    brand: '',
    model: '',
    size: '',
    tire_type: 'summer',
    condition: 'new'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal refs
  const tireTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const conditionModalRef = useRef<SearchableSelectModalRef>(null)

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: string, value: any) => {
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
    if (!formData.serial_number?.trim()) {
      newErrors.serial_number = 'Seri numarası zorunludur.'
    }
    if (!formData.brand?.trim()) {
      newErrors.brand = 'Marka zorunludur.'
    }
    if (!formData.model?.trim()) {
      newErrors.model = 'Model zorunludur.'
    }
    if (!formData.size?.trim()) {
      newErrors.size = 'Ebat zorunludur.'
    }
    if (!formData.tire_type) {
      newErrors.tire_type = 'Lastik tipi zorunludur.'
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
      // Prepare data - convert string numbers to actual numbers
      const submitData: any = { ...formData }
      if (submitData.tread_depth) {
        submitData.tread_depth = parseFloat(submitData.tread_depth)
      }
      if (submitData.purchase_price) {
        submitData.purchase_price = parseFloat(submitData.purchase_price)
      }

      await api.post('/filo-yonetimi/lastik-deposu', submitData)

      Toast.show({
        type: 'success',
        text1: 'Lastik başarıyla oluşturuldu',
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
      {/* Header */}
      <FormHeader
        title="Yeni Lastik"
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
              <Ionicons name="disc-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Seri Numarası *"
              placeholder="Örn: TIRE-2024-001"
              value={formData.serial_number}
              onChangeText={(text) => handleInputChange('serial_number', text)}
              error={errors.serial_number}
              maxLength={255}
            />

            <Input
              label="Marka *"
              placeholder="Örn: Michelin, Bridgestone"
              value={formData.brand}
              onChangeText={(text) => handleInputChange('brand', text)}
              error={errors.brand}
              maxLength={255}
            />

            <Input
              label="Model *"
              placeholder="Örn: XZE2+"
              value={formData.model}
              onChangeText={(text) => handleInputChange('model', text)}
              error={errors.model}
              maxLength={255}
            />

            <Input
              label="Ebat *"
              placeholder="Örn: 315/80 R 22.5"
              value={formData.size}
              onChangeText={(text) => handleInputChange('size', text)}
              error={errors.size}
              maxLength={255}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Lastik Tipi *</Text>
              <TouchableOpacity
                style={[styles.selectButton, errors.tire_type ? styles.selectButtonError : null]}
                onPress={() => tireTypeModalRef.current?.present()}
              >
                <Text style={formData.tire_type ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                  {TIRE_TYPE_OPTIONS.find(o => o.value === formData.tire_type)?.label || 'Lastik tipi seçin'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
              {errors.tire_type && <Text style={styles.errorText}>{errors.tire_type}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Durum</Text>
              <TouchableOpacity
                style={[styles.selectButton, errors.condition ? styles.selectButtonError : null]}
                onPress={() => conditionModalRef.current?.present()}
              >
                <Text style={formData.condition ? styles.selectButtonText : styles.selectButtonPlaceholder}>
                  {CONDITION_OPTIONS.find(o => o.value === formData.condition)?.label || 'Durum seçin'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={DashboardColors.textMuted} />
              </TouchableOpacity>
              {errors.condition && <Text style={styles.errorText}>{errors.condition}</Text>}
            </View>

            <Input
              label="Diş Derinliği (mm)"
              placeholder="Örn: 15.5"
              value={formData.tread_depth || ''}
              onChangeText={(text) => handleInputChange('tread_depth', text)}
              error={errors.tread_depth}
              keyboardType="decimal-pad"
            />

            <Input
              label="DOT Kodu"
              placeholder="Üretim kodu (opsiyonel)"
              value={formData.dot_code || ''}
              onChangeText={(text) => handleInputChange('dot_code', text)}
              error={errors.dot_code}
              maxLength={255}
            />
          </View>
        </View>

        {/* Satın Alma Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cash-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Satın Alma Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <DateInput
              label="Satın Alma Tarihi"
              value={formData.purchase_date || ''}
              onChangeDate={(date) => handleInputChange('purchase_date', date)}
              error={errors.purchase_date}
            />

            <Input
              label="Satın Alma Fiyatı (TL)"
              placeholder="Örn: 5000"
              value={formData.purchase_price || ''}
              onChangeText={(text) => handleInputChange('purchase_price', text)}
              error={errors.purchase_price}
              keyboardType="decimal-pad"
            />

            <Input
              label="Tedarikçi"
              placeholder="Tedarikçi adı (opsiyonel)"
              value={formData.supplier || ''}
              onChangeText={(text) => handleInputChange('supplier', text)}
              error={errors.supplier}
              maxLength={255}
            />
          </View>
        </View>

        {/* Depo Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="location-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Depo Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Depo Konumu"
              placeholder="Örn: Raf A1, Bölüm 3"
              value={formData.warehouse_location || ''}
              onChangeText={(text) => handleInputChange('warehouse_location', text)}
              error={errors.warehouse_location}
              maxLength={255}
            />

            <Input
              label="Notlar"
              placeholder="İsteğe bağlı notlar"
              value={formData.notes || ''}
              onChangeText={(text) => handleInputChange('notes', text)}
              error={errors.notes}
              multiline
              numberOfLines={3}
              maxLength={1000}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Modals */}
      <SearchableSelectModal
        ref={tireTypeModalRef}
        title="Lastik Tipi Seçin"
        options={TIRE_TYPE_OPTIONS}
        selectedValue={formData.tire_type}
        onSelect={(option) => handleInputChange('tire_type', option.value)}
        searchPlaceholder="Lastik tipi ara..."
        emptyMessage="Lastik tipi bulunamadı"
      />

      <SearchableSelectModal
        ref={conditionModalRef}
        title="Durum Seçin"
        options={CONDITION_OPTIONS}
        selectedValue={formData.condition}
        onSelect={(option) => handleInputChange('condition', option.value)}
        searchPlaceholder="Durum ara..."
        emptyMessage="Durum bulunamadı"
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
  fieldContainer: {
    gap: DashboardSpacing.xs
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textSecondary,
    marginBottom: 4
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DashboardColors.background,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectButtonError: {
    borderColor: DashboardColors.danger
  },
  selectButtonText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  selectButtonPlaceholder: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textMuted
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: 4
  }
})
