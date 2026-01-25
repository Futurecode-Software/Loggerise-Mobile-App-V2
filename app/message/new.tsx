import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Search,
  Users,
  MessageCircle,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import { Avatar, Input, Button } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  getAvailableUsers,
  findOrCreateConversation,
  createGroup,
  UserBasic,
} from '@/services/endpoints/messaging';

type Mode = 'select' | 'group';

export default function NewConversationScreen() {
  const colors = Colors.light;
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserBasic[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = user?.id || 0;

  // Fetch available users
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user selection for DM
  const handleUserSelect = async (selectedUser: UserBasic) => {
    if (mode === 'group') {
      // Toggle selection for group
      const isSelected = selectedUsers.some((u) => u.id === selectedUser.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter((u) => u.id !== selectedUser.id));
      } else {
        setSelectedUsers([...selectedUsers, selectedUser]);
      }
    } else {
      // Create DM conversation
      setIsCreating(true);
      try {
        const result = await findOrCreateConversation(selectedUser.id);
        router.replace(`/message/${result.conversation.id}` as any);
      } catch (err) {
        console.error('Create conversation error:', err);
        Alert.alert('Hata', 'Konuşma başlatılamadı. Lütfen tekrar deneyin.');
      } finally {
        setIsCreating(false);
      }
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir grup adı girin.');
      return;
    }

    if (selectedUsers.length < 1) {
      Alert.alert('Uyarı', 'Lütfen en az bir katılımcı seçin.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        user_ids: selectedUsers.map((u) => u.id),
      });
      router.replace(`/message/${result.id}` as any);
    } catch (err) {
      console.error('Create group error:', err);
      Alert.alert('Hata', 'Grup oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsCreating(false);
    }
  };

  // Render user item
  const renderUser = ({ item }: { item: UserBasic }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: Brand.primary + '10' },
        ]}
        onPress={() => handleUserSelect(item)}
        disabled={isCreating}
      >
        <Avatar
          name={item.name}
          size="md"
          source={item.profile_photo_url || undefined}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]}>
            {item.email}
          </Text>
        </View>
        {mode === 'group' && isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: Brand.primary }]}>
            <Check size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
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
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchUsers();
            }}
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
  };

  // Render selected users for group
  const renderSelectedUsers = () => {
    if (mode !== 'group' || selectedUsers.length === 0) return null;

    return (
      <View style={[styles.selectedContainer, { backgroundColor: colors.surface }]}>
        <FlatList
          horizontal
          data={selectedUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.selectedUser}
              onPress={() => handleUserSelect(item)}
            >
              <Avatar name={item.name} size="sm" />
              <View style={[styles.removeButton, { backgroundColor: colors.danger }]}>
                <Text style={styles.removeButtonText}>×</Text>
              </View>
              <Text
                style={[styles.selectedUserName, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedList}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
              onPress={() => setMode('group')}
            >
              <Users size={18} color={Brand.primary} />
              <Text style={[styles.groupButtonText, { color: Brand.primary }]}>
                Grup
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
      {renderSelectedUsers()}

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
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Group Button */}
      {mode === 'group' && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button
            onPress={handleCreateGroup}
            loading={isCreating}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
            style={styles.createButton}
          >
            Grup Oluştur ({selectedUsers.length} kişi)
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
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
