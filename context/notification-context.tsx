import React, { createContext, useContext, useEffect, ReactNode } from 'react';
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
  const { isAuthenticated, isInitializing } = useAuth();
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

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitializing && !isInitialized) {
      initialize();
    }
  }, [isAuthenticated, isInitializing, isInitialized, initialize]);

  // Clear notifications on logout
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      clearNotifications();
    }
  }, [isAuthenticated, isInitializing, clearNotifications]);

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
