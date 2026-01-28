import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Search,
  X,
  Mail,
  Plus,
  Pencil,
  Trash2,
  Users
} from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header';
import { userManagementService } from '../../services/api/userManagementService';
import { Colors, Spacing, Typography, BorderRadius, Shadows, Brand } from '@/constants/theme';
import { User, UserFilters } from '../../types/user';

const ROLE_LABELS: Record<string, string> = {
  'Süper Yönetici': 'Süper Yönetici',
  'İK Müdürü': 'İK Müdürü',
  'Lojistik Müdürü': 'Lojistik Müdürü',
  'Lojistik Operatörü': 'Lojistik Operatörü',
  'Muhasebeci': 'Muhasebeci',
};

// Use colors from theme
const colors = Colors.light;

export const UserManagementScreen: React.FC = () => {

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [userLimits, setUserLimits] = useState<{
    max_users: number | null;
    current_users: number;
    can_add_more: boolean;
  } | null>(null);

  // Load users
  const loadUsers = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const filters: UserFilters = {
        page,
        per_page: 20,
      };

      if (searchQuery) filters.search = searchQuery;
      if (selectedRole) filters.role = selectedRole;

      const response = await userManagementService.getUsers(filters);

      if (append) {
        setUsers(prev => [...prev, ...response.data]);
      } else {
        setUsers(response.data);
      }

      setHasMorePages(response.current_page < response.last_page);
      setCurrentPage(response.current_page);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Hata', 'Kullanıcılar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedRole]);

  // Load user limits
  const loadLimits = useCallback(async () => {
    try {
      const limits = await userManagementService.getUserLimits();
      setUserLimits(limits);
    } catch (error) {
      console.error('Error loading user limits:', error);
    }
  }, []);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      loadUsers();
      loadLimits();
    }, [loadUsers, loadLimits])
  );

  // Search debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== '') {
        loadUsers(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers(1);
    loadLimits();
  }, [loadUsers, loadLimits]);

  // Load more
  const loadMore = useCallback(() => {
    if (hasMorePages && !loading) {
      loadUsers(currentPage + 1, true);
    }
  }, [hasMorePages, loading, currentPage, loadUsers]);

  // Delete user
  const handleDelete = useCallback((user: User) => {
    if (user.id === 1) {
      Alert.alert('Uyarı', 'İlk kullanıcı silinemez.');
      return;
    }

    Alert.alert(
      'Kullanıcıyı Sil',
      `${user.name} adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await userManagementService.deleteUser(user.id);
              Alert.alert('Başarılı', 'Kullanıcı başarıyla silindi.');
              loadUsers();
            } catch (error: any) {
              Alert.alert('Hata', error?.response?.data?.message || 'Kullanıcı silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  }, [loadUsers]);

  // Navigate to edit
  const handleEdit = useCallback((user: User) => {
    router.push(`/settings/users/${user.id}/edit` as any);
  }, []);

  // Navigate to create
  const handleCreate = useCallback(() => {
    if (userLimits && !userLimits.can_add_more) {
      Alert.alert(
        'Limit Aşıldı',
        `Kullanıcı limitine ulaştınız. Paketiniz ${userLimits.max_users} kullanıcıya izin veriyor.`
      );
      return;
    }
    router.push('/settings/users/new' as any);
  }, [userLimits]);

  // Navigate to invitations
  const handleInvitations = useCallback(() => {
    router.push('/settings/users/invitations' as any);
  }, []);

  // Render user item
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>

      {/* Roles */}
      <View style={styles.rolesContainer}>
        {item.roles.map((role, index) => (
          <View key={index} style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {ROLE_LABELS[role.name] || role.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      {item.id !== 1 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Pencil size={16} color="#f59e0b" />
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.id === 1 && (
        <View style={styles.protectedBadge}>
          <Text style={styles.protectedText}>Korumalı</Text>
        </View>
      )}
    </View>
  );

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Users size={80} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Henüz kullanıcı kaydı yok</Text>
      <Text style={styles.emptyDescription}>
        Kullanıcı ekleyerek veya davet ederek başlayın
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
        <Plus size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Kullanıcı Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <FullScreenHeader
        title="Kullanıcı Yönetimi"
        subtitle={userLimits && userLimits.max_users !== null
          ? `${userLimits.current_users} / ${userLimits.max_users} kullanıcı`
          : `${users.length} kullanıcı`
        }
        showBackButton
        rightIcons={
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.7}
            disabled={userLimits && !userLimits.can_add_more}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Content Area */}
      <View style={styles.content}>
        {/* Search and Actions */}
        <View style={styles.topActions}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Kullanıcı ara... (ad, e-posta)"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Davetler Button */}
          <TouchableOpacity
            style={styles.invitationsButton}
            onPress={handleInvitations}
          >
            <Mail size={20} color={colors.primary} />
            <Text style={styles.invitationsButtonText}>Davetler</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  topActions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
  },
  invitationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invitationsButtonText: {
    ...Typography.headingSM,
    color: colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: colors.warningLight,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  deleteButton: {
    backgroundColor: colors.dangerLight,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
  protectedBadge: {
    backgroundColor: colors.successLight,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  protectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
