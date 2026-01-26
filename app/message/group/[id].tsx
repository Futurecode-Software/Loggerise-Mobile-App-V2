/**
 * Group Settings Screen
 *
 * Full-page screen for managing group conversation settings:
 * - Group info display and editing
 * - Participant management (add/remove)
 * - Avatar upload
 * - Leave group functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Users,
  UserPlus,
  UserMinus,
  LogOut,
  Edit2,
  Crown,
  Check,
  X,
  Search,
  Camera,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows, Status } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { FullScreenHeader } from '@/components/header';
import { Avatar, Input, Button } from '@/components/ui';
import {
  getGroupDetails,
  updateGroup,
  updateGroupAvatar,
  addParticipants,
  removeParticipant,
  leaveGroup,
  Participant,
  UserBasic,
} from '@/services/endpoints/messaging';

interface GroupDetailsState {
  conversation: {
    id: number;
    name: string;
    description: string | null;
    avatar_url: string | null;
    created_by: number;
  };
  participants: Participant[];
  availableUsers: UserBasic[];
  isAdmin: boolean;
  isCreator: boolean;
}

type ViewMode = 'main' | 'edit' | 'addParticipants';

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { user } = useAuth();
  const { success, error: showError, warning } = useToast();
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;
  const conversationId = id ? parseInt(id, 10) : 0;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [groupDetails, setGroupDetails] = useState<GroupDetailsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Add participants state
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Avatar state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Dialog states
  const [showRemoveParticipantDialog, setShowRemoveParticipantDialog] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);

  // Fetch group details
  const fetchGroupDetails = useCallback(async (showRefresh = false) => {
    if (!conversationId) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await getGroupDetails(conversationId);
      setGroupDetails(data);
      setEditName(data.conversation.name);
      setEditDescription(data.conversation.description || '');
    } catch (err) {
      console.error('Group details fetch error:', err);
      setError(err instanceof Error ? err.message : 'Grup bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  // Reset add participants state when switching views
  useEffect(() => {
    if (viewMode !== 'addParticipants') {
      setSelectedUsersToAdd([]);
      setSearchQuery('');
    }
  }, [viewMode]);

  // Update group info
  const handleUpdateGroup = async () => {
    if (!editName.trim() || !conversationId) return;

    setIsUpdating(true);
    try {
      await updateGroup(conversationId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      if (groupDetails) {
        setGroupDetails({
          ...groupDetails,
          conversation: {
            ...groupDetails.conversation,
            name: editName.trim(),
            description: editDescription.trim() || null,
          },
        });
      }
      setViewMode('main');
      success('Başarılı', 'Grup bilgileri güncellendi.');
    } catch (err) {
      console.error('Update group error:', err);
      showError('Hata', 'Grup güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add participants
  const handleAddParticipants = async () => {
    if (selectedUsersToAdd.length === 0 || !conversationId) return;

    setIsUpdating(true);
    try {
      await addParticipants(conversationId, selectedUsersToAdd);
      await fetchGroupDetails();
      setViewMode('main');
      success('Başarılı', 'Katılımcılar eklendi.');
    } catch (err) {
      console.error('Add participants error:', err);
      showError('Hata', 'Katılımcılar eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove participant - show dialog
  const handleRemoveParticipant = (participant: Participant) => {
    if (!conversationId) return;
    setParticipantToRemove(participant);
    setShowRemoveParticipantDialog(true);
  };

  // Confirm remove participant
  const confirmRemoveParticipant = async () => {
    if (!conversationId || !participantToRemove) return;

    try {
      await removeParticipant(conversationId, participantToRemove.id);
      await fetchGroupDetails();
      setShowRemoveParticipantDialog(false);
      setParticipantToRemove(null);
      success('Başarılı', 'Katılımcı gruptan çıkarıldı.');
    } catch (err) {
      console.error('Remove participant error:', err);
      showError('Hata', 'Katılımcı çıkarılamadı. Lütfen tekrar deneyin.');
    }
  };

  // Leave group - show dialog
  const handleLeaveGroup = () => {
    if (!conversationId) return;

    if (groupDetails?.isCreator) {
      warning('Uyarı', 'Grup oluşturucusu gruptan ayrılamaz.');
      return;
    }

    setShowLeaveGroupDialog(true);
  };

  // Confirm leave group
  const confirmLeaveGroup = async () => {
    if (!conversationId) return;

    try {
      await leaveGroup(conversationId);
      setShowLeaveGroupDialog(false);
      router.replace('/messages' as any);
    } catch (err) {
      console.error('Leave group error:', err);
      showError('Hata', 'Gruptan ayrılırken bir hata oluştu.');
    }
  };

  // Toggle user selection for adding
  const toggleUserSelection = (userId: number) => {
    setSelectedUsersToAdd((prev) =>
      prev.includes(userId) ? prev.filter((uid) => uid !== userId) : [...prev, userId]
    );
  };

  // Handle avatar picker
  const handlePickAvatar = async () => {
    if (!groupDetails?.isAdmin || !conversationId) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        warning('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni gereklidir.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          showError('Hata', 'Dosya boyutu maksimum 5MB olabilir');
          return;
        }

        if (asset.uri) {
          await handleUploadAvatar(asset.uri);
        }
      }
    } catch (err) {
      console.error('Image picker error:', err);
      showError('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  // Handle avatar upload
  const handleUploadAvatar = async (imageUri: string) => {
    if (!conversationId || !imageUri) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        type,
        name: filename,
      } as any);

      await updateGroupAvatar(conversationId, formData);

      success('Başarılı', 'Grup fotoğrafı güncellendi');
      await fetchGroupDetails();
    } catch (err) {
      console.error('Avatar upload error:', err);
      showError('Hata', 'Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Filter available users
  const filteredAvailableUsers =
    groupDetails?.availableUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Render participant item
  const renderParticipant = ({ item }: { item: Participant }) => {
    const isMe = item.id === currentUserId;
    const canRemove = groupDetails?.isAdmin && !item.is_creator && !isMe;

    return (
      <View style={[styles.participantItem, { borderBottomColor: colors.border }]}>
        <Avatar name={item.name} size="md" source={item.profile_photo_url || undefined} />
        <View style={styles.participantInfo}>
          <View style={styles.participantNameRow}>
            <Text style={[styles.participantName, { color: colors.text }]}>
              {item.name}
              {isMe && ' (Sen)'}
            </Text>
            {item.is_creator && (
              <View style={[styles.badge, { backgroundColor: Status.warning + '20' }]}>
                <Crown size={12} color={Status.warning} />
                <Text style={[styles.badgeText, { color: Status.warning }]}>Kurucu</Text>
              </View>
            )}
            {item.role === 'admin' && !item.is_creator && (
              <View style={[styles.badge, { backgroundColor: Brand.primary + '20' }]}>
                <Text style={[styles.badgeText, { color: Brand.primary }]}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={[styles.participantEmail, { color: colors.textMuted }]}>{item.email}</Text>
        </View>
        {canRemove && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.danger + '15' }]}
            onPress={() => handleRemoveParticipant(item)}
          >
            <UserMinus size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Grup Ayarları" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !groupDetails) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="Grup Ayarları" showBackButton />
        <View style={styles.centerContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Grup bilgileri yüklenemedi'}
          </Text>
          <Button title="Tekrar Dene" onPress={() => fetchGroupDetails()} style={styles.retryButton} />
        </View>
      </View>
    );
  }

  // Edit view
  if (viewMode === 'edit') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Grubu Düzenle"
          showBackButton
          onBackPress={() => setViewMode('main')}
        />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.editContent}>
          <View style={styles.inputGroup}>
            <Input
              label="Grup Adı"
              placeholder="Grup adı girin"
              value={editName}
              onChangeText={setEditName}
            />
          </View>
          <View style={styles.inputGroup}>
            <Input
              label="Açıklama"
              placeholder="Açıklama girin (isteğe bağlı)"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
            />
          </View>
          <Button
            title="Kaydet"
            onPress={handleUpdateGroup}
            loading={isUpdating}
            disabled={!editName.trim() || isUpdating}
            fullWidth
            style={styles.saveButton}
          />
        </ScrollView>
      </View>
    );
  }

  // Add participants view
  if (viewMode === 'addParticipants') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Katılımcı Ekle"
          showBackButton
          onBackPress={() => setViewMode('main')}
          rightIcons={
            selectedUsersToAdd.length > 0 ? (
              <TouchableOpacity onPress={handleAddParticipants} disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.headerActionText}>Ekle ({selectedUsersToAdd.length})</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
        <View style={styles.searchContainer}>
          <Input
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color={colors.icon} />}
            containerStyle={styles.searchInput}
          />
        </View>
        <FlatList
          data={filteredAvailableUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isSelected = selectedUsersToAdd.includes(item.id);
            return (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  { borderBottomColor: colors.border },
                  isSelected && { backgroundColor: Brand.primary + '10' },
                ]}
                onPress={() => toggleUserSelection(item.id)}
                activeOpacity={0.7}
              >
                <Avatar name={item.name} size="md" />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.userEmail, { color: colors.textMuted }]}>{item.email}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: Brand.primary }]}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.userListContent}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Users size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {searchQuery ? 'Kullanıcı bulunamadı' : 'Eklenecek kullanıcı yok'}
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // Main view
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader title="Grup Ayarları" showBackButton />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchGroupDetails(true)}
            colors={[Brand.primary]}
            tintColor={Brand.primary}
          />
        }
      >
        {/* Group Info Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.groupHeader}>
            <View style={styles.avatarContainer}>
              {groupDetails.conversation.avatar_url ? (
                <Avatar
                  name={groupDetails.conversation.name}
                  size="xl"
                  source={groupDetails.conversation.avatar_url}
                />
              ) : (
                <View style={[styles.groupAvatarLarge, { backgroundColor: Brand.primary }]}>
                  <Users size={36} color="#FFFFFF" />
                </View>
              )}
              {groupDetails.isAdmin && (
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: Brand.primary }]}
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Camera size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.groupName, { color: colors.text }]}>
              {groupDetails.conversation.name}
            </Text>
            {groupDetails.conversation.description && (
              <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>
                {groupDetails.conversation.description}
              </Text>
            )}
            <Text style={[styles.participantCount, { color: colors.textMuted }]}>
              {groupDetails.participants.length} katılımcı
            </Text>
          </View>
        </View>

        {/* Actions Section */}
        {groupDetails.isAdmin && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: colors.border }]}
              onPress={() => setViewMode('edit')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: Brand.primary + '15' }]}>
                <Edit2 size={20} color={Brand.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Grubu Düzenle</Text>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setViewMode('addParticipants')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: Brand.primary + '15' }]}>
                <UserPlus size={20} color={Brand.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Katılımcı Ekle</Text>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Participants Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Katılımcılar ({groupDetails.participants.length})
            </Text>
          </View>
          <FlatList
            data={groupDetails.participants}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderParticipant}
            scrollEnabled={false}
          />
        </View>

        {/* Leave Group Section */}
        {!groupDetails.isCreator && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleLeaveGroup}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.danger + '15' }]}>
                <LogOut size={20} color={colors.danger} />
              </View>
              <Text style={[styles.dangerText, { color: colors.danger }]}>Gruptan Ayrıl</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Remove Participant Dialog */}
      <ConfirmDialog
        visible={showRemoveParticipantDialog}
        title="Katılımcıyı Çıkar"
        message={`${participantToRemove?.name || ''} adlı kullanıcıyı gruptan çıkarmak istediğinize emin misiniz?`}
        confirmText="Çıkar"
        cancelText="İptal"
        isDangerous
        onConfirm={confirmRemoveParticipant}
        onCancel={() => {
          setShowRemoveParticipantDialog(false);
          setParticipantToRemove(null);
        }}
      />

      {/* Leave Group Dialog */}
      <ConfirmDialog
        visible={showLeaveGroupDialog}
        title="Gruptan Ayrıl"
        message="Bu gruptan ayrılmak istediğinize emin misiniz?"
        confirmText="Ayrıl"
        cancelText="İptal"
        isDangerous
        onConfirm={confirmLeaveGroup}
        onCancel={() => setShowLeaveGroupDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
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
  },
  section: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  groupHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  groupAvatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  groupName: {
    ...Typography.headingLG,
    textAlign: 'center',
  },
  groupDescription: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  participantCount: {
    ...Typography.bodySM,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    ...Typography.headingSM,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionText: {
    ...Typography.bodyMD,
    flex: 1,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dangerText: {
    ...Typography.bodyMD,
    flex: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  participantName: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  participantEmail: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  badgeText: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  removeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  editContent: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  searchInput: {
    marginBottom: 0,
  },
  userListContent: {
    flexGrow: 1,
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
  emptyList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  headerActionText: {
    ...Typography.bodyMD,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: Spacing['2xl'],
  },
});
