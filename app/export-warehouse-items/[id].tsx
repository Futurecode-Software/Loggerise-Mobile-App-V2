/**
 * İhracat Deposu Mal Detay Sayfası
 *
 * CLAUDE.md ilkelerine uygun
 * SectionHeader + InfoRow pattern'i
 * Durum geçiş butonları (mark-ready, mark-loaded)
 * useFocusEffect ile edit'ten dönüşte yenileme
 * ConfirmDialog ile silme onayı
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
  getExportWarehouseItem,
  deleteExportWarehouseItem,
  markItemReady,
  markItemLoaded,
  ExportWarehouseItem,
  getStatusInfo,
  getPackageTypeLabel
} from '@/services/endpoints/export-warehouse-items'

// Tarih formatlama
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export default function ExportWarehouseItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const itemId = id ? parseInt(id, 10) : null

  // State
  const [item, setItem] = useState<ExportWarehouseItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchItem = useCallback(async (showLoading = true) => {
    if (!itemId) {
      setError('Geçersiz mal ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getExportWarehouseItem(itemId)

      if (isMountedRef.current) {
        setItem(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Mal bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [itemId])

  useEffect(() => {
    isMountedRef.current = true
    fetchItem()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchItem])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchItem(false)
    }, [fetchItem])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchItem(false)
  }, [fetchItem])

  // Düzenleme
  const handleEdit = () => {
    if (!itemId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/export-warehouse-items/${itemId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemi
  const confirmDelete = async () => {
    if (!itemId) return

    setIsDeleting(true)
    try {
      await deleteExportWarehouseItem(itemId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Mal başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Mal silinemedi',
        position: 'top',
        visibilityTime: 1500,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Hazır İşaretle
  const handleMarkReady = async () => {
    if (!itemId) return

    setIsUpdatingStatus(true)
    try {
      await markItemReady(itemId)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Mal hazır olarak işaretlendi',
        position: 'top',
        visibilityTime: 1500,
      })
      fetchItem(false)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Durum güncellenemedi',
        position: 'top',
        visibilityTime: 1500,
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Yüklendi İşaretle
  const handleMarkLoaded = async () => {
    if (!itemId) return

    setIsUpdatingStatus(true)
    try {
      await markItemLoaded(itemId)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Mal yüklendi olarak işaretlendi',
        position: 'top',
        visibilityTime: 1500,
      })
      fetchItem(false)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Durum güncellenemedi',
        position: 'top',
        visibilityTime: 1500,
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Geri
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // Durum bilgileri
  const statusInfo = item ? getStatusInfo(item.status) : null

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

            {/* Başlık */}
            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
            ) : item ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {item.item_number}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar */}
            {!isLoading && item ? (
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

          {/* Durum Badge */}
          {isLoading ? (
            <View style={styles.headerSubRow}>
              <Skeleton width={80} height={14} />
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : item && statusInfo ? (
            <View style={styles.headerSubRow}>
              {item.load?.load_number && (
                <Text style={styles.headerCode}>Yük: {item.load.load_number}</Text>
              )}
              <View style={[styles.headerStatusBadge, { backgroundColor: statusInfo.bg }]}>
                <View style={[styles.headerStatusDot, { backgroundColor: statusInfo.color }]} />
                <Text style={[styles.headerStatusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* İçerik */}
      <ScrollView
        style={styles.contentArea}
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
        {!isLoading && (error || !item) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Mal bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchItem()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && item && (
          <>
            {/* Durum Aksiyonları */}
            {(item.status === 'received' || item.status === 'ready') && (
              <View style={styles.actionCard}>
                {item.status === 'received' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonReady]}
                    onPress={handleMarkReady}
                    disabled={isUpdatingStatus}
                    activeOpacity={0.7}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Hazır İşaretle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {item.status === 'ready' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonLoaded]}
                    onPress={handleMarkLoaded}
                    disabled={isUpdatingStatus}
                    activeOpacity={0.7}
                  >
                    {isUpdatingStatus ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="car" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Yüklendi İşaretle</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Mal Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Mal Bilgileri" icon="cube-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Mal Numarası"
                  value={item.item_number}
                  icon="barcode-outline"
                  highlight
                />
                {item.description && (
                  <InfoRow
                    label="Açıklama"
                    value={item.description}
                    icon="document-text-outline"
                  />
                )}
                {item.package_type && (
                  <InfoRow
                    label="Paket Tipi"
                    value={getPackageTypeLabel(item.package_type)}
                    icon="archive-outline"
                  />
                )}
                {item.package_count && (
                  <InfoRow
                    label="Paket Sayısı"
                    value={String(item.package_count)}
                    icon="layers-outline"
                  />
                )}
                {item.gross_weight_kg && (
                  <InfoRow
                    label="Brüt Ağırlık"
                    value={`${item.gross_weight_kg} kg`}
                    icon="scale-outline"
                  />
                )}
                {item.volume_m3 && (
                  <InfoRow
                    label="Hacim"
                    value={`${item.volume_m3} m³`}
                    icon="resize-outline"
                  />
                )}
              </View>
            </View>

            {/* Yük Bilgileri */}
            {item.load && (
              <View style={styles.card}>
                <SectionHeader title="Yük Bilgileri" icon="boat-outline" />
                <View style={styles.cardContent}>
                  <InfoRow
                    label="Yük Numarası"
                    value={item.load.load_number}
                    icon="document-outline"
                    highlight
                  />
                  {item.customer && (
                    <InfoRow
                      label="Müşteri"
                      value={item.customer.short_name || item.customer.name}
                      icon="person-outline"
                    />
                  )}
                  {item.position?.position_number && (
                    <InfoRow
                      label="Pozisyon"
                      value={item.position.position_number}
                      icon="git-branch-outline"
                    />
                  )}
                  {item.position?.driver && (
                    <InfoRow
                      label="Sürücü"
                      value={item.position.driver.name}
                      icon="car-outline"
                    />
                  )}
                  {item.position?.truck_tractor && (
                    <InfoRow
                      label="Çekici"
                      value={`${item.position.truck_tractor.plate} - ${item.position.truck_tractor.brand} ${item.position.truck_tractor.model}`}
                      icon="bus-outline"
                    />
                  )}
                  {item.position?.trailer && (
                    <InfoRow
                      label="Römork"
                      value={`${item.position.trailer.plate} - ${item.position.trailer.brand} ${item.position.trailer.model}`}
                      icon="trail-sign-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Depo Bilgileri */}
            {item.warehouse && (
              <View style={styles.card}>
                <SectionHeader title="Depo Bilgileri" icon="business-outline" />
                <View style={styles.cardContent}>
                  <InfoRow
                    label="Depo Adı"
                    value={item.warehouse.name}
                    icon="text-outline"
                    highlight
                  />
                  <InfoRow
                    label="Depo Kodu"
                    value={item.warehouse.code}
                    icon="barcode-outline"
                  />
                </View>
              </View>
            )}

            {/* Gümrük & Referans Bilgileri */}
            {(item.declaration_no || item.customer_reference || item.invoice_no) && (
              <View style={styles.card}>
                <SectionHeader title="Gümrük & Referans" icon="shield-outline" />
                <View style={styles.cardContent}>
                  {item.declaration_no && (
                    <InfoRow
                      label="Deklarasyon No"
                      value={item.declaration_no}
                      icon="document-lock-outline"
                    />
                  )}
                  {item.customer_reference && (
                    <InfoRow
                      label="Müşteri Referansı"
                      value={item.customer_reference}
                      icon="bookmark-outline"
                    />
                  )}
                  {item.invoice_no && (
                    <InfoRow
                      label="Fatura No"
                      value={item.invoice_no}
                      icon="receipt-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Notlar */}
            {item.notes && (
              <View style={styles.card}>
                <SectionHeader title="Notlar" icon="chatbox-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              </View>
            )}

            {/* Durum Geçmişi */}
            {item.status_history && item.status_history.length > 0 && (
              <View style={styles.card}>
                <SectionHeader title="Durum Geçmişi" icon="time-outline" />
                <View style={styles.cardContent}>
                  {item.status_history.map((history) => {
                    const newStatusInfo = getStatusInfo(history.new_status)
                    return (
                      <View key={history.id} style={styles.historyItem}>
                        <View style={[styles.historyDot, { backgroundColor: newStatusInfo.color }]} />
                        <View style={styles.historyContent}>
                          <Text style={styles.historyStatus}>{newStatusInfo.label}</Text>
                          {history.user && (
                            <Text style={styles.historyUser}>{history.user.name}</Text>
                          )}
                          {history.created_at && (
                            <Text style={styles.historyDate}>{formatDate(history.created_at)}</Text>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="information-circle-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(item.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(item.updated_at)}
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
        title="Malı Sil"
        message="Bu malı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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

  // Header
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 32,
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
    alignItems: 'center',
    minHeight: 70,
    marginBottom: DashboardSpacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginHorizontal: DashboardSpacing.md,
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
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1,
  },
  headerSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCode: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6,
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerStatusText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
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

  // İçerik
  contentArea: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
  },

  // Action Card
  actionCard: {
    marginBottom: DashboardSpacing.md,
    gap: DashboardSpacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.xl,
    height: 52,
    ...DashboardShadows.sm,
  },
  actionButtonReady: {
    backgroundColor: '#10B981',
  },
  actionButtonLoaded: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: '#fff',
  },

  // Kartlar
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm,
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
  },

  // Notlar
  notesText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 22,
    paddingVertical: DashboardSpacing.md,
  },

  // Durum Geçmişi
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  historyUser: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2,
  },
  historyDate: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: 2,
  },

  // Skeleton
  skeletonContainer: {
    gap: DashboardSpacing.md,
  },
  skeletonHeader: {
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },

  // Hata durumu
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl'],
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
