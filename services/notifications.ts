/**
 * Push Notifications Service
 *
 * Handles push notification setup, permissions, and token management.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';
import { storage } from './storage';

/**
 * Push token storage key
 */
const PUSH_TOKEN_KEY = 'push_token';

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

// Conditionally import and configure notifications only if supported
let Notifications: typeof import('expo-notifications') | null = null;

/**
 * Ensure notifications module is loaded and configured
 */
async function ensureNotificationsLoaded(): Promise<typeof import('expo-notifications') | null> {
  if (Notifications) {
    return Notifications;
  }

  if (!isPushNotificationsSupported()) {
    return null;
  }

  try {
    Notifications = await import('expo-notifications');
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return Notifications;
  } catch (error) {
    console.warn('Failed to load expo-notifications:', error);
    return null;
  }
}

// Preload notifications module if supported (non-blocking)
if (isPushNotificationsSupported()) {
  ensureNotificationsLoaded().catch(() => {
    // Ignore errors during preload
  });
}

/**
 * Get the Expo push token
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!isPushNotificationsSupported()) {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
    } else if (Platform.OS === 'android' && isExpoGo()) {
      console.warn('Push notifications require a development build on Android (not supported in Expo Go)');
    }
    return null;
  }

  // Ensure notifications module is loaded
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return null;
  }

  try {
    // Get project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('No project ID found for push notifications');
      return null;
    }

    const token = await notificationsModule.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isPushNotificationsSupported()) {
    return false;
  }

  // Ensure notifications module is loaded
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return false;
  }

  try {
    // Check current permissions
    const { status: existingStatus } = await notificationsModule.getPermissionsAsync();

    let finalStatus = existingStatus;

    // Request if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await notificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await setupAndroidChannel();
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Set up Android notification channel
 */
async function setupAndroidChannel() {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return;
  }

  await notificationsModule.setNotificationChannelAsync('default', {
    name: 'Varsayilan',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#13452d',
    sound: 'default',
  });

  // Messages channel
  await notificationsModule.setNotificationChannelAsync('messages', {
    name: 'Mesajlar',
    description: 'Yeni mesaj bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#13452d',
    sound: 'default',
  });

  // Alerts channel
  await notificationsModule.setNotificationChannelAsync('alerts', {
    name: 'Uyarilar',
    description: 'Onemli uyarilar ve hatirlatmalar',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 500, 500],
    lightColor: '#ef4444',
    sound: 'default',
  });

  // Updates channel
  await notificationsModule.setNotificationChannelAsync('updates', {
    name: 'Guncellemeler',
    description: 'Sistem ve siparis guncellemeleri',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

/**
 * Register push token with backend
 */
export async function registerPushToken(token: string): Promise<boolean> {
  try {
    await api.post('/device-tokens', {
      token,
      device_type: Platform.OS,
      device_name: Device.modelName || 'Unknown',
    });

    // Save token locally
    await storage.set(PUSH_TOKEN_KEY, token);

    console.log('Push token registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Unregister push token from backend
 */
export async function unregisterPushToken(): Promise<boolean> {
  try {
    const token = await storage.get<string>(PUSH_TOKEN_KEY);
    if (!token) return true;

    await api.delete('/device-tokens', {
      data: { token },
    });

    await storage.remove(PUSH_TOKEN_KEY);

    console.log('Push token unregistered successfully');
    return true;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return false;
  }
}

/**
 * Initialize push notifications
 * Call this when the app starts and user is logged in
 */
export async function initializePushNotifications(): Promise<string | null> {
  // Request permissions
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  // Get push token
  const token = await getExpoPushToken();
  if (!token) {
    return null;
  }

  // Register with backend
  await registerPushToken(token);

  return token;
}

/**
 * Handle notification received while app is foregrounded
 */
export async function addNotificationReceivedListener(
  callback: (notification: import('expo-notifications').Notification) => void
): Promise<import('expo-notifications').EventSubscription | null> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return null;
  }
  return notificationsModule.addNotificationReceivedListener(callback);
}

/**
 * Handle notification response (user tapped on notification)
 */
export async function addNotificationResponseReceivedListener(
  callback: (response: import('expo-notifications').NotificationResponse) => void
): Promise<import('expo-notifications').EventSubscription | null> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return null;
  }
  return notificationsModule.addNotificationResponseReceivedListener(callback);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return 0;
  }
  return await notificationsModule.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return;
  }
  await notificationsModule.setBadgeCountAsync(count);
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return;
  }
  await notificationsModule.setBadgeCountAsync(0);
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: import('expo-notifications').NotificationTriggerInput
): Promise<string | null> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return null;
  }
  return await notificationsModule.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return;
  }
  await notificationsModule.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return;
  }
  await notificationsModule.cancelAllScheduledNotificationsAsync();
}

/**
 * Dismiss all notifications from notification center
 */
export async function dismissAllNotifications(): Promise<void> {
  const notificationsModule = await ensureNotificationsLoaded();
  if (!notificationsModule) {
    return;
  }
  await notificationsModule.dismissAllNotificationsAsync();
}

/**
 * Notification types for routing
 */
export type NotificationType =
  | 'message'
  | 'load_update'
  | 'alert'
  | 'document_expiry'
  | 'payment_reminder'
  | 'system';

/**
 * Parse notification data and determine route
 */
export function parseNotificationRoute(
  data: Record<string, unknown>
): { route: string; params?: Record<string, unknown> } | null {
  const type = data.type as NotificationType;
  const id = data.id;

  switch (type) {
    case 'message':
      return { route: '/message/[id]', params: { id: data.conversation_id } };
    case 'load_update':
      return { route: '/load/[id]', params: { id } };
    case 'alert':
      return { route: '/alerts' };
    case 'document_expiry':
      return { route: '/employee/[id]', params: { id: data.employee_id } };
    case 'payment_reminder':
      return { route: '/contact/[id]', params: { id: data.contact_id } };
    default:
      return null;
  }
}
