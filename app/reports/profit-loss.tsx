/**
 * Kar/Zarar Analizi Raporu
 * Gelir, gider ve karlılık analizleri
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import { LineChart, PieChart } from 'react-native-chart-kit'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { formatCurrency, formatNumber } from '@/utils/currency'
import { reportsApi } from '@/services'
import type {
  ProfitLossSummary,
  ProfitLossTrend,
  ExpenseBreakdownItem
} from '@/services/endpoints/reports'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_WIDTH = SCREEN_WIDTH - 40

interface SummaryCardProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  label: string
  value: string
  subtitle?: string
  subtitleColor?: string
  borderColor: string
}

function SummaryCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
  subtitleColor,
  borderColor
}: SummaryCardProps): React.JSX.Element {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: borderColor }]}>
      <View style={[styles.summaryIconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      {subtitle && (
        <Text style={[styles.summarySubtitle, subtitleColor && { color: subtitleColor }]}>
          {subtitle}
        </Text>
      )}
    </View>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps): React.JSX.Element {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {children}
    </View>
  )
}

interface StatRowProps {
  label: string
  value: string
  isLast?: boolean
}

function StatRow({ label, value, isLast = false }: StatRowProps): React.JSX.Element {
  return (
    <View style={[styles.statRow, isLast && styles.statRowLast]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function formatPercent(value: number): string {
  return `%${value.toFixed(1)}`
}

export default function ProfitLossReportScreen(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<ProfitLossSummary | null>(null)
  const [trends, setTrends] = useState<ProfitLossTrend[]>([])
  const [expenses, setExpenses] = useState<ExpenseBreakdownItem[]>([])
  const [downloading, setDownloading] = useState(false)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setLoading(true)
    }

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [summaryRes, trendsRes, expensesRes] = await Promise.all([
      reportsApi.fetchProfitLossSummary({ start_date: startDate, end_date: endDate }),
      reportsApi.fetchProfitLossTrend({ start_date: startDate, end_date: endDate, interval: 'weekly' }),
      reportsApi.fetchExpenseBreakdown({ start_date: startDate, end_date: endDate })
    ]).catch((error: Error) => {
      if (isMountedRef.current) {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: error.message || 'Rapor yuklenemedi',
          position: 'top',
          visibilityTime: 1500
        })
      }
      return [null, [], []] as const
    })

    if (isMountedRef.current) {
      if (summaryRes && 'summary' in summaryRes) {
        setSummary(summaryRes.summary)
      }
      if (Array.isArray(trendsRes)) {
        setTrends(trendsRes)
      }
      if (Array.isArray(expensesRes)) {
        setExpenses(expensesRes)
      }
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

  function handleBackPress(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  async function handleDownloadPdf(): Promise<void> {
    setDownloading(true)

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const blob = await reportsApi
      .downloadProfitLossPdf({ start_date: startDate, end_date: endDate })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: 'PDF indirilemedi',
          position: 'top',
          visibilityTime: 1500
        })
        return null
      })

    if (!blob) {
      setDownloading(false)
      return
    }

    const fileName = `kar_zarar_${new Date().getTime()}.pdf`
    const fileUri = FileSystem.documentDirectory + fileName

    const reader = new FileReader()
    reader.readAsDataURL(blob as Blob)
    reader.onloadend = async () => {
      const base64data = (reader.result as string).split(',')[1]
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64
      })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri)
      }
      setDownloading(false)
    }
    reader.onerror = () => {
      setDownloading(false)
    }
  }

  // Line chart data
  const lineChartData = {
    labels: trends.map((_, i) => `H${i + 1}`),
    datasets: [
      {
        data: trends.length > 0 ? trends.map((t) => t.revenue / 1000) : [0],
        color: () => DashboardColors.primary,
        strokeWidth: 3
      },
      {
        data: trends.length > 0 ? trends.map((t) => t.profit / 1000) : [0],
        color: () => DashboardColors.success,
        strokeWidth: 3
      }
    ],
    legend: ['Gelir (bin TL)', 'Kar (bin TL)']
  }

  // Pie chart data
  const expenseColors = [
    DashboardColors.success,
    DashboardColors.info,
    DashboardColors.warning,
    DashboardColors.danger,
    '#8B5CF6'
  ]

  const pieChartData = expenses.map((item, index) => ({
    name: item.label,
    amount: item.value,
    color: expenseColors[index % expenseColors.length],
    legendFontColor: DashboardColors.textSecondary,
    legendFontSize: 12
  }))

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Kar/Zarar Analizi"
          icon="trending-up-outline"
          showBackButton
          onBackPress={handleBackPress}
        />
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
          </View>
        </View>
      </View>
    )
  }

  if (!summary) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Kar/Zarar Analizi"
          icon="trending-up-outline"
          showBackButton
          onBackPress={handleBackPress}
        />
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={DashboardColors.textMuted}
            />
            <Text style={styles.emptyText}>Rapor verisi bulunamadi</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Kar/Zarar Analizi"
        icon="trending-up-outline"
        subtitle="Son 30 gun"
        showBackButton
        onBackPress={handleBackPress}
        rightAction={{
          icon: 'download-outline',
          onPress: handleDownloadPdf,
          isLoading: downloading
        }}
      />

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
          {/* Ozet Kartlari */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              icon="trending-up-outline"
              iconColor={DashboardColors.success}
              iconBg={DashboardColors.successBg}
              label="Toplam Gelir"
              value={formatCurrency(summary.total_revenue, 'TRY', { decimals: 0 })}
              borderColor={DashboardColors.success}
            />

            <SummaryCard
              icon="trending-down-outline"
              iconColor={DashboardColors.danger}
              iconBg={DashboardColors.dangerBg}
              label="Toplam Gider"
              value={formatCurrency(summary.total_costs, 'TRY', { decimals: 0 })}
              borderColor={DashboardColors.danger}
            />

            <SummaryCard
              icon="wallet-outline"
              iconColor={DashboardColors.primary}
              iconBg={DashboardColors.primaryGlow}
              label="Net Kar"
              value={formatCurrency(summary.gross_profit, 'TRY', { decimals: 0 })}
              subtitle={`${formatPercent(summary.profit_margin)} Kar Marji`}
              subtitleColor={DashboardColors.primary}
              borderColor={DashboardColors.primary}
            />

            <SummaryCard
              icon="cube-outline"
              iconColor={DashboardColors.info}
              iconBg={DashboardColors.infoBg}
              label="Yuk Sayisi"
              value={String(summary.load_count)}
              borderColor={DashboardColors.info}
            />
          </View>

          {/* Trend Grafigi */}
          {trends.length > 0 && (
            <ChartCard title="Haftalik Trend">
              <LineChart
                data={lineChartData}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  backgroundColor: DashboardColors.surface,
                  backgroundGradientFrom: DashboardColors.surface,
                  backgroundGradientTo: DashboardColors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(4, 65, 52, ${opacity})`,
                  labelColor: () => DashboardColors.textSecondary,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: DashboardColors.surface
                  }
                }}
                bezier
                style={styles.chart}
              />
            </ChartCard>
          )}

          {/* Gider Dagilimi */}
          {pieChartData.length > 0 && (
            <ChartCard title="Gider Dagilimi">
              <PieChart
                data={pieChartData}
                width={CHART_WIDTH - 32}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </ChartCard>
          )}

          {/* Detay Istatistikler */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Detayli Istatistikler</Text>

            <StatRow
              label="Toplam KM"
              value={`${formatNumber(summary.total_km, 0)} km`}
            />
            <StatRow
              label="KM Basina Gelir"
              value={`${formatCurrency(summary.revenue_per_km, 'TRY')}/km`}
            />
            <StatRow
              label="KM Basina Maliyet"
              value={`${formatCurrency(summary.cost_per_km, 'TRY')}/km`}
            />
            <StatRow
              label="Yakit Gideri"
              value={formatCurrency(summary.total_fuel, 'TRY')}
            />
            <StatRow
              label="Avans"
              value={formatCurrency(summary.total_advance, 'TRY')}
            />
            <StatRow
              label="Diger Masraflar"
              value={formatCurrency(summary.total_expense, 'TRY')}
              isLast
            />
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing['3xl']
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: DashboardSpacing.md
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },

  // Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.lg
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    borderLeftWidth: 4,
    ...DashboardShadows.sm
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.sm
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginBottom: 4
  },
  summaryValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.textPrimary
  },
  summarySubtitle: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.primary,
    marginTop: 4,
    fontWeight: '600'
  },

  // Chart Card
  chartCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  chartTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.md
  },
  chart: {
    marginVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg
  },

  // Stats Card
  statsCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  statsTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.md
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.border
  },
  statRowLast: {
    borderBottomWidth: 0
  },
  statLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  statValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  }
})
