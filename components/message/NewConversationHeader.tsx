import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Users } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

type Mode = 'select' | 'group';

interface NewConversationHeaderProps {
  mode: Mode;
  onGroupModePress: () => void;
}

function NewConversationHeaderComponent({ mode, onGroupModePress }: NewConversationHeaderProps) {
  const colors = Colors.light;

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {mode === 'group' ? 'Yeni Grup' : 'Yeni Mesaj'}
      </Text>
      <View style={styles.headerRight}>
        {mode === 'select' && (
          <TouchableOpacity
            style={[styles.groupButton, { backgroundColor: Brand.primary + '15' }]}
            onPress={onGroupModePress}
          >
            <Users size={18} color={Brand.primary} />
            <Text style={[styles.groupButtonText, { color: Brand.primary }]}>Grup</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export const NewConversationHeader = memo(NewConversationHeaderComponent);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  groupButtonText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
});
