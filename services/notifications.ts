/**
 * Push Notifications Service
 *
 * Handles push notification setup, permissions, and token management.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';
import { storage } from './storage';

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

/**
 * Push token storage key
 */
const PUSH_TOKEN_KEY = 'push_token';

/**
 * Get the Expo push token
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Must be a physical device
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  try {
    // Get project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('No project ID found for push notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
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
  try {
    // Check current permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // Request if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
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
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Varsayilan',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#13452d',
    sound: 'default',
  });

  // Messages channel
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Mesajlar',
    description: 'Yeni mesaj bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#13452d',
    sound: 'default',
  });

  // Alerts channel
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Uyarilar',
    description: 'Onemli uyarilar ve hatirlatmalar',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 500, 500],
    lightColor: '#ef4444',
    sound: 'default',
  });

  // Updates channel
  await Notifications.setNotificationChannelAsync('updates', {
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
    await storage.setItem(PUSH_TOKEN_KEY, token);

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
    const token = await storage.getItem(PUSH_TOKEN_KEY);
    if (!token) return true;

    await api.delete('/device-tokens', {
      data: { token },
    });

    await storage.removeItem(PUSH_TOKEN_KEY);

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
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Handle notification response (user tapped on notification)
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
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
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Dismiss all notifications from notification center
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
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
