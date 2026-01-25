/**
 * InfoRow Component
 *
 * Displays a label-value pair with optional icon.
 * Used for displaying quote details in a consistent format.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface InfoRowProps {
  label: string;
  value?: string | number | boolean | null;
  icon?: LucideIcon;
  colors?: typeof Colors.light;
}

export function InfoRow({ label, value, icon: Icon, colors = Colors.light }: InfoRowProps) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {Icon ? <Icon size={16} color={colors.textMuted} /> : null}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{`${label}:`}</Text>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    ...Typography.bodyMD,
  },
  value: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
});
