/**
 * useNotificationObserver Hook
 *
 * Handles notification tap responses and navigates to the appropriate screen.
 * Uses expo-notifications with expo-router for deep linking.
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';

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
function handleNotificationNavigation(notification: Notifications.Notification) {
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
        router.push(`/load/${data.id}` as any);
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
    // Handle initial notification (app was opened from notification)
    async function handleInitialNotification() {
      if (hasHandledInitial.current) return;

      const response = await Notifications.getLastNotificationResponseAsync();
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

    // Also check when app comes to foreground (cold start scenario)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        handleInitialNotification();
      }
      appState.current = nextAppState;
    });

    // Listen for notification taps while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationNavigation(response.notification);
    });

    return () => {
      subscription.remove();
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
  // Don't show notification if user is already in this conversation
  if (activeConversationId === conversationId) {
    return null;
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
