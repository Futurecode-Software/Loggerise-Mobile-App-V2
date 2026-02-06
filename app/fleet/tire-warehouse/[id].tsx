/**
 * Tire Detail Screen
 *
 * Lastik detay sayfası - CLAUDE.md standartlarına uyumlu
 * SectionHeader ve InfoRow component'leri kullanır
 * Backend endpoints:
 * - GET /api/v1/mobile/filo-yonetimi/lastik-deposu/{id}
 * - DELETE /api/v1/mobile/filo-yonetimi/lastik-deposu/{id}
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
  getTireById,
  deleteTire,
  Tire,
  getTireStatusLabel,
  getTireConditionLabel,
  getTireTypeLabel
} from '@/services/endpoints/tires'
import { formatCurrency } from '@/utils/currency'

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

export default function TireDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const tireId = id ? parseInt(id, 10) : null

  // State
  const [tire, setTire] = useState<Tire | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchTire = useCallback(async (showLoading = true) => {
    if (!tireId) {
      setError('Geçersiz lastik ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getTireById(tireId)

      if (isMountedRef.current) {
        setTire(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Lastik bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [tireId])

  useEffect(() => {
    isMountedRef.current = true
    fetchTire()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchTire])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchTire(false)
    }, [fetchTire])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchTire(false)
  }, [fetchTire])

  // Düzenleme
  const handleEdit = () => {
    if (!tireId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/fleet/tire-warehouse/${tireId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!tireId) return

    setIsDeleting(true)
    try {
      await deleteTire(tireId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Lastik başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Lastik silinemedi',
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
        {/* Dekoratif ışık efektleri - Statik */}
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
            ) : tire ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {tire.serial_number}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && tire ? (
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

          {/* Lastik Özeti */}
          {isLoading ? (
            <View style={styles.summaryRow}>
              <View style={styles.summary}>
                <Skeleton width={100} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={160} height={28} />
              </View>
              <Skeleton width={70} height={28} borderRadius={14} />
            </View>
          ) : tire ? (
            <View style={styles.summaryRow}>
              <View style={styles.summary}>
                <Text style={styles.summaryLabel}>{tire.brand} {tire.model}</Text>
                <Text style={styles.summaryValue}>{tire.size}</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: tire.status === 'in_stock' ? DashboardColors.success : DashboardColors.warning }
                ]} />
                <Text style={styles.statusBadgeText}>{getTireStatusLabel(tire.status)}</Text>
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
                <View style={styles.skeletonHeader}>
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
        {!isLoading && (error || !tire) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Lastik bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchTire()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && tire && (
          <>
            {/* Lastik Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Lastik Bilgileri" icon="disc-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Seri Numarası"
                  value={tire.serial_number}
                  icon="barcode-outline"
                  highlight
                />
                <InfoRow
                  label="Marka"
                  value={tire.brand}
                  icon="business-outline"
                />
                <InfoRow
                  label="Model"
                  value={tire.model}
                  icon="pricetag-outline"
                />
                <InfoRow
                  label="Ebat"
                  value={tire.size}
                  icon="resize-outline"
                />
                <InfoRow
                  label="Lastik Tipi"
                  value={getTireTypeLabel(tire.tire_type)}
                  icon="snow-outline"
                />
                <InfoRow
                  label="Durum"
                  value={getTireConditionLabel(tire.condition)}
                  icon="checkmark-circle-outline"
                />
                {tire.tread_depth !== null && (
                  <InfoRow
                    label="Diş Derinliği"
                    value={`${tire.tread_depth} mm${tire.tread_depth <= 3.0 ? ' ⚠️' : ''}`}
                    icon="speedometer-outline"
                    highlight={tire.tread_depth <= 3.0}
                  />
                )}
                {tire.dot_code && (
                  <InfoRow
                    label="DOT Kodu"
                    value={tire.dot_code}
                    icon="qr-code-outline"
                  />
                )}
              </View>
            </View>

            {/* Satın Alma Bilgileri */}
            {(tire.purchase_date || tire.purchase_price || tire.supplier) && (
              <View style={styles.card}>
                <SectionHeader title="Satın Alma Bilgileri" icon="cash-outline" />
                <View style={styles.cardContent}>
                  {tire.purchase_date && (
                    <InfoRow
                      label="Satın Alma Tarihi"
                      value={formatDate(tire.purchase_date)}
                      icon="calendar-outline"
                    />
                  )}
                  {tire.purchase_price && (
                    <InfoRow
                      label="Satın Alma Fiyatı"
                      value={formatCurrency(tire.purchase_price, 'TRY')}
                      icon="wallet-outline"
                    />
                  )}
                  {tire.supplier && (
                    <InfoRow
                      label="Tedarikçi"
                      value={tire.supplier}
                      icon="people-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Depo Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Depo Bilgileri" icon="location-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Durum"
                  value={getTireStatusLabel(tire.status)}
                  icon="git-branch-outline"
                />
                {tire.warehouse_location && (
                  <InfoRow
                    label="Depo Konumu"
                    value={tire.warehouse_location}
                    icon="navigate-outline"
                  />
                )}
                {tire.current_assignment?.vehicle && (
                  <>
                    <InfoRow
                      label="Atandığı Araç"
                      value={tire.current_assignment.vehicle.plate}
                      icon="car-outline"
                    />
                    {tire.current_assignment.position && (
                      <InfoRow
                        label="Pozisyon"
                        value={tire.current_assignment.position}
                        icon="locate-outline"
                      />
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Notlar */}
            {tire.notes && (
              <View style={styles.card}>
                <SectionHeader title="Notlar" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{tire.notes}</Text>
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(tire.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(tire.updated_at)}
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
        title="Lastiği Sil"
        message={tire ? `${tire.serial_number} seri numaralı lastiği silmek istediğinizden emin misiniz?` : 'Bu lastiği silmek istediğinizden emin misiniz?'}
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
  summary: {
    flex: 1
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: DashboardSpacing.xs
  },
  summaryValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: '#fff'
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
  skeletonHeader: {
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
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
