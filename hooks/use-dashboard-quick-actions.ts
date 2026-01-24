/**
 * Dashboard Quick Actions Hook
 *
 * Main hook that returns quick actions based on the active dashboard tab.
 * Delegates to dashboard-specific hooks for each tab type.
 */

import { QuickAction } from '@/contexts/quick-actions-context';
import { useOverviewQuickActions } from './use-overview-quick-actions';
import { useLogisticsQuickActions } from './use-logistics-quick-actions';
import { useWarehouseQuickActions } from './use-warehouse-quick-actions';
import { useDomesticQuickActions } from './use-domestic-quick-actions';
import { useFinanceQuickActions } from './use-finance-quick-actions';
import { useCrmQuickActions } from './use-crm-quick-actions';
import { useFleetQuickActions } from './use-fleet-quick-actions';
import { useStockQuickActions } from './use-stock-quick-actions';
import { useHrQuickActions } from './use-hr-quick-actions';

/**
 * Dashboard tab type (matches index.tsx DashboardTab)
 */
export type DashboardTab =
  | 'overview'
  | 'logistics'
  | 'warehouse'
  | 'domestic'
  | 'finance'
  | 'crm'
  | 'fleet'
  | 'stock'
  | 'hr';

/**
 * Get quick actions for a specific dashboard
 */
export const useDashboardQuickActions = (
  dashboardId: DashboardTab
): QuickAction[] => {
  const overviewActions = useOverviewQuickActions();
  const logisticsActions = useLogisticsQuickActions();
  const warehouseActions = useWarehouseQuickActions();
  const domesticActions = useDomesticQuickActions();
  const financeActions = useFinanceQuickActions();
  const crmActions = useCrmQuickActions();
  const fleetActions = useFleetQuickActions();
  const stockActions = useStockQuickActions();
  const hrActions = useHrQuickActions();

  const actionMap: Record<DashboardTab, QuickAction[]> = {
    overview: overviewActions,
    logistics: logisticsActions,
    warehouse: warehouseActions,
    domestic: domesticActions,
    finance: financeActions,
    crm: crmActions,
    fleet: fleetActions,
    stock: stockActions,
    hr: hrActions,
  };

  return actionMap[dashboardId] || [];
};
