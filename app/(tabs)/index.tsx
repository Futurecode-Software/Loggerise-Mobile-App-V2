/**
 * Premium Dashboard Screen
 *
 * Ana dashboard ekrani - metrikler, hizli islemler ve coklu tab sistemi
 * Pull-to-refresh, staggered animasyonlar ve premium tasarim ozellikleri
 * Backend API'den gelen verilerle beslenir
 */

import React, { useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
} from '@/constants/dashboard-theme'
import { DashboardHeader, MetricCard, QuickActionButton } from '@/components/dashboard'
import {
  useDashboard,
  DashboardTab
} from '@/context/dashboard-context'
import { useRouter } from 'expo-router'
import { formatDashboardCurrency } from '@/utils/currency'
import { useNotificationContext } from '@/context/notification-context'
import { useMessageContext } from '@/context/message-context'

// Metrik tipi
interface Metric {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string | number
  growth?: number
  iconColor?: string
}

// Hizli islem tipi
interface QuickAction {
  id: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  badge: number
  route?: string
}

/**
 * Tab'a gore metrikleri hesapla
 */
function getMetricsForTab(
  tab: DashboardTab,
  dashboard: ReturnType<typeof useDashboard>
): Metric[] {
  switch (tab) {
    case 'overview': {
      const stats = dashboard.overviewStats
      if (!stats) return []
      return [
        {
          icon: 'car-outline',
          label: 'Aktif Seferler',
          value: stats.activeTrips,
        },
        {
          icon: 'location-outline',
          label: 'Yurtiçi İş Emri',
          value: stats.activeDomesticOrders,
        },
        {
          icon: 'cube-outline',
          label: 'Kabul Bekleyen',
          value: stats.pendingReceiving,
        },
        {
          icon: 'trending-up-outline',
          label: 'Aylık Gelir',
          value: formatDashboardCurrency(stats.monthlyRevenue),
        },
      ]
    }

    case 'logistics': {
      const stats = dashboard.logisticsStats
      if (!stats) return []
      return [
        {
          icon: 'car-outline',
          label: 'Aylık Sefer',
          value: stats.monthlyTripsCount,
          growth: stats.monthlyTripsGrowth,
        },
        {
          icon: 'time-outline',
          label: 'Aktif Sefer',
          value: stats.activeTripsCount,
        },
        {
          icon: 'calendar-outline',
          label: 'Planlanan',
          value: stats.plannedTripsCount,
        },
        {
          icon: 'bar-chart-outline',
          label: 'Toplam',
          value: stats.totalTripsCount,
        },
      ]
    }

    case 'warehouse': {
      const stats = dashboard.warehouseStats
      if (!stats) return []
      const summary = stats.summaryStats
      return [
        {
          icon: 'time-outline',
          label: 'Ön Taşıma Bek.',
          value: summary.pending_pre_carriages,
        },
        {
          icon: 'cube-outline',
          label: 'Kabul Bekleyen',
          value: summary.pending_warehouse_receiving,
        },
        {
          icon: 'checkmark-circle-outline',
          label: 'Hazır',
          value: summary.ready_for_disposition,
        },
        {
          icon: 'business-outline',
          label: 'Toplam Pozisyon',
          value: summary.total_positions,
        },
      ]
    }

    case 'domestic': {
      const stats = dashboard.domesticStats
      if (!stats) return []
      const summary = stats.summaryStats
      return [
        {
          icon: 'document-text-outline',
          label: 'Toplam Sipariş',
          value: summary.total_orders,
        },
        {
          icon: 'time-outline',
          label: 'Bekleyen',
          value: summary.pending_orders,
        },
        {
          icon: 'car-outline',
          label: 'Yolda',
          value: summary.in_transit_orders,
        },
        {
          icon: 'alert-circle-outline',
          label: 'Gecikmiş',
          value: summary.delayed_orders,
          iconColor: DashboardColors.danger,
        },
      ]
    }

    case 'finance': {
      const stats = dashboard.financeStats
      if (!stats) return []
      return [
        {
          icon: 'arrow-up-outline',
          label: 'Alacak',
          value: formatDashboardCurrency(stats.receivables.total),
          iconColor: DashboardColors.success,
        },
        {
          icon: 'arrow-down-outline',
          label: 'Borç',
          value: formatDashboardCurrency(stats.payables.total),
          iconColor: DashboardColors.danger,
        },
        {
          icon: 'time-outline',
          label: 'Gecikmiş Alacak',
          value: formatDashboardCurrency(stats.receivables.overdue),
        },
        {
          icon: 'trending-up-outline',
          label: 'Aylık Gelir',
          value: formatDashboardCurrency(stats.incomeStats.totalIncome),
          growth: stats.incomeStats.growthPercentage,
        },
      ]
    }

    case 'crm': {
      const stats = dashboard.crmStats
      if (!stats) return []
      return [
        {
          icon: 'checkmark-circle-outline',
          label: 'Kazanılan',
          value: stats.wonQuotes.count,
          growth: stats.wonQuotes.growthPercentage,
        },
        {
          icon: 'document-text-outline',
          label: 'Toplam Teklif',
          value: stats.quoteStats.total,
        },
        {
          icon: 'people-outline',
          label: 'Müşteri',
          value: stats.customerStats.total,
        },
        {
          icon: 'trending-up-outline',
          label: 'Dönüşüm',
          value: `%${stats.conversionRate.toFixed(1)}`,
        },
      ]
    }

    case 'fleet': {
      const stats = dashboard.fleetStats
      if (!stats) return []
      return [
        {
          icon: 'car-outline',
          label: 'Aktif Araç',
          value: stats.vehicleStats.active,
        },
        {
          icon: 'warning-outline',
          label: 'Bakımda',
          value: stats.vehicleStats.inMaintenance,
          iconColor: DashboardColors.warning,
        },
        {
          icon: 'person-outline',
          label: 'Aktif Sürücü',
          value: stats.driverStats.active,
        },
        {
          icon: 'document-outline',
          label: 'Sigorta Uyarısı',
          value: stats.expiringInsurances,
          iconColor: stats.expiringInsurances > 0 ? DashboardColors.danger : undefined,
        },
      ]
    }

    case 'stock': {
      const stats = dashboard.stockStats
      if (!stats) return []
      return [
        {
          icon: 'wallet-outline',
          label: 'Stok Değeri',
          value: formatDashboardCurrency(stats.totalStockValue),
          growth: stats.stockValueGrowth,
        },
        {
          icon: 'cube-outline',
          label: 'Aktif Ürün',
          value: stats.productStats.active,
        },
        {
          icon: 'alert-circle-outline',
          label: 'Düşük Stok',
          value: stats.productStats.lowStock,
          iconColor: stats.productStats.lowStock > 0 ? DashboardColors.warning : undefined,
        },
        {
          icon: 'swap-horizontal-outline',
          label: 'Bugünkü Hareket',
          value: stats.movementStats.today,
        },
      ]
    }

    case 'hr': {
      const stats = dashboard.hrStats
      if (!stats) return []
      return [
        {
          icon: 'people-outline',
          label: 'Toplam Çalışan',
          value: stats.totalEmployees,
        },
        {
          icon: 'person-add-outline',
          label: 'Bu Ay İşe Alım',
          value: stats.hiredThisMonth,
        },
        {
          icon: 'document-text-outline',
          label: 'Bekleyen Başvuru',
          value: stats.pendingApplications,
        },
        {
          icon: 'calendar-outline',
          label: 'Mülakat',
          value: stats.interviewScheduled,
        },
      ]
    }

    default:
      return []
  }
}

/**
 * Tab'a gore hizli islemleri getir
 */
function getQuickActionsForTab(tab: DashboardTab): QuickAction[] {
  switch (tab) {
    case 'overview':
      return [
        { id: '1', icon: 'add-circle-outline', label: 'Yeni Sefer', badge: 0 },
        { id: '2', icon: 'cube-outline', label: 'Yük Ekle', badge: 0 },
        { id: '3', icon: 'document-text-outline', label: 'Teklif Oluştur', badge: 0 },
        { id: '4', icon: 'scan-outline', label: 'QR Tara', badge: 0 },
      ]
    case 'logistics':
      return [
        { id: '1', icon: 'add-circle-outline', label: 'Yeni Sefer', badge: 0 },
        { id: '2', icon: 'cube-outline', label: 'Yük Ekle', badge: 0 },
        { id: '3', icon: 'location-outline', label: 'Araç Takip', badge: 0 },
        { id: '4', icon: 'document-outline', label: 'Belgeler', badge: 0 },
      ]
    case 'warehouse':
      return [
        { id: '1', icon: 'download-outline', label: 'Kabul', badge: 0 },
        { id: '2', icon: 'upload-outline', label: 'Sevk', badge: 0 },
        { id: '3', icon: 'scan-outline', label: 'Barkod Tara', badge: 0 },
        { id: '4', icon: 'search-outline', label: 'Pozisyon Ara', badge: 0 },
      ]
    case 'domestic':
      return [
        { id: '1', icon: 'add-circle-outline', label: 'Yeni Sipariş', badge: 0 },
        { id: '2', icon: 'car-outline', label: 'Araç Ata', badge: 0 },
        { id: '3', icon: 'location-outline', label: 'Teslimat Takip', badge: 0 },
        { id: '4', icon: 'document-outline', label: 'Raporlar', badge: 0 },
      ]
    case 'finance':
      return [
        { id: '1', icon: 'add-circle-outline', label: 'Yeni İşlem', badge: 0 },
        { id: '2', icon: 'receipt-outline', label: 'Fatura Kes', badge: 0 },
        { id: '3', icon: 'wallet-outline', label: 'Ödeme Al', badge: 0 },
        { id: '4', icon: 'document-outline', label: 'Raporlar', badge: 0 },
      ]
    case 'crm':
      return [
        { id: '1', icon: 'add-circle-outline', label: 'Yeni Teklif', badge: 0 },
        { id: '2', icon: 'person-add-outline', label: 'Müşteri Ekle', badge: 0 },
        { id: '3', icon: 'call-outline', label: 'Arama Yap', badge: 0 },
        { id: '4', icon: 'mail-outline', label: 'Mail Gönder', badge: 0 },
      ]
    case 'fleet':
      return [
        { id: '1', icon: 'add-circle-outline', label: 'Araç Ekle', badge: 0 },
        { id: '2', icon: 'build-outline', label: 'Bakım Planla', badge: 0 },
        { id: '3', icon: 'water-outline', label: 'Yakıt Girişi', badge: 0 },
        { id: '4', icon: 'document-outline', label: 'Belgeler', badge: 0 },
      ]
    case 'stock':
      return [
        { id: '1', icon: 'add-circle-outline', label: 'Ürün Ekle', badge: 0 },
        { id: '2', icon: 'download-outline', label: 'Stok Girişi', badge: 0 },
        { id: '3', icon: 'upload-outline', label: 'Stok Çıkışı', badge: 0 },
        { id: '4', icon: 'document-outline', label: 'Sayım', badge: 0 },
      ]
    case 'hr':
      return [
        { id: '1', icon: 'person-add-outline', label: 'Çalışan Ekle', badge: 0 },
        { id: '2', icon: 'briefcase-outline', label: 'İlan Ver', badge: 0 },
        { id: '3', icon: 'document-outline', label: 'İzin Talebi', badge: 0 },
        { id: '4', icon: 'calendar-outline', label: 'Mülakat Planla', badge: 0 },
      ]
    default:
      return []
  }
}

// formatCurrency - merkezi utils/currency.ts'den formatDashboardCurrency kullanılıyor

export default function Dashboard() {
  const router = useRouter()
  const dashboard = useDashboard()
  const { unreadCount: notificationCount } = useNotificationContext()
  const { unreadCount: messageCount } = useMessageContext()

  const {
    activeTab,
    setActiveTab,
    visibleTabs,
    isLoadingAvailable,
    isTabLoading,
    refreshing,
    onRefresh,
    error,
  } = dashboard

  // Tab degistirme
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as DashboardTab)
  }, [setActiveTab])

  // Bildirim tiklamasi
  const handleNotificationPress = useCallback(() => {
    router.push('/notifications')
  }, [router])

  // Mesaj tiklamasi
  const handleMessagePress = useCallback(() => {
    router.push('/(tabs)/messages')
  }, [router])

  // Avatar tiklamasi
  const handleAvatarPress = useCallback(() => {
    router.push('/(tabs)/profile')
  }, [router])

  // Hizli islem tiklamasi
  const handleQuickAction = useCallback((actionId: string) => {
    console.log('Quick action:', actionId)
  }, [])

  // Tab'lar icin header formatina donustur
  const headerTabs = useMemo(() => {
    return visibleTabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
    }))
  }, [visibleTabs])

  // Mevcut tab icin metrikler
  const currentMetrics = useMemo(() => {
    return getMetricsForTab(activeTab, dashboard)
  }, [activeTab, dashboard])

  // Mevcut tab icin hizli islemler
  const quickActions = useMemo(() => {
    return getQuickActionsForTab(activeTab)
  }, [activeTab])

  return (
    <View style={styles.container}>
      {/* Header - her zaman goster */}
      <DashboardHeader
        tabs={headerTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notificationCount={notificationCount}
        messageCount={messageCount}
        onNotificationPress={handleNotificationPress}
        onMessagePress={handleMessagePress}
        onAvatarPress={handleAvatarPress}
      />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          (isLoadingAvailable || error || visibleTabs.length === 0) && styles.scrollContentCentered
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardColors.primary}
            colors={[DashboardColors.primary]}
          />
        }
      >
        {/* Loading durumu */}
        {isLoadingAvailable ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
            <Text style={styles.stateText}>Dashboard yükleniyor...</Text>
          </View>
        ) : error && visibleTabs.length === 0 ? (
          // Hata durumu
          <View style={styles.stateContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={DashboardColors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.stateSubText}>Lütfen daha sonra tekrar deneyin</Text>
          </View>
        ) : visibleTabs.length === 0 ? (
          // Erişebilir dashboard yok
          <View style={styles.stateContainer}>
            <Ionicons name="lock-closed-outline" size={48} color={DashboardColors.textSecondary} />
            <Text style={styles.stateText}>Erişebilir dashboard bulunamadı</Text>
            <Text style={styles.stateSubText}>Yetki tanımları için yöneticinizle iletişime geçin</Text>
          </View>
        ) : (
          <>
            {/* Metrikler Bölümü */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Özet</Text>

              {isTabLoading && currentMetrics.length === 0 ? (
                <View style={styles.tabLoadingContainer}>
                  <ActivityIndicator size="small" color={DashboardColors.primary} />
                  <Text style={styles.tabLoadingText}>Veriler yükleniyor...</Text>
                </View>
              ) : currentMetrics.length > 0 ? (
                <View style={styles.metricsGrid}>
                  {currentMetrics.map((metric, index) => (
                    <MetricCard
                      key={`${activeTab}-${metric.label}`}
                      icon={metric.icon}
                      label={metric.label}
                      value={metric.value}
                      growth={metric.growth}
                      iconColor={metric.iconColor}
                      delay={index * 50}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Bu dashboard için veri bulunamadı</Text>
                </View>
              )}
            </View>

            {/* Hızlı İşlemler Bölümü */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="flash"
                  size={18}
                  color={DashboardColors.primary}
                />
                <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
              </View>
              <View style={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                  <QuickActionButton
                    key={action.id}
                    icon={action.icon}
                    label={action.label}
                    badge={action.badge}
                    onPress={() => handleQuickAction(action.id)}
                    delay={300 + index * 50}
                  />
                ))}
              </View>
            </View>

            {/* Tab bar icin alt bosluk */}
            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingTop: DashboardSpacing.lg,
  },
  section: {
    marginBottom: DashboardSpacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.lg,
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md,
  },
  bottomSpacer: {
    height: 100,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing['2xl'],
    gap: DashboardSpacing.md,
  },
  stateText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    textAlign: 'center',
  },
  stateSubText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    textAlign: 'center',
  },
  tabLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing['2xl'],
    gap: DashboardSpacing.md,
  },
  tabLoadingText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textSecondary,
  },
  noDataContainer: {
    padding: DashboardSpacing['2xl'],
    alignItems: 'center',
  },
  noDataText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textSecondary,
  },
})
