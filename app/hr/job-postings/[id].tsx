/**
 * Job Posting Detail Screen
 *
 * View and manage job posting details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Edit, Trash2, Globe, Eye, Users, Calendar, Briefcase } from 'lucide-react-native';
import { Card, Badge, Button } from '@/components/ui';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getJobPosting,
  deleteJobPosting,
  togglePublishJobPosting,
  JobPosting,
  getEmploymentTypeLabel,
  getExperienceLevelLabel,
  formatSalaryRange,
  getStatusLabel,
  getVisibilityLabel,
  isJobPostingExpired,
} from '@/services/endpoints/job-postings';
import { getApplicationStatusLabel, getApplicationStatusColor } from '@/services/endpoints/job-applications';
import { formatDate } from '@/utils/formatters';
import { getErrorMessage } from '@/services/api';

export default function JobPostingDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Fetch job posting
  useEffect(() => {
    const fetchJobPosting = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await getJobPosting(parseInt(id, 10));
        setJobPosting(data);
      } catch (err) {
        showError('Hata', getErrorMessage(err));
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobPosting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert('İş İlanını Sil', 'Bu iş ilanını silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          setIsDeleting(true);
          try {
            await deleteJobPosting(parseInt(id, 10));
            success('Başarılı', 'İş ilanı silindi.');
            router.back();
          } catch (err) {
            showError('Hata', getErrorMessage(err));
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [id, success, showError]);

  // Handle toggle publish
  const handleTogglePublish = useCallback(async () => {
    if (!id || !jobPosting) return;

    const action = jobPosting.is_public ? 'yayından kaldır' : 'yayınla';
    Alert.alert(
      `İş İlanını ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Bu iş ilanını ${action}mak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            setIsTogglingPublish(true);
            try {
              const updated = await togglePublishJobPosting(parseInt(id, 10));
              setJobPosting(updated);
              success('Başarılı', `İş ilanı ${action}ndı.`);
            } catch (err) {
              showError('Hata', getErrorMessage(err));
            } finally {
              setIsTogglingPublish(false);
            }
          },
        },
      ]
    );
  }, [id, jobPosting, success, showError]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (!jobPosting) {
    return null;
  }

  const expired = isJobPostingExpired(jobPosting);
  const applicationCount = jobPosting.applications_count || jobPosting.application_count || 0;

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title={jobPosting.title}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push(`/hr/job-postings/${id}/edit`)}
              activeOpacity={0.7}
            >
              <Edit size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Trash2 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Status Badges */}
        <View style={styles.statusRow}>
          <Badge
            label={getStatusLabel(jobPosting.is_active)}
            variant={jobPosting.is_active ? 'success' : 'error'}
          />
          <Badge label={getVisibilityLabel(jobPosting.is_public)} variant="info" />
          {expired && <Badge label="Süresi Doldu" variant="warning" />}
        </View>

        {/* Publish/Unpublish Button */}
        <Button
          title={jobPosting.is_public ? 'Yayından Kaldır' : 'Yayınla'}
          onPress={handleTogglePublish}
          variant={jobPosting.is_public ? 'secondary' : 'primary'}
          loading={isTogglingPublish}
          icon={<Globe size={18} color={jobPosting.is_public ? colors.text : '#FFFFFF'} />}
          style={styles.publishButton}
        />

        {/* Statistics */}
        <Card variant="outlined" style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${Brand.primary}15` }]}>
                <Eye size={20} color={Brand.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{jobPosting.view_count}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Görüntülenme</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${Brand.primary}15` }]}>
                <Users size={20} color={Brand.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{applicationCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Başvuru</Text>
            </View>
            {jobPosting.recent_applications_count !== undefined && (
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: `${Brand.primary}15` }]}>
                  <Calendar size={20} color={Brand.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {jobPosting.recent_applications_count}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Son 30 Gün</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Basic Info */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Genel Bilgiler</Text>
          <DetailRow label="Pozisyon" value={jobPosting.position} />
          <DetailRow label="Lokasyon" value={jobPosting.location || '-'} />
          <DetailRow label="İstihdam Türü" value={getEmploymentTypeLabel(jobPosting.employment_type)} />
          <DetailRow label="Deneyim Seviyesi" value={getExperienceLevelLabel(jobPosting.experience_level)} />
          <DetailRow
            label="Maaş Aralığı"
            value={formatSalaryRange(jobPosting.salary_min, jobPosting.salary_max, jobPosting.salary_currency)}
          />
          <DetailRow
            label="Başvuru Son Tarihi"
            value={jobPosting.application_deadline ? formatDate(jobPosting.application_deadline, 'dd.MM.yyyy') : '-'}
          />
        </Card>

        {/* Description */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Açıklama</Text>
          <Text style={[styles.description, { color: colors.text }]}>{jobPosting.description}</Text>
        </Card>

        {/* Requirements */}
        {jobPosting.requirements && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Aranan Nitelikler</Text>
            <Text style={[styles.description, { color: colors.text }]}>{jobPosting.requirements}</Text>
          </Card>
        )}

        {/* Responsibilities */}
        {jobPosting.responsibilities && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sorumluluklar</Text>
            <Text style={[styles.description, { color: colors.text }]}>{jobPosting.responsibilities}</Text>
          </Card>
        )}

        {/* Applications */}
        {jobPosting.applications && jobPosting.applications.length > 0 && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Başvurular ({jobPosting.applications.length})</Text>
            {jobPosting.applications.map((application: any) => (
              <TouchableOpacity
                key={application.id}
                style={styles.applicationItem}
                onPress={() => router.push(`/hr/job-applications/${application.id}`)}
              >
                <View style={styles.applicationInfo}>
                  <Text style={[styles.applicationName, { color: colors.text }]}>
                    {application.first_name} {application.last_name}
                  </Text>
                  <Text style={[styles.applicationDate, { color: colors.textSecondary }]}>
                    {formatDate(application.application_date, 'dd.MM.yyyy')}
                  </Text>
                </View>
                <Badge
                  label={getApplicationStatusLabel(application.status)}
                  variant={getApplicationStatusColor(application.status)}
                  size="sm"
                />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Dates */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tarihler</Text>
          <DetailRow label="Oluşturulma" value={formatDate(jobPosting.created_at, 'dd.MM.yyyy HH:mm')} />
          <DetailRow label="Güncellenme" value={formatDate(jobPosting.updated_at, 'dd.MM.yyyy HH:mm')} />
          {jobPosting.published_at && (
            <DetailRow label="Yayın Tarihi" value={formatDate(jobPosting.published_at, 'dd.MM.yyyy HH:mm')} />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

// Detail row component
function DetailRow({ label, value }: { label: string; value: string }) {
  const colors = Colors.light;
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  publishButton: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.headingLG,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.bodySM,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  detailLabel: {
    ...Typography.bodyMD,
    flex: 1,
  },
  detailValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  description: {
    ...Typography.bodyMD,
    lineHeight: 22,
  },
  applicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  applicationInfo: {
    flex: 1,
  },
  applicationName: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  applicationDate: {
    ...Typography.bodySM,
  },
});
