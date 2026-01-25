/**
 * UserSelectList Component
 *
 * Reusable user list component with search, loading, and empty states.
 * Used by both direct message and group conversation creation screens.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Search, Users, AlertCircle } from 'lucide-react-native';
import { Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { UserListItem } from './UserListItem';
import { UserBasic } from '@/services/endpoints/messaging';

interface UserSelectListProps {
  users: UserBasic[];
  selectedUsers?: UserBasic[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUserSelect: (user: UserBasic) => void;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  onRetry: () => void;
  isGroupMode?: boolean;
  searchPlaceholder?: string;
}

export function UserSelectList({
  users,
  selectedUsers = [],
  searchQuery,
  onSearchChange,
  onUserSelect,
  isLoading,
  isCreating,
  error,
  onRetry,
  isGroupMode = false,
  searchPlaceholder = 'Kullanıcı ara...',
}: UserSelectListProps) {
  const colors = Colors.light;

  // Render user item
  const renderUser = useCallback(
    ({ item }: { item: UserBasic }) => {
      const isSelected = selectedUsers.some((u) => u.id === item.id);
      return (
        <UserListItem
          user={item}
          isSelected={isSelected}
          isGroupMode={isGroupMode}
          onPress={() => onUserSelect(item)}
          disabled={isCreating}
        />
      );
    },
    [selectedUsers, onUserSelect, isCreating, isGroupMode]
  );

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Kullanıcılar yükleniyor...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Users size={64} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Kullanıcı bulunamadı' : 'Kullanıcı yok'}
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Henüz mesajlaşabileceğiniz kullanıcı yok'}
        </Text>
      </View>
    );
  }, [isLoading, error, searchQuery, colors, onRetry]);

  // Key extractor
  const keyExtractor = useCallback((item: UserBasic) => String(item.id), []);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChangeText={onSearchChange}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={keyExtractor}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
