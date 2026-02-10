/**
 * İhracat Deposu Detay Sayfası
 *
 * CLAUDE.md ilkelerine uygun
 * SectionHeader + InfoRow pattern'i
 * useFocusEffect ile edit'ten dönüşte yenileme
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
  getExportWarehouse,
  deleteExportWarehouse,
  ExportWarehouse,
  ExportWarehouseItem
} from '@/services/endpoints/export-warehouses'

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

// Mal durumu badge
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'received':
      return { label: 'Teslim Alındı', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' }
    case 'ready':
      return { label: 'Hazır', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' }
    case 'loaded':
      return { label: 'Yüklendi', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' }
    case 'waiting':
      return { label: 'Bekliyor', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' }
    default:
      return { label: status, color: DashboardColors.textMuted, bg: 'rgba(156, 163, 175, 0.1)' }
  }
}

// Item Card
function WarehouseItemCard({ item }: { item: ExportWarehouseItem }) {
  const statusInfo = getStatusInfo(item.status)

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemCardHeader}>
        <View style={styles.itemCardLeft}>
          {item.load?.load_number && (
            <Text style={styles.itemLoadNumber}>{item.load.load_number}</Text>
          )}
          {item.customer?.name && (
            <Text style={styles.itemCustomer} numberOfLines={1}>
              {item.customer.short_name || item.customer.name}
            </Text>
          )}
        </View>
        <View style={[styles.itemStatusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.itemStatusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>
      {item.position?.position_number && (
        <View style={styles.itemCardFooter}>
          <Ionicons name="document-outline" size={12} color={DashboardColors.textMuted} />
          <Text style={styles.itemPositionText}>Pozisyon: {item.position.position_number}</Text>
        </View>
      )}
    </View>
  )
}

export default function ExportWarehouseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const warehouseId = id ? parseInt(id, 10) : null

  // State
  const [warehouse, setWarehouse] = useState<ExportWarehouse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchWarehouse = useCallback(async (showLoading = true) => {
    if (!warehouseId) {
      setError('Geçersiz depo ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getExportWarehouse(warehouseId)

      if (isMountedRef.current) {
        setWarehouse(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Depo bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [warehouseId])

  useEffect(() => {
    isMountedRef.current = true
    fetchWarehouse()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchWarehouse])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchWarehouse(false)
    }, [fetchWarehouse])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchWarehouse(false)
  }, [fetchWarehouse])

  // Düzenleme
  const handleEdit = () => {
    if (!warehouseId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/warehouse/exports/${warehouseId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemi
  const confirmDelete = async () => {
    if (!warehouseId) return

    setIsDeleting(true)
    try {
      await deleteExportWarehouse(warehouseId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Depo başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Depo silinemedi',
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
            ) : warehouse ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {warehouse.name}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar */}
            {!isLoading && warehouse ? (
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

          {/* Durum Badge + Kod */}
          {isLoading ? (
            <View style={styles.headerSubRow}>
              <Skeleton width={80} height={14} />
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : warehouse ? (
            <View style={styles.headerSubRow}>
              <Text style={styles.headerCode}>{warehouse.code}</Text>
              <View
                style={[
                  styles.headerStatusBadge,
                  {
                    backgroundColor: warehouse.is_active
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <View
                  style={[
                    styles.headerStatusDot,
                    {
                      backgroundColor: warehouse.is_active
                        ? DashboardColors.success
                        : DashboardColors.danger
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.headerStatusText,
                    {
                      color: warehouse.is_active
                        ? DashboardColors.success
                        : DashboardColors.danger
                    }
                  ]}
                >
                  {warehouse.is_active ? 'Aktif' : 'Pasif'}
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
        {!isLoading && (error || !warehouse) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Depo bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchWarehouse()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && warehouse && (
          <>
            {/* Depo Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Depo Bilgileri" icon="business-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Depo Adı"
                  value={warehouse.name}
                  icon="text-outline"
                  highlight
                />
                <InfoRow
                  label="Depo Kodu"
                  value={warehouse.code}
                  icon="barcode-outline"
                />
                {warehouse.address && (
                  <InfoRow
                    label="Adres"
                    value={warehouse.address}
                    icon="map-outline"
                  />
                )}
              </View>
            </View>

            {/* Konum Bilgileri */}
            {(warehouse.country || warehouse.state || warehouse.city) && (
              <View style={styles.card}>
                <SectionHeader title="Konum Bilgileri" icon="location-outline" />
                <View style={styles.cardContent}>
                  {warehouse.country && (
                    <InfoRow
                      label="Ülke"
                      value={warehouse.country.name}
                      icon="globe-outline"
                    />
                  )}
                  {warehouse.state && (
                    <InfoRow
                      label="İl"
                      value={warehouse.state.name}
                      icon="navigate-outline"
                    />
                  )}
                  {warehouse.city && (
                    <InfoRow
                      label="Şehir"
                      value={warehouse.city.name}
                      icon="pin-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* İletişim Bilgileri */}
            {(warehouse.contact_person || warehouse.phone) && (
              <View style={styles.card}>
                <SectionHeader title="İletişim Bilgileri" icon="call-outline" />
                <View style={styles.cardContent}>
                  {warehouse.contact_person && (
                    <InfoRow
                      label="İletişim Kişisi"
                      value={warehouse.contact_person}
                      icon="person-outline"
                    />
                  )}
                  {warehouse.phone && (
                    <InfoRow
                      label="Telefon"
                      value={warehouse.phone}
                      icon="call-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Depodaki Mallar */}
            {warehouse.items && warehouse.items.length > 0 && (
              <View style={styles.card}>
                <SectionHeader
                  title={`Depodaki Mallar (${warehouse.items.length})`}
                  icon="cube-outline"
                />
                <View style={styles.cardContent}>
                  {warehouse.items.map((item) => (
                    <WarehouseItemCard key={item.id} item={item} />
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
                  value={formatDate(warehouse.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(warehouse.updated_at)}
                  icon="refresh-outline"
                />
                <InfoRow
                  label="Durum"
                  value={warehouse.is_active ? 'Aktif' : 'Pasif'}
                  icon={warehouse.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
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
        title="Depoyu Sil"
        message="Bu depoyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    paddingBottom: 32
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
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
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
  headerSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerCode: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500'
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  headerStatusText: {
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
  contentArea: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0
  },

  // Kartlar
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg
  },

  // Item Cards
  itemCard: {
    paddingVertical: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  itemCardLeft: {
    flex: 1,
    marginRight: DashboardSpacing.sm
  },
  itemLoadNumber: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  itemCustomer: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  itemStatusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  itemStatusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  itemCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: DashboardSpacing.xs
  },
  itemPositionText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
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
