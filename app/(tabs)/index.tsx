import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell,
  Truck,
  Package,
  TrendingUp,
  Plus,
  FileText,
  Car,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  AlertCircle,
  Warehouse,
  DollarSign,
  UserCheck,
  Briefcase,
  BarChart3,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { Card, Badge, Avatar } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import { useAuth } from '@/context/auth-context';
import { useNotificationContext } from '@/context/notification-context';
import { formatCurrencyCompact, formatNumber } from '@/utils/formatters';
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

// Dashboard Tab Types
type DashboardTab = 'overview' | 'logistics' | 'warehouse' | 'domestic' | 'finance' | 'crm' | 'fleet' | 'stock' | 'hr';

interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
}

const ALL_TABS: TabConfig[] = [
  { id: 'overview', label: 'Genel', icon: BarChart3 },
  { id: 'logistics', label: 'Lojistik', icon: Truck },
  { id: 'warehouse', label: 'Depo', icon: Warehouse },
  { id: 'domestic', label: 'Yurtiçi', icon: MapPin },
  { id: 'finance', label: 'Finans', icon: DollarSign },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'fleet', label: 'Filo', icon: Car },
  { id: 'stock', label: 'Stok', icon: Package },
  { id: 'hr', label: 'İK', icon: Briefcase },
];

// Default stats (used for skeleton/loading)
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

const QUICK_ACTIONS = [
  { id: 'newLoad', label: 'Yeni Yük', icon: Package, color: Brand.primary },
  { id: 'newInvoice', label: 'Fatura Kes', icon: FileText, color: '#3b82f6' },
  { id: 'addVehicle', label: 'Araç Ekle', icon: Car, color: '#8b5cf6' },
  { id: 'addContact', label: 'Müşteri Ekle', icon: Plus, color: '#f59e0b' },
];

export default function DashboardScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();

  // State
  const [activeTab, setActiveTab] = useState<DashboardTab>('logistics');
  const [refreshing, setRefreshing] = useState(false);
  const [availableDashboards, setAvailableDashboards] = useState<AvailableDashboards>(DEFAULT_AVAILABLE);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard data states (lazy loaded)
  const [basicStats, setBasicStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [logisticsStats, setLogisticsStats] = useState<LogisticsStats | null>(null);
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats | null>(null);
  const [domesticStats, setDomesticStats] = useState<DomesticStats | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [crmStats, setCrmStats] = useState<CRMStats | null>(null);
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [stockStats, setStockStats] = useState<StockStats | null>(null);
  const [hrStats, setHrStats] = useState<HRStats | null>(null);

  // Loading states per tab
  const [loadingTab, setLoadingTab] = useState<DashboardTab | null>(null);

  // Filter tabs based on permissions
  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter(tab => availableDashboards[tab.id]);
  }, [availableDashboards]);

  // Fetch available dashboards on mount
  const fetchAvailableDashboards = useCallback(async () => {
    try {
      setIsLoadingAvailable(true);
      setError(null);
      const data = await getAvailableDashboards();
      setAvailableDashboards(data);

      // Set initial tab to first available
      const firstAvailable = ALL_TABS.find(tab => data[tab.id]);
      if (firstAvailable) {
        setActiveTab(firstAvailable.id);
      }
    } catch (err) {
      console.error('Available dashboards error:', err);
      setError(err instanceof Error ? err.message : 'Dashboard bilgileri alınamadı');
    } finally {
      setIsLoadingAvailable(false);
    }
  }, []);

  // Fetch basic stats (backward compatible)
  const fetchBasicStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setBasicStats(data);
    } catch (err) {
      console.error('Basic stats error:', err);
    }
  }, []);

  // Fetch tab-specific data
  const fetchTabData = useCallback(async (tab: DashboardTab) => {
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
    // Stats are checked inside the function (to determine if we should fetch)
    // but they don't need to be in the dependency array because they don't affect
    // HOW we fetch - only IF we fetch. Adding them causes infinite re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDashboards]);

  // Initial load
  useEffect(() => {
    fetchAvailableDashboards();
    fetchBasicStats();
  }, [fetchAvailableDashboards, fetchBasicStats]);

  // Fetch tab data when tab changes
  useEffect(() => {
    if (!isLoadingAvailable && availableDashboards[activeTab]) {
      fetchTabData(activeTab);
    }
  }, [activeTab, isLoadingAvailable, availableDashboards, fetchTabData]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear cached data
    setOverviewStats(null);
    setLogisticsStats(null);
    setWarehouseStats(null);
    setDomesticStats(null);
    setFinanceStats(null);
    setCrmStats(null);
    setFleetStats(null);
    setStockStats(null);
    setHrStats(null);
    // Refetch
    await Promise.all([
      fetchAvailableDashboards(),
      fetchBasicStats(),
      refreshUnreadCount(),
    ]);
    // Fetch current tab data
    await fetchTabData(activeTab);
    setRefreshing(false);
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
  };

  // formatCurrency replaced with formatCurrencyCompact from @/utils/formatters (safe for undefined values)

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const isTabLoading = loadingTab === activeTab;

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (isTabLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Veriler yükleniyor...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'logistics':
        return renderLogisticsContent();
      case 'warehouse':
        return renderWarehouseContent();
      case 'domestic':
        return renderDomesticContent();
      case 'finance':
        return renderFinanceContent();
      case 'crm':
        return renderCRMContent();
      case 'fleet':
        return renderFleetContent();
      case 'stock':
        return renderStockContent();
      case 'hr':
        return renderHRContent();
      default:
        return renderBasicContent();
    }
  };

  // Overview Content
  const renderOverviewContent = () => {
    if (!overviewStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <Truck size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF SEFERLER</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{overviewStats.activeTrips}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <MapPin size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>YURTİÇİ İŞ EMRİ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{overviewStats.activeDomesticOrders}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <Package size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>KABUL BEKLEYEN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{overviewStats.pendingReceiving}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
              <TrendingUp size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AYLIK GELİR</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrencyCompact(overviewStats.monthlyRevenue)}</Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{overviewStats.completedTodayDomestic}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bugün Tamamlanan</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{overviewStats.delayedDomestic}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Geciken</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.info }]}>{overviewStats.readyPositions}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Hazır Pozisyon</Text>
            </View>
          </View>
        </Card>
      </>
    );
  };

  // Logistics Content
  const renderLogisticsContent = () => {
    if (!logisticsStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <Truck size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AYLIK SEFER</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{logisticsStats.monthlyTripsCount}</Text>
            {logisticsStats.monthlyTripsGrowth !== 0 && (
              <View style={styles.growthBadge}>
                {logisticsStats.monthlyTripsGrowth > 0 ? (
                  <ArrowUpRight size={14} color={colors.success} />
                ) : (
                  <ArrowDownRight size={14} color={colors.danger} />
                )}
                <Text style={[styles.growthText, { color: logisticsStats.monthlyTripsGrowth > 0 ? colors.success : colors.danger }]}>
                  %{Math.abs(logisticsStats.monthlyTripsGrowth)}
                </Text>
              </View>
            )}
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <Clock size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF SEFER</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{logisticsStats.activeTripsCount}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <Calendar size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>PLANLANAN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{logisticsStats.plannedTripsCount}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
              <BarChart3 size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOPLAM</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{logisticsStats.totalTripsCount}</Text>
          </Card>
        </View>

        {/* Expiring Documents */}
        {logisticsStats.expiringDocuments.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Süresi Yaklaşan Belgeler</Text>
            </View>
            <Card variant="outlined" padding="none">
              {logisticsStats.expiringDocuments.slice(0, 5).map((doc, index) => (
                <View
                  key={doc.id}
                  style={[
                    styles.listItem,
                    index !== Math.min(logisticsStats.expiringDocuments.length - 1, 4) && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.listItemIcon, { backgroundColor: colors.warningLight }]}>
                    <AlertTriangle size={16} color={colors.warning} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>{doc.name}</Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textMuted }]}>
                      {doc.days_until_expiry} gün kaldı
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Recent Trips */}
        {logisticsStats.recentTrips.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Seferler</Text>
            </View>
            <Card variant="outlined" padding="none">
              {logisticsStats.recentTrips.map((trip, index) => (
                <View
                  key={trip.id}
                  style={[
                    styles.listItem,
                    index !== logisticsStats.recentTrips.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.listItemIcon, { backgroundColor: trip.status === 'in_progress' ? colors.successLight : colors.infoLight }]}>
                    <Truck size={16} color={trip.status === 'in_progress' ? colors.success : colors.info} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>{trip.trip_number}</Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textMuted }]}>{trip.name || '-'}</Text>
                  </View>
                  <Badge
                    variant={trip.status === 'in_progress' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {trip.status === 'in_progress' ? 'Devam' : 'Bitti'}
                  </Badge>
                </View>
              ))}
            </Card>
          </>
        )}
      </>
    );
  };

  // Warehouse Content
  const renderWarehouseContent = () => {
    if (!warehouseStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <Clock size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>ÖN TAŞIMA BEK.</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{warehouseStats.summaryStats?.pending_pre_carriages || 0}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <Package size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>KABUL BEKLEYEN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{warehouseStats.summaryStats?.pending_warehouse_receiving || 0}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <CheckCircle2 size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>HAZIR</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{warehouseStats.summaryStats?.ready_for_disposition || 0}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
              <Warehouse size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOPLAM POZ.</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{warehouseStats.summaryStats?.total_positions || 0}</Text>
          </Card>
        </View>

        <Card style={styles.infoCard}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Hazırlık eşiği: %{warehouseStats.threshold}
          </Text>
        </Card>
      </>
    );
  };

  // Domestic Content
  const renderDomesticContent = () => {
    if (!domesticStats) return renderBasicContent();

    const stats = domesticStats.summaryStats;

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <MapPin size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOPLAM İŞ EMRİ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{stats.total_orders}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <Truck size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>YOLDA</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{stats.in_transit_orders}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <CheckCircle2 size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BUGÜN BİTEN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{stats.completed_today}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.dangerLight }]}>
              <AlertCircle size={24} color={colors.danger} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>GECİKEN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{stats.delayed_orders}</Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{stats.pending_orders}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bekleyen</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.info }]}>{stats.assigned_orders}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Atanmış</Text>
            </View>
          </View>
        </Card>

        {/* Delayed Orders */}
        {domesticStats.delayedOrders.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Geciken İş Emirleri</Text>
            </View>
            <Card variant="outlined" padding="none">
              {domesticStats.delayedOrders.slice(0, 5).map((order, index) => (
                <View
                  key={order.id}
                  style={[
                    styles.listItem,
                    index !== Math.min(domesticStats.delayedOrders.length - 1, 4) && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.listItemIcon, { backgroundColor: colors.dangerLight }]}>
                    <AlertCircle size={16} color={colors.danger} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>{order.order_number}</Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textMuted }]}>
                      {order.pickup_city} → {order.delivery_city}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </>
    );
  };

  // Finance Content
  const renderFinanceContent = () => {
    if (!financeStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <ArrowUpRight size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>ALACAK</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrencyCompact(financeStats.receivables.total)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.dangerLight }]}>
              <ArrowDownRight size={24} color={colors.danger} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BORÇ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrencyCompact(financeStats.payables.total)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <Clock size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>GECİKMİŞ ALACAK</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrencyCompact(financeStats.receivables.overdue)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <TrendingUp size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AYLIK GELİR</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrencyCompact(financeStats.incomeStats.totalIncome)}</Text>
          </Card>
        </View>
      </>
    );
  };

  // CRM Content
  const renderCRMContent = () => {
    if (!crmStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <CheckCircle2 size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>KAZANILAN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{crmStats.wonQuotes.count}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <FileText size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOPLAM TEKLİF</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{crmStats.quoteStats.total}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <Users size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>MÜŞTERİ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{crmStats.customerStats.total}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
              <TrendingUp size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>DÖNÜŞÜM</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>%{crmStats.conversionRate}</Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{crmStats.quoteStats.sent}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Gönderilen</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{crmStats.quoteStats.accepted}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Onaylanan</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{crmStats.quoteStats.rejected}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Reddedilen</Text>
            </View>
          </View>
        </Card>
      </>
    );
  };

  // Fleet Content
  const renderFleetContent = () => {
    if (!fleetStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <Car size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF ARAÇ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{fleetStats.vehicleStats.active}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <AlertTriangle size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BAKIMDA</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{fleetStats.vehicleStats.inMaintenance}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <UserCheck size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF SÜRÜCÜ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{fleetStats.driverStats.active}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.dangerLight }]}>
              <FileText size={24} color={colors.danger} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>SİGORTA UYR.</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{fleetStats.expiringInsurances}</Text>
          </Card>
        </View>

        {/* Expiring Documents */}
        {fleetStats.expiringDocuments.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Süresi Dolan Belgeler</Text>
            </View>
            <Card variant="outlined" padding="none">
              {fleetStats.expiringDocuments.slice(0, 5).map((doc, index) => (
                <View
                  key={doc.id}
                  style={[
                    styles.listItem,
                    index !== Math.min(fleetStats.expiringDocuments.length - 1, 4) && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.listItemIcon, { backgroundColor: colors.warningLight }]}>
                    <AlertTriangle size={16} color={colors.warning} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>{doc.name}</Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textMuted }]}>
                      {doc.type_label} - {doc.days_until_expiry} gün kaldı
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </>
    );
  };

  // Stock Content
  const renderStockContent = () => {
    if (!stockStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <TrendingUp size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>STOK DEĞERİ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrencyCompact(stockStats.totalStockValue)}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <Package size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOPLAM ÜRÜN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{stockStats.productStats.total}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.dangerLight }]}>
              <AlertCircle size={24} color={colors.danger} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>DÜŞÜK STOK</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{stockStats.productStats.lowStock}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <Warehouse size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF DEPO</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{stockStats.warehouseStats.active}</Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.info }]}>{stockStats.movementStats.today}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bugün Hareket</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{stockStats.movementStats.inbound}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Giriş</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{stockStats.movementStats.outbound}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Çıkış</Text>
            </View>
          </View>
        </Card>
      </>
    );
  };

  // HR Content
  const renderHRContent = () => {
    if (!hrStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <Users size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF PERSONEL</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{hrStats.activeEmployees}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <Briefcase size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF İLAN</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{hrStats.activeJobPostings}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <FileText size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>BEKLEYEN BAŞV.</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{hrStats.pendingApplications}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
              <Calendar size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>MÜLAKAT</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{hrStats.interviewScheduled}</Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{hrStats.hiredThisMonth}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bu Ay İşe Alınan</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{hrStats.leftThisMonth}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Bu Ay Ayrılan</Text>
            </View>
          </View>
        </Card>

        {/* Expiring Documents */}
        {hrStats.allExpiringDocuments.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Süresi Yaklaşan Belgeler</Text>
            </View>
            <Card variant="outlined" padding="none">
              {hrStats.allExpiringDocuments.slice(0, 5).map((doc, index) => (
                <View
                  key={`${doc.id}-${doc.document_type}`}
                  style={[
                    styles.listItem,
                    index !== Math.min(hrStats.allExpiringDocuments.length - 1, 4) && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.listItemIcon, { backgroundColor: colors.warningLight }]}>
                    <AlertTriangle size={16} color={colors.warning} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>{doc.employee_name}</Text>
                    <Text style={[styles.listItemSubtitle, { color: colors.textMuted }]}>
                      {doc.document_type} - {doc.days_until_expiry} gün kaldı
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </>
    );
  };

  // Basic Content (fallback)
  const renderBasicContent = () => {
    return (
      <>
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard} onPress={() => router.push('/(tabs)/loads')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.successLight }]}>
              <Truck size={24} color={colors.success} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOPLAM SEFER</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{basicStats.total_trips}</Text>
          </Card>

          <Card style={styles.metricCard} onPress={() => router.push('/(tabs)/loads')}>
            <View style={[styles.metricIcon, { backgroundColor: colors.warningLight }]}>
              <Package size={24} color={colors.warning} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AKTİF YÜKLER</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{basicStats.active_loads}</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: colors.infoLight }]}>
              <TrendingUp size={24} color={colors.info} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>AYLIK GELİR</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatCurrencyCompact(basicStats.monthly_revenue)}</Text>
          </Card>

          <Card style={styles.metricCard} onPress={() => router.push('/(tabs)/contacts')}>
            <View style={[styles.metricIcon, { backgroundColor: '#F3E8FF' }]}>
              <Users size={24} color="#8b5cf6" />
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>TOPLAM CARİ</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{formatNumber(basicStats.total_contacts)}</Text>
          </Card>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{basicStats.available_vehicles}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Müsait Araç</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{basicStats.busy_vehicles}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Meşgul Araç</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{basicStats.total_vehicles}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Toplam Araç</Text>
            </View>
          </View>
        </Card>
      </>
    );
  };

  // Loading state for initial load
  if (isLoadingAvailable) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.fullLoadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Dashboard yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.userSection}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Avatar
            source={user?.avatar}
            name={user?.fullName || 'Kullanıcı'}
            size="md"
          />
          <View style={styles.userInfo}>
            <Text style={[styles.headerGreeting, { color: colors.text }]}>
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Kullanıcı'}
            </Text>
            <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={24} color={colors.icon} />
          {unreadCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colors.danger }]}>
              <Text style={styles.notificationCount}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Bar - Only show tabs user has access to */}
      {visibleTabs.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabBar, { backgroundColor: colors.surface }]}
          contentContainerStyle={styles.tabBarContent}
        >
          {visibleTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
                activeTab === tab.id && { borderBottomColor: Brand.primary },
              ]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? Brand.primary : colors.textSecondary },
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
      >
        {/* Error State */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            <TouchableOpacity onPress={fetchAvailableDashboards}>
              <Text style={[styles.retryText, { color: colors.danger }]}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab Content */}
        {renderTabContent()}

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hızlı İşlemler</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsScroll}
          contentContainerStyle={styles.quickActionsContainer}
        >
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickAction, { backgroundColor: colors.card, ...Shadows.sm }]}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <action.icon size={24} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  headerGreeting: {
    ...Typography.headingSM,
    marginBottom: 2,
  },
  headerDate: {
    ...Typography.bodyXS,
  },
  notificationButton: {
    position: 'relative',
    padding: Spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  tabBar: {
    maxHeight: 48,
  },
  tabBarContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  tab: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    ...Typography.bodyMD,
  },
  activeTabText: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySM,
    flex: 1,
  },
  retryText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  metricLabel: {
    ...Typography.bodyXS,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    ...Typography.headingLG,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  growthText: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginLeft: 2,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...Typography.headingLG,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.bodyXS,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.bodySM,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headingSM,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    ...Typography.bodyMD,
    fontWeight: '500',
    marginBottom: 2,
  },
  listItemSubtitle: {
    ...Typography.bodySM,
  },
  quickActionsScroll: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.xl,
  },
  quickActionsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  quickAction: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    ...Typography.bodyXS,
    textAlign: 'center',
  },
});
