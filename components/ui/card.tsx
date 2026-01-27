import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  overflow?: 'hidden' | 'visible';
}

export function Card({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = 'md',
  overflow = 'hidden',
}: CardProps) {
  const colors = Colors.light;

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        };
      case 'filled':
        return {
          backgroundColor: colors.surface,
        };
      default:
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.03)',
          // Subtle shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: Spacing.sm };
      case 'lg':
        return { padding: Spacing.xl };
      default:
        return { padding: Spacing.lg };
    }
  };

  const cardStyle = [
    styles.card,
    getVariantStyles(),
    getPaddingStyles(),
    { overflow },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
  },
});
