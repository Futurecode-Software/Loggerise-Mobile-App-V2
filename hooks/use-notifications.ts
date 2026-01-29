import {
  markAllAsRead as apiMarkAllAsRead,
  markAsRead as apiMarkAsRead,
  getRecentNotifications,
  getUnreadCount,
  Notification,
  RecentNotificationsResponse,
} from "@/services/endpoints/notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

/**
 * Check if running in Expo Go (push notifications not supported on Android SDK 53+)
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
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
  if (Platform.OS === "android" && isExpoGo()) {
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
      console.error("Error fetching unread count:", err);
      return 0;
    }
  }, []);

  /**
   * Initialize notifications
   */
  const initialize = useCallback(async () => {
    if (isInitialized) return;

    // Get initial unread count from API
    await refreshUnreadCount();

    // Push: token al + backend'e kaydet (mesaj bildirimleri için)
    if (isPushNotificationsSupported() && Platform.OS !== "web") {
      try {
        const {
          registerForPushNotificationsAsync,
          registerPushTokenWithBackend,
        } = await import("@/services/notifications");
        const token = await registerForPushNotificationsAsync();
        setPushToken(token ?? null);
        if (token) {
          console.log(token);
          await registerPushTokenWithBackend(token);
        }
      } catch (error) {
        console.warn("Push notifications not available:", error);
      }
    } else if (Platform.OS === "android" && isExpoGo()) {
      console.warn(
        "Push notifications require a development build on Android (not supported in Expo Go)",
      );
    }

    setIsInitialized(true);
  }, [isInitialized, refreshUnreadCount]);

  /**
   * Fetch recent notifications from API
   */
  const fetchNotifications =
    useCallback(async (): Promise<RecentNotificationsResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRecentNotifications();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
        return data;
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError(
          err instanceof Error ? err.message : "Bildirimler yüklenemedi",
        );
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
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
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
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, []);

  /**
   * Clear notification state (logout'ta çağrılır – backend'den token kaldır)
   */
  const clearNotifications = useCallback(async () => {
    if (pushToken) {
      try {
        const { unregisterPushTokenFromBackend } =
          await import("@/services/notifications");
        await unregisterPushTokenFromBackend(pushToken);
      } catch {
        // ignore
      }
      setPushToken(null);
    }
    setNotifications([]);
    setUnreadCount(0);
  }, [pushToken]);

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
