/**
 * PricingItemsCard Component
 *
 * Displays the list of pricing items in a quote.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DollarSign } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';
import { CurrencyType, formatAmount } from '@/services/endpoints/quotes';

interface PricingItem {
  product?: { name: string; code?: string };
  description?: string;
  quantity: string | number;
  unit: string;
  unit_price: number | string;
  currency?: CurrencyType;
  vat_rate?: string | number;
  discount_amount?: string | number;
  total: number | string;
}

interface PricingItemsCardProps {
  items: PricingItem[];
  defaultCurrency: CurrencyType;
  colors?: typeof Colors.light;
}

function PricingItemRow({
  item,
  defaultCurrency,
  colors,
}: {
  item: PricingItem;
  defaultCurrency: CurrencyType;
  colors: typeof Colors.light;
}) {
  const currency = item.currency || defaultCurrency;
  const hasVat = item.vat_rate && parseFloat(String(item.vat_rate)) > 0;
  const hasDiscount = item.discount_amount && parseFloat(String(item.discount_amount)) > 0;

  return (
    <View style={[styles.pricingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.pricingItemHeader}>
        <Text style={[styles.pricingItemTitle, { color: colors.text }]}>
          {item.product?.name || item.description || '-'}
        </Text>
        {item.product?.code ? (
          <Text style={[styles.pricingItemCode, { color: colors.textMuted }]}>
            {`Kod: ${item.product.code}`}
          </Text>
        ) : null}
      </View>

      <View style={styles.pricingItemDetails}>
        <View style={styles.pricingItemRow}>
          <Text style={[styles.pricingItemLabel, { color: colors.textSecondary }]}>Miktar:</Text>
          <Text style={[styles.pricingItemValue, { color: colors.text }]}>
            {`${parseFloat(String(item.quantity)).toLocaleString('tr-TR')} ${item.unit}`}
          </Text>
        </View>

        <View style={styles.pricingItemRow}>
          <Text style={[styles.pricingItemLabel, { color: colors.textSecondary }]}>Birim Fiyat:</Text>
          <Text style={[styles.pricingItemValue, { color: colors.text }]}>
            {formatAmount(item.unit_price, currency)}
          </Text>
        </View>

        {hasVat ? (
          <View style={styles.pricingItemRow}>
            <Text style={[styles.pricingItemLabel, { color: colors.textSecondary }]}>KDV:</Text>
            <Text style={[styles.pricingItemValue, { color: colors.text }]}>
              {`%${parseFloat(String(item.vat_rate)).toFixed(0)}`}
            </Text>
          </View>
        ) : null}

        {hasDiscount ? (
          <View style={styles.pricingItemRow}>
            <Text style={[styles.pricingItemLabel, { color: colors.textSecondary }]}>İndirim:</Text>
            <Text style={[styles.pricingItemValue, { color: colors.danger }]}>
              {`-${formatAmount(parseFloat(String(item.discount_amount)), currency)}`}
            </Text>
          </View>
        ) : null}

        <View style={[styles.pricingItemRow, styles.pricingItemTotal]}>
          <Text style={[styles.pricingItemTotalLabel, { color: colors.text }]}>Toplam:</Text>
          <Text style={[styles.pricingItemTotalValue, { color: Brand.primary }]}>
            {formatAmount(item.total, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function PricingItemsCard({ items, defaultCurrency, colors = Colors.light }: PricingItemsCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <DollarSign size={20} color={Brand.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {`Fiyat Kalemleri (${items.length})`}
        </Text>
      </View>

      {items.map((item, index) => (
        <PricingItemRow key={index} item={item} defaultCurrency={defaultCurrency} colors={colors} />
      ))}
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
  pricingItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  pricingItemHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  pricingItemTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  pricingItemCode: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  pricingItemDetails: {
    gap: Spacing.sm,
  },
  pricingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingItemLabel: {
    ...Typography.bodySM,
  },
  pricingItemValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  pricingItemTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  pricingItemTotalLabel: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  pricingItemTotalValue: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
});
