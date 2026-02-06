/**
 * Yeni Çek Oluşturma Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern tasarım
 * FormHeader component kullanır
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet
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
import { SelectInput } from '@/components/ui/select-input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-input'
import { FormHeader } from '@/components/navigation/FormHeader'
import { CURRENCY_OPTIONS } from '@/constants/currencies'
import {
  createCheck,
  CheckFormData,
  CheckType,
  CheckStatus,
  CurrencyType
} from '@/services/endpoints/checks'
import { getContacts, Contact } from '@/services/endpoints/contacts'
import { getErrorMessage, getValidationErrors } from '@/services/api'

// Çek tipi seçenekleri
const TYPE_OPTIONS = [
  { label: 'Alınan Çek', value: 'received' },
  { label: 'Verilen Çek', value: 'issued' }
]

// Durum seçenekleri
const STATUS_OPTIONS = [
  { label: 'Beklemede', value: 'pending' },
  { label: 'Transfer Edildi', value: 'transferred' },
  { label: 'Tahsil Edildi', value: 'cleared' },
  { label: 'Karşılıksız', value: 'bounced' },
  { label: 'İptal Edildi', value: 'cancelled' }
]

export default function NewCheckScreen() {

  // Form state
  const [formData, setFormData] = useState<CheckFormData>({
    contact_id: 0,
    check_number: '',
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
    description: ''
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
        console.error('Failed to load contacts:', err)
      } finally {
        setLoadingContacts(false)
      }
    }
    fetchContacts()
  }, [])

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof CheckFormData, value: any) => {
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

  // Doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Zorunlu alanlar
    if (!formData.contact_id || formData.contact_id === 0) {
      newErrors.contact_id = 'Cari seçimi zorunludur.'
    }
    if (!formData.check_number?.trim()) {
      newErrors.check_number = 'Çek numarası zorunludur.'
    }
    if (!formData.bank_name?.trim()) {
      newErrors.bank_name = 'Banka adı zorunludur.'
    }
    if (!formData.branch_name?.trim()) {
      newErrors.branch_name = 'Şube adı zorunludur.'
    }
    if (!formData.type) {
      newErrors.type = 'Çek tipi zorunludur.'
    }
    if (!formData.issue_date) {
      newErrors.issue_date = 'Düzenleme tarihi zorunludur.'
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Vade tarihi zorunludur.'
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Tutar 0\'dan büyük olmalıdır.'
    }
    if (!formData.currency_type) {
      newErrors.currency_type = 'Para birimi zorunludur.'
    }
    if (!formData.status) {
      newErrors.status = 'Durum zorunludur.'
    }

    // Tarih kontrolü
    if (formData.issue_date && formData.due_date) {
      const issueDate = new Date(formData.issue_date)
      const dueDate = new Date(formData.due_date)
      if (dueDate < issueDate) {
        newErrors.due_date = 'Vade tarihi, düzenleme tarihinden önce olamaz.'
      }
    }

    // Uzunluk kontrolleri
    if (formData.check_number && formData.check_number.length > 255) {
      newErrors.check_number = 'Çek numarası en fazla 255 karakter olabilir.'
    }
    if (formData.bank_name && formData.bank_name.length > 255) {
      newErrors.bank_name = 'Banka adı en fazla 255 karakter olabilir.'
    }
    if (formData.branch_name && formData.branch_name.length > 255) {
      newErrors.branch_name = 'Şube adı en fazla 255 karakter olabilir.'
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
      await createCheck(formData)

      Toast.show({
        type: 'success',
        text1: 'Çek başarıyla oluşturuldu',
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

  // Cari seçenekleri
  const contactOptions = contacts.map(contact => ({
    label: contact.name,
    value: contact.id,
    subtitle: contact.code
  }))

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Yeni Çek"
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
              label="Çek Numarası *"
              placeholder="Örn: ÇEK-2025-001"
              value={formData.check_number}
              onChangeText={(text) => handleInputChange('check_number', text)}
              error={errors.check_number}
              maxLength={255}
            />

            <SelectInput
              label="Çek Tipi *"
              options={TYPE_OPTIONS}
              selectedValue={formData.type}
              onValueChange={(value) => handleInputChange('type', value as CheckType)}
              error={errors.type}
            />

            <SelectInput
              label="Durum *"
              options={STATUS_OPTIONS}
              selectedValue={formData.status}
              onValueChange={(value) => handleInputChange('status', value as CheckStatus)}
              error={errors.status}
            />
          </View>
        </View>

        {/* Banka Bilgileri */}
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
              maxLength={255}
            />

            <Input
              label="Şube Adı *"
              placeholder="Örn: Bakırköy Şubesi"
              value={formData.branch_name}
              onChangeText={(text) => handleInputChange('branch_name', text)}
              error={errors.branch_name}
              maxLength={255}
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

        {/* Tarih ve Tutar */}
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

        {/* Diğer Bilgiler */}
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
              placeholder="Opsiyonel"
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
