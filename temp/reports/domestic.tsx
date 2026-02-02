/**
 * Yurtiçi Taşıma Raporları
 * Yurtiçi iş emirleri istatistikleri
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FullScreenHeader } from '@/components/header';
import { Brand, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { showError } from '@/utils/toast';
import { reportsApi } from '@/services';
import type {
  DomesticSummary,
  DomesticByStatus,
  DomesticByVehicle,
  DomesticByDriver,
} from '@/services/endpoints/reports';
import { Truck, Users, DollarSign, Package, TrendingUp } from 'lucide-react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DomesticReportScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DomesticSummary | null>(null);
  const [byStatus, setByStatus] = useState<DomesticByStatus[]>([]);
  const [byVehicle, setByVehicle] = useState<DomesticByVehicle[]>([]);
  const [byDriver, setByDriver] = useState<DomesticByDriver[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Son 30 gün
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [summaryRes, statusRes, vehicleRes, driverRes] = await Promise.all([
        reportsApi.fetchDomesticSummary({ start_date: startDate, end_date: endDate }),
        reportsApi.fetchDomesticByStatus({ start_date: startDate, end_date: endDate }),
        reportsApi.fetchDomesticByVehicle({ start_date: startDate, end_date: endDate, limit: 5 }),
        reportsApi.fetchDomesticByDriver({ start_date: startDate, end_date: endDate, limit: 5 }),
      ]);

      setSummary(summaryRes);
      setByStatus(statusRes);
      setByVehicle(vehicleRes);
      setByDriver(driverRes);
    } catch (error: any) {
      showError('Hata', error.message || 'Yurtiçi raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Yurtiçi Raporlar" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Yurtiçi Raporlar" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <Text style={styles.errorText}>Yurtiçi rapor verisi bulunamadı</Text>
        </View>
      </View>
    );
  }

  // Durum dağılımı pie chart data
  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    completed: '#10B981',
    cancelled: '#EF4444',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Beklemede',
    in_progress: 'Devam Ediyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
  };

  const statusData = Object.entries(summary.status_distribution).map(([status, count]) => ({
    name: statusLabels[status] || status,
    amount: count,
    color: statusColors[status] || '#9CA3AF',
    legendFontColor: Colors.light.text,
    legendFontSize: 12,
  }));

  // Araç performansı bar chart data
  const vehicleChartData = {
    labels: byVehicle.map((item) => item.vehicle_plate.substring(0, 5)),
    datasets: [
      {
        data: byVehicle.map((item) => item.total_revenue / 1000),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Yurtiçi Raporlar"
        subtitle="Son 30 gün"
        showBackButton
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Özet Kartları */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.orderCard]}>
            <View style={styles.summaryIconContainer}>
              <Package size={24} color={Brand.primary} />
            </View>
            <Text style={styles.summaryLabel}>Toplam İş Emri</Text>
            <Text style={styles.summaryValue}>{summary.summary.total_orders}</Text>
          </View>

          <View style={[styles.summaryCard, styles.revenueCard]}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={24} color="#10B981" />
            </View>
            <Text style={styles.summaryLabel}>Toplam Gelir</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.summary.total_revenue)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.kmCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color="#3B82F6" />
            </View>
            <Text style={styles.summaryLabel}>Toplam KM</Text>
            <Text style={styles.summaryValue}>
              {summary.summary.total_km.toLocaleString('tr-TR')} km
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.vehicleCard]}>
            <View style={styles.summaryIconContainer}>
              <Truck size={24} color="#F59E0B" />
            </View>
            <Text style={styles.summaryLabel}>Aktif Araç</Text>
            <Text style={styles.summaryValue}>{summary.summary.active_vehicles}</Text>
          </View>

          <View style={[styles.summaryCard, styles.driverCard]}>
            <View style={styles.summaryIconContainer}>
              <Users size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.summaryLabel}>Aktif Sürücü</Text>
            <Text style={styles.summaryValue}>{summary.summary.active_drivers}</Text>
          </View>
        </View>

        {/* Durum Dağılımı */}
        {statusData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Durum Dağılımı</Text>
            <PieChart
              data={statusData}
              width={SCREEN_WIDTH - 64}
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
              width={SCREEN_WIDTH - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix="B"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(19, 133, 77, ${opacity})`,
                labelColor: (opacity = 1) => Colors.light.textSecondary,
                style: {
                  borderRadius: 16,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            <View style={styles.vehicleList}>
              {byVehicle.map((vehicle, index) => (
                <View key={index} style={styles.vehicleItem}>
                  <View style={styles.vehicleItemLeft}>
                    <Text style={styles.vehicleRank}>{index + 1}</Text>
                    <View>
                      <Text style={styles.vehiclePlate}>{vehicle.vehicle_plate}</Text>
                      <Text style={styles.vehicleStats}>
                        {vehicle.order_count} iş emri • {vehicle.total_km.toLocaleString('tr-TR')} km
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.vehicleRevenue}>{formatCurrency(vehicle.total_revenue)}</Text>
                    <Text style={styles.vehicleAvg}>
                      Ort: {formatCurrency(vehicle.avg_revenue_per_order)}
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
                <View key={index} style={styles.driverItem}>
                  <View style={styles.driverItemLeft}>
                    <Text style={styles.driverRank}>{index + 1}</Text>
                    <View>
                      <Text style={styles.driverName}>{driver.driver_name}</Text>
                      <Text style={styles.driverStats}>
                        {driver.order_count} iş emri • {driver.total_km.toLocaleString('tr-TR')} km
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.driverRevenue}>{formatCurrency(driver.total_revenue)}</Text>
                    <Text style={styles.driverAvg}>
                      Ort: {formatCurrency(driver.avg_revenue_per_order)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bilgilendirme */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Bilgilendirme</Text>
          <Text style={styles.infoText}>
            Yurtiçi raporlar son 30 günlük iş emirleri üzerinden hesaplanmaktadır. Araç ve sürücü
            performans verileri gelir bazlı sıralanmıştır.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodyMD,
    color: Colors.light.textSecondary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  orderCard: {
    borderLeftWidth: 4,
    borderLeftColor: Brand.primary,
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  kmCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  vehicleCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  driverCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Brand.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    ...Typography.headingMD,
    color: Colors.light.text,
  },
  chartCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  chartTitle: {
    ...Typography.headingMD,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  statusList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statusItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    ...Typography.bodySM,
    color: Colors.light.text,
  },
  statusValue: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
  },
  vehicleList: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  vehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: `${Brand.primary}05`,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  vehicleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  vehicleRank: {
    ...Typography.headingMD,
    color: Brand.primary,
    width: 30,
  },
  vehiclePlate: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
  },
  vehicleStats: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  vehicleRevenue: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'right',
  },
  vehicleAvg: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  driverList: {
    gap: Spacing.md,
  },
  driverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: `${Brand.primary}05`,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  driverItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  driverRank: {
    ...Typography.headingMD,
    color: '#8B5CF6',
    width: 30,
  },
  driverName: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
  },
  driverStats: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  driverRevenue: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'right',
  },
  driverAvg: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  infoCard: {
    padding: Spacing.lg,
    backgroundColor: `${Brand.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Brand.primary,
  },
  infoTitle: {
    ...Typography.headingSM,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.bodySM,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});
