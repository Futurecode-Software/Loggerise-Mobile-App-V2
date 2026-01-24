import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface DividerProps {
  text?: string;
  style?: ViewStyle;
}

export function Divider({ text, style }: DividerProps) {
  const colors = Colors.light;

  if (text) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={[styles.text, { color: colors.textMuted }]}>{text}</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.simpleLine,
        { backgroundColor: colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    ...Typography.bodySM,
    paddingHorizontal: Spacing.lg,
  },
  simpleLine: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.md,
  },
});
