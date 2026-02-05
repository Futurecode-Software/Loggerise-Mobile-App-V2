/**
 * Mobil Bildirim Detay Sayfası
 *
 * Notification broadcast kaydının detaylarını gösterir
 * Status, alıcılar, istatistikler
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
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getBroadcast,
  deleteBroadcast,
  NotificationBroadcast,
  getStatusLabel,
  getStatusColor,
  getTargetTypeLabel
} from '@/services/endpoints/notification-broadcasts'

// Tarih formatlama
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
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
  color?: string
}

function InfoRow({ label, value, icon, highlight, color }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={color || DashboardColors.textMuted}
            style={styles.infoIcon}
          />
        )}
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight, color && { color }]}>
        {value}
      </Text>
    </View>
  )
}

export default function NotificationBroadcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const broadcastId = id ? parseInt(id, 10) : null

  // State
  const [broadcast, setBroadcast] = useState<NotificationBroadcast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)

  // Refs
  const isMountedRef = useRef(true)

  // Veri çekme
  const fetchBroadcast = useCallback(async (showLoading = true) => {
    if (!broadcastId) {
      setError('Geçersiz bildirim ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getBroadcast(broadcastId)

      if (isMountedRef.current) {
        setBroadcast(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Bildirim bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [broadcastId])

  useEffect(() => {
    isMountedRef.current = true
    fetchBroadcast()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchBroadcast])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchBroadcast(false)
    }, [fetchBroadcast])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchBroadcast(false)
  }, [fetchBroadcast])

  // Geri
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Silme
  const handleDeleteRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setDeleteDialogVisible(true)
  }

  const handleDeleteConfirm = async () => {
    if (!broadcastId) return

    try {
      setIsDeleting(true)
      await deleteBroadcast(broadcastId)

      if (!isMountedRef.current) return

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Bildirim silindi',
        position: 'top',
        visibilityTime: 1500
      })

      router.back()
    } catch (err: any) {
      if (!isMountedRef.current) return
      console.error('Bildirim silinirken hata:', err)
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: err.message || 'Bildirim silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      if (!isMountedRef.current) return
      setIsDeleting(false)
      setDeleteDialogVisible(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false)
  }

  // Skeleton loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={DashboardColors.textOnPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Skeleton width={150} height={20} />
            </View>
            <View style={styles.headerButton} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Skeleton width="100%" height={20} />
            <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
            <Skeleton width="100%" height={60} style={{ marginTop: 16 }} />
          </View>
        </ScrollView>
      </View>
    )
  }

  // Error state
  if (error || !broadcast) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={DashboardColors.textOnPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Hata</Text>
            </View>
            <View style={styles.headerButton} />
          </View>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={DashboardColors.danger} />
          <Text style={styles.errorTitle}>Bildirim Yüklenemedi</Text>
          <Text style={styles.errorText}>{error || 'Bilinmeyen hata'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchBroadcast()}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const statusColor = getStatusColor(broadcast.status)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Statik glow orbs */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={DashboardColors.textOnPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Bildirim Detay
            </Text>
            <View style={[styles.headerStatusBadge, { backgroundColor: `${statusColor}15` }]}>
              <Text style={[styles.headerStatusText, { color: statusColor }]}>
                {getStatusLabel(broadcast.status)}
              </Text>
            </View>
          </View>

          {broadcast.status === 'draft' && (
            <TouchableOpacity style={styles.headerButton} onPress={handleDeleteRequest}>
              <Ionicons name="trash-outline" size={20} color={DashboardColors.textOnPrimary} />
            </TouchableOpacity>
          )}
          {broadcast.status !== 'draft' && <View style={styles.headerButton} />}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {/* Genel Bilgiler */}
        <View style={styles.card}>
          <SectionHeader title="Genel Bilgiler" icon="information-circle-outline" />
          <InfoRow label="Başlık" value={broadcast.title} icon="document-text-outline" />
          <InfoRow label="Mesaj" value={broadcast.message} />
          <InfoRow
            label="Hedef Kitle"
            value={getTargetTypeLabel(broadcast.target_type)}
            icon="people-outline"
          />
          {broadcast.sender && (
            <InfoRow
              label="Gönderen"
              value={broadcast.sender.name}
              icon="person-outline"
            />
          )}
        </View>

        {/* İstatistikler */}
        <View style={styles.card}>
          <SectionHeader title="İstatistikler" icon="stats-chart-outline" />
          <InfoRow
            label="Toplam Alıcı"
            value={broadcast.total_recipients.toString()}
            icon="people-outline"
            color={DashboardColors.primary}
          />
          {broadcast.status === 'sent' && (
            <>
              <InfoRow
                label="Başarılı"
                value={broadcast.success_count.toString()}
                icon="checkmark-circle-outline"
                color={DashboardColors.success}
              />
              <InfoRow
                label="Başarısız"
                value={broadcast.failure_count.toString()}
                icon="close-circle-outline"
                color={DashboardColors.danger}
              />
            </>
          )}
        </View>

        {/* Zamanlama */}
        {(broadcast.is_scheduled || broadcast.sent_at) && (
          <View style={styles.card}>
            <SectionHeader title="Zamanlama" icon="time-outline" />
            {broadcast.is_scheduled && broadcast.scheduled_at && (
              <InfoRow
                label="Zamanlandı"
                value={formatDate(broadcast.scheduled_at)}
                icon="calendar-outline"
              />
            )}
            {broadcast.sent_at && (
              <InfoRow
                label="Gönderildi"
                value={formatDate(broadcast.sent_at)}
                icon="send-outline"
                color={DashboardColors.success}
              />
            )}
          </View>
        )}

        {/* Deep Link */}
        {broadcast.deep_link_route && (
          <View style={styles.card}>
            <SectionHeader title="Deep Link" icon="link-outline" />
            <InfoRow
              label="Route"
              value={broadcast.deep_link_route}
              icon="navigate-outline"
            />
          </View>
        )}

        {/* Hata Mesajı */}
        {broadcast.error_message && (
          <View style={styles.card}>
            <SectionHeader title="Hata" icon="warning-outline" />
            <Text style={styles.errorMessage}>{broadcast.error_message}</Text>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Silme Onay Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Bildirimi Sil"
        message={`"${broadcast.title}" bildirimi silinecek. Onaylıyor musunuz?`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
        type="danger"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: DashboardSpacing.xl
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
    bottom: -20,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    zIndex: 10
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textOnPrimary
  },
  headerStatusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.md
  },
  headerStatusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.xl
  },
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: `${DashboardColors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.md
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  infoIcon: {
    marginRight: DashboardSpacing.xs
  },
  infoLabelText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    flex: 1
  },
  infoValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    textAlign: 'right',
    flex: 1
  },
  infoValueHighlight: {
    fontWeight: '600',
    color: DashboardColors.primary
  },
  errorMessage: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    lineHeight: 20,
    padding: DashboardSpacing.md,
    backgroundColor: `${DashboardColors.danger}10`,
    borderRadius: DashboardBorderRadius.md,
    borderWidth: 1,
    borderColor: `${DashboardColors.danger}30`
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.sm
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.md
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textOnPrimary
  }
})
