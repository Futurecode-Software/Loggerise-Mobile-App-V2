/**
 * Edit Event Screen
 *
 * Edit existing event (ajanda kaydı).
 * Matches backend UpdateEventRequest validation.
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
import { router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Card } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DateInput } from '@/components/ui/date-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, BorderRadius, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getEvent,
  updateEvent,
  Event,
  EventFormData,
  EventType,
  EventPriority,
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

// Status options (for edit only)
const STATUS_OPTIONS = [
  { label: 'Beklemede', value: 'pending' },
  { label: 'Tamamlandı', value: 'completed' },
  { label: 'İptal', value: 'cancelled' },
  { label: 'Ertelendi', value: 'rescheduled' },
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

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

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
    color: '#10b981',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await getEvent(parseInt(id, 10));
        setEvent(data);

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
          color: data.color || '#10b981',
          outcome: data.outcome || undefined,
          next_action: data.next_action || undefined,
        });
      } catch (err) {
        console.error('Event fetch error:', err);
        showError('Hata', err instanceof Error ? err.message : 'Etkinlik yüklenemedi');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

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
    if (!id) return;

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

      await updateEvent(parseInt(id, 10), submitData);
      success('Başarılı', 'Etkinlik güncellendi.');
      router.back();
    } catch (error: any) {
      console.error('Event update error:', error);

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

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader title="Etkinliği Düzenle" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Etkinlik yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (!event) return null;

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Etkinliği Düzenle"
        subtitle={event.title}
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

            <SelectInput
              label="Durum"
              placeholder="Durum seçin"
              value={formData.status || 'pending'}
              options={STATUS_OPTIONS}
              onValueChange={(value) => handleInputChange('status', value)}
              error={errors.status}
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

          {/* Outcome & Next Action (for completed events) */}
          {event.status === 'completed' && (
            <>
              <Card style={styles.card}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Sonuç</Text>

                <Input
                  label="Sonuç"
                  placeholder="Etkinlik sonucu"
                  value={formData.outcome || ''}
                  onChangeText={(value) => handleInputChange('outcome', value)}
                  error={errors.outcome}
                  multiline
                  numberOfLines={3}
                />
              </Card>

              <Card style={styles.card}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Sonraki Adım</Text>

                <Input
                  label="Sonraki Adım"
                  placeholder="Yapılacak sonraki işlem"
                  value={formData.next_action || ''}
                  onChangeText={(value) => handleInputChange('next_action', value)}
                  error={errors.next_action}
                  multiline
                  numberOfLines={2}
                />
              </Card>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
});
