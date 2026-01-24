import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import {
  Bell,
  Truck,
  Package,
  TrendingUp,
  FileText,
  Car,
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
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react-native';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useNotificationContext } from '@/context/notification-context';
import { formatCurrencyCompact, formatNumber } from '@/utils/formatters';
import { DashboardQuickActions } from '@/components/dashboard/quick-actions';
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

const { width } = Dimensions.get('window');

// Dashboard Tab Types
type DashboardTab = 'overview' | 'logistics' | 'warehouse' | 'domestic' | 'finance' | 'crm' | 'fleet' | 'stock' | 'hr';

interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORPORATE LIGHT THEME - Minimalist, Professional, Single Accent Color
// ═══════════════════════════════════════════════════════════════════════════════
const Theme = {
  // Background layers - clean white with subtle depth
  background: '#F8F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Border - very subtle
  border: '#EBEDF0',
  borderLight: '#F4F5F7',

  // Brand Green - single accent color (Loggerise brand)
  accent: '#13452d',
  accentLight: '#227d53',
  accentMuted: 'rgba(19, 69, 45, 0.08)',
  accentGlow: 'rgba(19, 69, 45, 0.04)',

  // Text hierarchy
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textAccent: '#13452d',

  // Minimal status colors
  success: '#227d53',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',

  // Status backgrounds - very subtle
  successBg: 'rgba(34, 125, 83, 0.08)',
  warningBg: 'rgba(217, 119, 6, 0.08)',
  dangerBg: 'rgba(220, 38, 38, 0.08)',
  infoBg: 'rgba(37, 99, 235, 0.08)',
};

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

// ═══════════════════════════════════════════════════════════════════════════════
// CORPORATE CARD COMPONENT - Clean, Minimal
// ═══════════════════════════════════════════════════════════════════════════════
const CorporateCard = ({ children, style, onPress }: any) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.corporateCard, style]}
    >
      {children}
    </Wrapper>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD - Clean single-color design
// ═══════════════════════════════════════════════════════════════════════════════
const MetricCard = ({
  icon: Icon,
  label,
  value,
  growth,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  growth?: number;
  delay?: number;
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.metricWrapper}>
      <CorporateCard style={styles.metricCard}>
        <View style={styles.metricIconRow}>
          <View style={styles.metricIcon}>
            <Icon size={20} color={Theme.accent} strokeWidth={2} />
          </View>
          {growth !== undefined && growth !== 0 && (
            <View style={[styles.growthPill, growth > 0 ? styles.growthUp : styles.growthDown]}>
              {growth > 0 ? (
                <ArrowUpRight size={12} color={Theme.success} />
              ) : (
                <ArrowDownRight size={12} color={Theme.danger} />
              )}
              <Text style={[styles.growthText, { color: growth > 0 ? Theme.success : Theme.danger }]}>
                {Math.abs(growth)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </CorporateCard>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE: QuickAction component moved to @/components/dashboard/quick-actions
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardScreen() {
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();

  const [activeTab, setActiveTab] = useState<DashboardTab>('logistics');
  const [refreshing, setRefreshing] = useState(false);
  const [availableDashboards, setAvailableDashboards] = useState<AvailableDashboards>(DEFAULT_AVAILABLE);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [loadingTab, setLoadingTab] = useState<DashboardTab | null>(null);

  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter(tab => availableDashboards[tab.id]);
  }, [availableDashboards]);

  const fetchAvailableDashboards = useCallback(async () => {
    try {
      setIsLoadingAvailable(true);
      setError(null);
      const data = await getAvailableDashboards();
      setAvailableDashboards(data);

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

  const fetchBasicStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setBasicStats(data);
    } catch (err) {
      console.error('Basic stats error:', err);
    }
  }, []);

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
  }, [availableDashboards, overviewStats, logisticsStats, warehouseStats, domesticStats, financeStats, crmStats, fleetStats, stockStats, hrStats]);

  useEffect(() => {
    fetchAvailableDashboards();
    fetchBasicStats();
  }, [fetchAvailableDashboards, fetchBasicStats]);

  useEffect(() => {
    if (!isLoadingAvailable && availableDashboards[activeTab]) {
      fetchTabData(activeTab);
    }
  }, [activeTab, isLoadingAvailable, availableDashboards, fetchTabData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setOverviewStats(null);
    setLogisticsStats(null);
    setWarehouseStats(null);
    setDomesticStats(null);
    setFinanceStats(null);
    setCrmStats(null);
    setFleetStats(null);
    setStockStats(null);
    setHrStats(null);

    await Promise.all([
      fetchAvailableDashboards(),
      fetchBasicStats(),
      refreshUnreadCount(),
    ]);
    await fetchTabData(activeTab);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const isTabLoading = loadingTab === activeTab;

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER TAB CONTENTS
  // ═══════════════════════════════════════════════════════════════════════════════
  const renderTabContent = () => {
    if (isTabLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.accent} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
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

  const renderOverviewContent = () => {
    if (!overviewStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <MetricCard icon={Truck} label="Aktif Seferler" value={overviewStats.activeTrips} delay={0} />
          <MetricCard icon={MapPin} label="Yurtiçi İş Emri" value={overviewStats.activeDomesticOrders} delay={50} />
          <MetricCard icon={Package} label="Kabul Bekleyen" value={overviewStats.pendingReceiving} delay={100} />
          <MetricCard icon={TrendingUp} label="Aylık Gelir" value={formatCurrencyCompact(overviewStats.monthlyRevenue)} delay={150} />
        </View>

        <Animated.View entering={FadeIn.delay(200)}>
          <CorporateCard style={styles.summaryCard}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Theme.success }]}>{overviewStats.completedTodayDomestic}</Text>
                <Text style={styles.summaryLabel}>Tamamlanan</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Theme.danger }]}>{overviewStats.delayedDomestic}</Text>
                <Text style={styles.summaryLabel}>Geciken</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Theme.accent }]}>{overviewStats.readyPositions}</Text>
                <Text style={styles.summaryLabel}>Hazır</Text>
              </View>
            </View>
          </CorporateCard>
        </Animated.View>
      </>
    );
  };

  const renderLogisticsContent = () => {
    if (!logisticsStats) return renderBasicContent();

    return (
      <>
        <View style={styles.metricsGrid}>
          <MetricCard icon={Truck} label="Aylık Sefer" value={logisticsStats.monthlyTripsCount} growth={logisticsStats.monthlyTripsGrowth} delay={0} />
          <MetricCard icon={Clock} label="Aktif Sefer" value={logisticsStats.activeTripsCount} delay={50} />
          <MetricCard icon={Calendar} label="Planlanan" value={logisticsStats.plannedTripsCount} delay={100} />
          <MetricCard icon={BarChart3} label="Toplam" value={logisticsStats.totalTripsCount} delay={150} />
        </View>

        {logisticsStats.expiringDocuments.length > 0 && (
          <Animated.View entering={FadeIn.delay(200)}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={18} color={Theme.warning} />
              <Text style={styles.sectionTitle}>Süresi Yaklaşan Belgeler</Text>
            </View>
            <CorporateCard style={styles.listCard}>
              {logisticsStats.expiringDocuments.slice(0, 4).map((doc, index) => (
                <View key={doc.id} style={[styles.listItem, index !== Math.min(logisticsStats.expiringDocuments.length - 1, 3) && styles.listItemBorder]}>
                  <View style={[styles.listItemDot, { backgroundColor: Theme.warning }]} />
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{doc.name}</Text>
                    <Text style={styles.listItemMeta}>{doc.days_until_expiry} gün kaldı</Text>
                  </View>
                </View>
              ))}
            </CorporateCard>
          </Animated.View>
        )}

        {logisticsStats.recentTrips.length > 0 && (
          <Animated.View entering={FadeIn.delay(300)}>
            <View style={styles.sectionHeader}>
              <Truck size={18} color={Theme.accent} />
              <Text style={styles.sectionTitle}>Son Seferler</Text>
            </View>
            <CorporateCard style={styles.listCard}>
              {logisticsStats.recentTrips.slice(0, 4).map((trip, index) => (
                <View key={trip.id} style={[styles.listItem, index !== Math.min(logisticsStats.recentTrips.length - 1, 3) && styles.listItemBorder]}>
                  <View style={[styles.listItemDot, { backgroundColor: trip.status === 'in_progress' ? Theme.success : Theme.textMuted }]} />
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{trip.trip_number}</Text>
                    <Text style={styles.listItemMeta}>{trip.name || '-'}</Text>
                  </View>
                  <View style={[styles.statusBadge, trip.status === 'in_progress' ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, { color: trip.status === 'in_progress' ? Theme.success : Theme.textMuted }]}>
                      {trip.status === 'in_progress' ? 'Devam' : 'Bitti'}
                    </Text>
                  </View>
                </View>
              ))}
            </CorporateCard>
          </Animated.View>
        )}
      </>
    );
  };

  const renderWarehouseContent = () => {
    if (!warehouseStats) return renderBasicContent();
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={Clock} label="Ön Taşıma Bek." value={warehouseStats.summaryStats?.pending_pre_carriages || 0} delay={0} />
        <MetricCard icon={Package} label="Kabul Bekleyen" value={warehouseStats.summaryStats?.pending_warehouse_receiving || 0} delay={50} />
        <MetricCard icon={CheckCircle2} label="Hazır" value={warehouseStats.summaryStats?.ready_for_disposition || 0} delay={100} />
        <MetricCard icon={Warehouse} label="Toplam Pozisyon" value={warehouseStats.summaryStats?.total_positions || 0} delay={150} />
      </View>
    );
  };

  const renderDomesticContent = () => {
    if (!domesticStats) return renderBasicContent();
    const stats = domesticStats.summaryStats;
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={MapPin} label="Toplam İş Emri" value={stats.total_orders} delay={0} />
        <MetricCard icon={Truck} label="Yolda" value={stats.in_transit_orders} delay={50} />
        <MetricCard icon={CheckCircle2} label="Bugün Biten" value={stats.completed_today} delay={100} />
        <MetricCard icon={AlertCircle} label="Geciken" value={stats.delayed_orders} delay={150} />
      </View>
    );
  };

  const renderFinanceContent = () => {
    if (!financeStats) return renderBasicContent();
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={ArrowUpRight} label="Alacak" value={formatCurrencyCompact(financeStats.receivables.total)} delay={0} />
        <MetricCard icon={ArrowDownRight} label="Borç" value={formatCurrencyCompact(financeStats.payables.total)} delay={50} />
        <MetricCard icon={Clock} label="Gecikmiş Alacak" value={formatCurrencyCompact(financeStats.receivables.overdue)} delay={100} />
        <MetricCard icon={TrendingUp} label="Aylık Gelir" value={formatCurrencyCompact(financeStats.incomeStats.totalIncome)} delay={150} />
      </View>
    );
  };

  const renderCRMContent = () => {
    if (!crmStats) return renderBasicContent();
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={CheckCircle2} label="Kazanılan" value={crmStats.wonQuotes.count} delay={0} />
        <MetricCard icon={FileText} label="Toplam Teklif" value={crmStats.quoteStats.total} delay={50} />
        <MetricCard icon={Users} label="Müşteri" value={crmStats.customerStats.total} delay={100} />
        <MetricCard icon={TrendingUp} label="Dönüşüm" value={`%${crmStats.conversionRate}`} delay={150} />
      </View>
    );
  };

  const renderFleetContent = () => {
    if (!fleetStats) return renderBasicContent();
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={Car} label="Aktif Araç" value={fleetStats.vehicleStats.active} delay={0} />
        <MetricCard icon={AlertTriangle} label="Bakımda" value={fleetStats.vehicleStats.inMaintenance} delay={50} />
        <MetricCard icon={UserCheck} label="Aktif Sürücü" value={fleetStats.driverStats.active} delay={100} />
        <MetricCard icon={FileText} label="Sigorta Uyarısı" value={fleetStats.expiringInsurances} delay={150} />
      </View>
    );
  };

  const renderStockContent = () => {
    if (!stockStats) return renderBasicContent();
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={TrendingUp} label="Stok Değeri" value={formatCurrencyCompact(stockStats.totalStockValue)} delay={0} />
        <MetricCard icon={Package} label="Toplam Ürün" value={stockStats.productStats.total} delay={50} />
        <MetricCard icon={AlertCircle} label="Düşük Stok" value={stockStats.productStats.lowStock} delay={100} />
        <MetricCard icon={Warehouse} label="Aktif Depo" value={stockStats.warehouseStats.active} delay={150} />
      </View>
    );
  };

  const renderHRContent = () => {
    if (!hrStats) return renderBasicContent();
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={Users} label="Aktif Personel" value={hrStats.activeEmployees} delay={0} />
        <MetricCard icon={Briefcase} label="Aktif İlan" value={hrStats.activeJobPostings} delay={50} />
        <MetricCard icon={FileText} label="Bekleyen Başvuru" value={hrStats.pendingApplications} delay={100} />
        <MetricCard icon={Calendar} label="Mülakat" value={hrStats.interviewScheduled} delay={150} />
      </View>
    );
  };

  const renderBasicContent = () => {
    return (
      <View style={styles.metricsGrid}>
        <MetricCard icon={Truck} label="Toplam Sefer" value={basicStats.total_trips} delay={0} />
        <MetricCard icon={Package} label="Aktif Yükler" value={basicStats.active_loads} delay={50} />
        <MetricCard icon={TrendingUp} label="Aylık Gelir" value={formatCurrencyCompact(basicStats.monthly_revenue)} delay={100} />
        <MetricCard icon={Users} label="Toplam Cari" value={formatNumber(basicStats.total_contacts)} delay={150} />
      </View>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  if (isLoadingAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingFull}>
          <ActivityIndicator size="large" color={Theme.accent} />
          <Text style={styles.loadingText}>Dashboard yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER - Clean, Minimal */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userSection} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.7}>
          <Avatar source={user?.avatar} name={user?.fullName || 'Kullanıcı'} size="md" />
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.fullName?.split(' ')[0] || 'Kullanıcı'}</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications')}>
          <Bell size={22} color={Theme.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* TAB BAR - Minimal pill style */}
      {visibleTabs.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Icon size={16} color={isActive ? '#FFFFFF' : Theme.textMuted} strokeWidth={isActive ? 2.5 : 2} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.accent} />
        }
      >
        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color={Theme.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderTabContent()}

        {/* QUICK ACTIONS - Dashboard-specific actions */}
        <Animated.View entering={FadeIn.delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          </View>
          <DashboardQuickActions dashboardId={activeTab} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES - Corporate, Minimal, Professional
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  loadingFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Theme.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.textPrimary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: Theme.textMuted,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Tab Bar
  tabBar: {
    maxHeight: 52,
  },
  tabBarContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Theme.borderLight,
  },
  tabActive: {
    backgroundColor: Theme.accent,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.textMuted,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: Theme.dangerBg,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: Theme.danger,
    flex: 1,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricWrapper: {
    width: (width - 52) / 2,
  },
  corporateCard: {
    backgroundColor: Theme.card,
    borderRadius: 14,
    // Very subtle border - cleaner than shadow
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  metricCard: {
    padding: 18,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Theme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthUp: {
    backgroundColor: Theme.successBg,
  },
  growthDown: {
    backgroundColor: Theme.dangerBg,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Theme.textMuted,
    fontWeight: '500',
  },

  // Summary Card
  summaryCard: {
    padding: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Theme.textMuted,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Theme.borderLight,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.textPrimary,
  },

  // List Card
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.textPrimary,
    marginBottom: 2,
  },
  listItemMeta: {
    fontSize: 12,
    color: Theme.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: Theme.successBg,
  },
  statusInactive: {
    backgroundColor: Theme.accentMuted,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Quick Actions
  quickActionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Theme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Theme.textPrimary,
  },
  quickActionDivider: {
    height: 1,
    backgroundColor: Theme.borderLight,
    marginLeft: 68,
    marginRight: 16,
  },
});
