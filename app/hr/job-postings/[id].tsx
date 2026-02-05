/**
 * İş İlanı Detay Sayfası
 *
 * İş ilanı bilgilerini detaylı görüntüleme - CLAUDE.md tasarım ilkeleri ile uyumlu
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { SectionHeader, InfoRow } from '@/components/detail'
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
  isJobPostingExpired
} from '@/services/endpoints/job-postings'
import { getApplicationStatusLabel, getApplicationStatusColor } from '@/services/endpoints/job-applications'
import { formatDate } from '@/utils/formatters'
import { getErrorMessage } from '@/services/api'

export default function JobPostingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const jobPostingId = id ? parseInt(id, 10) : null

  // State
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingPublish, setIsTogglingPublish] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchJobPosting = useCallback(async (showLoading = true) => {
    if (!jobPostingId) {
      setError('Geçersiz ilan ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getJobPosting(jobPostingId)

      if (isMountedRef.current) {
        setJobPosting(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'İlan bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [jobPostingId])

  useEffect(() => {
    isMountedRef.current = true
    fetchJobPosting()

    return () => {
      isMountedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchJobPosting(false)
    }, [fetchJobPosting])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchJobPosting(false)
  }, [fetchJobPosting])

  // Düzenleme
  const handleEdit = () => {
    if (!jobPostingId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/hr/job-postings/${jobPostingId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!jobPostingId) return

    setIsDeleting(true)
    try {
      await deleteJobPosting(jobPostingId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'İş ilanı başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'İş ilanı silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Yayınla/Kaldır toggle
  const handleTogglePublish = useCallback(async () => {
    if (!jobPostingId || !jobPosting) return

    setIsTogglingPublish(true)
    try {
      const updated = await togglePublishJobPosting(jobPostingId)
      setJobPosting(updated)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: updated.is_public ? 'İlan yayınlandı' : 'İlan yayından kaldırıldı',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: getErrorMessage(err),
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsTogglingPublish(false)
    }
  }, [jobPostingId, jobPosting])

  // Geri
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const expired = jobPosting ? isJobPostingExpired(jobPosting) : false
  const applicationCount = jobPosting?.applications_count || jobPosting?.application_count || 0

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
          {/* Üst Bar: Geri + Başlık + Aksiyonlar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Başlık - Orta */}
            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
            ) : jobPosting ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {jobPosting.title}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && jobPosting ? (
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

          {/* Durum Özeti */}
          {isLoading ? (
            <View style={styles.statusRow}>
              <Skeleton width={80} height={32} borderRadius={16} style={{ marginRight: DashboardSpacing.sm }} />
              <Skeleton width={80} height={32} borderRadius={16} />
            </View>
          ) : jobPosting ? (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: jobPosting.is_active
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: jobPosting.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: jobPosting.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                >
                  {getStatusLabel(jobPosting.is_active)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: jobPosting.is_public
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(156, 163, 175, 0.2)'
                  }
                ]}
              >
                <Ionicons
                  name={jobPosting.is_public ? 'globe-outline' : 'lock-closed-outline'}
                  size={14}
                  color={jobPosting.is_public ? DashboardColors.info : DashboardColors.textMuted}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: jobPosting.is_public
                      ? DashboardColors.info
                      : DashboardColors.textMuted
                    }
                  ]}
                >
                  {getVisibilityLabel(jobPosting.is_public)}
                </Text>
              </View>
              {expired && (
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <View style={[styles.statusDot, { backgroundColor: DashboardColors.warning }]} />
                  <Text style={[styles.statusBadgeText, { color: DashboardColors.warning }]}>
                    Süresi Doldu
                  </Text>
                </View>
              )}
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
            {[1, 2, 3, 4].map(i => (
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
        {!isLoading && (error || !jobPosting) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'İlan bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchJobPosting()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && jobPosting && (
          <>
            {/* Yayınla/Kaldır Butonu */}
            <TouchableOpacity
              style={[
                styles.publishButton,
                jobPosting.is_public ? styles.publishButtonUnpublish : styles.publishButtonPublish
              ]}
              onPress={handleTogglePublish}
              disabled={isTogglingPublish}
            >
              {isTogglingPublish ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={jobPosting.is_public ? 'eye-off-outline' : 'globe-outline'}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.publishButtonText}>
                    {jobPosting.is_public ? 'Yayından Kaldır' : 'Yayınla'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* İstatistikler */}
            <View style={styles.card}>
              <SectionHeader title="İstatistikler" icon="stats-chart-outline" />
              <View style={styles.cardContent}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
                      <Ionicons name="eye-outline" size={20} color={DashboardColors.primary} />
                    </View>
                    <Text style={styles.statValue}>{jobPosting.view_count || 0}</Text>
                    <Text style={styles.statLabel}>Görüntülenme</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
                      <Ionicons name="people-outline" size={20} color={DashboardColors.primary} />
                    </View>
                    <Text style={styles.statValue}>{applicationCount}</Text>
                    <Text style={styles.statLabel}>Başvuru</Text>
                  </View>
                  {jobPosting.recent_applications_count !== undefined && (
                    <View style={styles.statItem}>
                      <View style={[styles.statIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
                        <Ionicons name="calendar-outline" size={20} color={DashboardColors.primary} />
                      </View>
                      <Text style={styles.statValue}>{jobPosting.recent_applications_count}</Text>
                      <Text style={styles.statLabel}>Son 30 Gün</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Genel Bilgiler */}
            <View style={styles.card}>
              <SectionHeader title="Genel Bilgiler" icon="information-circle-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Pozisyon"
                  value={jobPosting.position}
                  icon="briefcase-outline"
                  highlight
                />
                <InfoRow
                  label="Lokasyon"
                  value={jobPosting.location || '-'}
                  icon="location-outline"
                />
                <InfoRow
                  label="İstihdam Türü"
                  value={getEmploymentTypeLabel(jobPosting.employment_type)}
                  icon="time-outline"
                />
                <InfoRow
                  label="Deneyim Seviyesi"
                  value={getExperienceLevelLabel(jobPosting.experience_level)}
                  icon="trending-up-outline"
                />
                <InfoRow
                  label="Maaş Aralığı"
                  value={formatSalaryRange(jobPosting.salary_min, jobPosting.salary_max, jobPosting.salary_currency)}
                  icon="cash-outline"
                />
                <InfoRow
                  label="Başvuru Son Tarihi"
                  value={jobPosting.application_deadline ? formatDate(jobPosting.application_deadline, 'dd.MM.yyyy') : '-'}
                  icon="calendar-outline"
                />
              </View>
            </View>

            {/* Açıklama */}
            <View style={styles.card}>
              <SectionHeader title="Açıklama" icon="document-text-outline" />
              <View style={styles.cardContent}>
                <Text style={styles.descriptionText}>{jobPosting.description}</Text>
              </View>
            </View>

            {/* Aranan Nitelikler */}
            {jobPosting.requirements && (
              <View style={styles.card}>
                <SectionHeader title="Aranan Nitelikler" icon="checkmark-done-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{jobPosting.requirements}</Text>
                </View>
              </View>
            )}

            {/* Sorumluluklar */}
            {jobPosting.responsibilities && (
              <View style={styles.card}>
                <SectionHeader title="Sorumluluklar" icon="list-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{jobPosting.responsibilities}</Text>
                </View>
              </View>
            )}

            {/* Başvurular */}
            {jobPosting.applications && jobPosting.applications.length > 0 && (
              <View style={styles.card}>
                <SectionHeader
                  title="Başvurular"
                  icon="people-outline"
                  count={jobPosting.applications.length}
                />
                <View style={styles.cardContent}>
                  {jobPosting.applications.map((application: any, index: number) => (
                    <TouchableOpacity
                      key={application.id}
                      style={[
                        styles.applicationItem,
                        index === jobPosting.applications!.length - 1 && styles.applicationItemLast
                      ]}
                      onPress={() => router.push(`/hr/job-applications/${application.id}`)}
                    >
                      <View style={styles.applicationInfo}>
                        <Text style={styles.applicationName}>
                          {application.first_name} {application.last_name}
                        </Text>
                        <Text style={styles.applicationDate}>
                          {formatDate(application.application_date, 'dd.MM.yyyy')}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.applicationStatusBadge,
                          { backgroundColor: getApplicationStatusColor(application.status) === 'success'
                            ? DashboardColors.successBg
                            : getApplicationStatusColor(application.status) === 'warning'
                            ? DashboardColors.warningBg
                            : getApplicationStatusColor(application.status) === 'danger'
                            ? DashboardColors.dangerBg
                            : DashboardColors.infoBg
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.applicationStatusText,
                            { color: getApplicationStatusColor(application.status) === 'success'
                              ? DashboardColors.success
                              : getApplicationStatusColor(application.status) === 'warning'
                              ? DashboardColors.warning
                              : getApplicationStatusColor(application.status) === 'danger'
                              ? DashboardColors.danger
                              : DashboardColors.info
                            }
                          ]}
                        >
                          {getApplicationStatusLabel(application.status)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
                    </TouchableOpacity>
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
                  value={formatDate(jobPosting.created_at, 'dd.MM.yyyy HH:mm')}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(jobPosting.updated_at, 'dd.MM.yyyy HH:mm')}
                  icon="refresh-outline"
                />
                {jobPosting.published_at && (
                  <InfoRow
                    label="Yayın Tarihi"
                    value={formatDate(jobPosting.published_at, 'dd.MM.yyyy HH:mm')}
                    icon="globe-outline"
                  />
                )}
              </View>
            </View>

            {/* Alt boşluk */}
            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
          </>
        )}
      </ScrollView>

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="İlanı Sil"
        message="Bu iş ilanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.md
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

  // Yayınla Butonu
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.xl,
    borderRadius: DashboardBorderRadius.lg,
    marginBottom: DashboardSpacing.md
  },
  publishButtonPublish: {
    backgroundColor: DashboardColors.primary
  },
  publishButtonUnpublish: {
    backgroundColor: DashboardColors.textMuted
  },
  publishButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
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

  // İstatistikler
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xs
  },
  statValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  statLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },

  // Açıklama
  descriptionText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 22
  },

  // Başvurular
  applicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  applicationItemLast: {
    borderBottomWidth: 0
  },
  applicationInfo: {
    flex: 1
  },
  applicationName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: 4
  },
  applicationDate: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  applicationStatusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full
  },
  applicationStatusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
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
