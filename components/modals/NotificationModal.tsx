import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Bell, Check, X, Package, FileCheck, FileWarning, UserCheck, ShieldAlert, Car, Ship, CheckCircle, CalendarClock, MessageCircle } from 'lucide-react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import type { Notification, NotificationType } from '@/services/endpoints/notifications';
import { getNotificationUrl } from '@/services/endpoints/notifications';
import { useHaptics } from '@/hooks/use-haptics';

export interface NotificationModalRef {
  present: () => void;
  dismiss: () => void;
}

interface NotificationModalProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

// Icon mapping for notification types
const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  public_load_offer: Package,
  new_public_load: Package,
  public_load_offer_status: FileCheck,
  document_expiry: FileWarning,
  license_expiry: UserCheck,
  insurance_expiry: ShieldAlert,
  inspection_due: Car,
  roro_cutoff: Ship,
  quote_accepted: CheckCircle,
  event_reminder: CalendarClock,
  message: MessageCircle,
};

// Icon colors for notification types
const NOTIFICATION_COLORS: Record<string, string> = {
  public_load_offer: Brand.primary,
  new_public_load: Brand.primary,
  public_load_offer_status: '#10B981',
  document_expiry: '#F59E0B',
  license_expiry: '#3B82F6',
  insurance_expiry: '#EF4444',
  inspection_due: '#8B5CF6',
  roro_cutoff: '#06B6D4',
  quote_accepted: '#10B981',
  event_reminder: '#F59E0B',
  message: Brand.primary,
};

/**
 * Notification Bottom Sheet Modal
 *
 * Displays notifications in a scrollable list
 * Features:
 * - Single snap point (85%) - fixed height
 * - enableContentPanningGesture={false} - scroll doesn't move modal
 * - Mark as read on tap
 * - Navigate to notification URL
 * - Mark all as read button
 */
const NotificationModal = forwardRef<NotificationModalRef, NotificationModalProps>(
  ({ notifications, isLoading, onMarkAsRead, onMarkAllAsRead, onRefresh }, ref) => {
    const colors = Colors.light;
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { hapticLight } = useHaptics();

    // ✅ CRITICAL: Single snap point for stable modal
    const snapPoints = useMemo(() => ['85%'], []);

    // iOS-like spring animation config
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 80,
      overshootClamping: true,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
      stiffness: 500,
    });

    // Custom backdrop with dimmed background
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    // Expose present/dismiss methods to parent
    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

    const handleNotificationPress = async (notification: Notification) => {
      hapticLight();

      try {
        // Mark as read if not already read
        if (!notification.read_at) {
          await onMarkAsRead(notification.id);
        }

        // Navigate to notification URL
        const url = getNotificationUrl(notification.data);
        if (url) {
          bottomSheetRef.current?.dismiss();
          setTimeout(() => {
            router.push(url as any);
          }, 300);
        }
      } catch (err) {
        console.error('Error handling notification:', err);
      }
    };

    const handleMarkAllAsRead = async () => {
      hapticLight();
      try {
        await onMarkAllAsRead();
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        console.error('Error marking all as read:', err);
      }
    };

    const getNotificationIcon = (type?: string): React.ElementType => {
      if (type && NOTIFICATION_ICONS[type]) {
        return NOTIFICATION_ICONS[type];
      }
      return Bell;
    };

    const getNotificationColor = (type?: string): string => {
      if (type && NOTIFICATION_COLORS[type]) {
        return NOTIFICATION_COLORS[type];
      }
      return Brand.primary;
    };

    const renderNotificationItem = ({ item: notification }: { item: Notification }) => {
      const isUnread = !notification.read_at;
      const Icon = getNotificationIcon(notification.type);
      const iconColor = getNotificationColor(notification.type);
      const message = notification.data.message || 'Bildirim';

      return (
        <TouchableOpacity
          style={[
            styles.notificationItem,
            { borderColor: colors.border },
            isUnread && {
              backgroundColor: Brand.primary + '08',
              borderColor: Brand.primary + '30',
            },
          ]}
          onPress={() => handleNotificationPress(notification)}
          activeOpacity={0.7}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Icon size={20} color={iconColor} strokeWidth={2} />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <Text
              style={[
                styles.notificationMessage,
                { color: colors.text },
                isUnread && styles.notificationMessageUnread,
              ]}
              numberOfLines={2}
            >
              {message}
            </Text>
            {notification.created_at_human && (
              <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
                {notification.created_at_human}
              </Text>
            )}
          </View>

          {/* Unread indicator */}
          {isUnread && (
            <View style={[styles.unreadDot, { backgroundColor: Brand.primary }]} />
          )}
        </TouchableOpacity>
      );
    };

    const renderEmpty = () => (
      <View style={styles.emptyContainer}>
        <Bell size={48} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Bildirim yok</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Yeni bildirimleriniz burada görünecek
        </Text>
      </View>
    );

    const renderHeader = () => {
      const unreadCount = notifications.filter(n => !n.read_at).length;
      const hasUnread = unreadCount > 0;

      return (
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Bildirimler</Text>
            {notifications.length > 0 && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {hasUnread ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
              </Text>
            )}
          </View>

          {hasUnread && (
            <TouchableOpacity
              style={[styles.markAllButton, { backgroundColor: Brand.primary + '15' }]}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.7}
            >
              <Check size={16} color={Brand.primary} strokeWidth={2.5} />
              <Text style={[styles.markAllText, { color: Brand.primary }]}>
                Tümünü oku
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    };

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}  // ✅ CRITICAL: Prevent scroll from moving modal
        enableDynamicSizing={false}
        animateOnMount={true}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        style={styles.shadow}
      >
        {renderHeader()}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Bildirimler yükleniyor...
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}
      </BottomSheetModal>
    );
  }
);

NotificationModal.displayName = 'NotificationModal';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  shadow: {
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    ...Typography.headingMD,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  markAllText: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    ...Typography.bodySM,
    lineHeight: 18,
  },
  notificationMessageUnread: {
    fontWeight: '600',
  },
  notificationTime: {
    ...Typography.bodyXS,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
    marginTop: Spacing['4xl'],
  },
  emptyTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySM,
  },
});

export default NotificationModal;
