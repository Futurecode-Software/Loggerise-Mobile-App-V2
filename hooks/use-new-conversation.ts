/**
 * useNewConversation Hook
 *
 * Custom hook for managing new conversation creation state.
 * Handles user fetching, selection, and group/DM creation.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import {
  getAvailableUsers,
  findOrCreateConversation,
  createGroup,
  UserBasic,
} from '@/services/endpoints/messaging';
import { useToast } from './use-toast';

type Mode = 'select' | 'group';

interface UseNewConversationOptions {
  currentUserId: number;
}

interface UseNewConversationReturn {
  // Mode
  mode: Mode;
  setMode: (mode: Mode) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredUsers: UserBasic[];

  // Selection
  selectedUsers: UserBasic[];
  toggleUserSelection: (user: UserBasic) => void;

  // Group
  groupName: string;
  setGroupName: (name: string) => void;
  groupDescription: string;
  setGroupDescription: (desc: string) => void;

  // State
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  // Actions
  handleUserSelect: (user: UserBasic) => Promise<void>;
  handleCreateGroup: () => Promise<void>;
  refetch: () => void;
}

export function useNewConversation({
  currentUserId,
}: UseNewConversationOptions): UseNewConversationReturn {
  const { error: showError, warning } = useToast();

  // Mode state
  const [mode, setMode] = useState<Mode>('select');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Users state
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserBasic[]>([]);

  // Group state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available users
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await getAvailableUsers();
      // Filter out current user
      setUsers(data.filter((u) => u.id !== currentUserId));
    } catch (err) {
      console.error('Users fetch error:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Toggle user selection
  const toggleUserSelection = useCallback((user: UserBasic) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  }, []);

  // Handle user select (DM or toggle for group)
  const handleUserSelect = useCallback(
    async (selectedUser: UserBasic) => {
      if (mode === 'group') {
        toggleUserSelection(selectedUser);
      } else {
        // Create DM conversation
        setIsCreating(true);
        try {
          const result = await findOrCreateConversation(selectedUser.id);
          router.replace(`/message/${result.conversation.id}` as any);
        } catch (err) {
          console.error('Create conversation error:', err);
          showError('Hata', 'Konuşma başlatılamadı. Lütfen tekrar deneyin.');
        } finally {
          setIsCreating(false);
        }
      }
    },
    [mode, toggleUserSelection, showError]
  );

  // Create group
  const handleCreateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      warning('Uyarı', 'Lütfen bir grup adı girin.');
      return;
    }

    if (selectedUsers.length < 1) {
      warning('Uyarı', 'Lütfen en az bir katılımcı seçin.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        user_ids: selectedUsers.map((u) => u.id),
      });
      router.replace(`/message/${result.id}` as any);
    } catch (err) {
      console.error('Create group error:', err);
      showError('Hata', 'Grup oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsCreating(false);
    }
  }, [groupName, groupDescription, selectedUsers, warning, showError]);

  // Refetch function
  const refetch = useCallback(() => {
    setIsLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  return {
    mode,
    setMode,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    selectedUsers,
    toggleUserSelection,
    groupName,
    setGroupName,
    groupDescription,
    setGroupDescription,
    isLoading,
    isCreating,
    error,
    handleUserSelect,
    handleCreateGroup,
    refetch,
  };
}
