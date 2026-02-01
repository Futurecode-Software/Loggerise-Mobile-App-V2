/**
 * Senet Düzenleme Ekranı
 *
 * Backend MobileUpdatePromissoryNoteRequest validation kurallarına uyumlu.
 * CLAUDE.md form sayfası tasarım standardına uygun.
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
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-input'
import {
  getPromissoryNote,
  updatePromissoryNote,
  PromissoryNoteFormData,
  PromissoryNoteType,
  PromissoryNoteStatus,
  CurrencyType
} from '@/services/endpoints/promissory-notes'
import { getContacts, Contact } from '@/services/endpoints/contacts'
import { getErrorMessage, getValidationErrors } from '@/services/api'

// Senet tipi seçenekleri
const TYPE_OPTIONS = [
  { label: 'Alınan', value: 'received' },
  { label: 'Verilen', value: 'issued' }
]

// Durum seçenekleri
const STATUS_OPTIONS = [
  { label: 'Beklemede', value: 'pending' },
  { label: 'Transfer Edildi', value: 'transferred' },
  { label: 'Tahsil Edildi', value: 'cleared' },
  { label: 'Protesto Edildi', value: 'protested' },
  { label: 'İptal Edildi', value: 'cancelled' }
]

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
  { label: 'Norveç Kronu (NOK)', value: 'NOK' }
]

export default function EditPromissoryNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
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
  const [formData, setFormData] = useState<PromissoryNoteFormData>({
    contact_id: 0,
    promissory_note_number: '',
    bank_name: '',
    branch_name: '',
    account_number: '',
    drawer_name: '',
    endorser_name: '',
    portfolio_number: '',
    type: 'received',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency_type: 'TRY',
    status: 'pending',
    description: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cariler
  const [contacts, setContacts] = useState<Contact[]>([])

  // Senet verilerini yükle
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const [promissoryNoteData, contactsResponse] = await Promise.all([
          getPromissoryNote(parseInt(id, 10)),
          getContacts({ per_page: 100, is_active: true }).catch(() => ({ contacts: [], pagination: {} as any }))
        ])

        setContacts(contactsResponse.contacts)

        // Form verilerini doldur
        setFormData({
          contact_id: promissoryNoteData.contact_id,
          promissory_note_number: promissoryNoteData.promissory_note_number,
          bank_name: promissoryNoteData.bank_name,
          branch_name: promissoryNoteData.branch_name,
          account_number: promissoryNoteData.account_number || '',
          drawer_name: promissoryNoteData.drawer_name || '',
          endorser_name: promissoryNoteData.endorser_name || '',
          portfolio_number: promissoryNoteData.portfolio_number || '',
          type: promissoryNoteData.type,
          issue_date: promissoryNoteData.issue_date,
          due_date: promissoryNoteData.due_date,
          amount: promissoryNoteData.amount,
          currency_type: promissoryNoteData.currency_type,
          status: promissoryNoteData.status,
          transferred_to_type: promissoryNoteData.transferred_to_type || null,
          transferred_to_id: promissoryNoteData.transferred_to_id || null,
          transferred_date: promissoryNoteData.transferred_date || null,
          cleared_date: promissoryNoteData.cleared_date || null,
          protested_date: promissoryNoteData.protested_date || null,
          cancelled_date: promissoryNoteData.cancelled_date || null,
          attached_document: promissoryNoteData.attached_document || null,
          description: promissoryNoteData.description || '',
          is_active: promissoryNoteData.is_active,
          sort_order: promissoryNoteData.sort_order
        })
      } catch (err) {
        console.error('Failed to load promissory note:', err)
        Toast.show({
          type: 'error',
          text1: 'Senet bilgileri yüklenemedi',
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

    fetchData()
  }, [id])

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof PromissoryNoteFormData, value: any) => {
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

    if (!formData.contact_id || formData.contact_id === 0) {
      newErrors.contact_id = 'Cari seçimi zorunludur.'
    }
    if (!formData.promissory_note_number?.trim()) {
      newErrors.promissory_note_number = 'Senet numarası zorunludur.'
    }
    if (!formData.bank_name?.trim()) {
      newErrors.bank_name = 'Banka adı zorunludur.'
    }
    if (!formData.branch_name?.trim()) {
      newErrors.branch_name = 'Şube adı zorunludur.'
    }
    if (!formData.type) {
      newErrors.type = 'Senet tipi zorunludur.'
    }
    if (!formData.issue_date) {
      newErrors.issue_date = 'Düzenleme tarihi zorunludur.'
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Vade tarihi zorunludur.'
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Tutar 0'dan büyük olmalıdır."
    }
    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur.'
    }
    if (!formData.status) {
      newErrors.status = 'Durum zorunludur.'
    }

    // Tarih doğrulaması
    if (formData.issue_date && formData.due_date) {
      const issueDate = new Date(formData.issue_date)
      const dueDate = new Date(formData.due_date)
      if (dueDate < issueDate) {
        newErrors.due_date = 'Vade tarihi, düzenleme tarihinden önce olamaz.'
      }
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
    if (!validateForm() || !id) {
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
      await updatePromissoryNote(parseInt(id, 10), formData)

      Toast.show({
        type: 'success',
        text1: 'Senet başarıyla güncellendi',
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

  const contactOptions = contacts.map(contact => ({
    label: contact.name,
    value: contact.id,
    subtitle: contact.code
  }))

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Senet Düzenle</Text>
              </View>
              <View style={styles.saveButton} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Senet bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

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
              <Text style={styles.headerTitle}>Senet Düzenle</Text>
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
              <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <SearchableSelect
              label="Cari *"
              placeholder="Cari seçin"
              options={contactOptions}
              value={formData.contact_id || undefined}
              onValueChange={(value) => handleInputChange('contact_id', value)}
              error={errors.contact_id}
            />

            <Input
              label="Senet Numarası *"
              placeholder="Örn: SEN-2025-001"
              value={formData.promissory_note_number}
              onChangeText={(text) => handleInputChange('promissory_note_number', text)}
              error={errors.promissory_note_number}
            />

            <SelectInput
              label="Senet Tipi *"
              options={TYPE_OPTIONS}
              selectedValue={formData.type}
              onValueChange={(value) => handleInputChange('type', value as PromissoryNoteType)}
              error={errors.type}
            />

            <SelectInput
              label="Durum *"
              options={STATUS_OPTIONS}
              selectedValue={formData.status}
              onValueChange={(value) => handleInputChange('status', value as PromissoryNoteStatus)}
              error={errors.status}
            />

            {/* Aktif/Pasif Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => handleInputChange('is_active', !formData.is_active)}
              activeOpacity={0.7}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Aktif</Text>
                <Text style={styles.toggleDescription}>Bu senet aktif olarak işaretlenecek</Text>
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

        {/* Banka Bilgileri Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="business-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Banka Bilgileri</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Banka Adı *"
              placeholder="Örn: Ziraat Bankası"
              value={formData.bank_name}
              onChangeText={(text) => handleInputChange('bank_name', text)}
              error={errors.bank_name}
            />

            <Input
              label="Şube Adı *"
              placeholder="Örn: Merkez Şube"
              value={formData.branch_name}
              onChangeText={(text) => handleInputChange('branch_name', text)}
              error={errors.branch_name}
            />

            <Input
              label="Hesap Numarası"
              placeholder="Opsiyonel"
              value={formData.account_number}
              onChangeText={(text) => handleInputChange('account_number', text)}
              error={errors.account_number}
              keyboardType="numeric"
            />

            <Input
              label="Keşideci Adı"
              placeholder="Opsiyonel"
              value={formData.drawer_name}
              onChangeText={(text) => handleInputChange('drawer_name', text)}
              error={errors.drawer_name}
            />

            <Input
              label="Ciranta Adı"
              placeholder="Opsiyonel"
              value={formData.endorser_name}
              onChangeText={(text) => handleInputChange('endorser_name', text)}
              error={errors.endorser_name}
            />

            <Input
              label="Portföy Numarası"
              placeholder="Opsiyonel"
              value={formData.portfolio_number}
              onChangeText={(text) => handleInputChange('portfolio_number', text)}
              error={errors.portfolio_number}
            />
          </View>
        </View>

        {/* Tarih ve Tutar Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="calendar-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Tarih ve Tutar</Text>
          </View>

          <View style={styles.sectionContent}>
            <DateInput
              label="Düzenleme Tarihi *"
              value={formData.issue_date}
              onChangeDate={(value) => handleInputChange('issue_date', value)}
              error={errors.issue_date}
            />

            <DateInput
              label="Vade Tarihi *"
              value={formData.due_date}
              onChangeDate={(value) => handleInputChange('due_date', value)}
              error={errors.due_date}
            />

            <Input
              label="Tutar *"
              placeholder="0.00"
              value={formData.amount ? String(formData.amount) : ''}
              onChangeText={(text) => {
                const numValue = parseFloat(text) || 0
                handleInputChange('amount', numValue)
              }}
              error={errors.amount}
              keyboardType="decimal-pad"
            />

            <SelectInput
              label="Para Birimi *"
              options={CURRENCY_OPTIONS}
              selectedValue={formData.currency_type}
              onValueChange={(value) => handleInputChange('currency_type', value as CurrencyType)}
              error={errors.currency_type}
            />
          </View>
        </View>

        {/* Diğer Bilgiler Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="create-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Diğer Bilgiler</Text>
          </View>

          <View style={styles.sectionContent}>
            <Input
              label="Açıklama"
              placeholder="Senet hakkında notlar..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              error={errors.description}
              multiline
              numberOfLines={3}
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
