/**
 * Metric Card Component
 *
 * Displays a single metric with icon, value, label, and optional growth indicator.
 * Used in dashboard grids to show key statistics.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { CorporateCard } from './corporate-card';

const { width } = Dimensions.get('window');

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  growth?: number;
  delay?: number;
}

export const MetricCard = ({
  icon: Icon,
  label,
  value,
  growth,
  delay = 0,
}: MetricCardProps) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={styles.wrapper}
    >
      <CorporateCard style={styles.card}>
        <View style={styles.iconRow}>
          <View style={styles.iconContainer}>
            <Icon size={20} color={DashboardTheme.accent} strokeWidth={2} />
          </View>
          {growth !== undefined && growth !== 0 && (
            <View
              style={[
                styles.growthPill,
                growth > 0 ? styles.growthUp : styles.growthDown,
              ]}
            >
              {growth > 0 ? (
                <ArrowUpRight size={12} color={DashboardTheme.success} />
              ) : (
                <ArrowDownRight size={12} color={DashboardTheme.danger} />
              )}
              <Text
                style={[
                  styles.growthText,
                  {
                    color:
                      growth > 0 ? DashboardTheme.success : DashboardTheme.danger,
                  },
                ]}
              >
                {Math.abs(growth)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </CorporateCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: (width - 52) / 2,
  },
  card: {
    padding: 18,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: DashboardTheme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthUp: {
    backgroundColor: DashboardTheme.successBg,
  },
  growthDown: {
    backgroundColor: DashboardTheme.dangerBg,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: DashboardTheme.textPrimary,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: DashboardTheme.textMuted,
    fontWeight: '500',
  },
});
