/**
 * Dashboard Quick Actions Component
 *
 * Displays a grid of quick action buttons for the active dashboard.
 * Automatically fetches and displays actions based on dashboard ID.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DashboardTab, useDashboardQuickActions } from '@/hooks/use-dashboard-quick-actions';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { QuickActionButton } from './quick-action-button';

/**
 * Dashboard Quick Actions Props
 */
interface DashboardQuickActionsProps {
  dashboardId: DashboardTab;
}

/**
 * Dashboard Quick Actions Component
 */
export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  dashboardId,
}) => {
  const actions = useDashboardQuickActions(dashboardId);

  if (actions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map((action) => (
          <QuickActionButton key={action.id} {...action} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DashboardTheme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
});
