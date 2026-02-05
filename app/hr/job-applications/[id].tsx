/**
 * Job Application Detail Screen
 *
 * Başvuru detay sayfası - CLAUDE.md tasarım ilkeleri ile uyumlu
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader, InfoRow } from '@/components/detail'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getJobApplication,
  deleteJobApplication,
  JobApplication,
  getApplicationStatusLabel,
  getFullName,
  formatDate,
  formatTime,
  getInterviewTypeLabel,
  getInterviewResultLabel
} from '@/services/endpoints/job-applications'

// Tarih formatlama
const formatDateDetail = (dateString?: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

export default function JobApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const applicationId = id ? parseInt(id, 10) : null

  // State
  const [jobApplication, setJobApplication] = useState<JobApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchJobApplication = useCallback(async (showLoading = true) => {
    if (!applicationId) {
      setError('Geçersiz başvuru ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getJobApplication(applicationId)

      if (isMountedRef.current) {
        setJobApplication(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Başvuru bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [applicationId])

  useEffect(() => {
    isMountedRef.current = true
    fetchJobApplication()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchJobApplication])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchJobApplication(false)
    }, [fetchJobApplication])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchJobApplication(false)
  }, [fetchJobApplication])

  // Düzenleme
  const handleEdit = () => {
    if (!applicationId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/hr/job-applications/${applicationId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!applicationId) return

    setIsDeleting(true)
    try {
      await deleteJobApplication(applicationId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Başvuru başarıyla silindi',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => {
        router.back()
      }, 300)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Başvuru silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Geri
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const statusColors: Record<string, { primary: string; bg: string }> = {
    başvuru_alındı: { primary: DashboardColors.info, bg: DashboardColors.infoBg },
    değerlendiriliyor: { primary: DashboardColors.warning, bg: DashboardColors.warningBg },
    mülakat_planlandı: { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
    onaylandı: { primary: DashboardColors.success, bg: DashboardColors.successBg },
    reddedildi: { primary: DashboardColors.danger, bg: DashboardColors.dangerBg },
    iptal_edildi: { primary: DashboardColors.textMuted, bg: DashboardColors.background }
  }

  const statusColor = jobApplication ? (statusColors[jobApplication.status] || statusColors.başvuru_alındı) : null

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
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          {/* Üst Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
            ) : jobApplication ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {getFullName(jobApplication)}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {!isLoading && jobApplication ? (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.headerActionsPlaceholder} />
            )}
          </View>

          {/* İsim ve Durum */}
          {isLoading ? (
            <View style={styles.balanceRow}>
              <View style={styles.balanceSummary}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={160} height={24} />
              </View>
              <Skeleton width={100} height={32} borderRadius={16} />
            </View>
          ) : jobApplication && statusColor ? (
            <View style={styles.balanceRow}>
              <View style={styles.balanceSummary}>
                <Text style={styles.balanceLabel}>{jobApplication.position}</Text>
                <Text style={styles.balanceAmount}>{jobApplication.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor.primary }]} />
                <Text style={[styles.statusBadgeText, { color: statusColor.primary }]}>
                  {getApplicationStatusLabel(jobApplication.status)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* İçerik */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {/* Loading */}
        {isLoading && (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Skeleton width={140} height={20} />
                </View>
                <View style={styles.cardContent}>
                  <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="60%" height={16} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Hata */}
        {!isLoading && (error || !jobApplication) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Başvuru bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchJobApplication()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && jobApplication && (
          <>
            {/* Başvurucu Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Başvurucu Bilgileri" icon="person-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Ad Soyad"
                  value={getFullName(jobApplication)}
                  icon="text-outline"
                  highlight
                />
                <InfoRow
                  label="E-posta"
                  value={jobApplication.email}
                  icon="mail-outline"
                />
                <InfoRow
                  label="Telefon"
                  value={jobApplication.phone}
                  icon="call-outline"
                />
                <InfoRow
                  label="Pozisyon"
                  value={jobApplication.position}
                  icon="briefcase-outline"
                />
                <InfoRow
                  label="Başvuru Tarihi"
                  value={formatDate(jobApplication.application_date)}
                  icon="calendar-outline"
                />
              </View>
            </View>

            {/* İş İlanı */}
            {jobApplication.job_posting && (
              <View style={styles.card}>
                <SectionHeader title="İlgili İş İlanı" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Pressable onPress={() => router.push(`/hr/job-postings/${jobApplication.job_posting!.id}`)}>
                    <InfoRow
                      label="İlan"
                      value={jobApplication.job_posting.title}
                      icon="document-outline"
                      highlight
                    />
                    <InfoRow
                      label="Pozisyon"
                      value={jobApplication.job_posting.position}
                      icon="briefcase-outline"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Notlar */}
            {jobApplication.notes && (
              <View style={styles.card}>
                <SectionHeader title="Notlar" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{jobApplication.notes}</Text>
                </View>
              </View>
            )}

            {/* Görüşmeler */}
            {jobApplication.interviews && jobApplication.interviews.length > 0 && (
              <View style={styles.card}>
                <SectionHeader title="Görüşmeler" icon="calendar-outline" count={jobApplication.interviews.length} />
                <View style={styles.cardContent}>
                  {jobApplication.interviews.map((interview, index) => (
                    <View key={interview.id} style={[styles.interviewItem, index > 0 && styles.interviewItemBorder]}>
                      <Text style={styles.interviewTitle}>{interview.title}</Text>
                      <View style={styles.interviewDetails}>
                        <View style={styles.interviewRow}>
                          <Ionicons name="calendar-outline" size={14} color={DashboardColors.textMuted} />
                          <Text style={styles.interviewText}>
                            {formatDate(interview.interview_date)} • {formatTime(interview.interview_time)}
                          </Text>
                        </View>
                        <View style={styles.interviewRow}>
                          <Ionicons name="videocam-outline" size={14} color={DashboardColors.textMuted} />
                          <Text style={styles.interviewText}>
                            {getInterviewTypeLabel(interview.interview_type)}
                          </Text>
                        </View>
                        {interview.interview_result && (
                          <View style={styles.interviewRow}>
                            <Ionicons name="checkmark-circle-outline" size={14} color={DashboardColors.textMuted} />
                            <Text style={styles.interviewText}>
                              {getInterviewResultLabel(interview.interview_result)}
                            </Text>
                          </View>
                        )}
                        {interview.notes && (
                          <Text style={styles.interviewNotes}>{interview.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDateDetail(jobApplication.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDateDetail(jobApplication.updated_at)}
                  icon="refresh-outline"
                />
              </View>
            </View>

            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
          </>
        )}
      </ScrollView>

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Başvuruyu Sil"
        message="Bu başvuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },

  // Header
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 24
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginHorizontal: DashboardSpacing.md
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  headerActionsPlaceholder: {
    width: 96
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: DashboardSpacing.md
  },
  balanceSummary: {
    flex: 1
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  balanceLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: DashboardSpacing.xs
  },
  balanceAmount: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },

  // İçerik
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md
  },

  // Kartlar
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg
  },

  // Açıklama
  descriptionText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 22
  },

  // Görüşmeler
  interviewItem: {
    paddingVertical: DashboardSpacing.md
  },
  interviewItemBorder: {
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  interviewTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  interviewDetails: {
    gap: DashboardSpacing.xs
  },
  interviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  interviewText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  interviewNotes: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.xs,
    fontStyle: 'italic'
  },

  // Skeleton
  skeletonContainer: {
    gap: DashboardSpacing.md
  },

  // Hata durumu
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  }
})
