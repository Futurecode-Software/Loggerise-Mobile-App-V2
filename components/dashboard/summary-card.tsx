/**
 * Summary Card Component
 *
 * Displays a horizontal grid of summary values with dividers.
 * Used for quick overview stats in dashboard.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { CorporateCard } from './corporate-card';

interface SummaryItem {
  value: string | number;
  label: string;
  color?: string;
}

interface SummaryCardProps {
  items: SummaryItem[];
  delay?: number;
}

export const SummaryCard = ({ items, delay = 200 }: SummaryCardProps) => {
  return (
    <Animated.View entering={FadeIn.delay(delay)}>
      <CorporateCard style={styles.card}>
        <View style={styles.grid}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <View style={styles.item}>
                <Text
                  style={[
                    styles.value,
                    { color: item.color || DashboardTheme.textPrimary },
                  ]}
                >
                  {item.value}
                </Text>
                <Text style={styles.label}>{item.label}</Text>
              </View>
              {index < items.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </CorporateCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: DashboardTheme.textMuted,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: DashboardTheme.borderLight,
  },
});
