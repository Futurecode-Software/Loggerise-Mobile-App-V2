import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Avatar } from '@/components/ui';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { UserBasic } from '@/services/endpoints/messaging';

interface SelectedUsersRowProps {
  users: UserBasic[];
  onRemove: (user: UserBasic) => void;
}

function SelectedUsersRowComponent({ users, onRemove }: SelectedUsersRowProps) {
  const colors = Colors.light;

  const renderSelectedUser = useCallback(
    ({ item }: { item: UserBasic }) => (
      <TouchableOpacity style={styles.selectedUser} onPress={() => onRemove(item)}>
        <Avatar name={item.name} size="sm" />
        <View style={[styles.removeButton, { backgroundColor: colors.danger }]}>
          <Text style={styles.removeButtonText}>×</Text>
        </View>
        <Text style={[styles.selectedUserName, { color: colors.text }]} numberOfLines={1}>
          {item.name.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    ),
    [onRemove, colors.danger, colors.text]
  );

  const keyExtractor = useCallback((item: UserBasic) => String(item.id), []);

  if (users.length === 0) return null;

  return (
    <View style={[styles.selectedContainer, { backgroundColor: colors.surface }]}>
      <FlatList
        horizontal
        data={users}
        keyExtractor={keyExtractor}
        renderItem={renderSelectedUser}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectedList}
      />
    </View>
  );
}

export const SelectedUsersRow = memo(SelectedUsersRowComponent);

const styles = StyleSheet.create({
  selectedContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  selectedList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  selectedUser: {
    alignItems: 'center',
    width: 60,
  },
  removeButton: {
    position: 'absolute',
    top: -2,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -2,
  },
  selectedUserName: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
    width: '100%',
    textAlign: 'center',
  },
});
