/**
 * useLoggyConversations Hook
 *
 * Custom hook for managing Loggy AI conversations list, fetching, and CRUD operations.
 */

import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getConversations,
  createConversation,
  deleteConversation,
  AiConversation,
} from '@/services/endpoints/loggy';
import { useToast } from './use-toast';

const STORAGE_KEY = 'loggy_last_conversation_id';

interface UseLoggyConversationsReturn {
  // Data
  conversations: AiConversation[];
  currentConversation: AiConversation | null;

  // State
  isLoading: boolean;
  refreshing: boolean;
  error: string | null;

  // Delete dialog state
  showDeleteDialog: boolean;
  conversationToDelete: number | null;

  // Actions
  fetchConversations: () => Promise<void>;
  createNewConversation: () => Promise<AiConversation>;
  selectConversation: (conversation: AiConversation) => void;
  handleDelete: (conversationId: number) => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
  refresh: () => Promise<void>;
}

export function useLoggyConversations(): UseLoggyConversationsReturn {
  const { success, error: showError } = useToast();

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

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
      showError('Hata', message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Select conversation
  const selectConversation = useCallback((conversation: AiConversation) => {
    setCurrentConversation(conversation);
    AsyncStorage.setItem(STORAGE_KEY, conversation.id.toString());
  }, []);

  // Delete conversation - show dialog
  const handleDelete = useCallback((conversationId: number) => {
    setConversationToDelete(conversationId);
    setShowDeleteDialog(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!conversationToDelete) return;

    try {
      await deleteConversation(conversationToDelete);
      setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete));
      if (currentConversation?.id === conversationToDelete) {
        setCurrentConversation(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      success('Başarılı', 'Konuşma silindi.');
    } catch (err) {
      showError('Hata', 'Konuşma silinemedi');
    } finally {
      setShowDeleteDialog(false);
      setConversationToDelete(null);
    }
  }, [conversationToDelete, currentConversation, success, showError]);

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
    setConversationToDelete(null);
  }, []);

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
    showDeleteDialog,
    conversationToDelete,
    fetchConversations,
    createNewConversation,
    selectConversation,
    handleDelete,
    confirmDelete,
    cancelDelete,
    refresh,
  };
}
