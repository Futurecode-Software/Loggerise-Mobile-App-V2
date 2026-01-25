/**
 * Metrics Grid Component
 *
 * A grid layout for displaying multiple MetricCard components.
 * Handles the flexbox layout and gap spacing.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MetricCard } from './metric-card';

interface MetricItem {
  icon: React.ElementType;
  label: string;
  value: string | number;
  growth?: number;
}

interface MetricsGridProps {
  metrics: MetricItem[];
}

export const MetricsGrid = ({ metrics }: MetricsGridProps) => {
  return (
    <View style={styles.grid}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.label}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          growth={metric.growth}
          delay={index * 50}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
