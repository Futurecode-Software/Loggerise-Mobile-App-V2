/**
 * Kategori Detay Sayfası
 *
 * Kategori bilgilerini detaylı görüntüleme - CLAUDE.md tasarım ilkeleri ile uyumlu
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
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getProductCategory,
  deleteProductCategory,
  ProductCategory
} from '@/services/endpoints/products'
import { formatDate } from '@/utils/date'
import { SectionHeader } from '@/components/detail/SectionHeader'
import { InfoRow } from '@/components/detail/InfoRow'

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const categoryId = id ? parseInt(id, 10) : null

  // State
  const [category, setCategory] = useState<ProductCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Veri çekme
  const fetchCategory = useCallback(async (showLoading = true) => {
    if (!categoryId) {
      setError('Geçersiz kategori ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getProductCategory(categoryId)

      if (isMountedRef.current) {
        setCategory(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Kategori bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [categoryId])

  useEffect(() => {
    isMountedRef.current = true
    fetchCategory()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchCategory])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchCategory(false)
    }, [fetchCategory])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchCategory(false)
  }, [fetchCategory])

  // Düzenleme
  const handleEdit = () => {
    if (!categoryId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/inventory/stock/categories/${categoryId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!categoryId) return

    setIsDeleting(true)
    try {
      await deleteProductCategory(categoryId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Kategori başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Kategori silinemedi',
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
            ) : category ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {category.name}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ */}
            {!isLoading && category ? (
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

          {/* Kategori Özeti + Status */}
          {isLoading ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryInfo}>
                <Skeleton width={120} height={14} style={{ marginBottom: DashboardSpacing.xs }} />
                <Skeleton width={80} height={24} />
              </View>
              <Skeleton width={70} height={32} borderRadius={16} />
            </View>
          ) : category ? (
            <View style={styles.summaryRow}>
              <View style={styles.summaryInfo}>
                {category.parent && (
                  <View style={styles.parentTag}>
                    <Ionicons name="return-down-forward-outline" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.parentTagText}>{category.parent.name}</Text>
                  </View>
                )}
                {category.children_count !== undefined && category.children_count > 0 && (
                  <Text style={styles.childrenCountText}>
                    {category.children_count} alt kategori
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: category.is_active
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: category.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: category.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                >
                  {category.is_active ? 'Aktif' : 'Pasif'}
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
            {[1, 2].map(i => (
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
        {!isLoading && (error || !category) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Kategori bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchCategory()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && category && (
          <>
            {/* Kategori Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Kategori Bilgileri" icon="folder-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Kategori Adı"
                  value={category.name}
                  icon="text-outline"
                  highlight
                />
                {category.parent && (
                  <InfoRow
                    label="Üst Kategori"
                    value={category.parent.name}
                    icon="return-down-forward-outline"
                  />
                )}
                {category.children_count !== undefined && (
                  <InfoRow
                    label="Alt Kategori Sayısı"
                    value={String(category.children_count)}
                    icon="layers-outline"
                  />
                )}
                <InfoRow
                  label="Durum"
                  value={category.is_active ? 'Aktif' : 'Pasif'}
                  icon={category.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
                />
              </View>
            </View>

            {/* Açıklama */}
            {category.description && (
              <View style={styles.card}>
                <SectionHeader title="Açıklama" icon="document-text-outline" />
                <View style={styles.cardContent}>
                  <Text style={styles.descriptionText}>{category.description}</Text>
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(category.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(category.updated_at)}
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
        title="Kategoriyi Sil"
        message="Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: DashboardSpacing.md
  },
  summaryInfo: {
    flex: 1,
    gap: DashboardSpacing.xs
  },
  parentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  parentTagText: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)'
  },
  childrenCountText: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)'
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
