/**
 * Kar/Zarar Analizi Raporu
 * Gelir, gider ve karlılık analizleri
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FullScreenHeader } from '@/components/header';
import { Brand, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { showError } from '@/utils/toast';
import { reportsApi } from '@/services';
import type { ProfitLossSummary, ProfitLossTrend, ExpenseBreakdownItem } from '@/services/endpoints/reports';
import { TrendingUp, TrendingDown, DollarSign, Package, Download } from 'lucide-react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

export default function ProfitLossReportScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProfitLossSummary | null>(null);
  const [trends, setTrends] = useState<ProfitLossTrend[]>([]);
  const [expenses, setExpenses] = useState<ExpenseBreakdownItem[]>([]);
  const [downloading, setDownloading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [summaryRes, trendsRes, expensesRes] = await Promise.all([
        reportsApi.fetchProfitLossSummary({ start_date: startDate, end_date: endDate }),
        reportsApi.fetchProfitLossTrend({ start_date: startDate, end_date: endDate, interval: 'weekly' }),
        reportsApi.fetchExpenseBreakdown({ start_date: startDate, end_date: endDate }),
      ]);

      setSummary(summaryRes.summary);
      setTrends(trendsRes);
      setExpenses(expensesRes);
    } catch (error: any) {
      showError('Hata', error.message || 'Rapor yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const blob = await reportsApi.downloadProfitLossPdf({ start_date: startDate, end_date: endDate });

      const fileName = `kar_zarar_${new Date().getTime()}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const reader = new FileReader();
      reader.readAsDataURL(blob as any);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      };
    } catch (error: any) {
      showError('Hata', 'PDF indirilemedi');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `%${value.toFixed(1)}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Kar/Zarar Analizi" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Kar/Zarar Analizi" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <Text style={styles.errorText}>Rapor verisi bulunamadı</Text>
        </View>
      </View>
    );
  }

  // Line chart data
  const lineChartData = {
    labels: trends.map((t, i) => `H${i + 1}`),
    datasets: [
      {
        data: trends.map((t) => t.revenue / 1000),
        color: (opacity = 1) => Brand.primary,
        strokeWidth: 3,
      },
      {
        data: trends.map((t) => t.profit / 1000),
        color: (opacity = 1) => '#10B981',
        strokeWidth: 3,
      },
    ],
    legend: ['Gelir (bin ₺)', 'Kar (bin ₺)'],
  };

  // Pie chart data
  const expenseColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
  const pieChartData = expenses.map((item, index) => ({
    name: item.label,
    amount: item.value,
    color: expenseColors[index % expenseColors.length],
    legendFontColor: Colors.light.text,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Kar/Zarar Analizi"
        subtitle="Son 30 gün"
        showBackButton
        rightIcons={
          <TouchableOpacity onPress={handleDownloadPdf} disabled={downloading} activeOpacity={0.7}>
            {downloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Download size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Özet Kartları */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.revenueCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color="#10B981" />
            </View>
            <Text style={styles.summaryLabel}>Toplam Gelir</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.total_revenue)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.costCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingDown size={24} color="#EF4444" />
            </View>
            <Text style={styles.summaryLabel}>Toplam Gider</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.total_costs)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.profitCard]}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={24} color={Brand.primary} />
            </View>
            <Text style={styles.summaryLabel}>Net Kar</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.gross_profit)}</Text>
            <Text style={styles.profitMargin}>{formatPercent(summary.profit_margin)} Kar Marjı</Text>
          </View>

          <View style={[styles.summaryCard, styles.loadCard]}>
            <View style={styles.summaryIconContainer}>
              <Package size={24} color="#3B82F6" />
            </View>
            <Text style={styles.summaryLabel}>Yük Sayısı</Text>
            <Text style={styles.summaryValue}>{summary.load_count}</Text>
          </View>
        </View>

        {/* Trend Grafiği */}
        {trends.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Haftalık Trend</Text>
            <LineChart
              data={lineChartData}
              width={CHART_WIDTH - 32}
              height={220}
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
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#ffffff',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        )}

        {/* Gider Dağılımı */}
        {pieChartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Gider Dağılımı</Text>
            <PieChart
              data={pieChartData}
              width={CHART_WIDTH - 32}
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

        {/* Detay İstatistikler */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Detaylı İstatistikler</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Toplam KM</Text>
            <Text style={styles.statValue}>{summary.total_km.toLocaleString('tr-TR')} km</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>KM Başına Gelir</Text>
            <Text style={styles.statValue}>{formatCurrency(summary.revenue_per_km)}/km</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>KM Başına Maliyet</Text>
            <Text style={styles.statValue}>{formatCurrency(summary.cost_per_km)}/km</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Yakıt Gideri</Text>
            <Text style={styles.statValue}>{formatCurrency(summary.total_fuel)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avans</Text>
            <Text style={styles.statValue}>{formatCurrency(summary.total_advance)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Diğer Masraflar</Text>
            <Text style={styles.statValue}>{formatCurrency(summary.total_expense)}</Text>
          </View>
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
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  costCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: Brand.primary,
  },
  loadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
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
    ...Typography.headingLG,
    color: Colors.light.text,
  },
  profitMargin: {
    ...Typography.bodyXS,
    color: Brand.primary,
    marginTop: 4,
    fontWeight: '600',
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
  statsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statsTitle: {
    ...Typography.headingMD,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statLabel: {
    ...Typography.bodySM,
    color: Colors.light.textSecondary,
  },
  statValue: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
