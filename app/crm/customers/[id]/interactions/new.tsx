import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useToast } from '@/hooks/use-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save, Users, Phone, Mail, Clock } from 'lucide-react-native';
import { Input, Button, Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  createInteraction,
  InteractionFormData,
  InteractionType,
  InteractionStatus,
} from '@/services/endpoints/customer-interactions';

const INTERACTION_TYPES = [
  { value: 'meeting', label: 'Toplantı', icon: Users },
  { value: 'call', label: 'Arama', icon: Phone },
  { value: 'email', label: 'E-posta', icon: Mail },
  { value: 'follow_up', label: 'Takip', icon: Clock },
] as const;

export default function NewInteractionScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = parseInt(id, 10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<InteractionFormData>({
    interaction_type: 'meeting',
    subject: '',
    description: '',
    interaction_date: new Date().toISOString().split('T')[0],
    next_followup_date: '',
    status: 'pending',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.interaction_type) {
      newErrors.interaction_type = 'Görüşme tipi zorunludur';
    }

    if (!formData.subject?.trim()) {
      newErrors.subject = 'Konu zorunludur';
    }

    if (!formData.interaction_date) {
      newErrors.interaction_date = 'Görüşme tarihi zorunludur';
    }

    // Validate date format
    if (formData.interaction_date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.interaction_date)) {
      newErrors.interaction_date = 'Geçersiz tarih formatı';
    }

    // Validate follow-up date if provided
    if (
      formData.next_followup_date &&
      !/^\d{4}-\d{2}-\d{2}$/.test(formData.next_followup_date)
    ) {
      newErrors.next_followup_date = 'Geçersiz tarih formatı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Hata', 'Lütfen formu eksiksiz doldurunuz');
      return;
    }

    setIsSubmitting(true);
    try {
      await createInteraction(customerId, formData);
      success('Başarılı', 'Görüşme başarıyla oluşturuldu');
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      showError('Hata', err instanceof Error ? err.message : 'Görüşme oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Görüşme</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: isSubmitting ? colors.border : Brand.primary },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Interaction Type */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Görüşme Tipi</Text>

            <View style={styles.typeGrid}>
              {INTERACTION_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = formData.interaction_type === type.value;

                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isActive ? Brand.primary + '15' : colors.surface,
                        borderColor: isActive ? Brand.primary : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, interaction_type: type.value as InteractionType })
                    }
                  >
                    <Icon size={24} color={isActive ? Brand.primary : colors.textSecondary} />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: isActive ? Brand.primary : colors.text },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.interaction_type && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.interaction_type}
              </Text>
            )}
          </Card>

          {/* Basic Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Görüşme Detayları</Text>

            <Input
              label="Konu"
              placeholder="Görüşme konusu"
              value={formData.subject}
              onChangeText={(value) => setFormData({ ...formData, subject: value })}
              error={errors.subject}
              required
            />

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Açıklama
              </Text>
              <Input
                placeholder="Görüşme notları ve detayları..."
                value={formData.description}
                onChangeText={(value) => setFormData({ ...formData, description: value })}
                multiline
                numberOfLines={4}
                style={styles.textArea}
              />
            </View>
          </Card>

          {/* Dates */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarihler</Text>

            <Input
              label="Görüşme Tarihi"
              placeholder="YYYY-MM-DD"
              value={formData.interaction_date}
              onChangeText={(value) => setFormData({ ...formData, interaction_date: value })}
              error={errors.interaction_date}
              required
              type="date"
            />

            <Input
              label="Sonraki Takip Tarihi"
              placeholder="YYYY-MM-DD"
              value={formData.next_followup_date}
              onChangeText={(value) => setFormData({ ...formData, next_followup_date: value })}
              error={errors.next_followup_date}
              type="date"
            />
          </Card>

          {/* Status */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum</Text>

            <View style={styles.formGroup}>
              <View style={styles.statusButtons}>
                {[
                  { value: 'pending', label: 'Beklemede', color: colors.warning },
                  { value: 'completed', label: 'Tamamlandı', color: colors.success },
                  { value: 'cancelled', label: 'İptal Edildi', color: colors.textMuted },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusButton,
                      formData.status === status.value && [
                        styles.statusButtonActive,
                        { borderColor: status.color },
                      ],
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        status: status.value as InteractionStatus,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        {
                          color: formData.status === status.value ? status.color : colors.text,
                        },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Submit Button */}
          <Button
            title={isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            variant="primary"
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  saveButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeLabel: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    minWidth: '30%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 2,
  },
  statusButtonText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography.bodyXS,
    marginTop: Spacing.sm,
  },
});
