/**
 * New Event Screen (Yeni Etkinlik)
 *
 * FormHeader component + KeyboardAwareScrollView + BottomSheetModal selects
 * CLAUDE.md standartlarına tam uyumlu
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'
import { FormHeader } from '@/components/navigation/FormHeader'
import { Input } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-input'
import { SearchableSelectModal, SearchableSelectModalRef } from '@/components/modals'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
} from '@/constants/dashboard-theme'
import { createEvent, EventFormData } from '@/services/endpoints/events'
import { getContacts } from '@/services/endpoints/contacts'
import { getErrorMessage, getValidationErrors } from '@/services/api'

// Event type options
const EVENT_TYPE_OPTIONS = [
  { label: 'Arama', value: 'call' },
  { label: 'Toplantı', value: 'meeting' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'E-posta', value: 'email' },
  { label: 'Görev', value: 'task' },
  { label: 'Son Tarih', value: 'deadline' },
]

// Priority options
const PRIORITY_OPTIONS = [
  { label: 'Düşük', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'Yüksek', value: 'high' },
  { label: 'Acil', value: 'urgent' },
]

// Contact method options
const CONTACT_METHOD_OPTIONS = [
  { label: 'Telefon', value: 'phone' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Video Görüşme', value: 'video_call' },
  { label: 'Yüz Yüze', value: 'in_person' },
  { label: 'E-posta', value: 'email' },
]

// Reminder options
const REMINDER_OPTIONS = [
  { label: '15 dakika önce', value: 15 },
  { label: '30 dakika önce', value: 30 },
  { label: '1 saat önce', value: 60 },
  { label: '1 gün önce', value: 1440 },
]

// Section Header Component
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLine} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  )
}

function flattenErrors(validationErrors: any): Record<string, string> {
  const flattened: Record<string, string> = {}
  Object.keys(validationErrors).forEach((key) => {
    const messages = validationErrors[key]
    if (Array.isArray(messages)) {
      flattened[key] = messages.join(' ')
    } else {
      flattened[key] = String(messages)
    }
  })
  return flattened
}

export default function NewEventScreen() {
  const scrollViewRef = useRef<ScrollView>(null)

  // Modal refs
  const eventTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const priorityModalRef = useRef<SearchableSelectModalRef>(null)
  const contactMethodModalRef = useRef<SearchableSelectModalRef>(null)
  const reminderModalRef = useRef<SearchableSelectModalRef>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get current date and 1 hour later for defaults
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_datetime: now.toISOString(),
    end_datetime: oneHourLater.toISOString(),
    is_all_day: false,
    event_type: 'meeting',
    priority: 'normal',
    customer_id: undefined,
    contact_method: undefined,
    contact_detail: '',
    reminder_minutes: undefined,
    color: DashboardColors.primary,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof EventFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear error for this field
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

  // Validation function matching backend rules
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.title?.trim()) {
      newErrors.title = 'Başlık zorunludur.'
    }
    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Başlangıç tarihi zorunludur.'
    }
    if (!formData.end_datetime) {
      newErrors.end_datetime = 'Bitiş tarihi zorunludur.'
    }
    if (!formData.event_type) {
      newErrors.event_type = 'Etkinlik tipi zorunludur.'
    }

    // Date validation
    if (formData.start_datetime && formData.end_datetime) {
      const startDate = new Date(formData.start_datetime)
      const endDate = new Date(formData.end_datetime)
      if (endDate <= startDate) {
        newErrors.end_datetime = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'Lütfen tüm zorunlu alanları doldurun.',
        position: 'top',
        visibilityTime: 2000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Clean up form data - remove empty optional fields
      const submitData: EventFormData = {
        ...formData,
        customer_id: formData.customer_id || undefined,
        description: formData.description?.trim() || undefined,
        contact_method: formData.contact_method || undefined,
        contact_detail: formData.contact_detail?.trim() || undefined,
        reminder_minutes: formData.reminder_minutes || undefined,
        color: formData.color || undefined,
      }

      await createEvent(submitData)
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Etkinlik oluşturuldu.',
        position: 'top',
        visibilityTime: 1500,
      })
      router.back()
    } catch (error: any) {
      console.error('Event creation error:', error)

      // Handle validation errors from backend
      const validationErrors = getValidationErrors(error)
      if (validationErrors) {
        setErrors(flattenErrors(validationErrors))
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: 'Lütfen form hatalarını düzeltin.',
          position: 'top',
          visibilityTime: 2000,
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: getErrorMessage(error),
          position: 'top',
          visibilityTime: 2000,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load options function for SearchableSelect
  const loadContactOptions = useCallback(async (searchQuery: string) => {
    try {
      const response = await getContacts({
        search: searchQuery,
        per_page: 50,
        is_active: true,
      })
      return response.contacts.map((contact) => ({
        label: contact.name,
        value: contact.id,
        subtitle: contact.code || '',
      }))
    } catch (error) {
      console.error('Failed to load contacts:', error)
      return []
    }
  }, [])

  const handleBackPress = useCallback(() => {
    router.back()
  }, [])

  // Modal select handlers
  const handleEventTypeSelect = (value: string | number) => {
    handleInputChange('event_type', value as string)
  }

  const handlePrioritySelect = (value: string | number) => {
    handleInputChange('priority', value as string)
  }

  const handleContactMethodSelect = (value: string | number) => {
    handleInputChange('contact_method', value as string)
  }

  const handleReminderSelect = (value: string | number) => {
    handleInputChange('reminder_minutes', value as number)
  }

  // Get selected labels
  const getEventTypeLabel = () => {
    const option = EVENT_TYPE_OPTIONS.find((opt) => opt.value === formData.event_type)
    return option?.label || 'Tip seçin'
  }

  const getPriorityLabel = () => {
    const option = PRIORITY_OPTIONS.find((opt) => opt.value === formData.priority)
    return option?.label || 'Öncelik seçin'
  }

  const getContactMethodLabel = () => {
    const option = CONTACT_METHOD_OPTIONS.find((opt) => opt.value === formData.contact_method)
    return option?.label || 'Yöntem seçin'
  }

  const getReminderLabel = () => {
    const option = REMINDER_OPTIONS.find((opt) => opt.value === formData.reminder_minutes)
    return option?.label || 'Hatırlatıcı seçin'
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <FormHeader
        title="Yeni Etkinlik"
        onBackPress={handleBackPress}
        onSavePress={handleSubmit}
        isSaving={isSubmitting}
      />


      {/* Content */}
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Basic Information */}
        <SectionHeader title="Temel Bilgiler" />

        <Input
          label="Başlık"
          placeholder="Etkinlik başlığı"
          value={formData.title}
          onChangeText={(value) => handleInputChange('title', value)}
          error={errors.title}
          required
        />

        <Input
          label="Açıklama"
          placeholder="Detaylı açıklama (opsiyonel)"
          value={formData.description || ''}
          onChangeText={(value) => handleInputChange('description', value)}
          error={errors.description}
          multiline
          numberOfLines={3}
        />

        {/* Event Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Etkinlik Tipi <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => eventTypeModalRef.current?.present()}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color={DashboardColors.textSecondary} />
            <Text
              style={[
                styles.selectButtonText,
                formData.event_type && { color: DashboardColors.textPrimary },
              ]}
            >
              {getEventTypeLabel()}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </TouchableOpacity>
          {errors.event_type && <Text style={styles.errorText}>{errors.event_type}</Text>}
        </View>

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Öncelik</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => priorityModalRef.current?.present()}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={20} color={DashboardColors.textSecondary} />
            <Text
              style={[
                styles.selectButtonText,
                formData.priority && { color: DashboardColors.textPrimary },
              ]}
            >
              {getPriorityLabel()}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Date & Time */}
        <SectionHeader title="Tarih & Saat" />

        <DateInput
          label="Başlangıç"
          value={
            formData.start_datetime
              ? formData.start_datetime.split('T')[0]
              : new Date().toISOString().split('T')[0]
          }
          onChangeDate={(date) => handleInputChange('start_datetime', new Date(date).toISOString())}
          error={errors.start_datetime}
          required
        />

        <DateInput
          label="Bitiş"
          value={
            formData.end_datetime
              ? formData.end_datetime.split('T')[0]
              : new Date().toISOString().split('T')[0]
          }
          onChangeDate={(date) => handleInputChange('end_datetime', new Date(date).toISOString())}
          error={errors.end_datetime}
          required
        />

        {/* Customer (Optional) */}
        <SectionHeader title="Müşteri (Opsiyonel)" />

        <SearchableSelect
          label="Müşteri"
          placeholder="Müşteri seçin"
          loadOptions={loadContactOptions}
          value={formData.customer_id}
          onValueChange={(value) => handleInputChange('customer_id', value)}
          error={errors.customer_id}
        />

        {/* Contact Method (Optional) */}
        <SectionHeader title="İletişim Yöntemi (Opsiyonel)" />

        {/* Contact Method */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>İletişim Yöntemi</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => contactMethodModalRef.current?.present()}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={20} color={DashboardColors.textSecondary} />
            <Text
              style={[
                styles.selectButtonText,
                formData.contact_method && { color: DashboardColors.textPrimary },
              ]}
            >
              {getContactMethodLabel()}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </TouchableOpacity>
        </View>

        <Input
          label="İletişim Detayı"
          placeholder="Telefon, e-posta vb."
          value={formData.contact_detail || ''}
          onChangeText={(value) => handleInputChange('contact_detail', value)}
          error={errors.contact_detail}
        />

        {/* Reminder (Optional) */}
        <SectionHeader title="Hatırlatıcı (Opsiyonel)" />

        {/* Reminder */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Hatırlatıcı</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => reminderModalRef.current?.present()}
            activeOpacity={0.7}
          >
            <Ionicons name="alarm-outline" size={20} color={DashboardColors.textSecondary} />
            <Text
              style={[
                styles.selectButtonText,
                formData.reminder_minutes && { color: DashboardColors.textPrimary },
              ]}
            >
              {getReminderLabel()}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Modals */}
      <SearchableSelectModal
        ref={eventTypeModalRef}
        title="Etkinlik Tipi Seçin"
        options={EVENT_TYPE_OPTIONS}
        selectedValue={formData.event_type}
        onSelect={handleEventTypeSelect}
        searchPlaceholder="Tip ara..."
        emptyMessage="Tip bulunamadı"
      />

      <SearchableSelectModal
        ref={priorityModalRef}
        title="Öncelik Seçin"
        options={PRIORITY_OPTIONS}
        selectedValue={formData.priority}
        onSelect={handlePrioritySelect}
        searchPlaceholder="Öncelik ara..."
        emptyMessage="Öncelik bulunamadı"
      />

      <SearchableSelectModal
        ref={contactMethodModalRef}
        title="İletişim Yöntemi Seçin"
        options={CONTACT_METHOD_OPTIONS}
        selectedValue={formData.contact_method}
        onSelect={handleContactMethodSelect}
        searchPlaceholder="Yöntem ara..."
        emptyMessage="Yöntem bulunamadı"
      />

      <SearchableSelectModal
        ref={reminderModalRef}
        title="Hatırlatıcı Seçin"
        options={REMINDER_OPTIONS}
        selectedValue={formData.reminder_minutes}
        onSelect={handleReminderSelect}
        searchPlaceholder="Hatırlatıcı ara..."
        emptyMessage="Hatırlatıcı bulunamadı"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl'],
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DashboardSpacing.xl,
    marginBottom: DashboardSpacing.lg,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: DashboardColors.borderLight,
  },
  sectionHeaderText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginHorizontal: DashboardSpacing.md,
  },

  // Input Group
  inputGroup: {
    marginBottom: DashboardSpacing.lg,
  },
  inputLabel: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs,
  },
  required: {
    color: DashboardColors.danger,
  },

  // Select Button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    minHeight: 48,
  },
  selectButtonText: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
  },

  // Error
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs,
  },
})
