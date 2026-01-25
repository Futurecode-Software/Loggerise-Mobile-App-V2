/**
 * PricingCard Component
 *
 * Displays quote pricing information including subtotal, discounts, VAT, and total.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DollarSign } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { InfoRow } from './info-row';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
import { Quote, formatAmount } from '@/services/endpoints/quotes';

interface PricingCardProps {
  quote: Quote;
  colors?: typeof Colors.light;
}

export function PricingCard({ quote, colors = Colors.light }: PricingCardProps) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <DollarSign size={20} color={Brand.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fiyatlandırma</Text>
      </View>

      <View style={styles.pricingRow}>
        <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Ara Toplam:</Text>
        <Text style={[styles.pricingValue, { color: colors.text }]}>
          {formatAmount(quote.subtotal, quote.currency)}
        </Text>
      </View>

      {quote.discount_amount && parseFloat(String(quote.discount_amount)) > 0 ? (
        <View style={styles.pricingRow}>
          <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>İndirim:</Text>
          <Text style={[styles.pricingValue, { color: colors.danger }]}>
            {`-${formatAmount(quote.discount_amount, quote.currency)}`}
          </Text>
        </View>
      ) : null}

      <View style={styles.pricingRow}>
        <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>KDV:</Text>
        <Text style={[styles.pricingValue, { color: colors.text }]}>
          {formatAmount(quote.vat_amount, quote.currency)}
        </Text>
      </View>

      <View style={[styles.pricingRow, styles.grandTotalRow]}>
        <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Genel Toplam:</Text>
        <Text style={[styles.grandTotalValue, { color: Brand.primary }]}>
          {formatAmount(quote.total_amount, quote.currency)}
        </Text>
      </View>

      <InfoRow label="Para Birimi" value={quote.currency} colors={colors} />
      <InfoRow label="Kur" value={quote.exchange_rate} colors={colors} />
      {quote.include_vat !== undefined ? (
        <InfoRow label="KDV Dahil" value={quote.include_vat} colors={colors} />
      ) : null}
      {quote.vat_rate !== undefined ? (
        <InfoRow label="KDV Oranı" value={`%${quote.vat_rate}`} colors={colors} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  pricingLabel: {
    ...Typography.bodyMD,
  },
  pricingValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  grandTotalLabel: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
  grandTotalValue: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
});
