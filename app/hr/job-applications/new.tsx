/**
 * New Job Application Screen
 *
 * Create new job application (başvuru).
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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Save, Upload, FileText, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Input, Card, Button } from '@/components/ui';
import { SelectInput } from '@/components/ui/select-input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DateInput } from '@/components/ui/date-input';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, Shadows, BorderRadius } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  createJobApplication,
  JobApplicationFormData,
  ApplicationStatus,
} from '@/services/endpoints/job-applications';
import { getJobPostings, JobPosting } from '@/services/endpoints/job-postings';
import { getErrorMessage, getValidationErrors } from '@/services/api';

const STATUS_OPTIONS = [
  { label: 'Başvuru Alındı', value: 'başvuru_alındı' },
  { label: 'Değerlendiriliyor', value: 'değerlendiriliyor' },
  { label: 'Mülakat Planlandı', value: 'mülakat_planlandı' },
  { label: 'Onaylandı', value: 'onaylandı' },
  { label: 'Reddedildi', value: 'reddedildi' },
  { label: 'İptal Edildi', value: 'iptal_edildi' },
];

export default function NewJobApplicationScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  // Form state
  const [formData, setFormData] = useState<JobApplicationFormData>({
    job_posting_id: undefined,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    cv_file: undefined,
    application_date: new Date().toISOString().split('T')[0],
    status: 'başvuru_alındı',
    notes: '',
  });

  const [cvFile, setCvFile] = useState<{ name: string; uri: string; type: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Job postings for dropdown
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loadingJobPostings, setLoadingJobPostings] = useState(false);

  // Fetch job postings
  useEffect(() => {
    const fetchJobPostings = async () => {
      setLoadingJobPostings(true);
      try {
        const response = await getJobPostings({ per_page: 100, is_active: true });
        setJobPostings(response.jobPostings);
      } catch (err) {
        console.error('Failed to load job postings:', err);
      } finally {
        setLoadingJobPostings(false);
      }
    };
    fetchJobPostings();
  }, []);

  // Handle input change
  const handleInputChange = useCallback(
    (field: keyof JobApplicationFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Auto-fill position if job posting is selected
      if (field === 'job_posting_id' && value) {
        const selectedJobPosting = jobPostings.find((jp) => jp.id === value);
        if (selectedJobPosting) {
          setFormData((prev) => ({ ...prev, position: selectedJobPosting.position }));
        }
      }

      if (errors[field]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors, jobPostings]
  );

  // Handle CV file pick
  const handlePickCV = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check file size (max 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          showError('Hata', 'Dosya boyutu 10 MB\'dan küçük olmalıdır.');
          return;
        }

        setCvFile({
          name: file.name,
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
        });

        setFormData((prev) => ({ ...prev, cv_file: file as any }));

        if (errors.cv_file) {
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors.cv_file;
            return newErrors;
          });
        }
      }
    } catch (err) {
      console.error('Document picker error:', err);
      showError('Hata', 'Dosya seçilemedi.');
    }
  }, [errors, showError]);

  // Handle remove CV
  const handleRemoveCV = useCallback(() => {
    setCvFile(null);
    setFormData((prev) => ({ ...prev, cv_file: undefined }));
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Ad zorunludur.';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Soyad zorunludur.';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'E-posta zorunludur.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin.';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Telefon zorunludur.';
    }
    if (!formData.position?.trim()) {
      newErrors.position = 'Pozisyon zorunludur.';
    }
    if (!formData.application_date) {
      newErrors.application_date = 'Başvuru tarihi zorunludur.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createJobApplication(formData);

      success('Başarılı', 'Başvuru başarıyla oluşturuldu.');
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
  }, [formData, validateForm, success, showError]);

  // Prepare job posting options
  const jobPostingOptions = jobPostings.map((jp) => ({
    label: jp.title,
    value: jp.id,
    subtitle: jp.position,
  }));

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Yeni Başvuru"
        subtitle="Başvuru bilgilerini girin"
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Başvurucu Bilgileri
            </Text>

            <Input
              label="Ad *"
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              placeholder="Adı girin"
              error={errors.first_name}
            />

            <Input
              label="Soyad *"
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              placeholder="Soyadı girin"
              error={errors.last_name}
            />

            <Input
              label="E-posta *"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Telefon *"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="+90 5XX XXX XX XX"
              keyboardType="phone-pad"
              error={errors.phone}
            />
          </Card>

          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>İş İlanı</Text>

            <SearchableSelect
              label="İş İlanı (Opsiyonel)"
              value={formData.job_posting_id || 0}
              onValueChange={(value) => handleInputChange('job_posting_id', value || undefined)}
              options={jobPostingOptions}
              placeholder="İş ilanı seçin"
              searchPlaceholder="İlan ara..."
              isLoading={loadingJobPostings}
              error={errors.job_posting_id}
            />

            <Input
              label="Başvurulan Pozisyon *"
              value={formData.position}
              onChangeText={(value) => handleInputChange('position', value)}
              placeholder="Pozisyon adı"
              error={errors.position}
            />
          </Card>

          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>CV Dosyası</Text>

            {!cvFile ? (
              <Button
                title="CV Yükle"
                onPress={handlePickCV}
                variant="secondary"
                icon={<Upload size={18} color={colors.text} />}
              />
            ) : (
              <View style={[styles.filePreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <FileText size={24} color={Brand.primary} />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                    {cvFile.name}
                  </Text>
                  <Text style={[styles.fileType, { color: colors.textSecondary }]}>
                    {cvFile.type}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemoveCV} style={styles.removeButton}>
                  <X size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
            {errors.cv_file && (
              <Text style={[styles.errorText, { color: colors.error }]}>{errors.cv_file}</Text>
            )}
          </Card>

          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Başvuru Detayları
            </Text>

            <DateInput
              label="Başvuru Tarihi *"
              value={formData.application_date}
              onChangeDate={(value) => handleInputChange('application_date', value)}
              error={errors.application_date}
            />

            <SelectInput
              label="Durum"
              value={formData.status || 'başvuru_alındı'}
              onValueChange={(value) => handleInputChange('status', value as ApplicationStatus)}
              options={STATUS_OPTIONS}
              error={errors.status}
            />

            <Input
              label="Notlar"
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="Değerlendirme notları..."
              multiline
              numberOfLines={4}
              error={errors.notes}
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
    backgroundColor: Brand.primary,
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
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  fileName: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileType: {
    ...Typography.bodySM,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
});
