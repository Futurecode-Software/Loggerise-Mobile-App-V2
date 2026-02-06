/**
 * Yurtiçi Taşıma Raporları
 * Yurtiçi iş emirleri istatistikleri
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import Toast from 'react-native-toast-message'
import PageHeader from '@/components/navigation/PageHeader'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
} from '@/constants/dashboard-theme'
import { formatCurrency, formatNumber } from '@/utils/currency'
import { reportsApi } from '@/services'
import type {
  DomesticSummary,
  DomesticByStatus,
  DomesticByVehicle,
  DomesticByDriver,
} from '@/services/endpoints/reports'
import { Truck, Users, DollarSign, Package, TrendingUp, Info } from 'lucide-react-native'
import { BarChart, PieChart } from 'react-native-chart-kit'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_WIDTH = SCREEN_WIDTH - 64

export default function DomesticReportScreen(): React.JSX.Element {
  const router = useRouter()
  const isMountedRef = useRef(true)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<DomesticSummary | null>(null)
  const [byStatus, setByStatus] = useState<DomesticByStatus[]>([])
  const [byVehicle, setByVehicle] = useState<DomesticByVehicle[]>([])
  const [byDriver, setByDriver] = useState<DomesticByDriver[]>([])

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [summaryRes, statusRes, vehicleRes, driverRes] = await Promise.all([
      reportsApi.fetchDomesticSummary({ start_date: startDate, end_date: endDate }),
      reportsApi.fetchDomesticByStatus({ start_date: startDate, end_date: endDate }),
      reportsApi.fetchDomesticByVehicle({ start_date: startDate, end_date: endDate, limit: 5 }),
      reportsApi.fetchDomesticByDriver({ start_date: startDate, end_date: endDate, limit: 5 }),
    ]).catch((error) => {
      if (isMountedRef.current) {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: error.message || 'Yurtiçi raporlar yüklenemedi',
          position: 'top',
          visibilityTime: 1500,
        })
      }
      return [null, [], [], []]
    })

    if (isMountedRef.current) {
      if (summaryRes) setSummary(summaryRes)
      if (statusRes) setByStatus(statusRes)
      if (vehicleRes) setByVehicle(vehicleRes)
      if (driverRes) setByDriver(driverRes)
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true
      fetchData()

      return () => {
        isMountedRef.current = false
      }
    }, [fetchData])
  )

  function handleRefresh(): void {
    setRefreshing(true)
    fetchData(false)
  }

  function handleBack(): void {
    router.back()
  }

  // Durum renkleri ve etiketleri
  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    completed: '#10B981',
    cancelled: '#EF4444',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Beklemede',
    in_progress: 'Devam Ediyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Yurtiçi Raporlar"
          showBackButton
          onBackPress={handleBack}
        />
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
          </View>
        </View>
      </View>
    )
  }

  // Empty state
  if (!summary) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Yurtiçi Raporlar"
          showBackButton
          onBackPress={handleBack}
        />
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Yurtiçi rapor verisi bulunamadı</Text>
          </View>
        </View>
      </View>
    )
  }

  // Durum dağılımı pie chart data
  const statusData = Object.entries(summary.status_distribution).map(([status, count]) => ({
    name: statusLabels[status] || status,
    amount: count,
    color: statusColors[status] || '#9CA3AF',
    legendFontColor: DashboardColors.text,
    legendFontSize: 12,
  }))

  // Araç performansı bar chart data
  const vehicleChartData = {
    labels: byVehicle.map((item) => item.vehicle_plate.substring(0, 5)),
    datasets: [
      {
        data: byVehicle.map((item) => item.total_revenue / 1000),
      },
    ],
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Yurtiçi Raporlar"
        subtitle="Son 30 gün"
        showBackButton
        onBackPress={handleBack}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[DashboardColors.primary]}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {/* Özet Kartları */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.orderCard]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: DashboardColors.primaryGlow }]}>
              <Package size={24} color={DashboardColors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Toplam İş Emri</Text>
            <Text style={styles.summaryValue}>{summary.summary.total_orders}</Text>
          </View>

          <View style={[styles.summaryCard, styles.revenueCard]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: DashboardColors.successBg }]}>
              <DollarSign size={24} color={DashboardColors.success} />
            </View>
            <Text style={styles.summaryLabel}>Toplam Gelir</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.summary.total_revenue, 'TRY', { decimals: 0 })}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.kmCard]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: DashboardColors.infoBg }]}>
              <TrendingUp size={24} color={DashboardColors.info} />
            </View>
            <Text style={styles.summaryLabel}>Toplam KM</Text>
            <Text style={styles.summaryValue}>
              {formatNumber(summary.summary.total_km, 0)} km
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.vehicleCard]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: DashboardColors.warningBg }]}>
              <Truck size={24} color={DashboardColors.warning} />
            </View>
            <Text style={styles.summaryLabel}>Aktif Araç</Text>
            <Text style={styles.summaryValue}>{summary.summary.active_vehicles}</Text>
          </View>

          <View style={[styles.summaryCard, styles.driverCard]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Users size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.summaryLabel}>Aktif Sürücü</Text>
            <Text style={styles.summaryValue}>{summary.summary.active_drivers}</Text>
          </View>
        </View>

        {/* Durum Dagilimi */}
        {statusData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Durum Dağılımı</Text>
            <PieChart
              data={statusData}
              width={CHART_WIDTH}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Araç Performansı */}
        {byVehicle.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>En İyi 5 Araç (Gelir)</Text>
            <BarChart
              data={vehicleChartData}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel=""
              yAxisSuffix="B"
              chartConfig={{
                backgroundColor: DashboardColors.surface,
                backgroundGradientFrom: DashboardColors.surface,
                backgroundGradientTo: DashboardColors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(4, 65, 52, ${opacity})`,
                labelColor: () => DashboardColors.textSecondary,
                style: {
                  borderRadius: DashboardBorderRadius.lg,
                },
              }}
              style={{
                marginVertical: DashboardSpacing.sm,
                borderRadius: DashboardBorderRadius.lg,
              }}
            />
            <View style={styles.vehicleList}>
              {byVehicle.map((vehicle, index) => (
                <View key={vehicle.vehicle_plate} style={styles.vehicleItem}>
                  <View style={styles.vehicleItemLeft}>
                    <Text style={styles.vehicleRank}>{index + 1}</Text>
                    <View>
                      <Text style={styles.vehiclePlate}>{vehicle.vehicle_plate}</Text>
                      <Text style={styles.vehicleStats}>
                        {vehicle.order_count} iş emri - {formatNumber(vehicle.total_km, 0)} km
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.vehicleRevenue}>
                      {formatCurrency(vehicle.total_revenue, 'TRY', { decimals: 0 })}
                    </Text>
                    <Text style={styles.vehicleAvg}>
                      Ort: {formatCurrency(vehicle.avg_revenue_per_order, 'TRY', { decimals: 0 })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sürücü Performansı */}
        {byDriver.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>En İyi 5 Sürücü (Gelir)</Text>
            <View style={styles.driverList}>
              {byDriver.map((driver, index) => (
                <View key={driver.driver_name} style={styles.driverItem}>
                  <View style={styles.driverItemLeft}>
                    <Text style={styles.driverRank}>{index + 1}</Text>
                    <View>
                      <Text style={styles.driverName}>{driver.driver_name}</Text>
                      <Text style={styles.driverStats}>
                        {driver.order_count} iş emri - {formatNumber(driver.total_km, 0)} km
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.driverRevenue}>
                      {formatCurrency(driver.total_revenue, 'TRY', { decimals: 0 })}
                    </Text>
                    <Text style={styles.driverAvg}>
                      Ort: {formatCurrency(driver.avg_revenue_per_order, 'TRY', { decimals: 0 })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bilgilendirme */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Info size={18} color={DashboardColors.primary} />
            <Text style={styles.infoTitle}>Bilgilendirme</Text>
          </View>
          <Text style={styles.infoText}>
            Yurtiçi raporlar son 30 günlük iş emirleri üzerinden hesaplanmaktadır. Araç ve sürücü
            performans verileri gelir bazlı sıralanmıştır.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl'],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: DashboardColors.card,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.lg,
    ...DashboardShadows.sm,
  },
  orderCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.primary,
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.success,
  },
  kmCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.info,
  },
  vehicleCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.warning,
  },
  driverCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.sm,
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
  },
  chartCard: {
    backgroundColor: DashboardColors.card,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg,
    ...DashboardShadows.sm,
  },
  chartTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.md,
  },
  vehicleList: {
    marginTop: DashboardSpacing.md,
    gap: DashboardSpacing.md,
  },
  vehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DashboardSpacing.md,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: DashboardColors.primary,
  },
  vehicleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    flex: 1,
  },
  vehicleRank: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.primary,
    width: 30,
  },
  vehiclePlate: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  vehicleStats: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2,
  },
  vehicleRevenue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text,
    textAlign: 'right',
  },
  vehicleAvg: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  driverList: {
    gap: DashboardSpacing.md,
  },
  driverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DashboardSpacing.md,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: DashboardBorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  driverItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    flex: 1,
  },
  driverRank: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#8B5CF6',
    width: 30,
  },
  driverName: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  driverStats: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2,
  },
  driverRevenue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text,
    textAlign: 'right',
  },
  driverAvg: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  infoCard: {
    padding: DashboardSpacing.lg,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.xs,
  },
  infoTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20,
  },
})
