/**
 * useLoggyConversations Hook
 *
 * Custom hook for managing Loggy AI conversations list, fetching, and CRUD operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getConversations,
  createConversation,
  deleteConversation,
  AiConversation,
} from '@/services/endpoints/loggy';

const STORAGE_KEY = 'loggy_last_conversation_id';

interface UseLoggyConversationsReturn {
  // Data
  conversations: AiConversation[];
  currentConversation: AiConversation | null;

  // State
  isLoading: boolean;
  refreshing: boolean;
  error: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  createNewConversation: () => Promise<AiConversation>;
  selectConversation: (conversation: AiConversation) => void;
  handleDelete: (conversationId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLoggyConversations(): UseLoggyConversationsReturn {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await getConversations({ per_page: 20 });
      setConversations(data);
    } catch (err) {
      console.error('Conversations fetch error:', err);
      setError(err instanceof Error ? err.message : 'Konuşmalar yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Create new conversation
  const createNewConversation = useCallback(async (): Promise<AiConversation> => {
    setIsLoading(true);
    try {
      const newConversation = await createConversation({ title: 'Yeni Konuşma' });
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      await AsyncStorage.setItem(STORAGE_KEY, newConversation.id.toString());
      return newConversation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Konuşma oluşturulamadı';
      Alert.alert('Hata', message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select conversation
  const selectConversation = useCallback((conversation: AiConversation) => {
    setCurrentConversation(conversation);
    AsyncStorage.setItem(STORAGE_KEY, conversation.id.toString());
  }, []);

  // Delete conversation
  const handleDelete = useCallback(
    async (conversationId: number) => {
      Alert.alert(
        'Konuşmayı Sil',
        'Bu işlem geri alınamaz. Konuşma ve tüm mesajları kalıcı olarak silinecektir.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteConversation(conversationId);
                setConversations((prev) => prev.filter((c) => c.id !== conversationId));
                if (currentConversation?.id === conversationId) {
                  setCurrentConversation(null);
                  await AsyncStorage.removeItem(STORAGE_KEY);
                }
              } catch (err) {
                Alert.alert('Hata', 'Konuşma silinemedi');
              }
            },
          },
        ]
      );
    },
    [currentConversation]
  );

  // Refresh conversations
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
  }, [fetchConversations]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchConversations();
  }, [fetchConversations]);

  // Load last conversation
  useEffect(() => {
    const loadLastConversation = async () => {
      const lastConversationId = await AsyncStorage.getItem(STORAGE_KEY);
      if (lastConversationId && conversations.length > 0) {
        const lastConversation = conversations.find(
          (c) => c.id === parseInt(lastConversationId, 10)
        );
        if (lastConversation && !currentConversation) {
          selectConversation(lastConversation);
        }
      }
    };
    if (conversations.length > 0 && !currentConversation) {
      loadLastConversation();
    }
  }, [conversations, currentConversation, selectConversation]);

  return {
    conversations,
    currentConversation,
    isLoading,
    refreshing,
    error,
    fetchConversations,
    createNewConversation,
    selectConversation,
    handleDelete,
    refresh,
  };
}
