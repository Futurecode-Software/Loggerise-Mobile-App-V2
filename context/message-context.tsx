import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getConversations, Conversation } from '@/services/endpoints/messaging';
import { useAuth } from './auth-context';

interface MessageContextValue {
  // State
  unreadCount: number;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshUnreadCount: () => Promise<number>;
  fetchConversations: () => Promise<void>;
  updateUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
}

export function MessageProvider({ children }: MessageProviderProps) {
  const { isAuthenticated, isInitializing, isSetupComplete } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh unread count from API
   */
  const refreshUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const response = await getConversations();
      setUnreadCount(response.totalUnreadCount);
      return response.totalUnreadCount;
    } catch (err) {
      console.error('[MessageContext] Error refreshing unread count:', err);
      return 0;
    }
  }, []);

  /**
   * Fetch conversations from API
   */
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getConversations();
      setConversations(response.conversations);
      setUnreadCount(response.totalUnreadCount);
    } catch (err) {
      console.error('[MessageContext] Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update unread count directly
   */
  const updateUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  /**
   * Increment unread count by 1
   */
  const incrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  /**
   * Decrement unread count
   */
  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - amount));
  }, []);

  // Initialize when user is authenticated AND setup is complete
  // Only run once when auth state changes to true
  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    // Only fetch if authenticated, setup complete, and not already initialized
    if (isAuthenticated && !isInitializing && isSetupComplete && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      refreshUnreadCount();
    }
    // Reset flag on logout or when setup is not complete
    if (!isAuthenticated && !isInitializing) {
      hasInitializedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitializing, isSetupComplete]);

  // Clear on logout
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      setUnreadCount(0);
      setConversations([]);
      setError(null);
    }
  }, [isAuthenticated, isInitializing]);

  const value: MessageContextValue = {
    unreadCount,
    conversations,
    isLoading,
    error,
    refreshUnreadCount,
    fetchConversations,
    updateUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
}
