/**
 * Cari Raporları
 * Alacak, borç ve yaşlandırma raporları
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
import { useFocusEffect , router } from 'expo-router'

import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { BarChart } from 'react-native-chart-kit'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { showError } from '@/utils/toast'
import { formatCurrency } from '@/utils/currency'
import { reportsApi } from '@/services'
import type {
  ContactDashboardSummary,
  CurrencyPositionItem,
  ContactAgingReport
} from '@/services/endpoints/reports'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface SummaryCardProps {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  label: string
  value: string
  valueColor?: string
  borderColor: string
}

function SummaryCard({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  borderColor
}: SummaryCardProps): React.ReactElement {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: borderColor }]}>
      <View style={styles.summaryIconContainer}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  )
}

interface CurrencyRowProps {
  item: CurrencyPositionItem
}

function CurrencyRow({ item }: CurrencyRowProps): React.ReactElement {
  const maxValue = Math.max(item.receivables, item.payables) || 1
  const receivablePercent = (item.receivables / maxValue) * 100
  const payablePercent = (item.payables / maxValue) * 100

  function getNetPositionColor(): string {
    if (item.net_position > 0) return DashboardColors.success
    if (item.net_position < 0) return DashboardColors.danger
    return DashboardColors.textSecondary
  }

  function getNetBadgeBgColor(): string {
    if (item.net_position > 0) return DashboardColors.successBg
    if (item.net_position < 0) return DashboardColors.dangerBg
    return DashboardColors.border
  }

  return (
    <View style={styles.currencyRow}>
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
                    width: `${receivablePercent}%`,
                    backgroundColor: DashboardColors.success
                  }
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
                    width: `${payablePercent}%`,
                    backgroundColor: DashboardColors.danger
                  }
                ]}
              />
            </View>
            <Text style={styles.currencyAmount}>
              {formatCurrency(item.payables, item.currency)}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.netBadge, { backgroundColor: getNetBadgeBgColor() }]}>
        <Text style={[styles.netAmount, { color: getNetPositionColor() }]}>
          {formatCurrency(item.net_position, item.currency)}
        </Text>
      </View>
    </View>
  )
}

interface AgingLegendItemProps {
  range: string
  amount: number
  percentage: number
}

function AgingLegendItem({ range, amount, percentage }: AgingLegendItemProps): React.ReactElement {
  return (
    <View style={styles.agingLegendItem}>
      <Text style={styles.agingRange}>{range}</Text>
      <Text style={styles.agingAmount}>{formatCurrency(amount, 'TRY')}</Text>
      <Text style={styles.agingPercent}>{percentage.toFixed(1)}%</Text>
    </View>
  )
}

function LoadingSkeleton(): React.ReactElement {
  return (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={DashboardColors.primary} />
      <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
    </View>
  )
}

function EmptyState(): React.ReactElement {
  return (
    <View style={styles.centerContent}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="analytics-outline" size={48} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Veri Bulunamadı</Text>
      <Text style={styles.emptyText}>Cari rapor verisi bulunamadı</Text>
    </View>
  )
}

export default function ContactReportScreen(): React.ReactElement {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<ContactDashboardSummary | null>(null)
  const [currencyPosition, setCurrencyPosition] = useState<CurrencyPositionItem[]>([])
  const [aging, setAging] = useState<ContactAgingReport | null>(null)

  const isMountedRef = useRef(true)

  const fetchData = useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setLoading(true)
    }

    try {
      const [summaryRes, currencyRes, agingRes] = await Promise.all([
        reportsApi.fetchContactDashboardSummary(),
        reportsApi.fetchCurrencyPosition(),
        reportsApi.fetchContactAging({ type: 'all' })
      ])

      if (!isMountedRef.current) return

      setSummary(summaryRes)
      setCurrencyPosition(currencyRes.positions)
      setAging(agingRes)
    } catch (error: unknown) {
      if (!isMountedRef.current) return
      const message = error instanceof Error ? error.message : 'Cari raporlar yüklenemedi'
      showError('Hata', message)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true
      fetchData(false)

      return () => {
        isMountedRef.current = false
      }
    }, [fetchData])
  )

  function handleBackPress(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  function handleRefresh(): void {
    setRefreshing(true)
    fetchData(false)
  }

  function getNetPositionColor(): string {
    if (!summary) return DashboardColors.text
    if (summary.net_position > 0) return DashboardColors.success
    if (summary.net_position < 0) return DashboardColors.danger
    return DashboardColors.text
  }

  const agingChartData = aging?.summary && Array.isArray(aging.summary)
    ? {
        labels: aging.summary.map((bucket) => bucket.range.replace(' gün', '')),
        datasets: [
          {
            data: aging.summary.map((bucket) => bucket.amount / 1000)
          }
        ]
      }
    : {
        labels: [],
        datasets: [{ data: [] }]
      }

  const hasAgingData = aging?.summary && aging.summary.length > 0

  return (
    <View style={styles.container}>
      <PageHeader
        title="Cari Raporları"
        icon="people-outline"
        subtitle="Alacak ve borç analizi"
        showBackButton
        onBackPress={handleBackPress}
      />

      <View style={styles.content}>
        {loading ? (
          <LoadingSkeleton />
        ) : !summary ? (
          <EmptyState />
        ) : (
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
            {/* Özet Kartları */}
            <View style={styles.summaryGrid}>
              <SummaryCard
                icon="trending-up-outline"
                iconColor={DashboardColors.success}
                label="Toplam Alacak"
                value={formatCurrency(summary.total_receivables, 'TRY')}
                borderColor={DashboardColors.success}
              />

              <SummaryCard
                icon="trending-down-outline"
                iconColor={DashboardColors.danger}
                label="Toplam Borç"
                value={formatCurrency(summary.total_payables, 'TRY')}
                borderColor={DashboardColors.danger}
              />

              <SummaryCard
                icon="cash-outline"
                iconColor={DashboardColors.primary}
                label="Net Pozisyon"
                value={formatCurrency(summary.net_position, 'TRY')}
                valueColor={getNetPositionColor()}
                borderColor={DashboardColors.primary}
              />

              <SummaryCard
                icon="alert-circle-outline"
                iconColor={DashboardColors.warning}
                label="Vadesi Geçmiş"
                value={formatCurrency(summary.overdue_receivables, 'TRY')}
                valueColor={DashboardColors.warning}
                borderColor={DashboardColors.warning}
              />

              <SummaryCard
                icon="people-outline"
                iconColor={DashboardColors.info}
                label="Toplam Cari"
                value={String(summary.contact_count)}
                borderColor={DashboardColors.info}
              />
            </View>

            {/* Döviz Pozisyonu */}
            {currencyPosition.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Döviz Pozisyonu</Text>
                {currencyPosition.map((item, index) => (
                  <CurrencyRow key={index} item={item} />
                ))}
              </View>
            )}

            {/* Yaşlandırma Analizi */}
            {hasAgingData && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Alacak Yaşlandırma</Text>
                <BarChart
                  data={agingChartData}
                  width={SCREEN_WIDTH - 64}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix="B"
                  chartConfig={{
                    backgroundColor: DashboardColors.surface,
                    backgroundGradientFrom: DashboardColors.surface,
                    backgroundGradientTo: DashboardColors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: () => DashboardColors.textSecondary,
                    style: {
                      borderRadius: DashboardBorderRadius.lg
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: ''
                    }
                  }}
                  style={{
                    marginVertical: DashboardSpacing.sm,
                    borderRadius: DashboardBorderRadius.lg
                  }}
                />
                <View style={styles.agingLegend}>
                  {aging?.summary.map((bucket, index) => (
                    <AgingLegendItem
                      key={index}
                      range={bucket.range}
                      amount={bucket.amount}
                      percentage={bucket.percentage}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Bilgilendirme */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color={DashboardColors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Bilgilendirme</Text>
                <Text style={styles.infoText}>
                  Cari raporlar tüm aktif cari hesaplar üzerinden gerçek zamanlı olarak hesaplanmaktadır.
                  Vadesi geçmiş alacaklar için cari takip süreçlerini başlatmanız önerilir.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
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
    paddingHorizontal: DashboardSpacing.xl
  },
  loadingText: {
    marginTop: DashboardSpacing.md,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },

  // Empty State
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  },

  // Summary Grid
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
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.lg,
    borderLeftWidth: 4,
    ...DashboardShadows.sm
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.primaryGlow,
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

  // Chart Card
  chartCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
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

  // Currency Row
  currencyRow: {
    marginBottom: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.border
  },
  currencyLeft: {
    flex: 1
  },
  currencyCode: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  currencyBars: {
    gap: DashboardSpacing.sm
  },
  currencyBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  currencyLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    width: 50
  },
  currencyBar: {
    flex: 1,
    height: 20,
    backgroundColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.xs,
    overflow: 'hidden'
  },
  currencyBarFill: {
    height: '100%'
  },
  currencyAmount: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textPrimary,
    width: 80,
    textAlign: 'right'
  },
  netBadge: {
    marginTop: DashboardSpacing.sm,
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.sm,
    alignItems: 'center'
  },
  netAmount: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },

  // Aging Legend
  agingLegend: {
    marginTop: DashboardSpacing.md,
    gap: DashboardSpacing.xs
  },
  agingLegendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.border
  },
  agingRange: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textPrimary,
    flex: 1
  },
  agingAmount: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1,
    textAlign: 'right'
  },
  agingPercent: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    width: 50,
    textAlign: 'right'
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    padding: DashboardSpacing.lg,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.primary,
    gap: DashboardSpacing.md
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  }
})
