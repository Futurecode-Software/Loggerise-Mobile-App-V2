/**
 * useMessagingWebSocket Hook
 *
 * React hook for real-time messaging with WebSocket support.
 * Handles conversation subscriptions, message reception, and typing indicators.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initializeWebSocket,
  subscribeToConversation,
  subscribeToUserChannel,
  unsubscribeFromChannel,
  onConnectionStateChange,
  reconnectWebSocket,
  resetReconnectAttempts,
} from '@/services/websocket';
import { Message } from '@/services/endpoints/messaging';

interface UseMessagingWebSocketOptions {
  userId: number;
  conversationId?: number;
  onNewMessage?: (message: Message) => void;
  onTyping?: (data: { user_id: number; user_name: string; is_typing: boolean }) => void;
  onNewConversationMessage?: (message: Message, conversationId: number) => void;
  onParticipantAdded?: (data: any) => void;
}

interface TypingUser {
  name: string;
  userId: number;
}

export function useMessagingWebSocket({
  userId,
  conversationId,
  onNewMessage,
  onTyping,
  onNewConversationMessage,
  onParticipantAdded,
}: UseMessagingWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, TypingUser>>({});

  // Store callbacks in refs to avoid re-subscribing on every render
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const onNewConversationMessageRef = useRef(onNewConversationMessage);
  const onParticipantAddedRef = useRef(onParticipantAdded);

  // Update refs when callbacks change
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    onNewConversationMessageRef.current = onNewConversationMessage;
  }, [onNewConversationMessage]);

  useEffect(() => {
    onParticipantAddedRef.current = onParticipantAdded;
  }, [onParticipantAdded]);

  // Refs for cleanup and state
  const conversationUnsubscribeRef = useRef<(() => void) | null>(null);
  const userChannelUnsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});
  const currentConversationIdRef = useRef<number | undefined>(undefined);
  const isSubscribedRef = useRef(false);

  // Reconnect function for external use
  const reconnect = useCallback(async () => {
    resetReconnectAttempts();
    const connected = await reconnectWebSocket();
    setIsConnected(connected);
    return connected;
  }, []);

  // Initialize WebSocket connection (only once)
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const connected = await initializeWebSocket();
      if (mounted) {
        setIsConnected(connected);
      }
    };

    init();

    // Listen to connection state changes
    const unsubscribe = onConnectionStateChange((state) => {
      if (mounted) {
        setIsConnected(state === 'connected');

        // If disconnected, try to resubscribe when reconnected
        if (state === 'connected') {
          // Reset subscription flag to allow resubscription
          isSubscribedRef.current = false;
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Handle typing indicator with auto-clear
  const handleTyping = useCallback(
    (data: { user_id: number; user_name: string; is_typing: boolean }) => {
      // Don't show typing for current user
      // Use Number() to handle type mismatch (string vs number)
      if (Number(data.user_id) === Number(userId)) return;

      if (data.is_typing) {
        // Add typing user
        setTypingUsers((prev) => ({
          ...prev,
          [data.user_id]: { name: data.user_name, userId: data.user_id },
        }));

        // Clear existing timeout
        if (typingTimeoutsRef.current[data.user_id]) {
          clearTimeout(typingTimeoutsRef.current[data.user_id]);
        }

        // Auto-remove after 3 seconds
        typingTimeoutsRef.current[data.user_id] = setTimeout(() => {
          setTypingUsers((prev) => {
            const newTyping = { ...prev };
            delete newTyping[data.user_id];
            return newTyping;
          });
        }, 3000);
      } else {
        // Remove typing user
        setTypingUsers((prev) => {
          const newTyping = { ...prev };
          delete newTyping[data.user_id];
          return newTyping;
        });

        // Clear timeout
        if (typingTimeoutsRef.current[data.user_id]) {
          clearTimeout(typingTimeoutsRef.current[data.user_id]);
          delete typingTimeoutsRef.current[data.user_id];
        }
      }

      // Call external handler via ref
      onTypingRef.current?.(data);
    },
    [userId]
  );

  // Subscribe to conversation channel
  useEffect(() => {
    // Skip if not connected or no conversation
    if (!isConnected || !conversationId) {
      return;
    }

    // Skip if already subscribed to this conversation
    if (currentConversationIdRef.current === conversationId && isSubscribedRef.current) {
      return;
    }

    // Unsubscribe from previous conversation
    if (conversationUnsubscribeRef.current) {
      conversationUnsubscribeRef.current();
      conversationUnsubscribeRef.current = null;
    }

    // Update current conversation ref
    currentConversationIdRef.current = conversationId;
    isSubscribedRef.current = true;

    // Subscribe to new conversation
    conversationUnsubscribeRef.current = subscribeToConversation(
      conversationId,
      (message: Message) => {
        // Don't show own messages (already added locally)
        const messageUserId = Number(message.user_id);
        const currentUserId = Number(userId);

        if (messageUserId !== currentUserId) {
          onNewMessageRef.current?.(message);
        }
      },
      handleTyping
    );

    // Clear typing users when changing conversations
    setTypingUsers({});

    return () => {
      if (conversationUnsubscribeRef.current) {
        conversationUnsubscribeRef.current();
        conversationUnsubscribeRef.current = null;
      }
      if (currentConversationIdRef.current) {
        unsubscribeFromChannel(`private-conversation.${currentConversationIdRef.current}`);
      }
      isSubscribedRef.current = false;
    };
  }, [isConnected, conversationId, userId, handleTyping]);

  // Subscribe to user channel for cross-conversation notifications
  useEffect(() => {
    if (!isConnected || !userId) return;

    // Avoid duplicate subscriptions
    if (userChannelUnsubscribeRef.current) {
      return;
    }

    userChannelUnsubscribeRef.current = subscribeToUserChannel(
      userId,
      (message: Message, msgConversationId: number) => {
        // Don't show own messages
        // Use Number() to handle type mismatch (string vs number)
        const messageUserId = Number(message.user_id);
        const currentUserId = Number(userId);

        if (messageUserId !== currentUserId) {
          onNewConversationMessageRef.current?.(message, msgConversationId);
        }
      },
      (data: any) => {
        onParticipantAddedRef.current?.(data);
      }
    );

    return () => {
      if (userChannelUnsubscribeRef.current) {
        userChannelUnsubscribeRef.current();
        userChannelUnsubscribeRef.current = null;
      }
      unsubscribeFromChannel(`private-user.${userId}`);
    };
  }, [isConnected, userId]);

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
    };
  }, []);

  return {
    isConnected,
    typingUsers,
    reconnect,
  };
}
