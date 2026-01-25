/**
 * Dashboard Quick Actions Component
 *
 * Modern grid layout for quick action buttons.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { DashboardTab, useDashboardQuickActions } from '@/hooks/use-dashboard-quick-actions';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { QuickActionButton } from './quick-action-button';

interface DashboardQuickActionsProps {
  dashboardId: DashboardTab;
  showHeader?: boolean;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  dashboardId,
  showHeader = false,
}) => {
  const actions = useDashboardQuickActions(dashboardId);

  if (actions.length === 0) return null;

  return (
    <View>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Zap size={16} color={DashboardTheme.accent} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Hizli Islemler</Text>
            <Text style={styles.headerSubtitle}>
              {actions.length} islem mevcut
            </Text>
          </View>
        </View>
      )}

      <View style={styles.grid}>
        {actions.map((action) => (
          <QuickActionButton key={action.id} {...action} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DashboardTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DashboardTheme.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: DashboardTheme.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
