import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Notification, RecentNotificationsResponse } from '@/services/endpoints/notifications';
import { useAuth } from './auth-context';

interface NotificationContextValue {
  // State
  unreadCount: number;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  pushToken: string | null;

  // Actions
  initialize: () => Promise<void>;
  fetchNotifications: () => Promise<RecentNotificationsResponse | null>;
  refreshUnreadCount: () => Promise<number>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated, isInitializing, isSetupComplete } = useAuth();
  const {
    initialize,
    pushToken,
    isInitialized,
    unreadCount,
    notifications,
    isLoading,
    error,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  // Ref to store initialize function to avoid re-triggering useEffect
  const initializeRef = useRef(initialize);
  useEffect(() => {
    initializeRef.current = initialize;
  }, [initialize]);

  // Initialize notifications when user is authenticated AND setup is complete - only once
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    console.log('[NotificationContext] Effect triggered:', {
      isAuthenticated,
      isInitializing,
      isSetupComplete,
      isInitialized,
      hasInitializedRef: hasInitializedRef.current,
    });

    if (isAuthenticated && !isInitializing && isSetupComplete && !isInitialized && !hasInitializedRef.current) {
      console.log('[NotificationContext] Conditions met, initializing notifications...');
      hasInitializedRef.current = true;
      initializeRef.current();
    }
    // Reset on logout or when setup is not complete
    if (!isAuthenticated && !isInitializing) {
      console.log('[NotificationContext] User logged out, resetting');
      hasInitializedRef.current = false;
    }
  }, [isAuthenticated, isInitializing, isSetupComplete, isInitialized]);

  // Ref to store clearNotifications to avoid re-triggering useEffect
  const clearNotificationsRef = useRef(clearNotifications);
  useEffect(() => {
    clearNotificationsRef.current = clearNotifications;
  }, [clearNotifications]);

  // Clear notifications on logout
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      clearNotificationsRef.current();
    }
  }, [isAuthenticated, isInitializing]);

  const value: NotificationContextValue = {
    unreadCount,
    notifications,
    isLoading,
    error,
    isInitialized,
    pushToken,
    initialize,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
