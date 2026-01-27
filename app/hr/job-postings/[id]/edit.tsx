/**
 * Edit Job Posting Screen
 *
 * Update existing job posting.
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
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Save } from 'lucide-react-native';
import { Input, Card } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { DateInput } from '@/components/ui/date-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getJobPosting,
  updateJobPosting,
  JobPostingFormData,
  EmploymentType,
  ExperienceLevel,
} from '@/services/endpoints/job-postings';
import { getErrorMessage, getValidationErrors } from '@/services/api';

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Tam Zamanlı', value: 'full_time' },
  { label: 'Yarı Zamanlı', value: 'part_time' },
  { label: 'Sözleşmeli', value: 'contract' },
  { label: 'Staj', value: 'internship' },
  { label: 'Uzaktan', value: 'remote' },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { label: 'Giriş Seviyesi', value: 'entry' },
  { label: 'Junior', value: 'junior' },
  { label: 'Mid-Level', value: 'mid' },
  { label: 'Senior', value: 'senior' },
  { label: 'Uzman', value: 'expert' },
];

const CURRENCY_OPTIONS = [
  { label: 'Türk Lirası (TRY)', value: 'TRY' },
  { label: 'Amerikan Doları (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
];

export default function EditJobPostingScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<JobPostingFormData>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    position: '',
    location: '',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: undefined,
    salary_max: undefined,
    salary_currency: 'TRY',
    application_deadline: undefined,
    is_public: false,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch job posting
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await getJobPosting(parseInt(id, 10));
        setFormData({
          title: data.title,
          description: data.description,
          requirements: data.requirements || '',
          responsibilities: data.responsibilities || '',
          position: data.position,
          location: data.location || '',
          employment_type: data.employment_type,
          experience_level: data.experience_level,
          salary_min: data.salary_min || undefined,
          salary_max: data.salary_max || undefined,
          salary_currency: data.salary_currency,
          application_deadline: data.application_deadline || undefined,
          is_public: data.is_public,
          is_active: data.is_active,
        });
      } catch (err) {
        showError('Hata', getErrorMessage(err));
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = useCallback(
    (field: keyof JobPostingFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

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

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'İlan başlığı zorunludur.';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'İlan açıklaması zorunludur.';
    }
    if (!formData.position?.trim()) {
      newErrors.position = 'Pozisyon zorunludur.';
    }
    if (!formData.employment_type) {
      newErrors.employment_type = 'İstihdam türü zorunludur.';
    }
    if (!formData.experience_level) {
      newErrors.experience_level = 'Deneyim seviyesi zorunludur.';
    }

    if (formData.salary_min && formData.salary_max) {
      if (formData.salary_max < formData.salary_min) {
        newErrors.salary_max = 'Maksimum maaş, minimum maaştan küçük olamaz.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!id || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateJobPosting(parseInt(id, 10), formData);

      success('Başarılı', 'İş ilanı başarıyla güncellendi.');
      router.back();
    } catch (error: any) {
      const validationErrors = getValidationErrors(error);
      if (validationErrors) {
        const flatErrors: Record<string, string> = {};
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0];
          }
        });
        setErrors(flatErrors);
      } else {
        showError('Hata', getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [id, formData, validateForm, success, showError]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="İş İlanı Düzenle"
        subtitle="İlan bilgilerini güncelleyin"
        rightIcons={
          <TouchableOpacity onPress={handleSubmit} activeOpacity={0.7} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Bilgiler</Text>

            <Input
              label="İlan Başlığı *"
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              error={errors.title}
            />

            <Input
              label="Pozisyon *"
              value={formData.position}
              onChangeText={(value) => handleInputChange('position', value)}
              error={errors.position}
            />

            <Input
              label="Lokasyon"
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              error={errors.location}
            />

            <SelectInput
              label="İstihdam Türü *"
              value={formData.employment_type}
              onValueChange={(value) => handleInputChange('employment_type', value as EmploymentType)}
              options={EMPLOYMENT_TYPE_OPTIONS}
              error={errors.employment_type}
            />

            <SelectInput
              label="Deneyim Seviyesi *"
              value={formData.experience_level}
              onValueChange={(value) =>
                handleInputChange('experience_level', value as ExperienceLevel)
              }
              options={EXPERIENCE_LEVEL_OPTIONS}
              error={errors.experience_level}
            />
          </Card>

          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Açıklama</Text>

            <Input
              label="İlan Açıklaması *"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={6}
              error={errors.description}
            />

            <Input
              label="Aranan Nitelikler"
              value={formData.requirements}
              onChangeText={(value) => handleInputChange('requirements', value)}
              multiline
              numberOfLines={4}
              error={errors.requirements}
            />

            <Input
              label="Sorumluluklar"
              value={formData.responsibilities}
              onChangeText={(value) => handleInputChange('responsibilities', value)}
              multiline
              numberOfLines={4}
              error={errors.responsibilities}
            />
          </Card>

          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Maaş Bilgileri</Text>

            <SelectInput
              label="Para Birimi"
              value={formData.salary_currency || 'TRY'}
              onValueChange={(value) => handleInputChange('salary_currency', value)}
              options={CURRENCY_OPTIONS}
            />

            <Input
              label="Minimum Maaş"
              value={formData.salary_min?.toString() || ''}
              onChangeText={(value) =>
                handleInputChange('salary_min', value ? parseFloat(value) : undefined)
              }
              keyboardType="numeric"
              error={errors.salary_min}
            />

            <Input
              label="Maksimum Maaş"
              value={formData.salary_max?.toString() || ''}
              onChangeText={(value) =>
                handleInputChange('salary_max', value ? parseFloat(value) : undefined)
              }
              keyboardType="numeric"
              error={errors.salary_max}
            />
          </Card>

          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Başvuru Ayarları</Text>

            <DateInput
              label="Başvuru Son Tarihi"
              value={formData.application_deadline || ''}
              onChangeDate={(value) => handleInputChange('application_deadline', value)}
              error={errors.application_deadline}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={[styles.switchText, { color: colors.text }]}>Herkese Açık</Text>
                <Text style={[styles.switchSubtext, { color: colors.textSecondary }]}>
                  İlan herkese görünür olsun
                </Text>
              </View>
              <Switch
                value={formData.is_public}
                onValueChange={(value) => handleInputChange('is_public', value)}
                trackColor={{ false: colors.border, true: Brand.primaryLight }}
                thumbColor={formData.is_public ? Brand.primary : colors.surface}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={[styles.switchText, { color: colors.text }]}>Aktif</Text>
                <Text style={[styles.switchSubtext, { color: colors.textSecondary }]}>
                  İlan aktif olsun
                </Text>
              </View>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => handleInputChange('is_active', value)}
                trackColor={{ false: colors.border, true: Brand.primaryLight }}
                thumbColor={formData.is_active ? Brand.primary : colors.surface}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  switchLabel: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchText: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  switchSubtext: {
    ...Typography.bodySM,
  },
});
