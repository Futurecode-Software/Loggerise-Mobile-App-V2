/**
 * New Group Screen
 *
 * Screen for creating a new group conversation.
 * Uses shared UserSelectList component with group-specific inputs.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Users } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNewConversation } from '@/hooks/use-new-conversation';
import { UserSelectList } from '@/components/message';

export default function NewGroupScreen() {
  const colors = Colors.light;
  const { user } = useAuth();
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;

  const {
    setMode,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    selectedUsers,
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

  // Set mode to group on mount
  React.useEffect(() => {
    setMode('group');
  }, [setMode]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: '#F0F2F5' }]}>
        {/* Full Screen Header */}
        <FullScreenHeader
          title="Yeni Grup Oluştur"
          subtitle="Grup adı girin ve katılımcıları seçin"
          showBackButton
          leftIcon={
            <View style={[styles.groupAvatar, { backgroundColor: Brand.primary }]}>
              <Users size={20} color="#FFFFFF" />
            </View>
          }
        />

        {/* Content Area */}
        <View style={styles.contentArea}>
          {/* Group Name Input */}
          <View style={[styles.groupInputs, { backgroundColor: colors.background }]}>
            <View style={styles.inputSection}>
              <Input
                label="Grup Adı *"
                placeholder="Grup adını girin..."
                value={groupName}
                onChangeText={setGroupName}
                containerStyle={styles.groupNameInput}
              />
            </View>
            <View style={styles.inputSection}>
              <Input
                label="Açıklama (Opsiyonel)"
                placeholder="Grup açıklaması..."
                value={groupDescription}
                onChangeText={setGroupDescription}
                containerStyle={styles.groupDescInput}
                multiline
              />
            </View>
          </View>

          {/* User List */}
          <UserSelectList
            users={filteredUsers}
            selectedUsers={selectedUsers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onUserSelect={handleUserSelect}
            isLoading={isLoading}
            isCreating={isCreating}
            error={error}
            onRetry={refetch}
            isGroupMode={true}
          />

          {/* Create Group Button */}
          <View
            style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
          >
            <Button
              title={isCreating ? 'Oluşturuluyor...' : `Grup Oluştur (${selectedUsers.length} kişi)`}
              onPress={handleCreateGroup}
              loading={isCreating}
              disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
              fullWidth
              variant="primary"
              style={styles.createButton}
              textStyle={styles.createButtonText}
            />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  groupInputs: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  groupNameInput: {
    marginBottom: 0,
  },
  groupDescInput: {
    marginBottom: 0,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    paddingBottom: Spacing.xl,
  },
  createButton: {
    width: '100%',
    minHeight: 50,
    backgroundColor: Brand.primary,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  groupAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
