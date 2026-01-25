import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Users,
  UserPlus,
  UserMinus,
  LogOut,
  Edit2,
  Crown,
  AlertCircle,
  Check,
  X,
  Search,
} from 'lucide-react-native';
import { Avatar, Input, Button } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  getGroupDetails,
  updateGroup,
  addParticipants,
  removeParticipant,
  leaveGroup,
  Participant,
  UserBasic,
} from '@/services/endpoints/messaging';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { user } = useAuth();
  const currentUserId = user?.id || 0;

  // State
  const [conversation, setConversation] = useState<{
    id: number;
    name: string;
    description: string | null;
    avatar_url: string | null;
    created_by: number;
  } | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserBasic[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch group details
  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getGroupDetails(parseInt(id, 10));
      setConversation(data.conversation);
      setParticipants(data.participants);
      setAvailableUsers(data.availableUsers);
      setIsAdmin(data.isAdmin);
      setIsCreator(data.isCreator);
      setEditName(data.conversation.name);
      setEditDescription(data.conversation.description || '');
    } catch (err) {
      console.error('Group details fetch error:', err);
      setError(err instanceof Error ? err.message : 'Grup bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  // Update group info
  const handleUpdateGroup = async () => {
    if (!editName.trim() || !id) return;

    setIsUpdating(true);
    try {
      await updateGroup(parseInt(id, 10), {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setConversation((prev) =>
        prev
          ? { ...prev, name: editName.trim(), description: editDescription.trim() || null }
          : null
      );
      setShowEditModal(false);
      Alert.alert('Başarılı', 'Grup bilgileri güncellendi.');
    } catch (err) {
      console.error('Update group error:', err);
      Alert.alert('Hata', 'Grup güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add participants
  const handleAddParticipants = async () => {
    if (selectedUsersToAdd.length === 0 || !id) return;

    setIsUpdating(true);
    try {
      await addParticipants(parseInt(id, 10), selectedUsersToAdd);
      await fetchGroupDetails(); // Refresh data
      setShowAddModal(false);
      setSelectedUsersToAdd([]);
      Alert.alert('Başarılı', 'Katılımcılar eklendi.');
    } catch (err) {
      console.error('Add participants error:', err);
      Alert.alert('Hata', 'Katılımcılar eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove participant
  const handleRemoveParticipant = (participant: Participant) => {
    if (!id) return;

    Alert.alert(
      'Katılımcıyı Çıkar',
      `${participant.name} adlı kullanıcıyı gruptan çıkarmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeParticipant(parseInt(id, 10), participant.id);
              setParticipants((prev) => prev.filter((p) => p.id !== participant.id));
              Alert.alert('Başarılı', 'Katılımcı gruptan çıkarıldı.');
            } catch (err) {
              console.error('Remove participant error:', err);
              Alert.alert('Hata', 'Katılımcı çıkarılamadı. Lütfen tekrar deneyin.');
            }
          },
        },
      ]
    );
  };

  // Leave group
  const handleLeaveGroup = () => {
    if (!id) return;

    if (isCreator) {
      Alert.alert('Uyarı', 'Grup oluşturucusu gruptan ayrılamaz.');
      return;
    }

    Alert.alert(
      'Gruptan Ayrıl',
      'Bu gruptan ayrılmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(parseInt(id, 10));
              router.replace('/messages' as any);
            } catch (err) {
              console.error('Leave group error:', err);
              Alert.alert('Hata', 'Gruptan ayrılırken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  // Toggle user selection for adding
  const toggleUserSelection = (userId: number) => {
    setSelectedUsersToAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Filter available users
  const filteredAvailableUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render participant
  const renderParticipant = ({ item }: { item: Participant }) => {
    const isMe = item.id === currentUserId;
    const canRemove = isAdmin && !item.is_creator && !isMe;

    return (
      <View style={[styles.participantItem, { borderBottomColor: colors.border }]}>
        <Avatar
          name={item.name}
          size="md"
          source={item.profile_photo_url || undefined}
        />
        <View style={styles.participantInfo}>
          <View style={styles.participantNameRow}>
            <Text style={[styles.participantName, { color: colors.text }]}>
              {item.name}
              {isMe && ' (Sen)'}
            </Text>
            {item.is_creator && (
              <View style={[styles.creatorBadge, { backgroundColor: Brand.warning + '20' }]}>
                <Crown size={12} color={Brand.warning} />
                <Text style={[styles.creatorText, { color: Brand.warning }]}>Kurucu</Text>
              </View>
            )}
            {item.role === 'admin' && !item.is_creator && (
              <View style={[styles.adminBadge, { backgroundColor: Brand.primary + '20' }]}>
                <Text style={[styles.adminText, { color: Brand.primary }]}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={[styles.participantEmail, { color: colors.textMuted }]}>
            {item.email}
          </Text>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Grup Detayları</Text>
        </View>
        <View style={styles.centerContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchGroupDetails();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Grup Detayları</Text>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            style={styles.editButton}
          >
            <Edit2 size={20} color={Brand.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Info */}
        <View style={[styles.groupInfoCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.groupAvatar, { backgroundColor: Brand.primary }]}>
            <Users size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.groupName, { color: colors.text }]}>
            {conversation?.name}
          </Text>
          {conversation?.description && (
            <Text style={[styles.groupDescription, { color: colors.textSecondary }]}>
              {conversation.description}
            </Text>
          )}
          <Text style={[styles.participantCount, { color: colors.textMuted }]}>
            {participants.length} katılımcı
          </Text>
        </View>

        {/* Participants Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Katılımcılar</Text>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: Brand.primary + '15' }]}
                onPress={() => setShowAddModal(true)}
              >
                <UserPlus size={18} color={Brand.primary} />
                <Text style={[styles.addButtonText, { color: Brand.primary }]}>Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={participants}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderParticipant}
            scrollEnabled={false}
          />
        </View>

        {/* Leave Group Button */}
        {!isCreator && (
          <TouchableOpacity
            style={[styles.leaveButton, { backgroundColor: colors.danger + '10' }]}
            onPress={handleLeaveGroup}
          >
            <LogOut size={20} color={colors.danger} />
            <Text style={[styles.leaveButtonText, { color: colors.danger }]}>
              Gruptan Ayrıl
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Grubu Düzenle
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Input
                label="Grup Adı"
                placeholder="Grup adı girin"
                value={editName}
                onChangeText={setEditName}
              />
              <Input
                label="Açıklama"
                placeholder="Açıklama girin (isteğe bağlı)"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
              />
              <Button
                onPress={handleUpdateGroup}
                loading={isUpdating}
                disabled={!editName.trim() || isUpdating}
                style={styles.modalButton}
              >
                Kaydet
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Participants Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.addModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Katılımcı Ekle
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setSelectedUsersToAdd([]);
                setSearchQuery('');
              }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
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
                  >
                    <Avatar name={item.name} size="md" />
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                        {item.email}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: Brand.primary }]}>
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.userList}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {searchQuery ? 'Kullanıcı bulunamadı' : 'Eklenecek kullanıcı yok'}
                  </Text>
                </View>
              }
            />
            <View style={styles.modalFooter}>
              <Button
                onPress={handleAddParticipants}
                loading={isUpdating}
                disabled={selectedUsersToAdd.length === 0 || isUpdating}
                style={styles.modalButton}
              >
                Ekle ({selectedUsersToAdd.length})
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  editButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  groupInfoCard: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  groupName: {
    ...Typography.headingMD,
    textAlign: 'center',
  },
  groupDescription: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  participantCount: {
    ...Typography.bodySM,
    marginTop: Spacing.sm,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  addButtonText: {
    ...Typography.bodySM,
    fontWeight: '600',
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
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  creatorText: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  adminBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  adminText: {
    ...Typography.bodyXS,
    fontWeight: '600',
  },
  removeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  leaveButtonText: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodySM,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  addModalContent: {
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headingMD,
  },
  modalBody: {
    gap: Spacing.md,
  },
  modalButton: {
    marginTop: Spacing.md,
  },
  modalFooter: {
    paddingTop: Spacing.md,
  },
  searchContainer: {
    marginBottom: Spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
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
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMD,
  },
});
