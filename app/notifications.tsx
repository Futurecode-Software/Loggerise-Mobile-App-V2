import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell,
  Package,
  FileCheck,
  FileWarning,
  UserCheck,
  ShieldAlert,
  Car,
  Ship,
  CheckCircle,
  CalendarClock,
  MessageCircle,
  AlertTriangle,
  ChevronLeft,
  CheckCheck,
  Trash2,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
// useColorScheme import kaldirildi - her zaman light mode kullanilir
import { useNotificationContext } from '@/context/notification-context';
import {
  getNotifications,
  deleteNotification,
  getNotificationUrl,
  Notification,
  NotificationType,
  NotificationData,
} from '@/services/endpoints/notifications';

/**
 * Get icon component for notification type
 */
function getNotificationIcon(type?: NotificationType | string, isUrgent?: boolean) {
  const iconProps = { size: 20 };

  switch (type) {
    case 'public_load_offer':
    case 'new_public_load':
      return <Package {...iconProps} />;
    case 'public_load_offer_status':
      return <FileCheck {...iconProps} />;
    case 'document_expiry':
      return <FileWarning {...iconProps} />;
    case 'license_expiry':
      return <UserCheck {...iconProps} />;
    case 'insurance_expiry':
      return <ShieldAlert {...iconProps} />;
    case 'inspection_due':
      return <Car {...iconProps} />;
    case 'roro_cutoff':
      return <Ship {...iconProps} />;
    case 'quote_accepted':
      return <CheckCircle {...iconProps} />;
    case 'event_reminder':
      return <CalendarClock {...iconProps} />;
    case 'message':
      return <MessageCircle {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
}

/**
 * Get icon background color based on type and urgency
 */
function getIconBackgroundColor(colors: any, type?: NotificationType | string, isUrgent?: boolean) {
  if (isUrgent) return colors.dangerLight;

  switch (type) {
    case 'public_load_offer':
    case 'new_public_load':
    case 'public_load_offer_status':
    case 'quote_accepted':
      return colors.successLight;
    case 'document_expiry':
    case 'license_expiry':
    case 'insurance_expiry':
    case 'inspection_due':
    case 'roro_cutoff':
      return colors.warningLight;
    case 'event_reminder':
    case 'message':
      return colors.infoLight;
    default:
      return colors.surface;
  }
}

/**
 * Get icon color based on type and urgency
 */
function getIconColor(colors: any, type?: NotificationType | string, isUrgent?: boolean) {
  if (isUrgent) return colors.danger;

  switch (type) {
    case 'public_load_offer':
    case 'new_public_load':
    case 'public_load_offer_status':
    case 'quote_accepted':
      return colors.success;
    case 'document_expiry':
    case 'license_expiry':
    case 'insurance_expiry':
    case 'inspection_due':
    case 'roro_cutoff':
      return colors.warning;
    case 'event_reminder':
    case 'message':
      return colors.info;
    default:
      return colors.icon;
  }
}

interface NotificationItemProps {
  notification: Notification;
  colors: any;
  onPress: () => void;
  onDelete: () => void;
}

function NotificationItem({ notification, colors, onPress, onDelete }: NotificationItemProps) {
  const data = notification.data;
  const isUnread = !notification.read_at;
  const isUrgent = data.urgency === 'high' || (data.days_until !== undefined && data.days_until <= 7);

  // Get subtitle based on notification type
  const getSubtitle = () => {
    if (data.load_number) return `Yük: ${data.load_number}`;
    if (data.employee_name) return data.employee_name;
    if (data.vehicle_plate) return data.vehicle_plate;
    if (data.position_number) return `Pozisyon: ${data.position_number}`;
    if (data.quote_number) return `Teklif: ${data.quote_number}`;
    if (data.title) return data.title;
    return null;
  };

  const subtitle = getSubtitle();
  const iconBg = getIconBackgroundColor(colors, data.type, isUrgent);
  const iconColor = getIconColor(colors, data.type, isUrgent);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        isUnread && { backgroundColor: colors.primaryLight },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {React.cloneElement(getNotificationIcon(data.type, isUrgent), { color: iconColor })}
      </View>
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.message,
            { color: colors.text },
            isUnread && styles.messageUnread,
          ]}
          numberOfLines={2}
        >
          {data.message || 'Yeni bildirim'}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        <View style={styles.metaRow}>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {notification.created_at_human}
          </Text>
          {data.days_until !== undefined && (
            <View
              style={[
                styles.daysUntilBadge,
                { backgroundColor: isUrgent ? colors.dangerLight : colors.warningLight },
              ]}
            >
              <AlertTriangle size={10} color={isUrgent ? colors.danger : colors.warning} />
              <Text
                style={[
                  styles.daysUntilText,
                  { color: isUrgent ? colors.danger : colors.warning },
                ]}
              >
                {data.days_until} gün
              </Text>
            </View>
          )}
        </View>
      </View>
      {isUnread && (
        <View style={[styles.unreadDot, { backgroundColor: isUrgent ? colors.danger : colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const { unreadCount, markAsRead, markAllAsRead, refreshUnreadCount } = useNotificationContext();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (page: number = 1, refresh: boolean = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await getNotifications({ page, per_page: 20 });
      if (page === 1) {
        setNotifications(response.data);
      } else {
        setNotifications((prev) => [...prev, ...response.data]);
      }
      setCurrentPage(response.meta.current_page);
      setLastPage(response.meta.last_page);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    fetchNotifications(1, true);
    refreshUnreadCount();
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && currentPage < lastPage) {
      fetchNotifications(currentPage + 1);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead(notification.id);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    }

    // Navigate to the appropriate screen
    const url = getNotificationUrl(notification.data);
    if (url) {
      router.push(url as any);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      refreshUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      colors={colors}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => handleDeleteNotification(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz bildirim yok</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Yeni bildirimler burada görünecek
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <CheckCheck size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Bildirimler yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingMD,
    flex: 1,
  },
  markAllButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headingSM,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  message: {
    ...Typography.bodyMD,
  },
  messageUnread: {
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.bodySM,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  time: {
    ...Typography.bodyXS,
  },
  daysUntilBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  daysUntilText: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.xs,
  },
  separator: {
    height: 1,
    marginLeft: 56 + Spacing.lg,
  },
  loadingMore: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
