/**
 * DetailHeader Component
 *
 * Header component with back button, title, and action buttons.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, Edit, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface DetailHeaderProps {
  title: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  colors?: typeof Colors.light;
}

export function DetailHeader({
  title,
  canEdit = false,
  onEdit,
  onDelete,
  colors = Colors.light,
}: DetailHeaderProps) {
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.headerActions}>
        {canEdit && onEdit ? (
          <TouchableOpacity style={styles.headerButton} onPress={onEdit}>
            <Edit size={22} color={colors.icon} />
          </TouchableOpacity>
        ) : null}
        {onDelete ? (
          <TouchableOpacity style={styles.headerButton} onPress={onDelete}>
            <Trash2 size={22} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
});
