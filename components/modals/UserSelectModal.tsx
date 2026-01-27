import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, Users, AlertCircle, MessageCircle } from 'lucide-react-native';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetTextInput,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { Avatar } from '@/components/ui';
import { getAvailableUsers, findOrCreateConversation, UserBasic } from '@/services/endpoints/messaging';
import { useAuth } from '@/context/auth-context';
import { useHaptics } from '@/hooks/use-haptics';
import { useToast } from '@/hooks/use-toast';

export interface UserSelectModalRef {
  present: () => void;
  dismiss: () => void;
}

interface UserSelectModalProps {
  onConversationCreated?: (conversationId: number) => void;
}

/**
 * User Select Bottom Sheet Modal
 *
 * Full screen modal for selecting a user to start a direct message conversation
 * Features:
 * - Single snap point (90%) - full screen
 * - enableContentPanningGesture={false} - scroll doesn't move modal
 * - Search with BottomSheetTextInput
 * - BottomSheetFlatList for scrollable users
 * - Automatic conversation creation on user select
 */
const UserSelectModal = forwardRef<UserSelectModalRef, UserSelectModalProps>(
  ({ onConversationCreated }, ref) => {
    const colors = Colors.light;
    const { user } = useAuth();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { hapticLight } = useHaptics();
    const { error: showError } = useToast();

    const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserBasic[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creatingUserId, setCreatingUserId] = useState<number | null>(null);

    // ✅ CRITICAL: Single snap point (90%) for full screen modal
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
        console.error('Users fetch error:', err);
        setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    }, [currentUserId]);

    // Fetch on modal open (when presented)
    const handleModalChange = useCallback((index: number) => {
      if (index === 0) {
        // Modal opened
        fetchUsers();
      }
    }, [fetchUsers]);

    const handleDismiss = useCallback(() => {
      // Reset state on dismiss
      setTimeout(() => {
        setSearchQuery('');
        setUsers([]);
        setError(null);
        setCreatingUserId(null);
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

    // Handle user select - create DM conversation
    const handleUserSelect = async (selectedUser: UserBasic) => {
      hapticLight();
      setIsCreating(true);
      setCreatingUserId(selectedUser.id);

      try {
        const result = await findOrCreateConversation(selectedUser.id);

        // Close modal
        bottomSheetRef.current?.dismiss();

        // Navigate to conversation
        setTimeout(() => {
          router.push(`/message/${result.conversation.id}` as any);
          if (onConversationCreated) {
            onConversationCreated(result.conversation.id);
          }
        }, 300);
      } catch (err) {
        console.error('Create conversation error:', err);
        showError('Hata', 'Konuşma başlatılamadı. Lütfen tekrar deneyin.');
      } finally {
        setIsCreating(false);
        setCreatingUserId(null);
      }
    };

    const renderUserItem = useCallback(({ item }: { item: UserBasic }) => {
      const user = item;
      const isCreatingThis = creatingUserId === user.id;

      return (
        <TouchableOpacity
          style={[
            styles.userItem,
            { borderColor: colors.border },
          ]}
          onPress={() => handleUserSelect(user)}
          disabled={isCreating}
          activeOpacity={0.7}
        >
          <Avatar
            name={user.name}
            size="md"
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

          {isCreatingThis && (
            <ActivityIndicator size="small" color={Brand.primary} />
          )}

          {!isCreatingThis && (
            <MessageCircle size={20} color={colors.textMuted} strokeWidth={2} />
          )}
        </TouchableOpacity>
      );
    }, [colors, isCreating, creatingUserId]);

    const renderEmpty = useCallback(() => {
      if (isLoading) {
        return (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Kullanıcılar yükleniyor...
            </Text>
          </View>
        );
      }

      if (error) {
        return (
          <View style={styles.emptyContainer}>
            <AlertCircle size={64} color={colors.danger} />
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
        );
      }

      return (
        <View style={styles.emptyContainer}>
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
    }, [isLoading, error, searchQuery, colors, fetchUsers]);

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Yeni Mesaj</Text>
            {filteredUsers.length > 0 && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {filteredUsers.length} kullanıcı
              </Text>
            )}
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
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

        {/* User List */}
        <BottomSheetFlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item: UserBasic) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>
    );
  }
);

UserSelectModal.displayName = 'UserSelectModal';

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    ...Typography.headingMD,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
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
    ...Typography.bodySM,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
    marginTop: Spacing['4xl'],
  },
  emptyTitle: {
    ...Typography.headingSM,
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  loadingText: {
    ...Typography.bodySM,
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
});

export default UserSelectModal;
