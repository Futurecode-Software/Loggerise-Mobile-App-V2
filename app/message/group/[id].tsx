/**
 * Group Settings Screen
 *
 * Full-page screen for managing group conversation settings:
 * - Group info display and editing
 * - Participant management (add/remove)
 * - Avatar upload
 * - Leave group functionality
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { ConfirmDialog , Avatar, Input, Button } from '@/components/ui';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/auth-context';
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme';

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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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

  // Refs
  const isMountedRef = useRef(true);

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
      if (isMountedRef.current) {
        setGroupDetails(data);
        setEditName(data.conversation.name);
        setEditDescription(data.conversation.description || '');
        setError(null);
      }
    } catch (err) {
      if (__DEV__) console.error('Group details fetch error:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Grup bilgileri yüklenemedi');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchGroupDetails();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchGroupDetails]);

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails(false);
    }, [fetchGroupDetails])
  );

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
      Toast.show({
        type: 'success',
        text1: 'Grup bilgileri güncellendi',
        position: 'top',
        visibilityTime: 1500
      });
    } catch (err) {
      if (__DEV__) console.error('Update group error:', err);
      Toast.show({
        type: 'error',
        text1: 'Grup güncellenemedi',
        position: 'top',
        visibilityTime: 1500
      });
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
      Toast.show({
        type: 'success',
        text1: 'Katılımcılar eklendi',
        position: 'top',
        visibilityTime: 1500
      });
    } catch (err) {
      if (__DEV__) console.error('Add participants error:', err);
      Toast.show({
        type: 'error',
        text1: 'Katılımcılar eklenemedi',
        position: 'top',
        visibilityTime: 1500
      });
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
      Toast.show({
        type: 'success',
        text1: 'Katılımcı gruptan çıkarıldı',
        position: 'top',
        visibilityTime: 1500
      });
    } catch (err) {
      if (__DEV__) console.error('Remove participant error:', err);
      Toast.show({
        type: 'error',
        text1: 'Katılımcı çıkarılamadı',
        position: 'top',
        visibilityTime: 1500
      });
    }
  };

  // Leave group - show dialog
  const handleLeaveGroup = () => {
    if (!conversationId) return;

    if (groupDetails?.isCreator) {
      Toast.show({
        type: 'warning',
        text1: 'Grup oluşturucusu gruptan ayrılamaz',
        position: 'top',
        visibilityTime: 1500
      });
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
      if (__DEV__) console.error('Leave group error:', err);
      Toast.show({
        type: 'error',
        text1: 'Gruptan ayrılırken bir hata oluştu',
        position: 'top',
        visibilityTime: 1500
      });
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
        Toast.show({
          type: 'warning',
          text1: 'Fotoğraf seçmek için galeri erişim izni gereklidir',
          position: 'top',
          visibilityTime: 1500
        });
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
          Toast.show({
            type: 'error',
            text1: 'Dosya boyutu maksimum 5MB olabilir',
            position: 'top',
            visibilityTime: 1500
          });
          return;
        }

        if (asset.uri) {
          await handleUploadAvatar(asset.uri);
        }
      }
    } catch (err) {
      if (__DEV__) console.error('Image picker error:', err);
      Toast.show({
        type: 'error',
        text1: 'Fotoğraf seçilirken bir hata oluştu',
        position: 'top',
        visibilityTime: 1500
      });
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

      Toast.show({
        type: 'success',
        text1: 'Grup fotoğrafı güncellendi',
        position: 'top',
        visibilityTime: 1500
      });
      await fetchGroupDetails();
    } catch (err) {
      if (__DEV__) console.error('Avatar upload error:', err);
      Toast.show({
        type: 'error',
        text1: 'Fotoğraf yüklenirken bir hata oluştu',
        position: 'top',
        visibilityTime: 1500
      });
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
      <View style={[styles.participantItem, { borderBottomColor: DashboardColors.borderLight }]}>
        <Avatar name={item.name} size="md" source={item.profile_photo_url || undefined} />
        <View style={styles.participantInfo}>
          <View style={styles.participantNameRow}>
            <Text style={[styles.participantName, { color: DashboardColors.textPrimary }]}>
              {item.name}
              {isMe && ' (Sen)'}
            </Text>
            {item.is_creator && (
              <View style={[styles.badge, { backgroundColor: DashboardColors.warning + '20' }]}>
                <Ionicons name="trophy" size={12} color={DashboardColors.warning} />
                <Text style={[styles.badgeText, { color: DashboardColors.warning }]}>Kurucu</Text>
              </View>
            )}
            {item.role === 'admin' && !item.is_creator && (
              <View style={[styles.badge, { backgroundColor: DashboardColors.primary + '20' }]}>
                <Text style={[styles.badgeText, { color: DashboardColors.primary }]}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={[styles.participantEmail, { color: DashboardColors.textMuted }]}>{item.email}</Text>
        </View>
        {canRemove && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: DashboardColors.danger + '15' }]}
            onPress={() => handleRemoveParticipant(item)}
          >
            <Ionicons name="person-remove-outline" size={18} color={DashboardColors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />

          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerTitle}>Grup Ayarları</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={[styles.loadingText, { color: DashboardColors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !groupDetails) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />

          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerTitle}>Grup Ayarları</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={DashboardColors.danger} />
          <Text style={[styles.errorTitle, { color: DashboardColors.textPrimary }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: DashboardColors.textSecondary }]}>
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />

          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => setViewMode('main')}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerTitle}>Grubu Düzenle</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>

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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#022920', '#044134', '#065f4a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />

          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => setViewMode('main')}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerTitle}>Katılımcı Ekle</Text>
              </View>
              {selectedUsersToAdd.length > 0 ? (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleAddParticipants}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.headerActionsPlaceholder} />
              )}
            </View>
          </View>
          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.searchContainer}>
          <Input
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search" size={20} color={DashboardColors.textMuted} />}
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
                  { borderBottomColor: DashboardColors.borderLight },
                  isSelected && { backgroundColor: DashboardColors.primary + '10' },
                ]}
                onPress={() => toggleUserSelection(item.id)}
                activeOpacity={0.7}
              >
                <Avatar name={item.name} size="md" />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: DashboardColors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.userEmail, { color: DashboardColors.textMuted }]}>{item.email}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: DashboardColors.primary }]}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.userListContent}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="people-outline" size={48} color={DashboardColors.textMuted} />
              <Text style={[styles.emptyText, { color: DashboardColors.textMuted }]}>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleSection}>
              <Text style={styles.headerTitle}>Grup Ayarları</Text>
            </View>
            <View style={styles.headerActionsPlaceholder} />
          </View>
        </View>
        <View style={styles.bottomCurve} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchGroupDetails(true)}
            colors={[DashboardColors.primary]}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {/* Group Info Section */}
        <View style={[styles.section, { backgroundColor: DashboardColors.surface }]}>
          <View style={styles.groupHeader}>
            <View style={styles.avatarContainer}>
              {groupDetails.conversation.avatar_url ? (
                <Avatar
                  name={groupDetails.conversation.name}
                  size="xl"
                  source={groupDetails.conversation.avatar_url}
                />
              ) : (
                <View style={[styles.groupAvatarLarge, { backgroundColor: DashboardColors.primary }]}>
                  <Ionicons name="people" size={36} color="#FFFFFF" />
                </View>
              )}
              {groupDetails.isAdmin && (
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: DashboardColors.primary }]}
                  onPress={handlePickAvatar}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.groupName, { color: DashboardColors.textPrimary }]}>
              {groupDetails.conversation.name}
            </Text>
            {groupDetails.conversation.description && (
              <Text style={[styles.groupDescription, { color: DashboardColors.textSecondary }]}>
                {groupDetails.conversation.description}
              </Text>
            )}
            <Text style={[styles.participantCount, { color: DashboardColors.textMuted }]}>
              {groupDetails.participants.length} katılımcı
            </Text>
          </View>
        </View>

        {/* Actions Section */}
        {groupDetails.isAdmin && (
          <View style={[styles.section, { backgroundColor: DashboardColors.surface }]}>
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: DashboardColors.borderLight }]}
              onPress={() => setViewMode('edit')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: DashboardColors.primary + '15' }]}>
                <Ionicons name="create-outline" size={20} color={DashboardColors.primary} />
              </View>
              <Text style={[styles.actionText, { color: DashboardColors.textPrimary }]}>Grubu Düzenle</Text>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setViewMode('addParticipants')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: DashboardColors.primary + '15' }]}>
                <Ionicons name="person-add-outline" size={20} color={DashboardColors.primary} />
              </View>
              <Text style={[styles.actionText, { color: DashboardColors.textPrimary }]}>Katılımcı Ekle</Text>
              <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Participants Section */}
        <View style={[styles.section, { backgroundColor: DashboardColors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: DashboardColors.textPrimary }]}>
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
          <View style={[styles.section, { backgroundColor: DashboardColors.surface }]}>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleLeaveGroup}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: DashboardColors.danger + '15' }]}>
                <Ionicons name="log-out-outline" size={20} color={DashboardColors.danger} />
              </View>
              <Text style={[styles.dangerText, { color: DashboardColors.danger }]}>Gruptan Ayrıl</Text>
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
        type="danger"
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
        type="danger"
        onConfirm={confirmLeaveGroup}
        onCancel={() => setShowLeaveGroupDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },

  // Header
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 32
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleSection: {
    flex: 1,
    marginHorizontal: DashboardSpacing.md,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center'
  },
  headerActionsPlaceholder: {
    width: 44
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },

  scrollView: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    backgroundColor: DashboardColors.background
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    marginTop: DashboardSpacing.md,
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    marginTop: DashboardSpacing.lg,
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    textAlign: 'center',
    marginTop: DashboardSpacing.sm,
  },
  retryButton: {
    marginTop: DashboardSpacing.lg,
  },
  section: {
    marginTop: DashboardSpacing.md,
    marginHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.xl,
    overflow: 'hidden',
    ...DashboardShadows.sm,
  },
  groupHeader: {
    alignItems: 'center',
    padding: DashboardSpacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: DashboardSpacing.md,
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
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  groupDescription: {
    fontSize: DashboardFontSizes.base,
    textAlign: 'center',
    marginTop: DashboardSpacing.sm,
  },
  participantCount: {
    fontSize: DashboardFontSizes.sm,
    marginTop: DashboardSpacing.sm,
  },
  sectionHeader: {
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DashboardSpacing.md,
  },
  actionText: {
    fontSize: DashboardFontSizes.base,
    flex: 1,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
  },
  dangerText: {
    fontSize: DashboardFontSizes.base,
    flex: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flex: 1,
    marginLeft: DashboardSpacing.md,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm,
  },
  participantName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
  },
  participantEmail: {
    fontSize: DashboardFontSizes.sm,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
  },
  removeButton: {
    padding: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md,
  },
  editContent: {
    padding: DashboardSpacing.lg,
  },
  inputGroup: {
    marginBottom: DashboardSpacing.lg,
  },
  saveButton: {
    marginTop: DashboardSpacing.md,
  },
  searchContainer: {
    padding: DashboardSpacing.md,
    paddingBottom: 0,
    backgroundColor: DashboardColors.background
  },
  searchInput: {
    marginBottom: 0,
  },
  userListContent: {
    flexGrow: 1,
    backgroundColor: DashboardColors.background
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    backgroundColor: DashboardColors.surface
  },
  userInfo: {
    flex: 1,
    marginLeft: DashboardSpacing.md,
  },
  userName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: DashboardFontSizes.sm,
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
    paddingVertical: DashboardSpacing['4xl'],
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    marginTop: DashboardSpacing.md,
  },
  bottomSpacer: {
    height: DashboardSpacing['2xl'],
  },
});
