import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Users, AlertCircle, Check, X } from 'lucide-react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { Avatar } from '@/components/ui';
import { getAvailableUsers, createGroup, UserBasic } from '@/services/endpoints/messaging';
import { useAuth } from '@/context/auth-context';
import { useHaptics } from '@/hooks/use-haptics';
import { useToast } from '@/hooks/use-toast';

export interface GroupCreateModalRef {
  present: () => void;
  dismiss: () => void;
}

interface GroupCreateModalProps {
  onGroupCreated?: (conversationId: number) => void;
}

/**
 * Group Create Bottom Sheet Modal
 *
 * Full screen modal for creating a new group conversation
 * Features:
 * - Single snap point (85%) - fixed height for scrollable content
 * - enableContentPanningGesture={false} - scroll doesn't move modal
 * - BottomSheetScrollView for scrollable form
 * - Multi-user selection with checkboxes
 * - Group name and description inputs
 */
const GroupCreateModal = forwardRef<GroupCreateModalRef, GroupCreateModalProps>(
  ({ onGroupCreated }, ref) => {
    const colors = Colors.light;
    const { user } = useAuth();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { hapticLight } = useHaptics();
    const { error: showError, success: showSuccess, warning } = useToast();

    const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;

    // State
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserBasic[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserBasic[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ CRITICAL: Single snap point (85%) for scrollable form
    const snapPoints = useMemo(() => ['90%'], []);

    // iOS-like spring animation config
    const animationConfigs = useBottomSheetSpringConfigs({
      damping: 80,
      overshootClamping: true,
      stiffness: 500,
    });

    // Custom backdrop with dimmed background
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    // Expose present/dismiss methods to parent
    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

    // Fetch users when modal opens
    const fetchUsers = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAvailableUsers();
        // Filter out current user
        setUsers(data.filter((u) => u.id !== currentUserId));
      } catch (err) {
        if (__DEV__) console.error('Users fetch error:', err);
        setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    }, [currentUserId]);

    // Fetch on modal open
    const handleModalChange = useCallback((index: number) => {
      if (index === 0) {
        fetchUsers();
      }
    }, [fetchUsers]);

    const handleDismiss = useCallback(() => {
      // Reset state on dismiss
      setTimeout(() => {
        setGroupName('');
        setGroupDescription('');
        setSearchQuery('');
        setUsers([]);
        setSelectedUsers([]);
        setError(null);
      }, 200);
    }, []);

    // Filter users by search query
    const filteredUsers = useMemo(() => {
      if (!searchQuery.trim()) return users;

      const query = searchQuery.toLowerCase();
      return users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );
    }, [users, searchQuery]);

    // Toggle user selection
    const toggleUserSelection = (user: UserBasic) => {
      hapticLight();
      setSelectedUsers((prev) => {
        const isSelected = prev.some((u) => u.id === user.id);
        if (isSelected) {
          return prev.filter((u) => u.id !== user.id);
        }
        return [...prev, user];
      });
    };

    // Remove selected user
    const removeSelectedUser = (userId: number) => {
      hapticLight();
      setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    // Handle create group
    const handleCreateGroup = async () => {
      if (!groupName.trim()) {
        warning('Uyarı', 'Lütfen bir grup adı girin.');
        return;
      }

      if (selectedUsers.length === 0) {
        warning('Uyarı', 'Lütfen en az bir katılımcı seçin.');
        return;
      }

      hapticLight();
      setIsCreating(true);

      try {
        const result = await createGroup({
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          user_ids: selectedUsers.map((u) => u.id),
        });

        showSuccess('Başarılı', 'Grup başarıyla oluşturuldu.');

        // Close modal
        bottomSheetRef.current?.dismiss();

        // Navigate to conversation
        setTimeout(() => {
          router.push(`/message/${result.id}` as any);
          if (onGroupCreated) {
            onGroupCreated(result.id);
          }
        }, 300);
      } catch (err) {
        if (__DEV__) console.error('Create group error:', err);
        showError('Hata', 'Grup oluşturulamadı. Lütfen tekrar deneyin.');
      } finally {
        setIsCreating(false);
      }
    };

    const renderUserItem = (user: UserBasic) => {
      const isSelected = selectedUsers.some((u) => u.id === user.id);

      return (
        <TouchableOpacity
          key={user.id}
          style={[
            styles.userItem,
            { borderColor: colors.border },
            isSelected && {
              backgroundColor: Brand.primary + '08',
              borderColor: Brand.primary,
            },
          ]}
          onPress={() => toggleUserSelection(user)}
          disabled={isCreating}
          activeOpacity={0.7}
        >
          <Avatar
            name={user.name}
            size="sm"
            source={user.avatar_url || undefined}
          />

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {user.name}
            </Text>
            {user.email && (
              <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {user.email}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.checkbox,
              { borderColor: isSelected ? Brand.primary : colors.border },
              isSelected && { backgroundColor: Brand.primary },
            ]}
          >
            {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      );
    };

    const renderSelectedUser = (user: UserBasic) => (
      <View key={user.id} style={[styles.selectedUserChip, { backgroundColor: Brand.primary + '15' }]}>
        <Avatar name={user.name} size="sm" source={user.avatar_url || undefined} />
        <Text style={[styles.selectedUserName, { color: Brand.primary }]} numberOfLines={1}>
          {user.name}
        </Text>
        <TouchableOpacity
          onPress={() => removeSelectedUser(user.id)}
          style={styles.removeButton}
          activeOpacity={0.7}
        >
          <X size={14} color={Brand.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}  // ✅ CRITICAL: Prevent scroll from moving modal
        enableDynamicSizing={false}
        animateOnMount={true}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onChange={handleModalChange}
        onDismiss={handleDismiss}
        style={styles.shadow}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.groupIcon, { backgroundColor: Brand.primary }]}>
              <Users size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Yeni Grup Oluştur</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Grup adı girin ve katılımcıları seçin
            </Text>
          </View>

          {/* Group Name Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.text }]}>Grup Adı *</Text>
            <BottomSheetTextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Grup adını girin..."
              placeholderTextColor={colors.textMuted}
              value={groupName}
              onChangeText={setGroupName}
              editable={!isCreating}
            />
          </View>

          {/* Group Description Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.text }]}>Açıklama (Opsiyonel)</Text>
            <BottomSheetTextInput
              style={[styles.textarea, { color: colors.text, borderColor: colors.border }]}
              placeholder="Grup açıklaması..."
              placeholderTextColor={colors.textMuted}
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              editable={!isCreating}
            />
          </View>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Seçilen Katılımcılar ({selectedUsers.length})
              </Text>
              <View style={styles.selectedUsersContainer}>
                {selectedUsers.map(renderSelectedUser)}
              </View>
            </View>
          )}

          {/* User Search */}
          <View style={styles.searchSection}>
            <Text style={[styles.label, { color: colors.text }]}>Katılımcı Ekle</Text>
            <View style={[styles.searchContainer, { borderColor: colors.border }]}>
              <Search size={20} color={colors.icon} />
              <BottomSheetTextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Kullanıcı ara..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* User List */}
          <View style={styles.userListSection}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Brand.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Kullanıcılar yükleniyor...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.emptyContainer}>
                <AlertCircle size={48} color={colors.danger} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Bir hata oluştu</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: Brand.primary }]}
                  onPress={fetchUsers}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                </TouchableOpacity>
              </View>
            ) : filteredUsers.length > 0 ? (
              <View style={styles.userList}>
                {filteredUsers.map(renderUserItem)}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Users size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'Kullanıcı bulunamadı' : 'Kullanıcı yok'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? 'Farklı bir arama terimi deneyin'
                    : 'Henüz eklenebilecek kullanıcı yok'}
                </Text>
              </View>
            )}
          </View>

          {/* Create Button */}
          <View style={styles.footerSection}>
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: Brand.primary },
                (!groupName.trim() || selectedUsers.length === 0 || isCreating) && styles.createButtonDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
              activeOpacity={0.7}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>
                  Grup Oluştur {selectedUsers.length > 0 && `(${selectedUsers.length} kişi)`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

GroupCreateModal.displayName = 'GroupCreateModal';

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  shadow: {
    ...Shadows.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: Spacing.lg,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.headingMD,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySM,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.bodyMD,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    ...Typography.bodyMD,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectedSection: {
    marginBottom: Spacing.lg,
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  selectedUserName: {
    ...Typography.bodyXS,
    fontWeight: '600',
    maxWidth: 100,
  },
  removeButton: {
    padding: 2,
  },
  searchSection: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: Colors.light.card,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
  },
  userListSection: {
    marginBottom: Spacing.lg,
  },
  userList: {
    gap: Spacing.sm,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  userEmail: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySM,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footerSection: {
    marginTop: Spacing.md,
  },
  createButton: {
    width: '100%',
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    ...Typography.bodyMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default GroupCreateModal;
