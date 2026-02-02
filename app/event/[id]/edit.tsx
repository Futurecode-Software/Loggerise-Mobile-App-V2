/**
 * Edit Event Screen (Etkinlik Düzenle)
 *
 * Dashboard theme + animasyonlu header + BottomSheetModal selects
 * CLAUDE.md standartlarına tam uyumlu
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
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
import { getEvent, updateEvent, Event, EventFormData } from '@/services/endpoints/events'
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

// Status options
const STATUS_OPTIONS = [
  { label: 'Beklemede', value: 'pending' },
  { label: 'Tamamlandı', value: 'completed' },
  { label: 'İptal', value: 'cancelled' },
  { label: 'Ertelendi', value: 'rescheduled' },
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

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)

  // Modal refs
  const eventTypeModalRef = useRef<SearchableSelectModalRef>(null)
  const priorityModalRef = useRef<SearchableSelectModalRef>(null)
  const statusModalRef = useRef<SearchableSelectModalRef>(null)
  const contactMethodModalRef = useRef<SearchableSelectModalRef>(null)
  const reminderModalRef = useRef<SearchableSelectModalRef>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)

  // Animasyonlu dekoratif daireler
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  useEffect(() => {
    // Orb 1 - Yukarı aşağı hareket + pulse
    orb1TranslateY.value = withRepeat(
      withTiming(15, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
    orb1Scale.value = withRepeat(
      withTiming(1.1, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )

    // Orb 2 - Sağa sola hareket + pulse
    orb2TranslateX.value = withRepeat(
      withTiming(20, {
        duration: 5000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
    orb2Scale.value = withRepeat(
      withTiming(1.15, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orb1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1TranslateY.value }, { scale: orb1Scale.value }],
  }))

  const orb2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2TranslateX.value }, { scale: orb2Scale.value }],
  }))

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_datetime: new Date().toISOString(),
    end_datetime: new Date().toISOString(),
    is_all_day: false,
    event_type: 'meeting',
    priority: 'normal',
    status: 'pending',
    customer_id: undefined,
    contact_method: undefined,
    contact_detail: '',
    reminder_minutes: undefined,
    color: DashboardColors.primary,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return

      setIsLoading(true)
      try {
        const data = await getEvent(parseInt(id, 10))
        setEvent(data)

        // Populate form with event data
        setFormData({
          title: data.title,
          description: data.description || '',
          start_datetime: data.start_datetime,
          end_datetime: data.end_datetime,
          is_all_day: data.is_all_day,
          event_type: data.event_type,
          priority: data.priority,
          status: data.status,
          customer_id: data.customer_id || undefined,
          contact_method: data.contact_method || undefined,
          contact_detail: data.contact_detail || '',
          reminder_minutes: data.reminder_minutes || undefined,
          color: data.color || DashboardColors.primary,
          outcome: data.outcome || undefined,
          next_action: data.next_action || undefined,
        })
      } catch (err) {
        console.error('Event fetch error:', err)
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: err instanceof Error ? err.message : 'Etkinlik yüklenemedi',
          position: 'top',
          visibilityTime: 2000,
        })
        router.back()
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [id])

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
    if (!id) return

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
        outcome: formData.outcome?.trim() || undefined,
        next_action: formData.next_action?.trim() || undefined,
      }

      await updateEvent(parseInt(id, 10), submitData)
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Etkinlik güncellendi.',
        position: 'top',
        visibilityTime: 1500,
      })
      router.back()
    } catch (error: any) {
      console.error('Event update error:', error)

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

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const handleSavePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    handleSubmit()
  }

  // Modal select handlers
  const handleEventTypeSelect = (value: string | number) => {
    handleInputChange('event_type', value as string)
  }

  const handlePrioritySelect = (value: string | number) => {
    handleInputChange('priority', value as string)
  }

  const handleStatusSelect = (value: string | number) => {
    handleInputChange('status', value as string)
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

  const getStatusLabel = () => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === formData.status)
    return option?.label || 'Durum seçin'
  }

  const getContactMethodLabel = () => {
    const option = CONTACT_METHOD_OPTIONS.find((opt) => opt.value === formData.contact_method)
    return option?.label || 'Yöntem seçin'
  }

  const getReminderLabel = () => {
    const option = REMINDER_OPTIONS.find((opt) => opt.value === formData.reminder_minutes)
    return option?.label || 'Hatırlatıcı seçin'
  }

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
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Etkinliği Düzenle</Text>
              </View>
              <View style={styles.headerButton} />
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Etkinlik yükleniyor...</Text>
        </View>
      </View>
    )
  }

  if (!event) return null

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Animasyonlu glow orbs */}
        <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
        <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Etkinliği Düzenle</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {event.title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSavePress}
              style={styles.headerButton}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

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

        {/* Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Durum</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => statusModalRef.current?.present()}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={20} color={DashboardColors.textSecondary} />
            <Text
              style={[
                styles.selectButtonText,
                formData.status && { color: DashboardColors.textPrimary },
              ]}
            >
              {getStatusLabel()}
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

        {/* Outcome & Next Action (for completed events) */}
        {formData.status === 'completed' && (
          <>
            <SectionHeader title="Sonuç" />

            <Input
              label="Sonuç"
              placeholder="Etkinlik sonucu"
              value={formData.outcome || ''}
              onChangeText={(value) => handleInputChange('outcome', value)}
              error={errors.outcome}
              multiline
              numberOfLines={3}
            />

            <SectionHeader title="Sonraki Adım" />

            <Input
              label="Sonraki Adım"
              placeholder="Yapılacak sonraki işlem"
              value={formData.next_action || ''}
              onChangeText={(value) => handleInputChange('next_action', value)}
              error={errors.next_action}
              multiline
              numberOfLines={2}
            />
          </>
        )}
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
        ref={statusModalRef}
        title="Durum Seçin"
        options={STATUS_OPTIONS}
        selectedValue={formData.status}
        onSelect={handleStatusSelect}
        searchPlaceholder="Durum ara..."
        emptyMessage="Durum bulunamadı"
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

  // Header
  headerContainer: {
    position: 'relative',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.md,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
  },
  headerTitle: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DashboardColors.background,
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md,
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
