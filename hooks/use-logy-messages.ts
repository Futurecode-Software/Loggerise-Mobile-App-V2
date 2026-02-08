/**
 * useLoggyMessages Hook
 *
 * Custom hook for managing Loggy AI conversation messages, sending, and loading.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getConversationMessages,
  sendMessage,
  AiConversation,
  AiMessage,
} from '@/services/endpoints/loggy';
import { useToast } from './use-toast';

interface UseLoggyMessagesOptions {
  conversation: AiConversation | null;
}

interface UseLoggyMessagesReturn {
  // Data
  messages: AiMessage[];

  // State
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Actions
  loadMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

export function useLoggyMessages({
  conversation,
}: UseLoggyMessagesOptions): UseLoggyMessagesReturn {
  const { error: showError } = useToast();

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getConversationMessages(conversation.id);
      setMessages(data.messages);
    } catch (err: any) {
      if (__DEV__) console.error('Messages load error:', err);
      if (err.response?.status === 403 || err.response?.status === 404) {
        setError('Bu konuşmaya erişim yetkiniz yok');
      } else {
        setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi');
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversation]);

  // Send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !conversation || isSending) return;

      const messageContent = content.trim();
      const userMessage: AiMessage = {
        id: Date.now(),
        conversation_id: conversation.id,
        role: 'user',
        content: messageContent,
        tool_calls: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        const result = await sendMessage(conversation.id, { content: messageContent });
        setMessages((prev) => [...prev, result.message]);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : 'Mesaj gönderilemedi');
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        showError('Hata', err instanceof Error ? err.message : 'Mesaj gönderilemedi');
      } finally {
        setIsSending(false);
      }
    },
    [conversation, isSending, showError]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setError(null);
      return;
    }
    loadMessages();
  }, [conversation, loadMessages]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    loadMessages,
    sendMessage: handleSendMessage,
    clearError,
  };
}
