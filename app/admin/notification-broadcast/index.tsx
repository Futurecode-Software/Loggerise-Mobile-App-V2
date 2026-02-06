/**
 * Mobil Bildirimler Liste Sayfası
 *
 * Backend'den gelen notification_broadcasts kayıtlarını listeler
 * Filtreleme, arama, silme, detay görüntüleme özellikleri
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import PageHeader from '@/components/navigation/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  getBroadcasts,
  deleteBroadcast,
  NotificationBroadcast,
  BroadcastStatus,
  getStatusLabel,
  getStatusColor,
  getTargetTypeLabel
} from '@/services/endpoints/notification-broadcasts'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Status filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: 'layers-outline' as const },
  { id: 'draft', label: 'Taslak', color: '#6B7280' },
  { id: 'scheduled', label: 'Zamanlandı', color: '#F59E0B' },
  { id: 'sending', label: 'Gönderiliyor', color: '#3B82F6' },
  { id: 'sent', label: 'Gönderildi', color: '#10B981' },
  { id: 'failed', label: 'Başarısız', color: '#EF4444' }
]

// Skeleton Component
function BroadcastCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width={200} height={18} />
          <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <View style={{ marginTop: DashboardSpacing.sm }}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={14} />
        <Skeleton width={60} height={14} />
      </View>
    </View>
  )
}

// Card Component
interface BroadcastCardProps {
  item: NotificationBroadcast
  onPress: () => void
  onDelete: () => void
}

function BroadcastCard({ item, onPress, onDelete }: BroadcastCardProps) {
  const scale = useSharedValue(1)
  const statusColor = getStatusColor(item.status)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const handleDeletePress = (e: any) => {
    e.stopPropagation()
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onDelete()
  }

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSubtitle}>
            {getTargetTypeLabel(item.target_type)}
            {item.sender && ` • ${item.sender.name}`}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          {item.status === 'draft' && (
            <TouchableOpacity
              onPress={handleDeletePress}
              style={styles.deleteButton}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Message */}
      <Text style={styles.cardMessage} numberOfLines={2}>
        {item.message}
      </Text>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.cardFooterLeft}>
          {item.total_recipients > 0 && (
            <View style={styles.footerItem}>
              <Ionicons name="people-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.footerText}>
                {item.total_recipients} alıcı
              </Text>
            </View>
          )}
          {item.status === 'sent' && (
            <View style={styles.footerItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={DashboardColors.success} />
              <Text style={styles.footerText}>
                {item.success_count} başarılı
              </Text>
            </View>
          )}
          {item.is_scheduled && item.scheduled_at && (
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={14} color={DashboardColors.textMuted} />
              <Text style={styles.footerText}>
                {new Date(item.scheduled_at).toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

export default function NotificationBroadcastListScreen() {
  const [broadcasts, setBroadcasts] = useState<NotificationBroadcast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<BroadcastStatus | 'all'>('all')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [deletingBroadcast, setDeletingBroadcast] = useState<NotificationBroadcast | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isMountedRef = useRef(true)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchBroadcasts = useCallback(async (showLoading = true, page = 1) => {
    if (!isMountedRef.current) return

    try {
      if (showLoading && page === 1) {
        setIsLoading(true)
      } else if (page > 1) {
        setIsLoadingMore(true)
      }
      setError(null)

      const response = await getBroadcasts({
        page,
        per_page: 20,
        status: selectedStatus
      })

      if (!isMountedRef.current) return

      if (page === 1) {
        setBroadcasts(response.data)
      } else {
        setBroadcasts(prev => [...prev, ...response.data])
      }

      setCurrentPage(response.meta.current_page)
      setLastPage(response.meta.last_page)
    } catch (err: any) {
      if (!isMountedRef.current) return
      console.error('Bildirimler yüklenirken hata:', err)
      setError(err.message || 'Bildirimler yüklenemedi')
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: err.message || 'Bildirimler yüklenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      if (!isMountedRef.current) return
      setIsLoading(false)
      setIsRefreshing(false)
      setIsLoadingMore(false)
    }
  }, [selectedStatus])

  useEffect(() => {
    fetchBroadcasts()
  }, [fetchBroadcasts])

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true
      fetchBroadcasts(false)

      return () => {
        isMountedRef.current = false
      }
    }, [fetchBroadcasts])
  )

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setCurrentPage(1)
    fetchBroadcasts(false, 1)
  }, [fetchBroadcasts])

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || currentPage >= lastPage) return
    fetchBroadcasts(false, currentPage + 1)
  }, [isLoadingMore, currentPage, lastPage, fetchBroadcasts])

  const handleStatusChange = useCallback((status: BroadcastStatus | 'all') => {
    setSelectedStatus(status)
    setCurrentPage(1)
  }, [])

  const handleNewBroadcast = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/admin/notification-broadcast/new')
  }, [])

  const handleBroadcastPress = useCallback((broadcast: NotificationBroadcast) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/admin/notification-broadcast/${broadcast.id}`)
  }, [])

  const handleDeleteRequest = useCallback((broadcast: NotificationBroadcast) => {
    setDeletingBroadcast(broadcast)
    setDeleteDialogVisible(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingBroadcast) return

    try {
      setIsDeleting(true)
      await deleteBroadcast(deletingBroadcast.id)

      if (!isMountedRef.current) return

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Bildirim silindi',
        position: 'top',
        visibilityTime: 1500
      })

      setDeleteDialogVisible(false)
      setDeletingBroadcast(null)
      fetchBroadcasts(false, 1)
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
    }
  }, [deletingBroadcast, fetchBroadcasts])

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogVisible(false)
    setDeletingBroadcast(null)
  }, [])

  const renderFilterChip = useCallback((filter: typeof STATUS_FILTERS[0]) => {
    const isSelected = selectedStatus === filter.id
    const filterColor = filter.id === 'all' ? DashboardColors.primary : (filter.color || DashboardColors.primary)

    return (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterChip,
          isSelected && { backgroundColor: `${filterColor}15`, borderColor: filterColor }
        ]}
        onPress={() => handleStatusChange(filter.id as BroadcastStatus | 'all')}
      >
        {filter.icon && (
          <Ionicons
            name={filter.icon}
            size={16}
            color={isSelected ? filterColor : DashboardColors.textMuted}
          />
        )}
        <Text
          style={[
            styles.filterChipText,
            isSelected && { color: filterColor, fontWeight: '600' }
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    )
  }, [selectedStatus, handleStatusChange])

  const renderBroadcast = useCallback(({ item }: { item: NotificationBroadcast }) => (
    <BroadcastCard
      item={item}
      onPress={() => handleBroadcastPress(item)}
      onDelete={() => handleDeleteRequest(item)}
    />
  ), [handleBroadcastPress, handleDeleteRequest])

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={DashboardColors.primary} />
      </View>
    )
  }, [isLoadingMore])

  const renderEmpty = useCallback(() => {
    if (isLoading) return null

    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="notifications-outline"
          size={64}
          color={DashboardColors.textMuted}
        />
        <Text style={styles.emptyStateTitle}>Bildirim Bulunamadı</Text>
        <Text style={styles.emptyStateText}>
          {selectedStatus === 'all'
            ? 'Henüz hiç bildirim gönderilmemiş.'
            : `${getStatusLabel(selectedStatus as BroadcastStatus)} durumunda bildirim bulunmuyor.`}
        </Text>
      </View>
    )
  }, [isLoading, selectedStatus])

  return (
    <View style={styles.container}>
      <PageHeader
        title="Mobil Bildirimler"
        icon="notifications-outline"
        subtitle="Toplu bildirim gönderimi"
        rightAction={{
          icon: 'add',
          onPress: handleNewBroadcast
        }}
      />

      <View style={styles.content}>
        {/* Filtreler */}
        <View style={styles.filtersContainer}>
          {STATUS_FILTERS.map(renderFilterChip)}
        </View>

        {/* Liste */}
        {isLoading ? (
          <View style={styles.list}>
            {Array.from({ length: 5 }).map((_, index) => (
              <BroadcastCardSkeleton key={index} />
            ))}
          </View>
        ) : (
          <FlatList
            data={broadcasts}
            renderItem={renderBroadcast}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>

      {/* Silme Onay Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Bildirimi Sil"
        message={`"${deletingBroadcast?.title}" bildirimi silinecek. Onaylıyor musunuz?`}
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
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.sm
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.surface,
    borderWidth: 1.5,
    borderColor: DashboardColors.border
  },
  filterChipText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    fontWeight: '500'
  },
  list: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.sm,
    paddingBottom: 100
  },
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DashboardSpacing.sm
  },
  cardTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  cardSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.md
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  deleteButton: {
    padding: DashboardSpacing.xs
  },
  cardMessage: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20,
    marginBottom: DashboardSpacing.md
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  cardFooterLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md,
    flex: 1
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  footerText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  loadingMore: {
    paddingVertical: DashboardSpacing.lg,
    alignItems: 'center'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyStateTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.sm
  },
  emptyStateText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22
  }
})
