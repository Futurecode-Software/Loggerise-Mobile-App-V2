/**
 * useNotificationObserver Hook
 *
 * Handles notification tap responses and navigates to the appropriate screen.
 * Uses expo-notifications with expo-router for deep linking.
 */

import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { AppState, AppStateStatus, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

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

// Conditionally import notifications only if supported
let Notifications: typeof import('expo-notifications') | null = null;

if (isPushNotificationsSupported()) {
  // Dynamic import to avoid loading the module in Expo Go
  import('expo-notifications').then((module) => {
    Notifications = module;
  }).catch((error) => {
    console.warn('Failed to load expo-notifications:', error);
  });
}

/**
 * Notification data structure expected from backend
 */
interface NotificationData {
  type?: 'message' | 'load_update' | 'alert' | 'document_expiry' | 'payment_reminder' | 'system';
  url?: string;
  conversation_id?: number | string;
  id?: number | string;
  employee_id?: number | string;
  contact_id?: number | string;
}

/**
 * Parse notification data and navigate to the appropriate screen
 */
function handleNotificationNavigation(notification: import('expo-notifications').Notification) {
  const data = notification.request.content.data as NotificationData;

  // If there's a direct URL, use it
  if (typeof data?.url === 'string' && data.url) {
    router.push(data.url as any);
    return;
  }

  // Parse by notification type
  const type = data?.type;

  switch (type) {
    case 'message':
      if (data.conversation_id) {
        router.push(`/message/${data.conversation_id}` as any);
      }
      break;

    case 'load_update':
      if (data.id) {
        router.push(`/logistics/load/${data.id}` as any);
      }
      break;

    case 'alert':
      router.push('/alerts' as any);
      break;

    case 'document_expiry':
      if (data.employee_id) {
        router.push(`/employee/${data.employee_id}` as any);
      }
      break;

    case 'payment_reminder':
      if (data.contact_id) {
        router.push(`/contact/${data.contact_id}` as any);
      }
      break;

    default:
      // If no specific type, try to use URL or go to notifications
      if (data?.url) {
        router.push(data.url as any);
      }
      break;
  }
}

/**
 * Hook to observe notification responses and handle navigation
 */
export function useNotificationObserver() {
  const appState = useRef(AppState.currentState);
  const hasHandledInitial = useRef(false);

  useEffect(() => {
    // Skip if push notifications are not supported
    if (!isPushNotificationsSupported()) {
      return;
    }

    // Ensure notifications module is loaded
    let notificationsModule: typeof import('expo-notifications') | null = null;
    let subscription: import('expo-notifications').EventSubscription | null = null;

    // Load notifications module
    import('expo-notifications').then((module) => {
      notificationsModule = module;
      Notifications = module;

      // Handle initial notification (app was opened from notification)
      async function handleInitialNotification() {
        if (hasHandledInitial.current || !notificationsModule) return;

        const response = await notificationsModule.getLastNotificationResponseAsync();
        if (response?.notification) {
          hasHandledInitial.current = true;
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            handleNotificationNavigation(response.notification);
          }, 500);
        }
      }

      // Check on mount
      handleInitialNotification();

      // Listen for notification taps while app is running
      subscription = notificationsModule.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(response.notification);
      });
    }).catch((error) => {
      console.warn('Failed to load expo-notifications:', error);
    });

    // Also check when app comes to foreground (cold start scenario)
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (!notificationsModule) {
          try {
            notificationsModule = await import('expo-notifications');
            Notifications = notificationsModule;
          } catch (error) {
            console.warn('Failed to load expo-notifications:', error);
            return;
          }
        }
        if (notificationsModule) {
          const response = await notificationsModule.getLastNotificationResponseAsync();
          if (response?.notification) {
            handleNotificationNavigation(response.notification);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
      appStateSubscription.remove();
    };
  }, []);
}

/**
 * Track active conversation to avoid showing notifications for current chat
 */
let activeConversationId: number | null = null;

/**
 * Set the active conversation (call when entering a chat)
 */
export function setActiveConversation(conversationId: number | null): void {
  activeConversationId = conversationId;
}

/**
 * Get the active conversation
 */
export function getActiveConversation(): number | null {
  return activeConversationId;
}

/**
 * Schedule a local notification for a new message
 * Won't show notification if user is already viewing that conversation
 */
export async function scheduleMessageNotification(
  senderName: string,
  messageText: string,
  conversationId: number,
  conversationType: 'private' | 'group' = 'private'
): Promise<string | null> {
  // Skip if push notifications are not supported
  if (!isPushNotificationsSupported()) {
    return null;
  }

  // Don't show notification if user is already in this conversation
  if (activeConversationId === conversationId) {
    return null;
  }

  // Ensure notifications module is loaded
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
    } catch (error) {
      console.error('Error loading expo-notifications:', error);
      return null;
    }
  }

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: conversationType === 'group' ? `${senderName} (Grup)` : senderName,
        body: messageText.length > 100 ? `${messageText.substring(0, 100)}...` : messageText,
        data: {
          type: 'message',
          conversation_id: conversationId,
          url: `/message/${conversationId}`,
        },
        sound: true,
        categoryIdentifier: 'message',
      },
      trigger: null, // Immediate
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling message notification:', error);
    return null;
  }
}
