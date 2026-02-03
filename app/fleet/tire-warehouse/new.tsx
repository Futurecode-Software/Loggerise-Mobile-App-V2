/**
 * New Tire Screen
 *
 * Yeni lastik oluşturma ekranı - CLAUDE.md standartlarına uyumlu
 * Backend endpoint: POST /api/v1/mobile/filo-yonetimi/lastik-deposu
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
import { DateInput } from '@/components/ui/date-input'
import api, { getErrorMessage, getValidationErrors } from '@/services/api'

// Lastik tipi seçenekleri
const TIRE_TYPE_OPTIONS = [
  { label: 'Yaz Lastiği', value: 'summer' },
  { label: 'Kış Lastiği', value: 'winter' },
  { label: 'Dört Mevsim', value: 'all_season' }
]

// Kondisyon seçenekleri
const CONDITION_OPTIONS = [
  { label: 'Yeni', value: 'new' },
  { label: 'İyi', value: 'good' },
  { label: 'Orta', value: 'fair' },
  { label: 'Eskimiş', value: 'worn' },
  { label: 'Hasarlı', value: 'damaged' }
]

export default function NewTireScreen() {
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
              <Text style={styles.headerTitle}>Yeni Lastik</Text>
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

            <SelectInput
              label="Lastik Tipi *"
              options={TIRE_TYPE_OPTIONS}
              selectedValue={formData.tire_type}
              onValueChange={(val) => handleInputChange('tire_type', val)}
              error={errors.tire_type}
            />

            <SelectInput
              label="Durum"
              options={CONDITION_OPTIONS}
              selectedValue={formData.condition}
              onValueChange={(val) => handleInputChange('condition', val)}
              error={errors.condition}
            />

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
  }
})
