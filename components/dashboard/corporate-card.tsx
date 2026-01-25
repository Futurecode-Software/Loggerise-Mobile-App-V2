/**
 * Corporate Card Component
 *
 * Clean, minimal card wrapper for dashboard content.
 * Supports optional press handler for interactive cards.
 */

import React, { ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { DashboardTheme } from '@/constants/dashboard-theme';

interface CorporateCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const CorporateCard = ({
  children,
  style,
  onPress,
}: CorporateCardProps) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, style]}
    >
      {children}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: DashboardTheme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
});
