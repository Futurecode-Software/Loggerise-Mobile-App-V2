/**
 * KDV Raporu
 * KDV beyanı ve hesaplamaları
 */

import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import Toast from 'react-native-toast-message'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import PageHeader from '@/components/navigation/PageHeader'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
} from '@/constants/dashboard-theme'
import { formatCurrency } from '@/utils/currency'
import { reportsApi } from '@/services'
import type { KdvSummary } from '@/services/endpoints/reports'

export default function KdvReportScreen(): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<KdvSummary | null>(null)
  const [downloading, setDownloading] = useState(false)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setLoading(true)
    }

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    const response = await reportsApi.fetchKdvSummary({
      start_date: startDate,
      end_date: endDate,
    })

    if (!isMountedRef.current) return

    if (response) {
      setData(response)
    } else {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'KDV raporu yüklenemedi',
        position: 'top',
        visibilityTime: 1500,
      })
    }

    setLoading(false)
    setRefreshing(false)
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

  async function handleDownloadPdf(): Promise<void> {
    setDownloading(true)

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]

    const blob = await reportsApi.downloadKdvPdf({
      start_date: startDate,
      end_date: endDate,
    })

    if (!blob) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'PDF indirilemedi',
        position: 'top',
        visibilityTime: 1500,
      })
      setDownloading(false)
      return
    }

    const fileName = `kdv_raporu_${new Date().getTime()}.pdf`
    const fileUri = FileSystem.documentDirectory + fileName

    const reader = new FileReader()
    reader.readAsDataURL(blob as Blob)
    reader.onloadend = async () => {
      const base64data = (reader.result as string).split(',')[1]
      await FileSystem.writeAsStringAsync(fileUri, base64data, {
        encoding: FileSystem.EncodingType.Base64,
      })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri)
      }

      setDownloading(false)
    }
    reader.onerror = () => {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'PDF işlenemedi',
        position: 'top',
        visibilityTime: 1500,
      })
      setDownloading(false)
    }
  }

  const vatRates = ['20', '10', '1', '0', 'exempt']
  const vatRateLabels: Record<string, string> = {
    '20': 'KDV %20',
    '10': 'KDV %10',
    '1': 'KDV %1',
    '0': 'KDV %0',
    exempt: 'Muaf',
  }

  function renderLoading(): React.JSX.Element {
    return (
      <View style={styles.container}>
        <PageHeader
          title="KDV Raporu"
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

  function renderEmpty(): React.JSX.Element {
    return (
      <View style={styles.container}>
        <PageHeader
          title="KDV Raporu"
          showBackButton
          onBackPress={handleBack}
        />
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={DashboardColors.textMuted}
            />
            <Text style={styles.emptyText}>KDV raporu verisi bulunamadı</Text>
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return renderLoading()
  }

  if (!data) {
    return renderEmpty()
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="KDV Raporu"
        subtitle={`${data.period.start_date} - ${data.period.end_date}`}
        showBackButton
        onBackPress={handleBack}
        rightAction={{
          icon: 'download-outline',
          onPress: handleDownloadPdf,
          isLoading: downloading,
        }}
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
          <View style={[styles.summaryCard, styles.calculatedCard]}>
            <View style={[styles.summaryIconContainer, styles.successIconBg]}>
              <Ionicons
                name="trending-up"
                size={24}
                color={DashboardColors.success}
              />
            </View>
            <Text style={styles.summaryLabel}>Hesaplanan KDV</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(data.summary.total_calculated_vat, 'TRY')}
            </Text>
            <Text style={styles.summarySubtext}>
              {data.sales.invoice_count} Satis Faturasi
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.deductibleCard]}>
            <View style={[styles.summaryIconContainer, styles.infoIconBg]}>
              <Ionicons
                name="trending-down"
                size={24}
                color={DashboardColors.info}
              />
            </View>
            <Text style={styles.summaryLabel}>Indirilecek KDV</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(data.summary.total_deductible_vat, 'TRY')}
            </Text>
            <Text style={styles.summarySubtext}>
              {data.purchases.invoice_count} Alis Faturasi
            </Text>
          </View>

          {data.summary.payable_vat > 0 ? (
            <View style={[styles.summaryCard, styles.payableCard]}>
              <View style={[styles.summaryIconContainer, styles.dangerIconBg]}>
                <Ionicons
                  name="alert-circle"
                  size={24}
                  color={DashboardColors.danger}
                />
              </View>
              <Text style={styles.summaryLabel}>Odenecek KDV</Text>
              <Text style={[styles.summaryValue, styles.dangerText]}>
                {formatCurrency(data.summary.payable_vat, 'TRY')}
              </Text>
            </View>
          ) : (
            <View style={[styles.summaryCard, styles.carriedCard]}>
              <View style={[styles.summaryIconContainer, styles.primaryIconBg]}>
                <Ionicons
                  name="document-text"
                  size={24}
                  color={DashboardColors.primary}
                />
              </View>
              <Text style={styles.summaryLabel}>Devreden KDV</Text>
              <Text style={[styles.summaryValue, styles.primaryText]}>
                {formatCurrency(data.summary.carried_forward_vat, 'TRY')}
              </Text>
            </View>
          )}
        </View>

        {/* Satis Faturalari - KDV Oranlarina Gore */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Satis Faturalari KDV Dagilimi</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.flex1]}>Oran</Text>
              <Text style={[styles.tableHeaderText, styles.flex15, styles.textRight]}>
                Matrah
              </Text>
              <Text style={[styles.tableHeaderText, styles.flex15, styles.textRight]}>
                KDV
              </Text>
            </View>
            {vatRates.map((rate) => {
              const rateData = data.sales.vat_rates[rate]
              if (!rateData || rateData.vat === 0) return null

              return (
                <View key={rate} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.flex1]}>
                    {vatRateLabels[rate]}
                  </Text>
                  <Text style={[styles.tableCell, styles.flex15, styles.textRight]}>
                    {formatCurrency(rateData.amount, 'TRY')}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.flex15,
                      styles.textRight,
                      styles.fontSemibold,
                    ]}
                  >
                    {formatCurrency(rateData.vat, 'TRY')}
                  </Text>
                </View>
              )
            })}
            <View style={[styles.tableRow, styles.tableTotalRow]}>
              <Text style={[styles.tableTotalCell, styles.flex1]}>Toplam</Text>
              <Text style={[styles.tableTotalCell, styles.flex15, styles.textRight]}>
                {formatCurrency(data.sales.total_amount, 'TRY')}
              </Text>
              <Text
                style={[
                  styles.tableTotalCell,
                  styles.flex15,
                  styles.textRight,
                  styles.successText,
                ]}
              >
                {formatCurrency(data.sales.total_vat, 'TRY')}
              </Text>
            </View>
          </View>
        </View>

        {/* Alis Faturalari - KDV Oranlarina Gore */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Alis Faturalari KDV Dagilimi</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.flex1]}>Oran</Text>
              <Text style={[styles.tableHeaderText, styles.flex15, styles.textRight]}>
                Matrah
              </Text>
              <Text style={[styles.tableHeaderText, styles.flex15, styles.textRight]}>
                KDV
              </Text>
            </View>
            {vatRates.map((rate) => {
              const rateData = data.purchases.vat_rates[rate]
              if (!rateData || rateData.vat === 0) return null

              return (
                <View key={rate} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.flex1]}>
                    {vatRateLabels[rate]}
                  </Text>
                  <Text style={[styles.tableCell, styles.flex15, styles.textRight]}>
                    {formatCurrency(rateData.amount, 'TRY')}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.flex15,
                      styles.textRight,
                      styles.fontSemibold,
                    ]}
                  >
                    {formatCurrency(rateData.vat, 'TRY')}
                  </Text>
                </View>
              )
            })}
            <View style={[styles.tableRow, styles.tableTotalRow]}>
              <Text style={[styles.tableTotalCell, styles.flex1]}>Toplam</Text>
              <Text style={[styles.tableTotalCell, styles.flex15, styles.textRight]}>
                {formatCurrency(data.purchases.total_amount, 'TRY')}
              </Text>
              <Text
                style={[
                  styles.tableTotalCell,
                  styles.flex15,
                  styles.textRight,
                  styles.infoColorText,
                ]}
              >
                {formatCurrency(data.purchases.total_vat, 'TRY')}
              </Text>
            </View>
          </View>
        </View>

        {/* Bilgilendirme */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons
              name="information-circle"
              size={20}
              color={DashboardColors.primary}
            />
            <Text style={styles.infoTitle}>Bilgilendirme</Text>
          </View>
          <Text style={styles.infoCardText}>
            Bu rapor iptal edilmemis faturalar uzerinden hazirlanmistir. KDV
            beyani oncesi muhasebeciye danismaniz onerilir.
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
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl'],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: DashboardSpacing.md,
  },
  emptyText: {
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
  calculatedCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.success,
  },
  deductibleCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.info,
  },
  payableCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.danger,
  },
  carriedCard: {
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.primary,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.sm,
  },
  successIconBg: {
    backgroundColor: DashboardColors.successBg,
  },
  infoIconBg: {
    backgroundColor: DashboardColors.infoBg,
  },
  dangerIconBg: {
    backgroundColor: DashboardColors.dangerBg,
  },
  primaryIconBg: {
    backgroundColor: DashboardColors.primaryGlow,
  },
  summaryLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.text,
  },
  summarySubtext: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 4,
  },
  dangerText: {
    color: DashboardColors.danger,
  },
  primaryText: {
    color: DashboardColors.primary,
  },
  successText: {
    color: DashboardColors.success,
  },
  infoColorText: {
    color: DashboardColors.info,
  },
  infoCardText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20,
  },
  tableCard: {
    backgroundColor: DashboardColors.card,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg,
    ...DashboardShadows.sm,
  },
  tableTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.md,
  },
  table: {
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.sm,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DashboardColors.primaryGlow,
    padding: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.border,
  },
  tableHeaderText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text,
  },
  tableRow: {
    flexDirection: 'row',
    padding: DashboardSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.border,
  },
  tableTotalRow: {
    backgroundColor: DashboardColors.primaryGlow,
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.text,
  },
  tableTotalCell: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.text,
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
  flex1: {
    flex: 1,
  },
  flex15: {
    flex: 1.5,
  },
  textRight: {
    textAlign: 'right',
  },
  fontSemibold: {
    fontWeight: '600',
  },
})
