/**
 * Yeni Senet Oluşturma Ekranı
 *
 * Backend MobileStorePromissoryNoteRequest validation kurallarına uyumlu.
 * CLAUDE.md form sayfası tasarım standardına uygun.
 */

import React, { useState, useCallback, useEffect } from 'react'
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
import { FormHeader } from '@/components/navigation/FormHeader'
import { CURRENCY_OPTIONS } from '@/constants/currencies'
import { Input } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-input'
import {
  createPromissoryNote,
  PromissoryNoteFormData,
  PromissoryNoteType,
  PromissoryNoteStatus
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

export default function NewPromissoryNoteScreen() {
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cariler
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  // Carileri yükle
  useEffect(() => {
    const fetchContacts = async () => {
      setLoadingContacts(true)
      try {
        const response = await getContacts({ per_page: 100, is_active: true })
        setContacts(response.contacts)
      } catch (err) {
        if (__DEV__) console.error('Failed to load contacts:', err)
      } finally {
        setLoadingContacts(false)
      }
    }
    fetchContacts()
  }, [])

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
      await createPromissoryNote(formData)

      Toast.show({
        type: 'success',
        text1: 'Senet başarıyla oluşturuldu',
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

  const contactOptions = contacts.map(contact => ({
    label: contact.name,
    value: contact.id,
    subtitle: contact.code
  }))

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Yeni Senet"
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
              loading={loadingContacts}
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
              onValueChange={(value) => handleInputChange('currency_type', value)}
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
