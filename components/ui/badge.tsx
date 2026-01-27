import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/theme';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'destructive' | 'error' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  numberOfLines?: number;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
  numberOfLines = 1,
}: BadgeProps) {
  const colors = Colors.light;

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'success':
        return {
          container: { backgroundColor: colors.successLight },
          text: { color: colors.success },
        };
      case 'warning':
        return {
          container: { backgroundColor: colors.warningLight },
          text: { color: colors.warning },
        };
      case 'secondary':
        return {
          container: { backgroundColor: '#E8F5E9' },
          text: { color: colors.secondary },
        };
      case 'danger':
      case 'destructive':
      case 'error':
        return {
          container: { backgroundColor: colors.dangerLight },
          text: { color: colors.danger },
        };
      case 'info':
        return {
          container: { backgroundColor: colors.infoLight },
          text: { color: colors.info },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border
          },
          text: { color: colors.textSecondary },
        };
      default:
        return {
          container: { backgroundColor: colors.surface },
          text: { color: colors.textSecondary },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: 2,
          },
          text: Typography.bodyXS,
        };
      default:
        return {
          container: {
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
          },
          text: Typography.bodySM,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        variantStyles.container,
        sizeStyles.container,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variantStyles.text,
          sizeStyles.text,
          textStyle,
        ]}
        numberOfLines={numberOfLines}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  text: {
    fontWeight: '500',
  },
});
