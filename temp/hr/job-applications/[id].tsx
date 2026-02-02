/**
 * Job Application Detail Screen
 *
 * View and manage job application details.
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
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Edit, Trash2, Download, CheckCircle, Calendar, MessageCircle } from 'lucide-react-native';
import { Card, Badge, Button } from '@/components/ui';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import { useToast } from '@/hooks/use-toast';
import {
  getJobApplication,
  deleteJobApplication,
  approveJobApplication,
  downloadCV,
  JobApplication,
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getFullName,
  formatDate,
  formatTime,
  getInterviewTypeLabel,
  getInterviewResultLabel,
  getInterviewResultColor,
} from '@/services/endpoints/job-applications';
import { formatDate as formatDateUtil } from '@/utils/formatters';
import { getErrorMessage } from '@/services/api';

export default function JobApplicationDetailScreen() {
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { success, error: showError } = useToast();

  const [jobApplication, setJobApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDownloadingCV, setIsDownloadingCV] = useState(false);

  // Fetch job application
  const fetchJobApplication = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await getJobApplication(parseInt(id, 10));
      setJobApplication(data);
    } catch (err) {
      showError('Hata', getErrorMessage(err));
      router.back();
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchJobApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle delete
  const handleDelete = useCallback(() => {
    Alert.alert('Başvuruyu Sil', 'Bu başvuruyu silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          setIsDeleting(true);
          try {
            await deleteJobApplication(parseInt(id, 10));
            success('Başarılı', 'Başvuru silindi.');
            router.back();
          } catch (err) {
            showError('Hata', getErrorMessage(err));
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [id, success, showError]);

  // Handle approve
  const handleApprove = useCallback(() => {
    Alert.alert(
      'Başvuruyu Onayla',
      'Bu başvuruyu onaylamak ve personel kaydı oluşturmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            if (!id) return;
            setIsApproving(true);
            try {
              await approveJobApplication(parseInt(id, 10));
              success('Başarılı', 'Başvuru onaylandı ve personel kaydı oluşturuldu.');
              fetchJobApplication();
            } catch (err) {
              showError('Hata', getErrorMessage(err));
            } finally {
              setIsApproving(false);
            }
          },
        },
      ]
    );
  }, [id, success, showError, fetchJobApplication]);

  // Handle download CV
  const handleDownloadCV = useCallback(async () => {
    if (!id || !jobApplication?.cv_file_path) return;

    setIsDownloadingCV(true);
    try {
      const url = await downloadCV(parseInt(id, 10));
      await Linking.openURL(url);
      success('Başarılı', 'CV dosyası indiriliyor...');
    } catch (err) {
      showError('Hata', getErrorMessage(err));
    } finally {
      setIsDownloadingCV(false);
    }
  }, [id, jobApplication, success, showError]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (!jobApplication) {
    return null;
  }

  const isApproved = jobApplication.status === 'onaylandı';

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title={getFullName(jobApplication)}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push(`/hr/job-applications/${id}/edit`)}
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
        {/* Status Badge */}
        <Badge
          label={getApplicationStatusLabel(jobApplication.status)}
          variant={getApplicationStatusColor(jobApplication.status)}
          style={styles.statusBadge}
        />

        {/* Approve Button */}
        {!isApproved && (
          <Button
            title="Başvuruyu Onayla ve Personel Kaydı Oluştur"
            onPress={handleApprove}
            variant="primary"
            loading={isApproving}
            icon={<CheckCircle size={18} color="#FFFFFF" />}
            style={styles.approveButton}
          />
        )}

        {/* Download CV Button */}
        {jobApplication.cv_file_path && (
          <Button
            title="CV İndir"
            onPress={handleDownloadCV}
            variant="secondary"
            loading={isDownloadingCV}
            icon={<Download size={18} color={colors.text} />}
            style={styles.downloadButton}
          />
        )}

        {/* Basic Info */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Başvurucu Bilgileri</Text>
          <DetailRow label="Ad Soyad" value={getFullName(jobApplication)} />
          <DetailRow label="E-posta" value={jobApplication.email} />
          <DetailRow label="Telefon" value={jobApplication.phone} />
          <DetailRow label="Pozisyon" value={jobApplication.position} />
          <DetailRow label="Başvuru Tarihi" value={formatDate(jobApplication.application_date)} />
        </Card>

        {/* Job Posting Info */}
        {jobApplication.job_posting && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>İlgili İş İlanı</Text>
            <TouchableOpacity
              onPress={() => router.push(`/hr/job-postings/${jobApplication.job_posting!.id}`)}
            >
              <DetailRow label="İlan" value={jobApplication.job_posting.title} />
              <DetailRow label="Pozisyon" value={jobApplication.job_posting.position} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Notes */}
        {jobApplication.notes && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Notlar</Text>
            <Text style={[styles.notes, { color: colors.text }]}>{jobApplication.notes}</Text>
          </Card>
        )}

        {/* Interviews */}
        {jobApplication.interviews && jobApplication.interviews.length > 0 && (
          <Card variant="outlined" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Görüşmeler ({jobApplication.interviews.length})
            </Text>
            {jobApplication.interviews.map((interview) => (
              <View key={interview.id} style={styles.interviewItem}>
                <View style={styles.interviewHeader}>
                  <Text style={[styles.interviewTitle, { color: colors.text }]}>
                    {interview.title}
                  </Text>
                  {interview.interview_result && (
                    <Badge
                      label={getInterviewResultLabel(interview.interview_result)}
                      variant={getInterviewResultColor(interview.interview_result)}
                      size="sm"
                    />
                  )}
                </View>
                <View style={styles.interviewDetails}>
                  <View style={styles.interviewRow}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.interviewText, { color: colors.textSecondary }]}>
                      {formatDate(interview.interview_date)} • {formatTime(interview.interview_time)}
                    </Text>
                  </View>
                  <View style={styles.interviewRow}>
                    <MessageCircle size={14} color={colors.textSecondary} />
                    <Text style={[styles.interviewText, { color: colors.textSecondary }]}>
                      {getInterviewTypeLabel(interview.interview_type)}
                    </Text>
                  </View>
                  {interview.notes && (
                    <Text style={[styles.interviewNotes, { color: colors.textSecondary }]}>
                      {interview.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Dates */}
        <Card variant="outlined" style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tarihler</Text>
          <DetailRow label="Oluşturulma" value={formatDateUtil(jobApplication.created_at, 'dd.MM.yyyy HH:mm')} />
          <DetailRow label="Güncellenme" value={formatDateUtil(jobApplication.updated_at, 'dd.MM.yyyy HH:mm')} />
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
  statusBadge: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  approveButton: {
    marginBottom: Spacing.md,
  },
  downloadButton: {
    marginBottom: Spacing.lg,
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
  notes: {
    ...Typography.bodyMD,
    lineHeight: 22,
  },
  interviewItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  interviewTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
  },
  interviewDetails: {
    gap: Spacing.xs,
  },
  interviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  interviewText: {
    ...Typography.bodySM,
  },
  interviewNotes: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});
