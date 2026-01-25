import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { Avatar } from '@/components/ui';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
import { UserBasic } from '@/services/endpoints/messaging';

interface UserListItemProps {
  user: UserBasic;
  isSelected: boolean;
  isGroupMode: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function UserListItemComponent({
  user,
  isSelected,
  isGroupMode,
  onPress,
  disabled = false,
}: UserListItemProps) {
  const colors = Colors.light;

  return (
    <TouchableOpacity
      style={[
        styles.userItem,
        { borderBottomColor: colors.border },
        isSelected && styles.userItemSelected,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Avatar name={user.name} size="md" source={user.profile_photo_url || undefined} />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email}</Text>
      </View>
      {isGroupMode && isSelected && (
        <View style={[styles.checkBadge, { backgroundColor: Brand.primary }]}>
          <Check size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export const UserListItem = memo(UserListItemComponent);

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  userItemSelected: {
    backgroundColor: Brand.primary + '10',
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  userEmail: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
