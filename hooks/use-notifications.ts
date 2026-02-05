import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  getUnreadCount,
  getRecentNotifications,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  Notification,
  RecentNotificationsResponse,
} from '@/services/endpoints/notifications';

/**
 * Check if running in Expo Go (push notifications not supported on Android SDK 53+)
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Check if push notifications are supported
 */
function isPushNotificationsSupported(): boolean {
  // Must be a physical device
  if (!Device.isDevice) {
    return false;
  }

  // Push notifications are not supported in Expo Go on Android (SDK 53+)
  if (Platform.OS === 'android' && isExpoGo()) {
    return false;
  }

  return true;
}

/**
 * Hook for handling notifications in the app
 *
 * Uses API-based notifications for all platforms.
 * Push notifications are initialized separately only on physical devices.
 */
export function useNotifications() {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // API notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh unread count from API
   */
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  }, []);

  // Ref to track initialization to avoid dependency on isInitialized state
  const isInitializingRef = useRef(false);

  /**
   * Initialize notifications
   */
  const initialize = useCallback(async () => {
    console.log('[Notifications] Initialize called - Platform:', Platform.OS);

    // Use ref to prevent multiple initializations without depending on state
    if (isInitializingRef.current) {
      console.log('[Notifications] Already initializing, skipping');
      return;
    }
    isInitializingRef.current = true;

    // Get initial unread count from API
    await refreshUnreadCount();

    // Debug: Check support
    const isSupported = isPushNotificationsSupported();
    const isDevice = Device.isDevice;
    const isExpoGoApp = isExpoGo();
    console.log('[Notifications] Platform checks:', {
      platform: Platform.OS,
      isDevice,
      isExpoGo: isExpoGoApp,
      isSupported,
    });

    // Initialize push notifications on physical devices (not in Expo Go on Android)
    if (isSupported && Platform.OS !== 'web') {
      console.log('[Notifications] Attempting to initialize push notifications...');
      try {
        const { initializePushNotifications } = await import('@/services/notifications');
        console.log('[Notifications] Module loaded, requesting token...');
        const token = await initializePushNotifications();
        setPushToken(token);
        console.log('[Notifications] Push token registered:', token ? 'success' : 'no token');
      } catch (error) {
        console.error('[Notifications] Push notifications error:', error);
      }
    } else if (Platform.OS === 'android' && isExpoGoApp) {
      console.log('[Notifications] Push notifications require a development build on Android (not supported in Expo Go)');
    } else {
      console.log('[Notifications] Push notifications not supported on this platform');
    }

    setIsInitialized(true);
    console.log('[Notifications] Initialization complete');
  }, [refreshUnreadCount]);

  /**
   * Fetch recent notifications from API
   */
  const fetchNotifications = useCallback(async (): Promise<RecentNotificationsResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRecentNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
      return data;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Bildirimler yüklenemedi');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiMarkAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  /**
   * Clear notification state
   */
  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsInitialized(false);
    isInitializingRef.current = false;
  }, []);

  return {
    // State
    initialize,
    pushToken,
    isInitialized,

    // API notification related
    unreadCount,
    notifications,
    isLoading,
    error,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
