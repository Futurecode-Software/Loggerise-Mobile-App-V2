/**
 * Senet Detay Sayfası
 *
 * Senet bilgilerini detaylı görüntüleme - CLAUDE.md tasarım ilkeleri ile uyumlu
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
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/formatters'
import {
  getPromissoryNote,
  deletePromissoryNote,
  PromissoryNote,
  getPromissoryNoteTypeLabel,
  getPromissoryNoteStatusLabel,
  getCurrencyLabel
} from '@/services/endpoints/promissory-notes'

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  transferred: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  cleared: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  protested: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
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
  count?: number
  isExpanded?: boolean
  onToggle?: () => void
}

function SectionHeader({ title, icon, count, isExpanded, onToggle }: SectionHeaderProps) {
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      disabled={!onToggle}
      activeOpacity={onToggle ? 0.7 : 1}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={16} color={DashboardColors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {onToggle && (
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={DashboardColors.textMuted}
        />
      )}
    </TouchableOpacity>
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

export default function PromissoryNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const promissoryNoteId = id ? parseInt(id, 10) : null

  // State
  const [promissoryNote, setPromissoryNote] = useState<PromissoryNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchPromissoryNote = useCallback(async (showLoading = true) => {
    if (!promissoryNoteId) {
      setError('Geçersiz senet ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getPromissoryNote(promissoryNoteId)

      if (isMountedRef.current) {
        setPromissoryNote(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Senet bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [promissoryNoteId])

  useEffect(() => {
    isMountedRef.current = true
    fetchPromissoryNote()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchPromissoryNote])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchPromissoryNote(false)
    }, [fetchPromissoryNote])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPromissoryNote(false)
  }, [fetchPromissoryNote])

  // Düzenleme
  const handleEdit = () => {
    if (!promissoryNoteId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/accounting/promissory-note/${promissoryNoteId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!promissoryNoteId) return

    setIsDeleting(true)
    try {
      await deletePromissoryNote(promissoryNoteId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Senet başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Senet silinemedi',
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
  const getStatusColors = () => {
    if (!promissoryNote) return STATUS_COLORS.pending
    return STATUS_COLORS[promissoryNote.status] || STATUS_COLORS.pending
  }

  const getTypeColors = () => {
    if (!promissoryNote) return TYPE_COLORS.received
    return TYPE_COLORS[promissoryNote.type] || TYPE_COLORS.received
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
            ) : promissoryNote ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {promissoryNote.promissory_note_number}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && promissoryNote ? (
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
              <View style={styles.summaryMain}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={180} height={36} />
              </View>
              <View style={styles.summaryBadges}>
                <Skeleton width={70} height={28} borderRadius={14} />
                <Skeleton width={80} height={28} borderRadius={14} />
              </View>
            </View>
          ) : promissoryNote ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryMain}>
                <Text style={styles.summaryLabel}>Tutar</Text>
                <Text style={styles.summaryAmount}>
                  {formatCurrency(promissoryNote.amount, promissoryNote.currency_type)}
                </Text>
              </View>
              <View style={styles.summaryBadges}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColors().bg }]}>
                  <Text style={[styles.typeBadgeText, { color: getTypeColors().primary }]}>
                    {getPromissoryNoteTypeLabel(promissoryNote.type)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColors().bg }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColors().primary }]}>
                    {getPromissoryNoteStatusLabel(promissoryNote.status)}
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
        {!isLoading && (error || !promissoryNote) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Senet bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchPromissoryNote()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && promissoryNote && (
          <>
            {/* Cari Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Cari Bilgileri" icon="person-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Cari Adı"
                  value={promissoryNote.contact?.name || '-'}
                  icon="person-outline"
                  highlight
                />
                {promissoryNote.contact?.code && (
                  <InfoRow
                    label="Cari Kodu"
                    value={promissoryNote.contact.code}
                    icon="barcode-outline"
                  />
                )}
              </View>
            </View>

            {/* Senet Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Senet Bilgileri" icon="document-text-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Senet Numarası"
                  value={promissoryNote.promissory_note_number}
                  icon="document-outline"
                  highlight
                />
                {promissoryNote.portfolio_number && (
                  <InfoRow
                    label="Portföy No"
                    value={promissoryNote.portfolio_number}
                    icon="folder-outline"
                  />
                )}
                <InfoRow
                  label="Düzenleme Tarihi"
                  value={formatDate(promissoryNote.issue_date, 'dd.MM.yyyy')}
                  icon="calendar-outline"
                />
                <InfoRow
                  label="Vade Tarihi"
                  value={formatDate(promissoryNote.due_date, 'dd.MM.yyyy')}
                  icon="calendar-outline"
                />
                <InfoRow
                  label="Para Birimi"
                  value={getCurrencyLabel(promissoryNote.currency_type)}
                  icon="cash-outline"
                />
                <InfoRow
                  label="Durum"
                  value={promissoryNote.is_active ? 'Aktif' : 'Pasif'}
                  icon={promissoryNote.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
                />
              </View>
            </View>

            {/* Banka Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Banka Bilgileri" icon="business-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Banka"
                  value={promissoryNote.bank_name}
                  icon="business-outline"
                />
                {promissoryNote.branch_name && (
                  <InfoRow
                    label="Şube"
                    value={promissoryNote.branch_name}
                    icon="location-outline"
                  />
                )}
                {promissoryNote.account_number && (
                  <InfoRow
                    label="Hesap No"
                    value={promissoryNote.account_number}
                    icon="card-outline"
                  />
                )}
                {promissoryNote.drawer_name && (
                  <InfoRow
                    label="Keşideci"
                    value={promissoryNote.drawer_name}
                    icon="person-outline"
                  />
                )}
                {promissoryNote.endorser_name && (
                  <InfoRow
                    label="Ciranta"
                    value={promissoryNote.endorser_name}
                    icon="people-outline"
                  />
                )}
              </View>
            </View>

            {/* Tarih Bilgileri */}
            {(promissoryNote.transferred_date || promissoryNote.cleared_date || promissoryNote.protested_date || promissoryNote.cancelled_date) && (
              <View style={styles.card}>
                <SectionHeader title="Tarih Bilgileri" icon="time-outline" />
                <View style={styles.cardContent}>
                  {promissoryNote.transferred_date && (
                    <InfoRow
                      label="Transfer Tarihi"
                      value={formatDate(promissoryNote.transferred_date, 'dd.MM.yyyy')}
                      icon="swap-horizontal-outline"
                    />
                  )}
                  {promissoryNote.cleared_date && (
                    <InfoRow
                      label="Tahsil Tarihi"
                      value={formatDate(promissoryNote.cleared_date, 'dd.MM.yyyy')}
                      icon="checkmark-circle-outline"
                    />
                  )}
                  {promissoryNote.protested_date && (
                    <InfoRow
                      label="Protesto Tarihi"
                      value={formatDate(promissoryNote.protested_date, 'dd.MM.yyyy')}
                      icon="alert-circle-outline"
                    />
                  )}
                  {promissoryNote.cancelled_date && (
                    <InfoRow
                      label="İptal Tarihi"
                      value={formatDate(promissoryNote.cancelled_date, 'dd.MM.yyyy')}
                      icon="close-circle-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Açıklama */}
            {promissoryNote.description && (
              <View style={styles.card}>
                <SectionHeader title="Açıklama" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{promissoryNote.description}</Text>
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="information-circle-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(promissoryNote.created_at, 'dd.MM.yyyy HH:mm')}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(promissoryNote.updated_at, 'dd.MM.yyyy HH:mm')}
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
        title="Senedi Sil"
        message="Bu senedi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    alignItems: 'flex-end',
    marginTop: DashboardSpacing.md
  },
  summaryMain: {
    flex: 1
  },
  summaryBadges: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: DashboardSpacing.xs
  },
  summaryAmount: {
    fontSize: DashboardFontSizes['3xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full
  },
  typeBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700'
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700'
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
  countBadge: {
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  countText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: '#fff'
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
