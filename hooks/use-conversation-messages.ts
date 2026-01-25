/**
 * useConversationMessages Hook
 *
 * Custom hook for managing conversation messages state, fetching, and sending.
 * Integrates with WebSocket for real-time updates.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { FlatList } from 'react-native';
import {
  getConversation,
  sendMessage,
  markConversationAsRead,
  sendTypingIndicator,
  Message,
  ConversationDetail,
  Participant,
} from '@/services/endpoints/messaging';
import { useMessagingWebSocket } from './use-messaging-websocket';
import { setActiveConversation } from './use-notification-observer';

interface UseConversationMessagesOptions {
  conversationId: string | undefined;
  currentUserId: number;
}

interface UseConversationMessagesReturn {
  // Data
  conversation: ConversationDetail | null;
  messages: Message[];
  participants: Participant[];

  // State
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  newMessage: string;

  // WebSocket state
  isConnected: boolean;
  typingUsers: Record<number, { name: string; userId: number }>;

  // Actions
  setNewMessage: (text: string) => void;
  handleSendMessage: () => Promise<void>;
  handleTextChange: (text: string) => void;
  refetch: () => void;

  // Refs
  flatListRef: React.RefObject<FlatList<any> | null>;
}

export function useConversationMessages({
  conversationId,
  currentUserId,
}: UseConversationMessagesOptions): UseConversationMessagesReturn {
  // State
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const flatListRef = useRef<FlatList<any>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingRef = useRef<boolean>(false);

  // Parse conversation ID once
  const parsedConversationId = conversationId ? parseInt(conversationId, 10) : undefined;

  // WebSocket integration
  const { isConnected, typingUsers } = useMessagingWebSocket({
    userId: currentUserId,
    conversationId: parsedConversationId,
    onNewMessage: useCallback(
      (message: Message) => {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;

          const enrichedMessage: Message = {
            ...message,
            is_mine: message.user_id === currentUserId,
          };
          return [...prev, enrichedMessage];
        });

        // Scroll to new message
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);

        // Mark as read
        if (parsedConversationId) {
          markConversationAsRead(parsedConversationId);
        }
      },
      [currentUserId, parsedConversationId]
    ),
  });

  // Fetch conversation data
  const fetchConversation = useCallback(async () => {
    if (!parsedConversationId) return;

    try {
      setError(null);
      const data = await getConversation(parsedConversationId);
      setConversation(data.conversation);
      setMessages(data.messages);
      setParticipants(data.participants);

      await markConversationAsRead(parsedConversationId);
    } catch (err) {
      console.error('Conversation fetch error:', err);
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [parsedConversationId]);

  // Initial load
  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Track active conversation for notification suppression
  useEffect(() => {
    if (parsedConversationId) {
      setActiveConversation(parsedConversationId);
    }

    return () => {
      setActiveConversation(null);
    };
  }, [parsedConversationId]);

  // Handle typing indicator
  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!parsedConversationId || lastTypingRef.current === isTyping) return;

      lastTypingRef.current = isTyping;
      sendTypingIndicator(parsedConversationId, isTyping);

      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          lastTypingRef.current = false;
          sendTypingIndicator(parsedConversationId, false);
        }, 2000);
      }
    },
    [parsedConversationId]
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle text change with typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setNewMessage(text);
      sendTypingStatus(text.length > 0);
    },
    [sendTypingStatus]
  );

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !parsedConversationId || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    sendTypingStatus(false);

    try {
      const sentMessage = await sendMessage({
        conversation_id: parsedConversationId,
        message: messageText,
      });

      setMessages((prev) => [...prev, sentMessage]);

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (err) {
      console.error('Send message error:', err);
      Alert.alert('Hata', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, parsedConversationId, isSending, sendTypingStatus]);

  // Refetch function
  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    messages,
    participants,
    isLoading,
    isSending,
    error,
    newMessage,
    isConnected,
    typingUsers,
    setNewMessage,
    handleSendMessage,
    handleTextChange,
    refetch,
    flatListRef,
  };
}
