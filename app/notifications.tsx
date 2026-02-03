import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable
} from 'react-native'

import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import { useNotificationContext } from '@/context/notification-context'
import {
  getNotifications,
  deleteNotification,
  getNotificationUrl,
  Notification,
  NotificationType,
  NotificationData
} from '@/services/endpoints/notifications'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// İkon adları
function getNotificationIconName(type?: NotificationType | string, isUrgent?: boolean): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'public_load_offer':
    case 'new_public_load':
      return 'cube-outline'
    case 'public_load_offer_status':
      return 'document-text-outline'
    case 'document_expiry':
      return 'document-outline'
    case 'license_expiry':
      return 'person-outline'
    case 'insurance_expiry':
      return 'shield-outline'
    case 'inspection_due':
      return 'car-outline'
    case 'roro_cutoff':
      return 'boat-outline'
    case 'quote_accepted':
      return 'checkmark-circle-outline'
    case 'event_reminder':
      return 'calendar-outline'
    case 'message':
      return 'chatbubble-outline'
    default:
      return 'notifications-outline'
  }
}

// İkon renkleri
const NOTIFICATION_COLORS: Record<string, { primary: string; bg: string }> = {
  public_load_offer: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  new_public_load: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  public_load_offer_status: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  quote_accepted: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  document_expiry: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  license_expiry: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  insurance_expiry: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  inspection_due: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  roro_cutoff: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  event_reminder: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  message: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  urgent: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  default: { primary: DashboardColors.textMuted, bg: DashboardColors.surface }
}

function getNotificationColors(type?: NotificationType | string, isUrgent?: boolean) {
  if (isUrgent) return NOTIFICATION_COLORS.urgent
  return NOTIFICATION_COLORS[type || 'default'] || NOTIFICATION_COLORS.default
}

// Skeleton Component
function NotificationCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.md }}>
          <Skeleton width={200} height={16} />
          <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
          <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  )
}

// Card Component
interface NotificationItemProps {
  notification: Notification
  onPress: () => void
  onDelete: () => void
}

function NotificationCard({ notification, onPress, onDelete }: NotificationItemProps) {
  const scale = useSharedValue(1)
  const data = notification.data
  const isUnread = !notification.read_at
  const isUrgent = data.urgency === 'high' || (data.days_until !== undefined && data.days_until <= 7)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  // Get subtitle based on notification type
  const getSubtitle = () => {
    if (data.load_number) return `Yük: ${data.load_number}`
    if (data.employee_name) return data.employee_name
    if (data.vehicle_plate) return data.vehicle_plate
    if (data.position_number) return `Pozisyon: ${data.position_number}`
    if (data.quote_number) return `Teklif: ${data.quote_number}`
    if (data.title) return data.title
    return null
  }

  const subtitle = getSubtitle()
  const colors = getNotificationColors(data.type, isUrgent)
  const iconName = getNotificationIconName(data.type, isUrgent)

  return (
    <AnimatedPressable
      style={[
        styles.card,
        animStyle,
        isUnread && styles.cardUnread
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name={iconName} size={24} color={colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.cardMessage,
              isUnread && styles.cardMessageUnread
            ]}
            numberOfLines={2}
          >
            {data.message || 'Yeni bildirim'}
          </Text>
          {subtitle && (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          <View style={styles.cardMeta}>
            <Text style={styles.cardTime}>
              {notification.created_at_human}
            </Text>
            {data.days_until !== undefined && (
              <View style={[
                styles.daysUntilBadge,
                { backgroundColor: isUrgent ? NOTIFICATION_COLORS.urgent.bg : NOTIFICATION_COLORS.document_expiry.bg }
              ]}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={isUrgent ? NOTIFICATION_COLORS.urgent.primary : NOTIFICATION_COLORS.document_expiry.primary}
                />
                <Text style={[
                  styles.daysUntilText,
                  { color: isUrgent ? NOTIFICATION_COLORS.urgent.primary : NOTIFICATION_COLORS.document_expiry.primary }
                ]}>
                  {data.days_until} gün
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Unread Indicator */}
      {isUnread && (
        <View style={[
          styles.unreadDot,
          { backgroundColor: isUrgent ? NOTIFICATION_COLORS.urgent.primary : DashboardColors.primary }
        ]} />
      )}
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="notifications-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
      <Text style={styles.emptyText}>
        Yeni bildirimler burada görünecek
      </Text>
    </View>
  )
}

export default function NotificationsScreen() {
  const { unreadCount, markAsRead, markAllAsRead, refreshUnreadCount } = useNotificationContext()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(async (page: number = 1, append: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current

    try {
      const response = await getNotifications({ page, per_page: 20 })

      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (append) {
          setNotifications((prev) => [...prev, ...response.data])
        } else {
          setNotifications(response.data)
        }
        setCurrentPage(response.meta.current_page)
        setLastPage(response.meta.last_page)
        hasInitialFetchRef.current = true
      }
    } catch (error) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        console.error('Error fetching notifications:', error)
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
        setRefreshing(false)
      }
    }
  }, [])

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(1, false)

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Refs for useFocusEffect to avoid re-triggering
  const executeFetchRef = useRef(executeFetch)
  useEffect(() => {
    executeFetchRef.current = executeFetch
  }, [executeFetch])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(1, false)
        refreshUnreadCount()
      }
    }, [refreshUnreadCount])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(1, false)
    refreshUnreadCount()
  }

  const handleLoadMore = () => {
    if (!isLoadingMore && currentPage < lastPage) {
      setIsLoadingMore(true)
      executeFetch(currentPage + 1, true)
    }
  }

  const handleNotificationPress = async (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead(notification.id)
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
    }

    // Navigate to the appropriate screen
    const url = getNotificationUrl(notification.data)
    if (url) {
      router.push(url as any)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      refreshUnreadCount()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await markAllAsRead()
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    )
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Bildirimler"
        icon="notifications-outline"
        subtitle={unreadCount > 0 ? `${unreadCount} okunmamış` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={
          unreadCount > 0
            ? [
                {
                  icon: 'checkmark-done',
                  onPress: handleMarkAllAsRead
                }
              ]
            : undefined
        }
      />

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.listContent}>
            <NotificationCardSkeleton />
            <NotificationCardSkeleton />
            <NotificationCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() => handleNotificationPress(item)}
                onDelete={() => handleDeleteNotification(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.xl
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    position: 'relative',
    ...DashboardShadows.md
  },
  cardUnread: {
    backgroundColor: DashboardColors.primaryGlow,
    borderWidth: 1,
    borderColor: DashboardColors.primary + '20'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardContent: {
    flex: 1,
    marginLeft: DashboardSpacing.md
  },
  cardMessage: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textPrimary,
    lineHeight: 20,
    marginBottom: DashboardSpacing.xs
  },
  cardMessageUnread: {
    fontWeight: '600'
  },
  cardSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginBottom: DashboardSpacing.xs
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.xs
  },
  cardTime: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  daysUntilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  daysUntilText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  unreadDot: {
    position: 'absolute',
    top: DashboardSpacing.lg,
    right: DashboardSpacing.lg,
    width: 10,
    height: 10,
    borderRadius: 5
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  }
})
