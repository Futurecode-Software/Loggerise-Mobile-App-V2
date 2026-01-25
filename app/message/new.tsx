import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Users, AlertCircle } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNewConversation } from '@/hooks/use-new-conversation';
import {
  NewConversationHeader,
  UserListItem,
  SelectedUsersRow,
} from '@/components/message';
import { UserBasic } from '@/services/endpoints/messaging';

export default function NewConversationScreen() {
  const colors = Colors.light;
  const { user } = useAuth();
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : (user?.id || 0);

  const {
    mode,
    setMode,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    selectedUsers,
    toggleUserSelection,
    groupName,
    setGroupName,
    groupDescription,
    setGroupDescription,
    isLoading,
    isCreating,
    error,
    handleUserSelect,
    handleCreateGroup,
    refetch,
  } = useNewConversation({ currentUserId });

  // Render user item
  const renderUser = useCallback(
    ({ item }: { item: UserBasic }) => {
      const isSelected = selectedUsers.some((u) => u.id === item.id);
      return (
        <UserListItem
          user={item}
          isSelected={isSelected}
          isGroupMode={mode === 'group'}
          onPress={() => handleUserSelect(item)}
          disabled={isCreating}
        />
      );
    },
    [selectedUsers, mode, handleUserSelect, isCreating]
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
            onPress={refetch}
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
  }, [isLoading, error, searchQuery, colors, refetch]);

  // Key extractor
  const keyExtractor = useCallback((item: UserBasic) => String(item.id), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <NewConversationHeader mode={mode} onGroupModePress={() => setMode('group')} />

      {/* Group Name Input (when in group mode) */}
      {mode === 'group' && (
        <View style={[styles.groupInputs, { backgroundColor: colors.surface }]}>
          <Input
            placeholder="Grup adı *"
            value={groupName}
            onChangeText={setGroupName}
            containerStyle={styles.groupNameInput}
          />
          <Input
            placeholder="Açıklama (isteğe bağlı)"
            value={groupDescription}
            onChangeText={setGroupDescription}
            containerStyle={styles.groupDescInput}
          />
        </View>
      )}

      {/* Selected Users */}
      {mode === 'group' && (
        <SelectedUsersRow users={selectedUsers} onRemove={toggleUserSelection} />
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Kullanıcı ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={keyExtractor}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Group Button */}
      {mode === 'group' && (
        <View
          style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
        >
          <Button
            onPress={handleCreateGroup}
            loading={isCreating}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
            style={styles.createButton}
          >
            {`Grup Oluştur (${selectedUsers.length} kişi)`}
          </Button>
        </View>
      )}

      {/* Loading Overlay */}
      {isCreating && mode === 'select' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingOverlayText, { color: colors.text }]}>
            Konuşma başlatılıyor...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  groupInputs: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  groupNameInput: {
    marginBottom: 0,
  },
  groupDescInput: {
    marginBottom: 0,
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
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  createButton: {
    width: '100%',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
});
