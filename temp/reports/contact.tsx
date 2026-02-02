/**
 * Cari Raporları
 * Alacak, borç ve yaşlandırma raporları
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FullScreenHeader } from '@/components/header';
import { Brand, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { showError } from '@/utils/toast';
import { reportsApi } from '@/services';
import type {
  ContactDashboardSummary,
  CurrencyPositionItem,
  ContactAgingReport,
} from '@/services/endpoints/reports';
import { Users, TrendingUp, TrendingDown, AlertCircle, DollarSign } from 'lucide-react-native';
import { BarChart } from 'react-native-chart-kit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ContactReportScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ContactDashboardSummary | null>(null);
  const [currencyPosition, setCurrencyPosition] = useState<CurrencyPositionItem[]>([]);
  const [aging, setAging] = useState<ContactAgingReport | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [summaryRes, currencyRes, agingRes] = await Promise.all([
        reportsApi.fetchContactDashboardSummary(),
        reportsApi.fetchCurrencyPosition(),
        reportsApi.fetchContactAging({ type: 'all' }),
      ]);

      setSummary(summaryRes);
      setCurrencyPosition(currencyRes.positions);
      setAging(agingRes);
    } catch (error: any) {
      showError('Hata', error.message || 'Cari raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const formatCurrency = (value: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Cari Raporları" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="Cari Raporları" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <Text style={styles.errorText}>Cari rapor verisi bulunamadı</Text>
        </View>
      </View>
    );
  }

  // Yaşlandırma grafiği için veri - sadece veri varsa oluştur
  const agingChartData = aging?.summary && Array.isArray(aging.summary) ? {
    labels: aging.summary.map((bucket) => bucket.range.replace(' gün', '')),
    datasets: [
      {
        data: aging.summary.map((bucket) => bucket.amount / 1000),
      },
    ],
  } : {
    labels: [],
    datasets: [{ data: [] }],
  };

  return (
    <View style={styles.container}>
      <FullScreenHeader title="Cari Raporları" subtitle="Alacak ve borç analizi" showBackButton />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Özet Kartları */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.receivableCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color="#10B981" />
            </View>
            <Text style={styles.summaryLabel}>Toplam Alacak</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.total_receivables)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.payableCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingDown size={24} color="#EF4444" />
            </View>
            <Text style={styles.summaryLabel}>Toplam Borç</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.total_payables)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.netCard]}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={24} color={Brand.primary} />
            </View>
            <Text style={styles.summaryLabel}>Net Pozisyon</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    summary.net_position > 0
                      ? '#10B981'
                      : summary.net_position < 0
                        ? '#EF4444'
                        : Colors.light.text,
                },
              ]}
            >
              {formatCurrency(summary.net_position)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.overdueCard]}>
            <View style={styles.summaryIconContainer}>
              <AlertCircle size={24} color="#F59E0B" />
            </View>
            <Text style={styles.summaryLabel}>Vadesi Geçmiş</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
              {formatCurrency(summary.overdue_receivables)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.contactCard]}>
            <View style={styles.summaryIconContainer}>
              <Users size={24} color="#3B82F6" />
            </View>
            <Text style={styles.summaryLabel}>Toplam Cari</Text>
            <Text style={styles.summaryValue}>{summary.contact_count}</Text>
          </View>
        </View>

        {/* Döviz Pozisyonu */}
        {currencyPosition.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Döviz Pozisyonu</Text>
            {currencyPosition.map((item, index) => (
              <View key={index} style={styles.currencyRow}>
                <View style={styles.currencyLeft}>
                  <Text style={styles.currencyCode}>{item.currency}</Text>
                  <View style={styles.currencyBars}>
                    <View style={styles.currencyBarRow}>
                      <Text style={styles.currencyLabel}>Alacak</Text>
                      <View style={styles.currencyBar}>
                        <View
                          style={[
                            styles.currencyBarFill,
                            {
                              width: `${
                                (item.receivables /
                                  Math.max(item.receivables, item.payables)) *
                                100
                              }%`,
                              backgroundColor: '#10B981',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.currencyAmount}>
                        {formatCurrency(item.receivables, item.currency)}
                      </Text>
                    </View>
                    <View style={styles.currencyBarRow}>
                      <Text style={styles.currencyLabel}>Borç</Text>
                      <View style={styles.currencyBar}>
                        <View
                          style={[
                            styles.currencyBarFill,
                            {
                              width: `${
                                (item.payables / Math.max(item.receivables, item.payables)) * 100
                              }%`,
                              backgroundColor: '#EF4444',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.currencyAmount}>
                        {formatCurrency(item.payables, item.currency)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  style={[
                    styles.netBadge,
                    {
                      backgroundColor:
                        item.net_position > 0
                          ? '#10B98110'
                          : item.net_position < 0
                            ? '#EF444410'
                            : Colors.light.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.netAmount,
                      {
                        color:
                          item.net_position > 0
                            ? '#10B981'
                            : item.net_position < 0
                              ? '#EF4444'
                              : Colors.light.textSecondary,
                      },
                    ]}
                  >
                    {formatCurrency(item.net_position, item.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Yaşlandırma Analizi */}
        {aging && aging.summary.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Alacak Yaşlandırma</Text>
            <BarChart
              data={agingChartData}
              width={SCREEN_WIDTH - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix="B"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                labelColor: (opacity = 1) => Colors.light.textSecondary,
                style: {
                  borderRadius: 16,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
            <View style={styles.agingLegend}>
              {aging?.summary.map((bucket, index) => (
                <View key={index} style={styles.agingLegendItem}>
                  <Text style={styles.agingRange}>{bucket.range}</Text>
                  <Text style={styles.agingAmount}>{formatCurrency(bucket.amount)}</Text>
                  <Text style={styles.agingPercent}>{bucket.percentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bilgilendirme */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Bilgilendirme</Text>
          <Text style={styles.infoText}>
            Cari raporlar tüm aktif cari hesaplar üzerinden gerçek zamanlı olarak hesaplanmaktadır.
            Vadesi geçmiş alacaklar için cari takip süreçlerini başlatmanız önerilir.
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
  receivableCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  payableCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  netCard: {
    borderLeftWidth: 4,
    borderLeftColor: Brand.primary,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  contactCard: {
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
  currencyRow: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  currencyLeft: {
    flex: 1,
  },
  currencyCode: {
    ...Typography.headingSM,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  currencyBars: {
    gap: Spacing.sm,
  },
  currencyBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencyLabel: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    width: 50,
  },
  currencyBar: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  currencyBarFill: {
    height: '100%',
  },
  currencyAmount: {
    ...Typography.bodyXS,
    color: Colors.light.text,
    width: 80,
    textAlign: 'right',
  },
  netBadge: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  netAmount: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  agingLegend: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  agingLegendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  agingRange: {
    ...Typography.bodySM,
    color: Colors.light.text,
    flex: 1,
  },
  agingAmount: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'right',
  },
  agingPercent: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    width: 50,
    textAlign: 'right',
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
