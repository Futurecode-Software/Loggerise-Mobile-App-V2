/**
 * Çalışan Detay Sayfası
 *
 * Çalışan bilgilerini detaylı görüntüleme - CLAUDE.md tasarım ilkeleri ile uyumlu
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  getEmployee,
  deleteEmployee,
  Employee,
  getEmploymentStatusLabel,
  getContractTypeLabel,
  getPositionLabel,
  getGenderLabel,
  getMaritalStatusLabel
} from '@/services/endpoints/employees'

// Tarih formatlama
const formatDate = (dateString?: string): string => {
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

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const employeeId = id ? parseInt(id, 10) : null

  // State
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchEmployee = useCallback(async (showLoading = true) => {
    if (!employeeId) {
      setError('Geçersiz çalışan ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getEmployee(employeeId)

      if (isMountedRef.current) {
        setEmployee(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Çalışan bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [employeeId])

  useEffect(() => {
    isMountedRef.current = true
    fetchEmployee()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchEmployee])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchEmployee(false)
    }, [fetchEmployee])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchEmployee(false)
  }, [fetchEmployee])

  // Düzenleme
  const handleEdit = () => {
    if (!employeeId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/hr/employee/${employeeId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!employeeId) return

    setIsDeleting(true)
    try {
      await deleteEmployee(employeeId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Çalışan başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Çalışan silinemedi',
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
            ) : employee ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {employee.first_name} {employee.last_name}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && employee ? (
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

          {/* Pozisyon ve Durum */}
          {isLoading ? (
            <View style={styles.positionRow}>
              <Skeleton width={120} height={16} />
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : employee ? (
            <View style={styles.positionRow}>
              <View style={styles.positionInfo}>
                <Ionicons name="briefcase-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.positionText}>
                  {employee.position ? getPositionLabel(employee.position) : 'Pozisyon belirtilmemiş'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: employee.employment_status === 'active'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : employee.employment_status === 'on_leave'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)'
                }
              ]}>
                <View style={[
                  styles.statusDot,
                  {
                    backgroundColor: employee.employment_status === 'active'
                      ? DashboardColors.success
                      : employee.employment_status === 'on_leave'
                        ? DashboardColors.warning
                        : DashboardColors.danger
                  }
                ]} />
                <Text style={[
                  styles.statusBadgeText,
                  {
                    color: employee.employment_status === 'active'
                      ? DashboardColors.success
                      : employee.employment_status === 'on_leave'
                        ? DashboardColors.warning
                        : DashboardColors.danger
                  }
                ]}>
                  {getEmploymentStatusLabel(employee.employment_status)}
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
        {!isLoading && (error || !employee) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Çalışan bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchEmployee()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && employee && (
          <>
            {/* Temel Bilgiler */}
            <View style={styles.card}>
              <SectionHeader title="Temel Bilgiler" icon="person-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="TC Kimlik No"
                  value={employee.citizenship_no}
                  icon="card-outline"
                  highlight
                />
                {employee.employee_code && (
                  <InfoRow
                    label="Personel Kodu"
                    value={employee.employee_code}
                    icon="barcode-outline"
                  />
                )}
                {employee.sgk_number && (
                  <InfoRow
                    label="SGK No"
                    value={employee.sgk_number}
                    icon="shield-checkmark-outline"
                  />
                )}
                {employee.gender && (
                  <InfoRow
                    label="Cinsiyet"
                    value={getGenderLabel(employee.gender)}
                    icon="people-outline"
                  />
                )}
                {employee.marital_status && (
                  <InfoRow
                    label="Medeni Durum"
                    value={getMaritalStatusLabel(employee.marital_status)}
                    icon="heart-outline"
                  />
                )}
              </View>
            </View>

            {/* İletişim Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="İletişim Bilgileri" icon="call-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Telefon"
                  value={employee.phone_1}
                  icon="phone-portrait-outline"
                  highlight
                />
                {employee.phone_2 && (
                  <InfoRow
                    label="Telefon 2"
                    value={employee.phone_2}
                    icon="phone-portrait-outline"
                  />
                )}
                <InfoRow
                  label="E-posta"
                  value={employee.email}
                  icon="mail-outline"
                />
                {employee.home_phone && (
                  <InfoRow
                    label="Ev Telefonu"
                    value={employee.home_phone}
                    icon="home-outline"
                  />
                )}
                {employee.emergency_phone_1 && (
                  <InfoRow
                    label="Acil Durum Tel"
                    value={employee.emergency_phone_1}
                    icon="alert-circle-outline"
                  />
                )}
              </View>
            </View>

            {/* İstihdam Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="İstihdam Bilgileri" icon="briefcase-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Durum"
                  value={getEmploymentStatusLabel(employee.employment_status)}
                  icon="checkbox-outline"
                  highlight
                />
                {employee.contract_type && (
                  <InfoRow
                    label="Sözleşme Tipi"
                    value={getContractTypeLabel(employee.contract_type)}
                    icon="document-text-outline"
                  />
                )}
                {employee.position && (
                  <InfoRow
                    label="Pozisyon"
                    value={getPositionLabel(employee.position)}
                    icon="people-circle-outline"
                  />
                )}
                {employee.start_date && (
                  <InfoRow
                    label="Başlangıç Tarihi"
                    value={formatDate(employee.start_date)}
                    icon="calendar-outline"
                  />
                )}
                {employee.end_date && (
                  <InfoRow
                    label="Bitiş Tarihi"
                    value={formatDate(employee.end_date)}
                    icon="calendar-outline"
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
        title="Çalışanı Sil"
        message="Bu çalışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    width: 96 // 44 + 8 + 44 (iki buton + gap)
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
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: DashboardSpacing.sm
  },
  positionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  positionText: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)'
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
    paddingTop: 0,
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

  // Bölüm Başlığı
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },

  // Bilgi Satırı
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  infoIcon: {
    marginRight: DashboardSpacing.sm
  },
  infoLabelText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  infoValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    maxWidth: '50%',
    textAlign: 'right'
  },
  infoValueHighlight: {
    color: DashboardColors.primary,
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
