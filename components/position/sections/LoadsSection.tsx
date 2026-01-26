/**
 * Loads Section
 *
 * Displays and manages loads attached to the position.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Position } from '@/services/endpoints/positions';

interface LoadsSectionProps {
  position: Position;
  onUpdate: () => void;
}

export function LoadsSection({ position, onUpdate }: LoadsSectionProps) {
  const colors = Colors.light;
  const loads = position.loads || [];

  if (loads.length === 0) {
    return (
      <Card style={styles.card}>
        <View style={styles.emptyState}>
          <Package size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Bu pozisyonda henüz yük bulunmuyor
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {loads.map((load) => (
        <Card key={load.id} style={styles.card}>
          <View style={styles.loadHeader}>
            <Text style={[styles.loadNumber, { color: colors.text }]}>
              {load.load_number}
            </Text>
          </View>

          {load.customer && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Müşteri:</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {load.customer.name}
              </Text>
            </View>
          )}

          {load.sender_company && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Gönderen:</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {load.sender_company.name}
              </Text>
            </View>
          )}

          {load.receiver_company && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Alıcı:</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {load.receiver_company.name}
              </Text>
            </View>
          )}

          {load.items && load.items.length > 0 && (
            <View style={styles.items}>
              <Text style={[styles.itemsTitle, { color: colors.textSecondary }]}>
                Kalemler:
              </Text>
              {load.items.map((item, index) => (
                <Text key={index} style={[styles.itemText, { color: colors.text }]}>
                  • {item.name} - {item.quantity} {item.unit}
                </Text>
              ))}
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  loadHeader: {
    marginBottom: Spacing.sm,
  },
  loadNumber: {
    ...Typography.headingMD,
    fontFamily: 'monospace',
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodySM,
    minWidth: 80,
  },
  value: {
    ...Typography.bodySM,
    fontWeight: '500',
    flex: 1,
  },
  items: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  itemsTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  itemText: {
    ...Typography.bodySM,
    paddingLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
});
