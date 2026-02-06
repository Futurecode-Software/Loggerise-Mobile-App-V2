/**
 * Product Detail Screen
 *
 * Ürün detay sayfası - CLAUDE.md tasarım ilkeleri ile uyumlu
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
  getProduct,
  deleteProduct,
  Product,
  getProductTypeLabel,
  getProductUnitLabel
} from '@/services/endpoints/products'
import { formatCurrency } from '@/utils/currency'
import { formatDate } from '@/utils/date'
import { SectionHeader } from '@/components/detail/SectionHeader'
import { InfoRow } from '@/components/detail/InfoRow'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const productId = id ? parseInt(id, 10) : null

  // State
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchProduct = useCallback(async (showLoading = true) => {
    if (!productId) {
      setError('Geçersiz ürün ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getProduct(productId)

      if (isMountedRef.current) {
        setProduct(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Ürün bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [productId])

  useEffect(() => {
    isMountedRef.current = true
    fetchProduct()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchProduct])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchProduct(false)
    }, [fetchProduct])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchProduct(false)
  }, [fetchProduct])

  // Düzenleme
  const handleEdit = () => {
    if (!productId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/inventory/stock/products/${productId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!productId) return

    setIsDeleting(true)
    try {
      await deleteProduct(productId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Ürün başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Ürün silinemedi',
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
            ) : product ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {product.name}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && product ? (
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

          {/* Ürün Tipi + Status */}
          {isLoading ? (
            <View style={styles.productTypeRow}>
              <Skeleton width={80} height={28} borderRadius={14} />
              <Skeleton width={70} height={28} borderRadius={14} />
            </View>
          ) : product ? (
            <View style={styles.productTypeRow}>
              <View style={[
                styles.typeBadge,
                { backgroundColor: product.product_type === 'goods'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(59, 130, 246, 0.2)'
                }
              ]}>
                <Ionicons
                  name={product.product_type === 'goods' ? 'cube' : 'construct'}
                  size={14}
                  color={product.product_type === 'goods' ? '#10B981' : '#3B82F6'}
                />
                <Text style={[
                  styles.typeBadgeText,
                  { color: product.product_type === 'goods' ? '#10B981' : '#3B82F6' }
                ]}>
                  {getProductTypeLabel(product.product_type)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: product.is_active
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: product.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: product.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                >
                  {product.is_active ? 'Aktif' : 'Pasif'}
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
        {!isLoading && (error || !product) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Ürün bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchProduct()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && product && (
          <>
            {/* Ürün Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Ürün Bilgileri" icon="cube-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Ürün Adı"
                  value={product.name}
                  icon="text-outline"
                  highlight
                />
                {product.code && (
                  <InfoRow
                    label="Ürün Kodu"
                    value={product.code}
                    icon="barcode-outline"
                  />
                )}
                <InfoRow
                  label="Ürün Tipi"
                  value={getProductTypeLabel(product.product_type)}
                  icon="layers-outline"
                />
                <InfoRow
                  label="Birim"
                  value={getProductUnitLabel(product.unit)}
                  icon="apps-outline"
                />
                {product.barcode && (
                  <InfoRow
                    label="Barkod"
                    value={product.barcode}
                    icon="scan-outline"
                  />
                )}
              </View>
            </View>

            {/* Kategorilendirme */}
            {(product.brand || product.category || product.model) && (
              <View style={styles.card}>
                <SectionHeader title="Kategorilendirme" icon="folder-outline" />
                <View style={styles.cardContent}>
                  {product.brand && (
                    <InfoRow
                      label="Marka"
                      value={product.brand.name}
                      icon="pricetag-outline"
                    />
                  )}
                  {product.category && (
                    <InfoRow
                      label="Kategori"
                      value={product.category.name}
                      icon="grid-outline"
                    />
                  )}
                  {product.model && (
                    <InfoRow
                      label="Model"
                      value={product.model.name}
                      icon="construct-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Fiyatlandırma */}
            {(product.purchase_price !== undefined || product.sale_price !== undefined || product.vat_rate !== undefined) && (
              <View style={styles.card}>
                <SectionHeader title="Fiyatlandırma" icon="cash-outline" />
                <View style={styles.cardContent}>
                  {product.purchase_price !== undefined && product.purchase_price !== null && (
                    <InfoRow
                      label="Alış Fiyatı"
                      value={formatCurrency(product.purchase_price, 'TRY')}
                      icon="log-in-outline"
                    />
                  )}
                  {product.sale_price !== undefined && product.sale_price !== null && (
                    <InfoRow
                      label="Satış Fiyatı"
                      value={formatCurrency(product.sale_price, 'TRY')}
                      icon="log-out-outline"
                      highlight
                    />
                  )}
                  {product.vat_rate !== undefined && product.vat_rate !== null && (
                    <InfoRow
                      label="KDV Oranı"
                      value={`%${product.vat_rate}`}
                      icon="receipt-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Stok Bilgileri */}
            {(product.min_stock_level !== undefined || product.max_stock_level !== undefined) && (
              <View style={styles.card}>
                <SectionHeader title="Stok Bilgileri" icon="stats-chart-outline" />
                <View style={styles.cardContent}>
                  {product.min_stock_level !== undefined && product.min_stock_level !== null && (
                    <InfoRow
                      label="Minimum Stok"
                      value={String(product.min_stock_level)}
                      icon="arrow-down-outline"
                    />
                  )}
                  {product.max_stock_level !== undefined && product.max_stock_level !== null && (
                    <InfoRow
                      label="Maksimum Stok"
                      value={String(product.max_stock_level)}
                      icon="arrow-up-outline"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Açıklama */}
            {product.description && (
              <View style={styles.card}>
                <SectionHeader title="Açıklama" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{product.description}</Text>
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(product.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(product.updated_at)}
                  icon="refresh-outline"
                />
                <InfoRow
                  label="Durum"
                  value={product.is_active ? 'Aktif' : 'Pasif'}
                  icon={product.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
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
        title="Ürünü Sil"
        message="Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
  productTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.sm
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6
  },
  typeBadgeText: {
    fontSize: DashboardFontSizes.sm,
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
