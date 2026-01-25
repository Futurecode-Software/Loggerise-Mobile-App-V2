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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
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
import { useAuth } from '@/context/auth-context';
import { useNotificationContext } from '@/context/notification-context';
import { useMessageContext } from '@/context/message-context';
import { useDashboard, DashboardTab } from '@/contexts/dashboard-context';
import { DashboardTheme } from '@/constants/dashboard-theme';
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

  const renderTabContent = () => {
    if (isTabLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardTheme.accent} />
          <Text style={styles.loadingText}>Yukleniyor...</Text>
        </View>
      );
    }

    const TabComponent = TAB_COMPONENTS[activeTab] || BasicTab;
    return <TabComponent />;
  };

  // Loading state
  if (isLoadingAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingFull}>
          <ActivityIndicator size="large" color={DashboardTheme.accent} />
          <Text style={styles.loadingText}>Dashboard yukleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userSection}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Avatar
            source={user?.avatar}
            name={user?.fullName || 'Kullanici'}
            size="md"
          />
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Kullanici'}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerIcons}>
          {/* Message Icon */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/(tabs)/messages')}
          >
            <MessageCircle size={22} color={DashboardTheme.textSecondary} />
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
          >
            <Bell size={22} color={DashboardTheme.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      {visibleTabs.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {visibleTabs.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Icon
                  size={16}
                  color={isActive ? '#FFFFFF' : DashboardTheme.textMuted}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
            onRefresh={handleRefresh}
            tintColor={DashboardTheme.accent}
          />
        }
      >
        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color={DashboardTheme.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderTabContent()}

        {/* Quick Actions */}
        <Animated.View entering={FadeIn.delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hizli Islemler</Text>
          </View>
          <DashboardQuickActions dashboardId={activeTab} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardTheme.background,
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
    color: DashboardTheme.textMuted,
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
    color: DashboardTheme.textPrimary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: DashboardTheme.textMuted,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DashboardTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: DashboardTheme.card,
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
    backgroundColor: DashboardTheme.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    backgroundColor: DashboardTheme.accent,
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
    backgroundColor: DashboardTheme.borderLight,
  },
  tabActive: {
    backgroundColor: DashboardTheme.accent,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: DashboardTheme.textMuted,
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
    backgroundColor: DashboardTheme.dangerBg,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    color: DashboardTheme.danger,
    flex: 1,
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
    color: DashboardTheme.textPrimary,
  },
});
