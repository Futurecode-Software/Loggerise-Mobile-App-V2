/**
 * Dashboard Context
 *
 * Centralized state management for all dashboard data.
 * Handles available dashboards, active tab, stats for each dashboard type,
 * loading states, and refresh functionality.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import {
  getAvailableDashboards,
  getDashboardStats,
  getOverviewStats,
  getLogisticsStats,
  getWarehouseStats,
  getDomesticStats,
  getFinanceStats,
  getCRMStats,
  getFleetStats,
  getStockStats,
  getHRStats,
  AvailableDashboards,
  DashboardStats,
  OverviewStats,
  LogisticsStats,
  WarehouseStats,
  DomesticStats,
  FinanceStats,
  CRMStats,
  FleetStats,
  StockStats,
  HRStats,
} from '@/services/endpoints/dashboard';
import { useAuth } from '@/context/auth-context';

// Dashboard Tab Types
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

export interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
}

// All available tabs configuration
export const ALL_TABS: Omit<TabConfig, 'icon'>[] = [
  { id: 'overview', label: 'Genel' },
  { id: 'logistics', label: 'Lojistik' },
  { id: 'warehouse', label: 'Depo' },
  { id: 'domestic', label: 'Yurtiçi' },
  { id: 'finance', label: 'Finans' },
  { id: 'crm', label: 'CRM' },
  { id: 'fleet', label: 'Filo' },
  { id: 'stock', label: 'Stok' },
  { id: 'hr', label: 'İK' },
];

// Default values
const DEFAULT_STATS: DashboardStats = {
  monthly_revenue: 0,
  available_vehicles: 0,
  busy_vehicles: 0,
  total_trips: 0,
  active_loads: 0,
  total_vehicles: 0,
  total_contacts: 0,
};

const DEFAULT_AVAILABLE: AvailableDashboards = {
  overview: false,
  logistics: false,
  warehouse: false,
  domestic: false,
  finance: false,
  crm: false,
  fleet: false,
  stock: false,
  hr: false,
};

// Dashboard Stats Union Type
export type DashboardStatsUnion =
  | OverviewStats
  | LogisticsStats
  | WarehouseStats
  | DomesticStats
  | FinanceStats
  | CRMStats
  | FleetStats
  | StockStats
  | HRStats;

// Context Type
interface DashboardContextType {
  // Available dashboards
  availableDashboards: AvailableDashboards;
  isLoadingAvailable: boolean;

  // Active tab
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;

  // Visible tabs (filtered by permissions)
  visibleTabs: Omit<TabConfig, 'icon'>[];

  // Basic stats (fallback)
  basicStats: DashboardStats;

  // Tab-specific stats
  overviewStats: OverviewStats | null;
  logisticsStats: LogisticsStats | null;
  warehouseStats: WarehouseStats | null;
  domesticStats: DomesticStats | null;
  financeStats: FinanceStats | null;
  crmStats: CRMStats | null;
  fleetStats: FleetStats | null;
  stockStats: StockStats | null;
  hrStats: HRStats | null;

  // Loading states
  loadingTab: DashboardTab | null;
  isTabLoading: boolean;

  // Error state
  error: string | null;

  // Refresh functionality
  refreshing: boolean;
  onRefresh: () => Promise<void>;

  // Get stats for current tab
  getCurrentTabStats: () => DashboardStatsUnion | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

/**
 * Hook to use dashboard context
 */
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

/**
 * Dashboard Provider Component
 */
export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  // Get auth state
  const { isAuthenticated, isInitializing } = useAuth();

  // Available dashboards state
  const [availableDashboards, setAvailableDashboards] =
    useState<AvailableDashboards>(DEFAULT_AVAILABLE);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<DashboardTab>('logistics');

  // Basic stats
  const [basicStats, setBasicStats] = useState<DashboardStats>(DEFAULT_STATS);

  // Tab-specific stats
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [logisticsStats, setLogisticsStats] = useState<LogisticsStats | null>(null);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats | null>(null);
  const [domesticStats, setDomesticStats] = useState<DomesticStats | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [crmStats, setCrmStats] = useState<CRMStats | null>(null);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [stockStats, setStockStats] = useState<StockStats | null>(null);
  const [hrStats, setHrStats] = useState<HRStats | null>(null);

  // Loading states
  const [loadingTab, setLoadingTab] = useState<DashboardTab | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Computed: visible tabs based on permissions
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter((tab) => availableDashboards[tab.id]);
  }, [availableDashboards]);

  // Computed: is current tab loading
  const isTabLoading = loadingTab === activeTab;

  // Fetch available dashboards
  const fetchAvailableDashboards = useCallback(async () => {
    try {
      setIsLoadingAvailable(true);
      setError(null);
      const data = await getAvailableDashboards();
      setAvailableDashboards(data);

      // Set first available tab as active
      const firstAvailable = ALL_TABS.find((tab) => data[tab.id]);
      if (firstAvailable) {
        setActiveTab(firstAvailable.id);
      }
    } catch (err) {
      console.error('Available dashboards error:', err);
      setError(
        err instanceof Error ? err.message : 'Dashboard bilgileri alınamadı'
      );
    } finally {
      setIsLoadingAvailable(false);
    }
  }, []);

  // Fetch basic stats
  const fetchBasicStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setBasicStats(data);
    } catch (err) {
      console.error('Basic stats error:', err);
    }
  }, []);

  // Fetch tab-specific data
  const fetchTabData = useCallback(
    async (tab: DashboardTab) => {
      if (!availableDashboards[tab]) return;

      setLoadingTab(tab);
      try {
        switch (tab) {
          case 'overview':
            if (!overviewStats) {
              const data = await getOverviewStats();
              setOverviewStats(data);
            }
            break;
          case 'logistics':
            if (!logisticsStats) {
              const data = await getLogisticsStats();
              setLogisticsStats(data);
            }
            break;
          case 'warehouse':
            if (!warehouseStats) {
              const data = await getWarehouseStats();
              setWarehouseStats(data);
            }
            break;
          case 'domestic':
            if (!domesticStats) {
              const data = await getDomesticStats();
              setDomesticStats(data);
            }
            break;
          case 'finance':
            if (!financeStats) {
              const data = await getFinanceStats();
              setFinanceStats(data);
            }
            break;
          case 'crm':
            if (!crmStats) {
              const data = await getCRMStats();
              setCrmStats(data);
            }
            break;
          case 'fleet':
            if (!fleetStats) {
              const data = await getFleetStats();
              setFleetStats(data);
            }
            break;
          case 'stock':
            if (!stockStats) {
              const data = await getStockStats();
              setStockStats(data);
            }
            break;
          case 'hr':
            if (!hrStats) {
              const data = await getHRStats();
              setHrStats(data);
            }
            break;
        }
      } catch (err) {
        console.error(`${tab} stats error:`, err);
      } finally {
        setLoadingTab(null);
      }
    },
    [
      availableDashboards,
      overviewStats,
      logisticsStats,
      warehouseStats,
      domesticStats,
      financeStats,
      crmStats,
      fleetStats,
      stockStats,
      hrStats,
    ]
  );

  // Get current tab stats
  const getCurrentTabStats = useCallback((): DashboardStatsUnion | null => {
    switch (activeTab) {
      case 'overview':
        return overviewStats;
      case 'logistics':
        return logisticsStats;
      case 'warehouse':
        return warehouseStats;
      case 'domestic':
        return domesticStats;
      case 'finance':
        return financeStats;
      case 'crm':
        return crmStats;
      case 'fleet':
        return fleetStats;
      case 'stock':
        return stockStats;
      case 'hr':
        return hrStats;
      default:
        return null;
    }
  }, [
    activeTab,
    overviewStats,
    logisticsStats,
    warehouseStats,
    domesticStats,
    financeStats,
    crmStats,
    fleetStats,
    stockStats,
    hrStats,
  ]);

  // Refresh all data - only when authenticated
  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setRefreshing(true);

    // Clear all cached stats
    setOverviewStats(null);
    setLogisticsStats(null);
    setWarehouseStats(null);
    setDomesticStats(null);
    setFinanceStats(null);
    setCrmStats(null);
    setFleetStats(null);
    setStockStats(null);
    setHrStats(null);

    // Refetch data
    await Promise.all([fetchAvailableDashboards(), fetchBasicStats()]);
    await fetchTabData(activeTab);

    setRefreshing(false);
  }, [fetchAvailableDashboards, fetchBasicStats, fetchTabData, activeTab, isAuthenticated]);

  // Clear all data when user logs out
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      // Reset all state to defaults
      setAvailableDashboards(DEFAULT_AVAILABLE);
      setBasicStats(DEFAULT_STATS);
      setOverviewStats(null);
      setLogisticsStats(null);
      setWarehouseStats(null);
      setDomesticStats(null);
      setFinanceStats(null);
      setCrmStats(null);
      setFleetStats(null);
      setStockStats(null);
      setHrStats(null);
      setIsLoadingAvailable(false);
      setError(null);
      setActiveTab('logistics');
    }
  }, [isAuthenticated, isInitializing]);

  // Initial data load - only when authenticated
  useEffect(() => {
    // Don't fetch if still initializing or not authenticated
    if (isInitializing || !isAuthenticated) {
      return;
    }

    setIsLoadingAvailable(true);
    fetchAvailableDashboards();
    fetchBasicStats();
  }, [fetchAvailableDashboards, fetchBasicStats, isAuthenticated, isInitializing]);

  // Load tab data when active tab changes - only when authenticated
  useEffect(() => {
    if (!isLoadingAvailable && availableDashboards[activeTab] && isAuthenticated) {
      fetchTabData(activeTab);
    }
  }, [activeTab, isLoadingAvailable, availableDashboards, fetchTabData, isAuthenticated]);

  const value = useMemo(
    () => ({
      availableDashboards,
      isLoadingAvailable,
      activeTab,
      setActiveTab,
      visibleTabs,
      basicStats,
      overviewStats,
      logisticsStats,
      warehouseStats,
      domesticStats,
      financeStats,
      crmStats,
      fleetStats,
      stockStats,
      hrStats,
      loadingTab,
      isTabLoading,
      error,
      refreshing,
      onRefresh,
      getCurrentTabStats,
    }),
    [
      availableDashboards,
      isLoadingAvailable,
      activeTab,
      visibleTabs,
      basicStats,
      overviewStats,
      logisticsStats,
      warehouseStats,
      domesticStats,
      financeStats,
      crmStats,
      fleetStats,
      stockStats,
      hrStats,
      loadingTab,
      isTabLoading,
      error,
      refreshing,
      onRefresh,
      getCurrentTabStats,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
