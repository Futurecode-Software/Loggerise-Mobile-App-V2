/**
 * Quick Actions Context
 *
 * Provides dashboard-specific quick actions throughout the app.
 * Each dashboard can define its own set of quick actions based on user permissions.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react-native';

/**
 * Quick Action interface
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
  permission?: string;
}

/**
 * Quick Actions Context Type
 */
interface QuickActionsContextType {
  actions: QuickAction[];
  setActions: (actions: QuickAction[]) => void;
}

const QuickActionsContext = createContext<QuickActionsContextType | undefined>(
  undefined
);

/**
 * Hook to use quick actions context
 */
export const useQuickActions = () => {
  const context = useContext(QuickActionsContext);
  if (!context) {
    throw new Error(
      'useQuickActions must be used within QuickActionsProvider'
    );
  }
  return context;
};

/**
 * Quick Actions Provider Component
 */
export const QuickActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<QuickAction[]>([]);

  return (
    <QuickActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </QuickActionsContext.Provider>
  );
};
