/**
 * New Event Screen
 *
 * Create new event (ajanda kaydı).
 * Matches backend StoreEventRequest validation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Card } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DateInput } from '@/components/ui/date-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, BorderRadius, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createEvent,
  EventFormData,
  EventType,
  EventPriority,
  EventStatus,
  ContactMethod,
  ReminderMinutes,
} from '@/services/endpoints/events';
import { getContacts } from '@/services/endpoints/contacts';
import { getErrorMessage, getValidationErrors } from '@/services/api';

// Event type options
const EVENT_TYPE_OPTIONS = [
  { label: 'Arama', value: 'call' },
  { label: 'Toplantı', value: 'meeting' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'E-posta', value: 'email' },
  { label: 'Görev', value: 'task' },
  { label: 'Son Tarih', value: 'deadline' },
];

// Priority options
const PRIORITY_OPTIONS = [
  { label: 'Düşük', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'Yüksek', value: 'high' },
  { label: 'Acil', value: 'urgent' },
];

// Contact method options
const CONTACT_METHOD_OPTIONS = [
  { label: 'Telefon', value: 'phone' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Video Görüşme', value: 'video_call' },
  { label: 'Yüz Yüze', value: 'in_person' },
  { label: 'E-posta', value: 'email' },
];

// Reminder options
const REMINDER_OPTIONS = [
  { label: '15 dakika önce', value: 15 },
  { label: '30 dakika önce', value: 30 },
  { label: '1 saat önce', value: 60 },
  { label: '1 gün önce', value: 1440 },
];

function flattenErrors(validationErrors: any): Record<string, string> {
  const flattened: Record<string, string> = {};
  Object.keys(validationErrors).forEach((key) => {
    const messages = validationErrors[key];
    if (Array.isArray(messages)) {
      flattened[key] = messages.join(' ');
    } else {
      flattened[key] = String(messages);
    }
  });
  return flattened;
}

export default function NewEventScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Get current date and 1 hour later for defaults
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

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
    color: '#10b981', // Brand primary as default
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof EventFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field
      if (errors[field]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validation function matching backend rules
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title?.trim()) {
      newErrors.title = 'Başlık zorunludur.';
    }
    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Başlangıç tarihi zorunludur.';
    }
    if (!formData.end_datetime) {
      newErrors.end_datetime = 'Bitiş tarihi zorunludur.';
    }
    if (!formData.event_type) {
      newErrors.event_type = 'Etkinlik tipi zorunludur.';
    }

    // Date validation
    if (formData.start_datetime && formData.end_datetime) {
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);
      if (endDate <= startDate) {
        newErrors.end_datetime = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setIsSubmitting(true);
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
      };

      await createEvent(submitData);
      success('Başarılı', 'Etkinlik oluşturuldu.');
      router.back();
    } catch (error: any) {
      console.error('Event creation error:', error);

      // Handle validation errors from backend
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        setErrors(flattenErrors(validationErrors));
        showError('Hata', 'Lütfen form hatalarını düzeltin.');
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load options function for SearchableSelect
  const loadContactOptions = useCallback(
    async (searchQuery: string) => {
      try {
        const response = await getContacts({
          search: searchQuery,
          per_page: 50,
          is_active: true,
        });
        return response.contacts.map((contact) => ({
          label: contact.name,
          value: contact.id,
          subtitle: contact.code || '',
        }));
      } catch (error) {
        console.error('Failed to load contacts:', error);
        return [];
      }
    },
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Yeni Etkinlik"
        subtitle="Etkinlik bilgilerini girin"
        showBackButton
        rightIcons={
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

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

            <SelectInput
              label="Etkinlik Tipi"
              placeholder="Tip seçin"
              value={formData.event_type}
              options={EVENT_TYPE_OPTIONS}
              onValueChange={(value) => handleInputChange('event_type', value)}
              error={errors.event_type}
              required
            />

            <SelectInput
              label="Öncelik"
              placeholder="Öncelik seçin"
              value={formData.priority || 'normal'}
              options={PRIORITY_OPTIONS}
              onValueChange={(value) => handleInputChange('priority', value)}
              error={errors.priority}
            />
          </Card>

          {/* Date & Time */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarih & Saat</Text>

            <DateInput
              label="Başlangıç"
              value={formData.start_datetime ? new Date(formData.start_datetime) : new Date()}
              onChange={(date) => handleInputChange('start_datetime', date.toISOString())}
              mode="datetime"
              error={errors.start_datetime}
              required
            />

            <DateInput
              label="Bitiş"
              value={formData.end_datetime ? new Date(formData.end_datetime) : new Date()}
              onChange={(date) => handleInputChange('end_datetime', date.toISOString())}
              mode="datetime"
              error={errors.end_datetime}
              required
            />
          </Card>

          {/* Customer (Optional) */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Müşteri (Opsiyonel)</Text>

            <SearchableSelect
              label="Müşteri"
              placeholder="Müşteri seçin"
              loadOptions={loadContactOptions}
              value={formData.customer_id}
              onValueChange={(value) => handleInputChange('customer_id', value)}
              error={errors.customer_id}
            />
          </Card>

          {/* Contact Method (Optional) */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              İletişim Yöntemi (Opsiyonel)
            </Text>

            <SelectInput
              label="İletişim Yöntemi"
              placeholder="Yöntem seçin"
              value={formData.contact_method || ''}
              options={CONTACT_METHOD_OPTIONS}
              onValueChange={(value) =>
                handleInputChange('contact_method', value || undefined)
              }
              error={errors.contact_method}
            />

            <Input
              label="İletişim Detayı"
              placeholder="Telefon, e-posta vb."
              value={formData.contact_detail || ''}
              onChangeText={(value) => handleInputChange('contact_detail', value)}
              error={errors.contact_detail}
            />
          </Card>

          {/* Reminder (Optional) */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Hatırlatıcı (Opsiyonel)
            </Text>

            <SelectInput
              label="Hatırlatıcı"
              placeholder="Hatırlatıcı seçin"
              value={formData.reminder_minutes || ''}
              options={REMINDER_OPTIONS}
              onValueChange={(value) =>
                handleInputChange('reminder_minutes', value || undefined)
              }
              error={errors.reminder_minutes}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
});
