/**
 * Çek Detay Sayfası
 *
 * CLAUDE.md tasarım ilkelerine uygun modern tasarım
 * Referans: cash-register/[id].tsx
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
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getCheck,
  deleteCheck,
  Check,
  getCheckTypeLabel,
  getCheckStatusLabel,
  formatCheckAmount,
  getCurrencyLabel
} from '@/services/endpoints/checks'
import { formatDate } from '@/utils/formatters'

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  transferred: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  cleared: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  bounced: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  cancelled: { primary: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' }
}

// Tip renkleri
const TYPE_COLORS: Record<string, { primary: string; bg: string }> = {
  received: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  issued: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
}

// Bölüm başlığı
interface SectionHeaderProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
}

function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={16} color={DashboardColors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  )
}

// Bilgi satırı
interface InfoRowProps {
  label: string
  value: string
  icon?: keyof typeof Ionicons.glyphMap
  highlight?: boolean
}

function InfoRow({ label, value, icon, highlight }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={DashboardColors.textMuted}
            style={styles.infoIcon}
          />
        )}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {value}
      </Text>
    </View>
  )
}

export default function CheckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const checkId = id ? parseInt(id, 10) : null

  // State
  const [check, setCheck] = useState<Check | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchCheck = useCallback(async (showLoading = true) => {
    if (!checkId) {
      setError('Geçersiz çek ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getCheck(checkId)

      if (isMountedRef.current) {
        setCheck(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Çek bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [checkId])

  useEffect(() => {
    isMountedRef.current = true
    fetchCheck()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchCheck])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchCheck(false)
    }, [fetchCheck])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchCheck(false)
  }, [fetchCheck])

  // Düzenleme
  const handleEdit = () => {
    if (!checkId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/check/${checkId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!checkId) return

    setIsDeleting(true)
    try {
      await deleteCheck(checkId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Çek başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Çek silinemedi',
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

  // Status ve type renkleri
  const statusColors = check ? STATUS_COLORS[check.status] || STATUS_COLORS.pending : null
  const typeColors = check ? TYPE_COLORS[check.type] || TYPE_COLORS.received : null

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
            ) : check ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {check.check_number}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && check ? (
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

          {/* Tutar ve Durum Özeti */}
          {isLoading ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryContent}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={180} height={36} />
              </View>
              <Skeleton width={90} height={32} borderRadius={16} />
            </View>
          ) : check ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Çek Tutarı</Text>
                <Text style={styles.summaryAmount}>
                  {formatCheckAmount(check.amount, check.currency_type)}
                </Text>
              </View>
              <View style={styles.badgesContainer}>
                <View style={[styles.typeBadge, { backgroundColor: typeColors?.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColors?.primary }]}>
                    {getCheckTypeLabel(check.type)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors?.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors?.primary }]} />
                  <Text style={[styles.statusBadgeText, { color: statusColors?.primary }]}>
                    {getCheckStatusLabel(check.status)}
                  </Text>
                </View>
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
        {!isLoading && (error || !check) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Çek bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchCheck()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && check && (
          <>
            {/* Cari Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Cari Bilgileri" icon="person-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Cari Adı"
                  value={check.contact?.name || '-'}
                  icon="person-outline"
                  highlight
                />
                {check.contact?.code && (
                  <InfoRow
                    label="Cari Kodu"
                    value={check.contact.code}
                    icon="barcode-outline"
                  />
                )}
              </View>
            </View>

            {/* Çek Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Çek Bilgileri" icon="document-text-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Çek Numarası"
                  value={check.check_number}
                  icon="document-outline"
                  highlight
                />
                {check.portfolio_number && (
                  <InfoRow
                    label="Portföy No"
                    value={check.portfolio_number}
                    icon="folder-outline"
                  />
                )}
                <InfoRow
                  label="Düzenleme Tarihi"
                  value={formatDate(check.issue_date, 'dd.MM.yyyy')}
                  icon="calendar-outline"
                />
                <InfoRow
                  label="Vade Tarihi"
                  value={formatDate(check.due_date, 'dd.MM.yyyy')}
                  icon="calendar-outline"
                  highlight
                />
              </View>
            </View>

            {/* Banka Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Banka Bilgileri" icon="business-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Banka"
                  value={check.bank_name}
                  icon="business-outline"
                />
                <InfoRow
                  label="Şube"
                  value={check.branch_name}
                  icon="git-branch-outline"
                />
                {check.account_number && (
                  <InfoRow
                    label="Hesap No"
                    value={check.account_number}
                    icon="card-outline"
                  />
                )}
                {check.drawer_name && (
                  <InfoRow
                    label="Keşideci"
                    value={check.drawer_name}
                    icon="person-outline"
                  />
                )}
                {check.endorser_name && (
                  <InfoRow
                    label="Ciranta"
                    value={check.endorser_name}
                    icon="swap-horizontal-outline"
                  />
                )}
              </View>
            </View>

            {/* Tutar Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Tutar Bilgileri" icon="cash-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Tutar"
                  value={formatCheckAmount(check.amount, check.currency_type)}
                  icon="cash-outline"
                  highlight
                />
                <InfoRow
                  label="Para Birimi"
                  value={getCurrencyLabel(check.currency_type)}
                  icon="globe-outline"
                />
              </View>
            </View>

            {/* Durum Tarihleri */}
            {(check.transferred_date || check.cleared_date || check.bounced_date || check.cancelled_date) && (
              <View style={styles.card}>
                <SectionHeader title="Tarih Bilgileri" icon="time-outline" />
                <View style={styles.cardContent}>
                  {check.transferred_date && (
                    <InfoRow
                      label="Transfer Tarihi"
                      value={formatDate(check.transferred_date, 'dd.MM.yyyy')}
                      icon="arrow-forward-outline"
                    />
                  )}
                  {check.cleared_date && (
                    <InfoRow
                      label="Tahsil Tarihi"
                      value={formatDate(check.cleared_date, 'dd.MM.yyyy')}
                      icon="checkmark-circle-outline"
                    />
                  )}
                  {check.bounced_date && (
                    <InfoRow
                      label="Karşılıksız Tarihi"
                      value={formatDate(check.bounced_date, 'dd.MM.yyyy')}
                      icon="alert-circle-outline"
                    />
                  )}
                  {check.cancelled_date && (
                    <InfoRow
                      label="İptal Tarihi"
                      value={formatDate(check.cancelled_date, 'dd.MM.yyyy')}
                      icon="close-circle-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Transfer Bilgileri */}
            {check.transferred_to && (
              <View style={styles.card}>
                <SectionHeader title="Transfer Bilgileri" icon="swap-horizontal-outline" />
                <View style={styles.cardContent}>
                  <InfoRow
                    label="Transfer Yeri"
                    value={check.transferred_to.name}
                    icon="business-outline"
                    highlight
                  />
                </View>
              </View>
            )}

            {/* Açıklama */}
            {check.description && (
              <View style={styles.card}>
                <SectionHeader title="Açıklama" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{check.description}</Text>
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(check.created_at, 'dd.MM.yyyy HH:mm')}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(check.updated_at, 'dd.MM.yyyy HH:mm')}
                  icon="refresh-outline"
                />
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
        title="Çeki Sil"
        message="Bu çeki silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: DashboardSpacing.md
  },
  summaryContent: {
    flex: 1
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: DashboardSpacing.xs
  },
  summaryAmount: {
    fontSize: DashboardFontSizes['4xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5
  },
  badgesContainer: {
    alignItems: 'flex-end',
    gap: DashboardSpacing.xs
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full
  },
  typeBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center'
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

  // Açıklama
  descriptionText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 22
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
