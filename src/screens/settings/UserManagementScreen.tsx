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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userManagementService } from '../../services/api/userManagementService';
import { colors } from '../../constants/colors';
import { User, UserFilters } from '../../types/user';

const ROLE_LABELS: Record<string, string> = {
  'Süper Yönetici': 'Süper Yönetici',
  'İK Müdürü': 'İK Müdürü',
  'Lojistik Müdürü': 'Lojistik Müdürü',
  'Lojistik Operatörü': 'Lojistik Operatörü',
  'Muhasebeci': 'Muhasebeci',
};

export const UserManagementScreen: React.FC = () => {
  const navigation = useNavigation();

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
    navigation.navigate('UserForm', { userId: user.id });
  }, [navigation]);

  // Navigate to create
  const handleCreate = useCallback(() => {
    if (userLimits && !userLimits.can_add_more) {
      Alert.alert(
        'Limit Aşıldı',
        `Kullanıcı limitine ulaştınız. Paketiniz ${userLimits.max_users} kullanıcıya izin veriyor.`
      );
      return;
    }
    navigation.navigate('UserForm', {});
  }, [navigation, userLimits]);

  // Navigate to invitations
  const handleInvitations = useCallback(() => {
    navigation.navigate('UserInvitations', {});
  }, [navigation]);

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
            <Icon name="pencil" size={16} color={colors.warning.DEFAULT} />
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="delete" size={16} color={colors.danger.DEFAULT} />
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
      <Icon name="account-multiple-outline" size={80} color={colors.gray[400]} />
      <Text style={styles.emptyTitle}>Henüz kullanıcı kaydı yok</Text>
      <Text style={styles.emptyDescription}>
        Kullanıcı ekleyerek veya davet ederek başlayın
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreate}>
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Kullanıcı Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Kullanıcı Yönetimi</Text>
          {userLimits && userLimits.max_users !== null && (
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>
                {userLimits.current_users} / {userLimits.max_users}
              </Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kullanıcı ara... (ad, e-posta)"
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.invitationsButton}
            onPress={handleInvitations}
          >
            <Icon name="email-outline" size={20} color={colors.primary.DEFAULT} />
            <Text style={styles.invitationsButtonText}>Davetler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addButton,
              userLimits && !userLimits.can_add_more && styles.addButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={userLimits && !userLimits.can_add_more}
          >
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Kullanıcı Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} style={styles.loader} />
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
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.gray[900],
  },
  limitBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  limitText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.gray[900],
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  invitationsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  invitationsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
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
    backgroundColor: colors.primary.DEFAULT,
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
    color: colors.gray[900],
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray[600],
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.info.light,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info.DEFAULT,
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
    backgroundColor: colors.warning.light,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning.DEFAULT,
  },
  deleteButton: {
    backgroundColor: colors.danger.light,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger.DEFAULT,
  },
  protectedBadge: {
    backgroundColor: colors.success.light,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  protectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.DEFAULT,
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
    color: colors.gray[900],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
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
