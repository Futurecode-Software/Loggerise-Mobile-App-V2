/**
 * Dashboard Screen
 *
 * Main dashboard view with multiple tab-based dashboards.
 * Uses DashboardContext for centralized state management.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  Truck,
  Package,
  Car,
  Users,
  Warehouse,
  DollarSign,
  Briefcase,
  BarChart3,
  MapPin,
  AlertCircle,
  MessageCircle,
} from 'lucide-react-native';

import { Avatar } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { useAuth } from '@/context/auth-context';
import { useNotificationContext } from '@/context/notification-context';
import { useMessageContext } from '@/context/message-context';
import { useDashboard, DashboardTab } from '@/contexts/dashboard-context';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  DashboardQuickActions,
  OverviewTab,
  LogisticsTab,
  WarehouseTab,
  DomesticTab,
  FinanceTab,
  CRMTab,
  FleetTab,
  StockTab,
  HRTab,
  BasicTab,
} from '@/components/dashboard';

// Tab icons mapping
const TAB_ICONS: Record<DashboardTab, React.ElementType> = {
  overview: BarChart3,
  logistics: Truck,
  warehouse: Warehouse,
  domestic: MapPin,
  finance: DollarSign,
  crm: Users,
  fleet: Car,
  stock: Package,
  hr: Briefcase,
};

// Tab content components mapping
const TAB_COMPONENTS: Record<DashboardTab, React.FC> = {
  overview: OverviewTab,
  logistics: LogisticsTab,
  warehouse: WarehouseTab,
  domestic: DomesticTab,
  finance: FinanceTab,
  crm: CRMTab,
  fleet: FleetTab,
  stock: StockTab,
  hr: HRTab,
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();
  const { unreadCount: unreadMessageCount, refreshUnreadCount: refreshMessageCount } = useMessageContext();

  const {
    isLoadingAvailable,
    activeTab,
    setActiveTab,
    visibleTabs,
    isTabLoading,
    error,
    refreshing,
    onRefresh,
  } = useDashboard();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Gunaydin';
    if (hour < 18) return 'Iyi gunler';
    return 'Iyi aksamlar';
  };

  const handleRefresh = async () => {
    await Promise.all([onRefresh(), refreshUnreadCount(), refreshMessageCount()]);
  };

  const TabComponent = TAB_COMPONENTS[activeTab] || BasicTab;

  // Loading state - show simple loading indicator if still loading
  if (isLoadingAvailable) {
    return (
      <View style={styles.container}>
        <FullScreenHeader
          title="Dashboard"
          subtitle="Yükleniyor..."
        />
        <View style={styles.loadingFull}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={styles.loadingText}>Dashboard yukleniyor...</Text>
        </View>
      </View>
    );
  }

  // Tab'ları header için hazırla
  const headerTabs = visibleTabs.map((tab) => {
    const Icon = TAB_ICONS[tab.id];
    const isActive = activeTab === tab.id;
    return {
      id: tab.id,
      label: tab.label,
      icon: <Icon size={16} color="#FFFFFF" strokeWidth={isActive ? 2.5 : 2} />,
      isActive,
      onPress: () => setActiveTab(tab.id),
    };
  });

  return (
    <View style={styles.container}>
      {/* Full Screen Header */}
      <FullScreenHeader
        leftContent={
          <View style={styles.headerLeftContent}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <Avatar
                source={user?.avatar}
                name={user?.fullName || 'Kullanici'}
                size="sm"
              />
            </TouchableOpacity>
            <View style={styles.headerUserInfo}>
              <Text style={styles.headerGreeting}>
                {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Kullanici'}
              </Text>
              <Text style={styles.headerDate}>
                {new Date().toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
          </View>
        }
        rightIcons={
          <View style={styles.headerIcons}>
            {/* Message Icon */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push('/(tabs)/messages')}
              activeOpacity={0.7}
            >
              <MessageCircle size={22} color="#FFFFFF" />
              {unreadMessageCount > 0 && (
                <View style={[styles.badge, styles.messageBadge]}>
                  <Text style={styles.badgeText}>
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
            >
              <Bell size={22} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        }
        tabs={headerTabs}
      />

      {/* Content - White rounded card */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Brand.primary}
          />
        }
      >
        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color={DashboardTheme.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isTabLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DashboardTheme.accent} />
            <Text style={styles.loadingText}>Yukleniyor...</Text>
          </View>
        ) : (
          <View style={styles.dashboardContent}>
            <TabComponent />
            <DashboardQuickActions dashboardId={activeTab} showHeader />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  loadingFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 0,
    ...Shadows.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: DashboardTheme.textMuted,
  },

  // Header Left Content
  headerLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  // Header Icons
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    padding: 4,
  },
  notificationBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#13452d',
  },
  messageBadge: {
    backgroundColor: '#FF9500',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Content - White rounded card
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  dashboardContent: {
    gap: 20,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: DashboardTheme.dangerBg,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: DashboardTheme.danger,
    flex: 1,
  },
});
