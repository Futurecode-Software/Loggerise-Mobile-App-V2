/**
 * Dashboard Context
 *
 * Dashboard verileri icin merkezi state yonetimi.
 * Kullanici izinlerine gore erisebilir dashboard'lari, aktif tab'i,
 * her dashboard tipi icin istatistikleri, yukleme durumlarini ve
 * yenileme fonksiyonalitesini yonetir.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react'
import { Ionicons } from '@expo/vector-icons'
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
} from '@/services/endpoints/dashboard'
import { useAuth } from '@/context/auth-context'

// Dashboard Tab Tipleri
export type DashboardTab =
  | 'overview'
  | 'logistics'
  | 'warehouse'
  | 'domestic'
  | 'finance'
  | 'crm'
  | 'fleet'
  | 'stock'
  | 'hr'

export interface TabConfig {
  id: DashboardTab
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

// Tum tab yapilandirmasi
export const ALL_TABS: TabConfig[] = [
  { id: 'overview', label: 'Genel', icon: 'bar-chart-outline' },
  { id: 'logistics', label: 'Lojistik', icon: 'car-outline' },
  { id: 'warehouse', label: 'Depo', icon: 'cube-outline' },
  { id: 'domestic', label: 'Yurtiçi', icon: 'location-outline' },
  { id: 'finance', label: 'Finans', icon: 'wallet-outline' },
  { id: 'crm', label: 'CRM', icon: 'people-outline' },
  { id: 'fleet', label: 'Filo', icon: 'bus-outline' },
  { id: 'stock', label: 'Stok', icon: 'layers-outline' },
  { id: 'hr', label: 'İK', icon: 'person-outline' },
]

// Varsayılan değerler
const DEFAULT_STATS: DashboardStats = {
  monthly_revenue: 0,
  available_vehicles: 0,
  busy_vehicles: 0,
  total_trips: 0,
  active_loads: 0,
  total_vehicles: 0,
  total_contacts: 0,
}

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
}

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
  | HRStats

// Context Type
interface DashboardContextType {
  // Erisebilir dashboard'lar
  availableDashboards: AvailableDashboards
  isLoadingAvailable: boolean

  // Aktif tab
  activeTab: DashboardTab
  setActiveTab: (tab: DashboardTab) => void

  // Gorunur tab'lar (izinlere gore filtrelenmis)
  visibleTabs: TabConfig[]

  // Temel istatistikler (fallback)
  basicStats: DashboardStats

  // Tab'a ozel istatistikler
  overviewStats: OverviewStats | null
  logisticsStats: LogisticsStats | null
  warehouseStats: WarehouseStats | null
  domesticStats: DomesticStats | null
  financeStats: FinanceStats | null
  crmStats: CRMStats | null
  fleetStats: FleetStats | null
  stockStats: StockStats | null
  hrStats: HRStats | null

  // Yukleme durumlari
  loadingTab: DashboardTab | null
  isTabLoading: boolean

  // Hata durumu
  error: string | null

  // Yenileme fonksiyonalitesi
  refreshing: boolean
  onRefresh: () => Promise<void>

  // Mevcut tab'in istatistiklerini al
  getCurrentTabStats: () => DashboardStatsUnion | null
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
)

/**
 * Dashboard context'i kullanmak icin hook
 */
export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return context
}

/**
 * Dashboard Provider Component
 */
export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  // Auth state'i al
  const { isAuthenticated, isInitializing, isSetupComplete } = useAuth()

  // Erisebilir dashboard'lar state'i
  const [availableDashboards, setAvailableDashboards] =
    useState<AvailableDashboards>(DEFAULT_AVAILABLE)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Aktif tab
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  // Temel istatistikler
  const [basicStats, setBasicStats] = useState<DashboardStats>(DEFAULT_STATS)

  // Tab'a ozel istatistikler
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null)
  const [logisticsStats, setLogisticsStats] = useState<LogisticsStats | null>(null)
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats | null>(null)
  const [domesticStats, setDomesticStats] = useState<DomesticStats | null>(null)
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null)
  const [crmStats, setCrmStats] = useState<CRMStats | null>(null)
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null)
  const [stockStats, setStockStats] = useState<StockStats | null>(null)
  const [hrStats, setHrStats] = useState<HRStats | null>(null)

  // Yukleme durumlari
  const [loadingTab, setLoadingTab] = useState<DashboardTab | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Hesaplanan: izinlere gore gorunur tab'lar
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter((tab) => availableDashboards[tab.id])
  }, [availableDashboards])

  // Hesaplanan: mevcut tab yukleniyor mu
  const isTabLoading = loadingTab === activeTab

  // Erisebilir dashboard'lari getir
  const fetchAvailableDashboards = useCallback(async () => {
    try {
      setIsLoadingAvailable(true)
      setError(null)
      const data = await getAvailableDashboards()
      setAvailableDashboards(data)

      // Ilk erisebilir tab'i aktif yap
      const firstAvailable = ALL_TABS.find((tab) => data[tab.id])
      if (firstAvailable) {
        setActiveTab(firstAvailable.id)
      }
    } catch (err) {
      if (__DEV__) console.error('Available dashboards error:', err)
      setError(
        err instanceof Error ? err.message : 'Dashboard bilgileri alinamadi'
      )
    } finally {
      setIsLoadingAvailable(false)
    }
  }, [])

  // Temel istatistikleri getir
  const fetchBasicStats = useCallback(async () => {
    try {
      const data = await getDashboardStats()
      setBasicStats(data)
    } catch (err) {
      if (__DEV__) console.error('Basic stats error:', err)
    }
  }, [])

  // Refs to track loaded tabs without causing re-renders
  const loadedTabsRef = React.useRef<Set<DashboardTab>>(new Set())

  // Tab'a ozel verileri getir
  const fetchTabData = useCallback(
    async (tab: DashboardTab, forceRefresh: boolean = false) => {
      // Check if tab data already loaded using ref (avoids dependency on stats)
      if (!forceRefresh && loadedTabsRef.current.has(tab)) {
        return
      }

      setLoadingTab(tab)
      try {
        switch (tab) {
          case 'overview': {
            const data = await getOverviewStats()
            setOverviewStats(data)
            break
          }
          case 'logistics': {
            const data = await getLogisticsStats()
            setLogisticsStats(data)
            break
          }
          case 'warehouse': {
            const data = await getWarehouseStats()
            setWarehouseStats(data)
            break
          }
          case 'domestic': {
            const data = await getDomesticStats()
            setDomesticStats(data)
            break
          }
          case 'finance': {
            const data = await getFinanceStats()
            setFinanceStats(data)
            break
          }
          case 'crm': {
            const data = await getCRMStats()
            setCrmStats(data)
            break
          }
          case 'fleet': {
            const data = await getFleetStats()
            setFleetStats(data)
            break
          }
          case 'stock': {
            const data = await getStockStats()
            setStockStats(data)
            break
          }
          case 'hr': {
            const data = await getHRStats()
            setHrStats(data)
            break
          }
        }
        // Mark tab as loaded
        loadedTabsRef.current.add(tab)
      } catch (err) {
        if (__DEV__) console.error(`${tab} stats error:`, err)
      } finally {
        setLoadingTab(null)
      }
    },
    [] // No dependencies on stats - use ref for cache tracking
  )

  // Mevcut tab'in istatistiklerini al
  const getCurrentTabStats = useCallback((): DashboardStatsUnion | null => {
    switch (activeTab) {
      case 'overview':
        return overviewStats
      case 'logistics':
        return logisticsStats
      case 'warehouse':
        return warehouseStats
      case 'domestic':
        return domesticStats
      case 'finance':
        return financeStats
      case 'crm':
        return crmStats
      case 'fleet':
        return fleetStats
      case 'stock':
        return stockStats
      case 'hr':
        return hrStats
      default:
        return null
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
  ])

  // Tum verileri yenile - sadece giris yapilmis ve setup tamamlanmissa
  const onRefresh = useCallback(async () => {
    if (!isAuthenticated || !isSetupComplete) {
      return
    }

    setRefreshing(true)

    // Tum cached istatistikleri temizle
    setOverviewStats(null)
    setLogisticsStats(null)
    setWarehouseStats(null)
    setDomesticStats(null)
    setFinanceStats(null)
    setCrmStats(null)
    setFleetStats(null)
    setStockStats(null)
    setHrStats(null)

    // Clear loaded tabs cache
    loadedTabsRef.current.clear()

    // Verileri yeniden getir
    await Promise.all([fetchAvailableDashboards(), fetchBasicStats()])
    await fetchTabData(activeTab, true)

    setRefreshing(false)
  }, [fetchAvailableDashboards, fetchBasicStats, fetchTabData, activeTab, isAuthenticated, isSetupComplete])

  // Kullanici cikis yaptiginda tum verileri temizle
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      // Tum state'leri varsayilana resetle
      setAvailableDashboards(DEFAULT_AVAILABLE)
      setBasicStats(DEFAULT_STATS)
      setOverviewStats(null)
      setLogisticsStats(null)
      setWarehouseStats(null)
      setDomesticStats(null)
      setFinanceStats(null)
      setCrmStats(null)
      setFleetStats(null)
      setStockStats(null)
      setHrStats(null)
      setIsLoadingAvailable(false)
      setError(null)
      setActiveTab('overview')
      // Clear loaded tabs cache
      loadedTabsRef.current.clear()
    }
  }, [isAuthenticated, isInitializing])

  // Ilk veri yuklemesi - sadece giris yapilmis ve setup tamamlanmissa
  useEffect(() => {
    // Henuz initialize ediliyorsa, giris yapilmamissa veya setup tamamlanmamissa getirme
    if (isInitializing || !isAuthenticated || !isSetupComplete) {
      return
    }

    setIsLoadingAvailable(true)
    fetchAvailableDashboards()
    fetchBasicStats()
  }, [fetchAvailableDashboards, fetchBasicStats, isAuthenticated, isInitializing, isSetupComplete])

  // Aktif tab degistiginde tab verisini yukle - sadece giris yapilmis ve setup tamamlanmissa
  useEffect(() => {
    if (!isLoadingAvailable && availableDashboards[activeTab] && isAuthenticated && isSetupComplete) {
      fetchTabData(activeTab)
    }
  }, [activeTab, isLoadingAvailable, availableDashboards, fetchTabData, isAuthenticated, isSetupComplete])

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
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
