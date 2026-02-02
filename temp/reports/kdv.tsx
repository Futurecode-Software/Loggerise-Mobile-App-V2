/**
 * KDV Raporu
 * KDV beyanı ve hesaplamaları
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FullScreenHeader } from '@/components/header';
import { Brand, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { showError } from '@/utils/toast';
import { reportsApi } from '@/services';
import type { KdvSummary } from '@/services/endpoints/reports';
import { Download, FileText, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function KdvReportScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KdvSummary | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Bu ayın başı ve sonu
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await reportsApi.fetchKdvSummary({
        start_date: startDate,
        end_date: endDate,
      });

      setData(response);
    } catch (error: any) {
      showError('Hata', error.message || 'KDV raporu yüklenemedi');
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

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const blob = await reportsApi.downloadKdvPdf({ start_date: startDate, end_date: endDate });

      const fileName = `kdv_raporu_${new Date().getTime()}.pdf`;
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="KDV Raporu" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <FullScreenHeader title="KDV Raporu" showBackButton />
        <View style={[styles.content, styles.centerContent]}>
          <Text style={styles.errorText}>KDV raporu verisi bulunamadı</Text>
        </View>
      </View>
    );
  }

  const vatRates = ['20', '10', '1', '0', 'exempt'];
  const vatRateLabels: Record<string, string> = {
    '20': 'KDV %20',
    '10': 'KDV %10',
    '1': 'KDV %1',
    '0': 'KDV %0',
    'exempt': 'Muaf',
  };

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="KDV Raporu"
        subtitle={`${data.period.start_date} - ${data.period.end_date}`}
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
          <View style={[styles.summaryCard, styles.calculatedCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={24} color="#10B981" />
            </View>
            <Text style={styles.summaryLabel}>Hesaplanan KDV</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(data.summary.total_calculated_vat)}
            </Text>
            <Text style={styles.summarySubtext}>
              {data.sales.invoice_count} Satış Faturası
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.deductibleCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingDown size={24} color="#3B82F6" />
            </View>
            <Text style={styles.summaryLabel}>İndirilecek KDV</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(data.summary.total_deductible_vat)}
            </Text>
            <Text style={styles.summarySubtext}>
              {data.purchases.invoice_count} Alış Faturası
            </Text>
          </View>

          {data.summary.payable_vat > 0 ? (
            <View style={[styles.summaryCard, styles.payableCard]}>
              <View style={styles.summaryIconContainer}>
                <AlertCircle size={24} color="#EF4444" />
              </View>
              <Text style={styles.summaryLabel}>Ödenecek KDV</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                {formatCurrency(data.summary.payable_vat)}
              </Text>
            </View>
          ) : (
            <View style={[styles.summaryCard, styles.carriedCard]}>
              <View style={styles.summaryIconContainer}>
                <FileText size={24} color={Brand.primary} />
              </View>
              <Text style={styles.summaryLabel}>Devreden KDV</Text>
              <Text style={[styles.summaryValue, { color: Brand.primary }]}>
                {formatCurrency(data.summary.carried_forward_vat)}
              </Text>
            </View>
          )}
        </View>

        {/* Satış Faturaları - KDV Oranlarına Göre */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Satış Faturaları KDV Dağılımı</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Oran</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>
                Matrah
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>
                KDV
              </Text>
            </View>
            {vatRates.map((rate) => {
              const rateData = data.sales.vat_rates[rate];
              if (!rateData || rateData.vat === 0) return null;

              return (
                <View key={rate} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{vatRateLabels[rate]}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                    {formatCurrency(rateData.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 1.5, textAlign: 'right', fontWeight: '600' },
                    ]}
                  >
                    {formatCurrency(rateData.vat)}
                  </Text>
                </View>
              );
            })}
            <View style={[styles.tableRow, styles.tableTotalRow]}>
              <Text style={[styles.tableTotalCell, { flex: 1 }]}>Toplam</Text>
              <Text style={[styles.tableTotalCell, { flex: 1.5, textAlign: 'right' }]}>
                {formatCurrency(data.sales.total_amount)}
              </Text>
              <Text
                style={[
                  styles.tableTotalCell,
                  { flex: 1.5, textAlign: 'right', color: '#10B981' },
                ]}
              >
                {formatCurrency(data.sales.total_vat)}
              </Text>
            </View>
          </View>
        </View>

        {/* Alış Faturaları - KDV Oranlarına Göre */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Alış Faturaları KDV Dağılımı</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Oran</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>
                Matrah
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>
                KDV
              </Text>
            </View>
            {vatRates.map((rate) => {
              const rateData = data.purchases.vat_rates[rate];
              if (!rateData || rateData.vat === 0) return null;

              return (
                <View key={rate} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{vatRateLabels[rate]}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                    {formatCurrency(rateData.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 1.5, textAlign: 'right', fontWeight: '600' },
                    ]}
                  >
                    {formatCurrency(rateData.vat)}
                  </Text>
                </View>
              );
            })}
            <View style={[styles.tableRow, styles.tableTotalRow]}>
              <Text style={[styles.tableTotalCell, { flex: 1 }]}>Toplam</Text>
              <Text style={[styles.tableTotalCell, { flex: 1.5, textAlign: 'right' }]}>
                {formatCurrency(data.purchases.total_amount)}
              </Text>
              <Text
                style={[
                  styles.tableTotalCell,
                  { flex: 1.5, textAlign: 'right', color: '#3B82F6' },
                ]}
              >
                {formatCurrency(data.purchases.total_vat)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bilgilendirme */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Bilgilendirme</Text>
          <Text style={styles.infoText}>
            Bu rapor iptal edilmemiş faturalar üzerinden hazırlanmıştır. KDV beyanı öncesi
            muhasebeciye danışmanız önerilir.
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
  calculatedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  deductibleCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  payableCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  carriedCard: {
    borderLeftWidth: 4,
    borderLeftColor: Brand.primary,
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
  summarySubtext: {
    ...Typography.bodyXS,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  tableCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  tableTitle: {
    ...Typography.headingMD,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  table: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: `${Brand.primary}10`,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableHeaderText: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tableRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tableTotalRow: {
    backgroundColor: `${Brand.primary}05`,
    borderBottomWidth: 0,
  },
  tableCell: {
    ...Typography.bodySM,
    color: Colors.light.text,
  },
  tableTotalCell: {
    ...Typography.bodySM,
    fontWeight: '600',
    color: Colors.light.text,
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
