/**
 * Export Position Detail Screen
 *
 * Dashboard-style position detail view.
 * Matches web version at /lojistik-yonetimi/ihracatlar/pozisyonlar/{id}
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
} from '@/constants/dashboard-theme'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  getPosition,
  Position,
  getPositionTypeLabel,
  getVehicleOwnerTypeLabel,
  getDriverFullName,
  getInsuranceStatusLabel,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/services/endpoints/positions'

// Section Header Component
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

// Info Row Component
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

// Status Badge Component
function StatusBadge({ status }: { status?: string }) {
  const colors = STATUS_COLORS[status || 'active'] || STATUS_COLORS.active
  const label = STATUS_LABELS[status || 'active'] || status

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.statusText, { color: colors.primary }]}>{label}</Text>
    </View>
  )
}

export default function ExportPositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  // State
  const [position, setPosition] = useState<Position | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Fetch position data
  const fetchPosition = useCallback(async (showLoading = true) => {
    if (!id) return

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getPosition(parseInt(id, 10))

      if (isMountedRef.current) {
        setPosition(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Pozisyon bilgileri yüklenemedi'
        setError(errorMsg)
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: errorMsg,
          position: 'top',
          visibilityTime: 1500,
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [id])

  useEffect(() => {
    isMountedRef.current = true
    fetchPosition()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchPosition])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPosition(false)
  }, [fetchPosition])

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/logistics/exports/positions/${id}/edit` as any)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!id) return

    setIsDeleting(true)
    try {
      // TODO: Implement delete API call
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Pozisyon başarıyla silindi',
        position: 'top',
        visibilityTime: 1500,
      })

      setTimeout(() => {
        router.back()
      }, 300)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Pozisyon silinemedi',
        position: 'top',
        visibilityTime: 1500,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading state
  if (isLoading) {
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
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>

        {/* Loading Content */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Pozisyon bilgileri yükleniyor...</Text>
        </View>
      </View>
    )
  }

  // Error state
  if (error || !position) {
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
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName}>Hata</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>

        {/* Error Content */}
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
          </View>
          <Text style={styles.errorTitle}>Bir hata oluştu</Text>
          <Text style={styles.errorText}>{error || 'Pozisyon bulunamadı'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPosition()}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const driverName = getDriverFullName(position.driver)
  const secondDriverName = getDriverFullName(position.second_driver)
  const vehicleInfo = position.truck_tractor
    ? `${position.truck_tractor.plate}${position.trailer ? ' / ' + position.trailer.plate : ''}`
    : position.trailer?.plate || '-'
  const insuranceStatus = getInsuranceStatusLabel(position.insurance_status)

  return (
    <View style={styles.container}>
      {/* Header with LinearGradient */}
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
            <View style={styles.headerTitleSection}>
              <Text style={styles.headerName} numberOfLines={1}>
                {position.position_number}
              </Text>
            </View>

            {/* Aksiyonlar - Sağ */}
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
          </View>

          {/* Alt Bilgiler: Pozisyon Adı + Badge'ler */}
          {position.name && (
            <Text style={styles.headerSubtitle}>{position.name}</Text>
          )}
          <View style={styles.headerBadges}>
            <StatusBadge status={position.status} />
            <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={styles.typeBadgeText}>
                {getPositionTypeLabel(position.position_type)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomCurve} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DashboardColors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Genel Bilgiler */}
        <View style={styles.card}>
          <SectionHeader title="Genel Bilgiler" icon="information-circle-outline" />
          <View style={styles.cardContent}>
            <InfoRow label="Pozisyon No" value={position.position_number} icon="document-text-outline" />
            {position.name && (
              <InfoRow label="Pozisyon Adı" value={position.name} icon="text-outline" />
            )}
            <InfoRow
              label="Pozisyon Tipi"
              value={getPositionTypeLabel(position.position_type)}
              icon="swap-horizontal-outline"
            />
            <InfoRow
              label="Araç Sahibi"
              value={getVehicleOwnerTypeLabel(position.vehicle_owner_type)}
              icon="business-outline"
            />
            {position.route && (
              <InfoRow label="Rota" value={position.route} icon="map-outline" highlight />
            )}
          </View>
        </View>

        {/* Araç Bilgileri */}
        {(position.truck_tractor || position.trailer) && (
          <View style={styles.card}>
            <SectionHeader title="Araç Bilgileri" icon="car-outline" />
            <View style={styles.cardContent}>
              {vehicleInfo !== '-' && (
                <InfoRow label="Araç" value={vehicleInfo} icon="car-outline" highlight />
              )}
              {position.trailer_class && (
                <InfoRow label="Dorse Sınıfı" value={position.trailer_class} icon="cube-outline" />
              )}
            </View>
          </View>
        )}

        {/* Sürücü Bilgileri */}
        {(position.driver || position.second_driver) && (
          <View style={styles.card}>
            <SectionHeader title="Sürücü Bilgileri" icon="people-outline" />
            <View style={styles.cardContent}>
              {driverName !== '-' && (
                <InfoRow label="Sürücü" value={driverName} icon="person-outline" highlight />
              )}
              {secondDriverName !== '-' && (
                <InfoRow label="2. Sürücü" value={secondDriverName} icon="person-outline" />
              )}
            </View>
          </View>
        )}

        {/* RoRo Bilgileri */}
        {position.is_roro && (
          <View style={styles.card}>
            <SectionHeader title="RoRo Bilgileri" icon="boat-outline" />
            <View style={styles.cardContent}>
              {position.roro_booking_reference && (
                <InfoRow label="Rezervasyon No" value={position.roro_booking_reference} icon="bookmark-outline" />
              )}
              {position.departurePort && (
                <InfoRow label="Kalkış Limanı" value={position.departurePort.name} icon="navigate-outline" />
              )}
              {position.arrivalPort && (
                <InfoRow label="Varış Limanı" value={position.arrivalPort.name} icon="locate-outline" />
              )}
              {position.roro_departure_date && (
                <InfoRow label="Kalkış Tarihi" value={position.roro_departure_date} icon="calendar-outline" />
              )}
              {position.roro_arrival_date && (
                <InfoRow label="Varış Tarihi" value={position.roro_arrival_date} icon="calendar-outline" />
              )}
              {position.roro_deck_type && (
                <InfoRow label="Güverte" value={position.roro_deck_type === 'alt_guverte' ? 'Alt Güverte' : 'Üst Güverte'} icon="layers-outline" />
              )}
            </View>
          </View>
        )}

        {/* Sınır Geçiş Bilgileri */}
        {(position.border_exit_gate || position.border_entry_gate) && (
          <View style={styles.card}>
            <SectionHeader title="Sınır Geçiş" icon="flag-outline" />
            <View style={styles.cardContent}>
              {position.border_exit_gate && (
                <InfoRow label="Çıkış Kapısı" value={position.border_exit_gate} icon="exit-outline" />
              )}
              {position.border_exit_date && (
                <InfoRow label="Çıkış Tarihi" value={position.border_exit_date} icon="calendar-outline" />
              )}
              {position.border_entry_gate && (
                <InfoRow label="Giriş Kapısı" value={position.border_entry_gate} icon="enter-outline" />
              )}
              {position.border_entry_date && (
                <InfoRow label="Giriş Tarihi" value={position.border_entry_date} icon="calendar-outline" />
              )}
            </View>
          </View>
        )}

        {/* Sigorta Bilgileri */}
        {position.insurance_status && (
          <View style={styles.card}>
            <SectionHeader title="Sigorta" icon="shield-checkmark-outline" />
            <View style={styles.cardContent}>
              <InfoRow
                label="Sigorta Durumu"
                value={insuranceStatus.label}
                icon="shield-outline"
                highlight
              />
              {position.insurance_date && (
                <InfoRow label="Sigorta Tarihi" value={position.insurance_date} icon="calendar-outline" />
              )}
              {position.insurance_amount && (
                <InfoRow label="Sigorta Tutarı" value={position.insurance_amount} icon="cash-outline" />
              )}
            </View>
          </View>
        )}

        {/* Mühür Bilgileri */}
        {position.seal_no && (
          <View style={styles.card}>
            <SectionHeader title="Mühür Bilgileri" icon="lock-closed-outline" />
            <View style={styles.cardContent}>
              <InfoRow label="Mühür No" value={position.seal_no} icon="lock-closed-outline" highlight />
              {position.sealing_person && (
                <InfoRow label="Mühürleyen" value={position.sealing_person} icon="person-outline" />
              )}
            </View>
          </View>
        )}

        {/* Notlar */}
        {position.notes && (
          <View style={styles.card}>
            <SectionHeader title="Notlar" icon="chatbubble-outline" />
            <View style={styles.cardContent}>
              <Text style={styles.notesText}>{position.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Pozisyonu Sil"
        message="Bu pozisyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.xl,
  },

  // Header
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 24,
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DashboardSpacing.lg,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  headerActionsPlaceholder: {
    width: 96,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  headerTitleSection: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: DashboardSpacing.md,
  },
  headerName: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: DashboardSpacing.sm,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.md,
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

  // Status Badge
  statusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full,
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full,
  },
  typeBadgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm,
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  countBadge: {
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: '#fff',
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: DashboardSpacing.sm,
  },
  infoLabelText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
  },
  infoValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    maxWidth: '50%',
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: DashboardColors.primary,
    fontWeight: '600',
  },

  // Notes
  notesText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    lineHeight: 22,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.background,
    gap: DashboardSpacing.md,
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl'],
    backgroundColor: DashboardColors.background,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
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
    color: '#fff',
  },
})
