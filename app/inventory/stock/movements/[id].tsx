/**
 * Stock Movement Detail Screen
 *
 * Stok hareketi detay sayfası - CLAUDE.md tasarım ilkeleri ile uyumlu
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getStockMovement,
  deleteStockMovement,
  getMovementTypeLabel,
  isInboundMovement,
  getMovementTypeColor,
  StockMovement
} from '@/services/endpoints/stock-movements'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { SectionHeader } from '@/components/detail/SectionHeader'
import { InfoRow } from '@/components/detail/InfoRow'

export default function MovementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const movementId = id ? parseInt(id, 10) : null

  // State
  const [movement, setMovement] = useState<StockMovement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchMovement = useCallback(async (showLoading = true) => {
    if (!movementId) {
      setError('Geçersiz hareket ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getStockMovement(movementId)

      if (isMountedRef.current) {
        setMovement(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Stok hareketi yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [movementId])

  useEffect(() => {
    isMountedRef.current = true
    fetchMovement()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchMovement])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchMovement(false)
    }, [fetchMovement])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchMovement(false)
  }, [fetchMovement])

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!movementId) return

    setIsDeleting(true)
    try {
      await deleteStockMovement(movementId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Stok hareketi başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Stok hareketi silinemedi',
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

  const formatQuantity = (mov: StockMovement) => {
    const sign = isInboundMovement(mov.movement_type) ? '+' : '-'
    const unit = mov.product?.unit || ''
    return `${sign}${mov.quantity} ${unit}`
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
            ) : movement ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {movement.product?.name || `Ürün #${movement.product_id}`}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && movement ? (
              <View style={styles.headerActions}>
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

          {/* Hareket Bilgileri */}
          {isLoading ? (
            <View style={styles.movementInfoHeader}>
              <Skeleton width={80} height={80} borderRadius={40} />
              <Skeleton width={120} height={24} borderRadius={12} style={{ marginTop: DashboardSpacing.md }} />
              <Skeleton width={100} height={32} style={{ marginTop: DashboardSpacing.sm }} />
            </View>
          ) : movement ? (
            <View style={styles.movementInfoHeader}>
              <View style={[
                styles.movementIcon,
                { backgroundColor: `${getMovementTypeColor(movement.movement_type)}15` }
              ]}>
                <Ionicons
                  name={
                    movement.movement_type === 'transfer_in' || movement.movement_type === 'transfer_out'
                      ? 'swap-horizontal'
                      : isInboundMovement(movement.movement_type)
                        ? 'arrow-down'
                        : 'arrow-up'
                  }
                  size={40}
                  color={getMovementTypeColor(movement.movement_type)}
                />
              </View>
              <View style={[
                styles.typeBadge,
                {
                  backgroundColor: isInboundMovement(movement.movement_type)
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)'
                }
              ]}>
                <Text style={[
                  styles.typeBadgeText,
                  {
                    color: isInboundMovement(movement.movement_type)
                      ? DashboardColors.success
                      : DashboardColors.danger
                  }
                ]}>
                  {getMovementTypeLabel(movement.movement_type)}
                </Text>
              </View>
              <Text style={[
                styles.quantityBig,
                {
                  color: isInboundMovement(movement.movement_type)
                    ? '#FFFFFF'
                    : 'rgba(239, 68, 68, 0.9)'
                }
              ]}>
                {formatQuantity(movement)}
              </Text>
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
        {!isLoading && (error || !movement) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Stok hareketi bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchMovement()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && movement && (
          <>
            {/* Ürün Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Ürün Bilgileri" icon="cube-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Ürün"
                  value={movement.product?.name || `Ürün #${movement.product_id}`}
                  icon="pricetag-outline"
                  highlight
                />
                {movement.product?.code && (
                  <InfoRow
                    label="Ürün Kodu"
                    value={movement.product.code}
                    icon="barcode-outline"
                  />
                )}
              </View>
            </View>

            {/* Depo Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Depo Bilgileri" icon="business-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label={
                    movement.movement_type === 'transfer_in' || movement.movement_type === 'transfer_out'
                      ? 'Kaynak Depo'
                      : 'Depo'
                  }
                  value={movement.warehouse?.name || `Depo #${movement.warehouse_id}`}
                  icon="home-outline"
                />
                {(movement.movement_type === 'transfer_in' || movement.movement_type === 'transfer_out') &&
                  movement.reference_warehouse && (
                    <InfoRow
                      label="Hedef Depo"
                      value={movement.reference_warehouse.name}
                      icon="home-outline"
                    />
                  )}
              </View>
            </View>

            {/* Hareket Detayları */}
            <View style={styles.card}>
              <SectionHeader title="Hareket Detayları" icon="information-circle-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Miktar"
                  value={`${movement.quantity} ${movement.product?.unit || ''}`}
                  icon="layers-outline"
                  highlight
                />
                {movement.unit_cost !== undefined && movement.unit_cost !== null && (
                  <InfoRow
                    label="Birim Maliyet"
                    value={formatCurrency(movement.unit_cost, movement.currency_type || 'TRY')}
                    icon="cash-outline"
                  />
                )}
                {movement.total_cost !== undefined && movement.total_cost !== null && (
                  <InfoRow
                    label="Toplam Maliyet"
                    value={formatCurrency(movement.total_cost, movement.currency_type || 'TRY')}
                    icon="calculator-outline"
                  />
                )}
                {movement.balance_after !== undefined && movement.balance_after !== null && (
                  <InfoRow
                    label="Sonraki Bakiye"
                    value={`${movement.balance_after} ${movement.product?.unit || ''}`}
                    icon="pulse-outline"
                  />
                )}
              </View>
            </View>

            {/* Tarih ve Notlar */}
            <View style={styles.card}>
              <SectionHeader title="Tarih ve Notlar" icon="calendar-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="İşlem Tarihi"
                  value={formatDate(movement.transaction_date)}
                  icon="calendar-outline"
                />
                <InfoRow
                  label="Kayıt Tarihi"
                  value={formatDate(movement.created_at)}
                  icon="time-outline"
                />
                {movement.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Notlar</Text>
                    <Text style={styles.notesText}>{movement.notes}</Text>
                  </View>
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
        title="Stok Hareketini Sil"
        message="Bu stok hareketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
    marginBottom: DashboardSpacing.md,
    minHeight: 70
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
    width: 44
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
  movementInfoHeader: {
    alignItems: 'center',
    marginTop: DashboardSpacing.sm
  },
  movementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.md
  },
  typeBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    marginBottom: DashboardSpacing.sm
  },
  typeBadgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },
  quantityBig: {
    fontSize: DashboardFontSizes['4xl'],
    fontWeight: '800',
    letterSpacing: 0.5
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

  // Notlar
  notesSection: {
    paddingTop: DashboardSpacing.md,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  notesLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.xs
  },
  notesText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
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
