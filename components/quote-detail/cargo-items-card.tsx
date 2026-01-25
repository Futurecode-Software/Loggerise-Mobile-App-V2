/**
 * CargoItemsCard Component
 *
 * Displays the list of cargo items in a quote.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';
import { CargoItem } from '@/services/endpoints/quotes';

interface CargoItemsCardProps {
  items: CargoItem[];
  colors?: typeof Colors.light;
}

function CargoItemRow({ item, colors }: { item: CargoItem; colors: typeof Colors.light }) {
  const hasGrossWeight = item.gross_weight && parseFloat(String(item.gross_weight)) > 0;
  const hasNetWeight = item.net_weight && parseFloat(String(item.net_weight)) > 0;
  const hasDimensions = item.width || item.height || item.length;

  return (
    <View style={[styles.cargoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cargoItemTitle, { color: colors.text }]}>
        {item.cargo_name || 'İsimsiz Kalem'}
      </Text>
      {item.cargo_name_foreign ? (
        <Text style={[styles.cargoItemSubtitle, { color: colors.textMuted }]}>
          {item.cargo_name_foreign}
        </Text>
      ) : null}

      <View style={styles.cargoItemDetails}>
        {item.package_type ? (
          <View style={styles.cargoItemDetail}>
            <Text style={[styles.cargoDetailLabel, { color: colors.textSecondary }]}>Ambalaj:</Text>
            <Text style={[styles.cargoDetailValue, { color: colors.text }]}>{item.package_type}</Text>
          </View>
        ) : null}

        {item.package_count && item.package_count > 0 ? (
          <View style={styles.cargoItemDetail}>
            <Text style={[styles.cargoDetailLabel, { color: colors.textSecondary }]}>Koli:</Text>
            <Text style={[styles.cargoDetailValue, { color: colors.text }]}>{item.package_count}</Text>
          </View>
        ) : null}

        {item.piece_count && item.piece_count > 0 ? (
          <View style={styles.cargoItemDetail}>
            <Text style={[styles.cargoDetailLabel, { color: colors.textSecondary }]}>Adet:</Text>
            <Text style={[styles.cargoDetailValue, { color: colors.text }]}>{item.piece_count}</Text>
          </View>
        ) : null}

        {hasGrossWeight ? (
          <View style={styles.cargoItemDetail}>
            <Text style={[styles.cargoDetailLabel, { color: colors.textSecondary }]}>Brüt Ağırlık:</Text>
            <Text style={[styles.cargoDetailValue, { color: colors.text }]}>
              {`${parseFloat(String(item.gross_weight)).toLocaleString('tr-TR')} kg`}
            </Text>
          </View>
        ) : null}

        {hasNetWeight ? (
          <View style={styles.cargoItemDetail}>
            <Text style={[styles.cargoDetailLabel, { color: colors.textSecondary }]}>Net Ağırlık:</Text>
            <Text style={[styles.cargoDetailValue, { color: colors.text }]}>
              {`${parseFloat(String(item.net_weight)).toLocaleString('tr-TR')} kg`}
            </Text>
          </View>
        ) : null}

        {hasDimensions ? (
          <View style={styles.cargoItemDetail}>
            <Text style={[styles.cargoDetailLabel, { color: colors.textSecondary }]}>Boyut (GxYxU):</Text>
            <Text style={[styles.cargoDetailValue, { color: colors.text }]}>
              {`${item.width || '-'} x ${item.height || '-'} x ${item.length || '-'} cm`}
            </Text>
          </View>
        ) : null}

        {item.is_hazardous ? <Badge label="Tehlikeli Madde" variant="danger" size="sm" /> : null}

        {item.is_stackable !== undefined ? (
          <Badge
            label={item.is_stackable ? 'İstiflenebilir' : 'İstiflenemez'}
            variant={item.is_stackable ? 'default' : 'warning'}
            size="sm"
          />
        ) : null}
      </View>
    </View>
  );
}

export function CargoItemsCard({ items, colors = Colors.light }: CargoItemsCardProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <Package size={20} color={Brand.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {`Kargo Kalemleri (${items.length})`}
        </Text>
      </View>

      {items.map((item, index) => (
        <CargoItemRow key={index} item={item} colors={colors} />
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
  cargoItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cargoItemTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  cargoItemSubtitle: {
    ...Typography.bodySM,
    marginBottom: Spacing.md,
  },
  cargoItemDetails: {
    gap: Spacing.sm,
  },
  cargoItemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cargoDetailLabel: {
    ...Typography.bodySM,
  },
  cargoDetailValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
});
