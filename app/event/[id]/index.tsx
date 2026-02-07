/**
 * Event Detail Screen (Etkinlik Detayı)
 *
 * Dashboard theme + statik glow orbs + SectionHeader + InfoRow pattern
 * CLAUDE.md standartlarına tam uyumlu
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
} from '@/constants/dashboard-theme'
import {
  getEvent,
  deleteEvent,
  completeEvent,
  Event,
  getEventTypeLabel,
  getEventStatusLabel,
  getPriorityLabel,
  getContactMethodLabel,
  getReminderLabel,
  formatEventTimeRange,
  ReminderMinutes,
} from '@/services/endpoints/events'
import { formatDate } from '@/utils/formatters'

// Status colors
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
  rescheduled: '#6366F1',
}

// Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  normal: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
}

// Section Header Component
function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderIcon}>
        <Ionicons name={icon} size={20} color={DashboardColors.primary} />
      </View>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  )
}

// Info Row Component
function InfoRow({
  label,
  value,
  badge,
}: {
  label: string
  value?: string | number | boolean
  badge?: { label: string; color: string }
}) {
  if (value === undefined || value === null || value === '') return null

  const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value)

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {badge ? (
        <View style={[styles.infoBadge, { backgroundColor: `${badge.color}15` }]}>
          <Text style={[styles.infoBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      ) : (
        <Text style={styles.infoValue}>{displayValue}</Text>
      )}
    </View>
  )
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fetch event data
  const fetchEvent = useCallback(
    async (showLoading = true) => {
      if (!id) return

      if (showLoading) {
        setIsLoading(true)
      }

      try {
        setError(null)
        const data = await getEvent(parseInt(id, 10))
        if (isMountedRef.current) {
          setEvent(data)
        }
      } catch (err) {
        console.error('Event fetch error:', err)
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Etkinlik bilgileri yüklenemedi')
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
          setRefreshing(false)
        }
      }
    },
    [id]
  )

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  // Refresh on focus (after edit)
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        fetchEvent(false)
      }
    }, [fetchEvent, isLoading])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchEvent(false)
  }

  // Delete event
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!id) return
    setIsDeleting(true)
    try {
      await deleteEvent(parseInt(id, 10))
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Etkinlik silindi.',
        position: 'top',
        visibilityTime: 1500,
      })
      router.back()
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: err instanceof Error ? err.message : 'Etkinlik silinemedi.',
        position: 'top',
        visibilityTime: 2000,
      })
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Complete event
  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setShowCompleteConfirm(true)
  }

  const handleConfirmComplete = async () => {
    if (!id) return
    setIsCompleting(true)
    try {
      const result = await completeEvent(parseInt(id, 10), {})
      if (isMountedRef.current) {
        setEvent(result.event)
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Etkinlik tamamlandı.',
          position: 'top',
          visibilityTime: 1500,
        })
        setShowCompleteConfirm(false)

        // Next event notification
        if (result.nextEvent) {
          setTimeout(() => {
            Toast.show({
              type: 'info',
              text1: 'Bilgi',
              text2: 'Yeni takip etkinliği oluşturuldu.',
              position: 'top',
              visibilityTime: 2000,
            })
          }, 1000)
        }
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: err instanceof Error ? err.message : 'Etkinlik tamamlanamadı.',
        position: 'top',
        visibilityTime: 2000,
      })
    } finally {
      if (isMountedRef.current) {
        setIsCompleting(false)
      }
    }
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/event/${id}/edit` as any)
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Statik glow orbs */}
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />
          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Etkinlik Detayı</Text>
              </View>
              <View style={styles.headerButton} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Etkinlik bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  // Error state
  if (error || !event) {
    return (
      <View style={styles.container}>
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
            <View style={styles.headerBar}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Etkinlik Detayı</Text>
              </View>
              <View style={styles.headerButton} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={DashboardColors.danger} />
          <Text style={styles.errorTitle}>Bir hata oluştu</Text>
          <Text style={styles.errorText}>{error || 'Etkinlik bulunamadı'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchEvent()}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const canComplete = event.status === 'pending'
  const statusColor = STATUS_COLORS[event.status] || DashboardColors.textSecondary
  const priorityColor = PRIORITY_COLORS[event.priority] || DashboardColors.textSecondary

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

        {/* Statik glow orbs */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.headerSubtitle}>Etkinlik Detayı</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleEditPress}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                style={styles.headerButton}
                activeOpacity={0.7}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* Content */}
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
        {/* Status & Priority Section */}
        <SectionHeader title="Durum" icon="information-circle-outline" />
        <View style={styles.section}>
          <InfoRow
            label="Durum"
            badge={{
              label: getEventStatusLabel(event.status),
              color: statusColor,
            }}
          />
          <InfoRow
            label="Öncelik"
            badge={{
              label: getPriorityLabel(event.priority),
              color: priorityColor,
            }}
          />
          <InfoRow label="Tür" value={getEventTypeLabel(event.event_type)} />
        </View>

        {/* Time Section */}
        <SectionHeader title="Tarih & Saat" icon="calendar-outline" />
        <View style={styles.section}>
          <InfoRow label="Başlangıç" value={formatDate(event.start_datetime, 'dd MMMM yyyy, HH:mm')} />
          <InfoRow label="Bitiş" value={formatDate(event.end_datetime, 'dd MMMM yyyy, HH:mm')} />
          <InfoRow label="Süre" value={formatEventTimeRange(event)} />
          <InfoRow label="Tüm Gün" value={event.is_all_day} />
        </View>

        {/* Description */}
        {event.description && (
          <>
            <SectionHeader title="Açıklama" icon="document-text-outline" />
            <View style={styles.section}>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          </>
        )}

        {/* Customer Section */}
        {event.customer && (
          <>
            <SectionHeader title="Müşteri" icon="business-outline" />
            <View style={styles.section}>
              <InfoRow label="Müşteri Adı" value={event.customer.name} />
              {event.customer.code && <InfoRow label="Müşteri Kodu" value={event.customer.code} />}
            </View>
          </>
        )}

        {/* Contact Method Section */}
        {event.contact_method && (
          <>
            <SectionHeader title="İletişim" icon="call-outline" />
            <View style={styles.section}>
              <InfoRow label="İletişim Yöntemi" value={getContactMethodLabel(event.contact_method)} />
              {event.contact_detail && <InfoRow label="Detay" value={event.contact_detail} />}
            </View>
          </>
        )}

        {/* Reminder Section */}
        {event.reminder_minutes && (
          <>
            <SectionHeader title="Hatırlatıcı" icon="alarm-outline" />
            <View style={styles.section}>
              <InfoRow
                label="Hatırlatıcı"
                value={getReminderLabel(event.reminder_minutes as ReminderMinutes)}
              />
              {event.reminder_datetime && (
                <InfoRow
                  label="Hatırlatıcı Zamanı"
                  value={formatDate(event.reminder_datetime, 'dd MMMM yyyy, HH:mm')}
                />
              )}
            </View>
          </>
        )}

        {/* Outcome Section */}
        {event.outcome && (
          <>
            <SectionHeader title="Sonuç" icon="checkmark-circle-outline" />
            <View style={styles.section}>
              <Text style={styles.description}>{event.outcome}</Text>
            </View>
          </>
        )}

        {/* Next Action Section */}
        {event.next_action && (
          <>
            <SectionHeader title="Sonraki Adım" icon="arrow-forward-circle-outline" />
            <View style={styles.section}>
              <Text style={styles.description}>{event.next_action}</Text>
            </View>
          </>
        )}

        {/* Complete Button */}
        {canComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            disabled={isCompleting}
            activeOpacity={0.7}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Etkinliği Tamamla</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Timestamps */}
        <SectionHeader title="Kayıt Bilgileri" icon="time-outline" />
        <View style={styles.section}>
          <InfoRow label="Oluşturulma" value={formatDate(event.created_at, 'dd MMMM yyyy, HH:mm')} />
          <InfoRow label="Güncelleme" value={formatDate(event.updated_at, 'dd MMMM yyyy, HH:mm')} />
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Etkinliği Sil"
        message="Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        visible={showCompleteConfirm}
        title="Etkinliği Tamamla"
        message="Bu etkinliği tamamlandı olarak işaretlemek istediğinizden emin misiniz?"
        confirmText="Tamamla"
        cancelText="İptal"
        isLoading={isCompleting}
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary,
  },

  // Header
  headerContainer: {
    position: 'relative',
    paddingBottom: 32,
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 70,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
  },
  headerTitle: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
  },

  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl'],
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DashboardColors.background,
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DashboardColors.background,
    paddingHorizontal: DashboardSpacing.xl,
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.md,
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginTop: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl'],
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DashboardSpacing.xl,
    marginBottom: DashboardSpacing.md,
    gap: DashboardSpacing.sm,
  },
  sectionHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
  },

  // Section
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.xs,
  },
  infoLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  infoBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
  },
  infoBadgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
  },

  // Description
  description: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    lineHeight: 22,
  },

  // Complete Button
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    marginTop: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg,
    ...DashboardShadows.sm,
  },
  completeButtonText: {
    fontSize: DashboardFontSizes.lg,
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
