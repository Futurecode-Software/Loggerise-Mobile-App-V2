import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '@/constants/theme';

interface CheckboxProps {
  value?: boolean;
  checked?: boolean; // Alias for value (backwards compatibility)
  onValueChange?: (value: boolean) => void;
  onCheckedChange?: (value: boolean) => void; // Alias for onValueChange
  label?: string;
  description?: string;
  size?: number;
  color?: string;
  disabled?: boolean;
}

export function Checkbox({
  value,
  checked,
  onValueChange,
  onCheckedChange,
  label,
  description,
  size = 20,
  color = Colors.light.primary,
  disabled = false
}: CheckboxProps) {
  const colors = Colors.light;

  // Support both value/onValueChange and checked/onCheckedChange
  const isChecked = value ?? checked ?? false;
  const handleChange = onValueChange ?? onCheckedChange;

  const handlePress = () => {
    if (!disabled && handleChange) {
      handleChange(!isChecked);
    }
  };

  const checkbox = (
    <View
      style={[
        styles.checkbox,
        {
          width: size,
          height: size,
          borderRadius: BorderRadius.sm,
          borderColor: disabled ? colors.border : colors.primary,
        },
        isChecked && { backgroundColor: color, borderColor: color },
      ]}
    />
  );

  if (label || description) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
        style={styles.container}
      >
        {checkbox}
        <View style={styles.labelContainer}>
          {label && (
            <Text
              style={[
                styles.label,
                { color: disabled ? colors.textMuted : colors.text },
              ]}
            >
              {label}
            </Text>
          )}
          {description && (
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {checkbox}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  label: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  description: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
});
