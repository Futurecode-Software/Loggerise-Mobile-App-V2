import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { Avatar, Button } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { createGroup, getAvailableUsers, UserBasic } from '@/services/endpoints/messaging';
import { UserListItem } from './UserListItem';
import { FullScreenHeader } from '@/components/header';
import { useToast } from '@/hooks/use-toast';

interface GroupCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: number) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function GroupCreationModal({
  isOpen,
  onClose,
  onGroupCreated,
  onError,
  onSuccess,
}: GroupCreationModalProps) {
  const colors = Colors.light;
  const toast = useToast();

  // State
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Fetch available users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const availableUsers = await getAvailableUsers();
      setUsers(availableUsers);
    } catch (err) {
      console.error('Users fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi';
      if (onError) {
        onError(errorMessage);
      } else {
        toast.showError(errorMessage);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, [onError, toast]);

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset form
      setGroupName('');
      setGroupDescription('');
      setSelectedUserIds([]);
      setSearchQuery('');
    }
  }, [isOpen, fetchUsers]);

  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Filter users by search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      const errorMsg = 'Grup adı boş olamaz';
      if (onError) {
        onError(errorMsg);
      } else {
        toast.showError(errorMsg);
      }
      return;
    }

    if (selectedUserIds.length === 0) {
      const errorMsg = 'En az bir katılımcı seçmelisiniz';
      if (onError) {
        onError(errorMsg);
      } else {
        toast.showError(errorMsg);
      }
      return;
    }

    setIsLoading(true);
    try {
      const conversation = await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        user_ids: selectedUserIds,
      });

      const successMsg = 'Grup başarıyla oluşturuldu';
      if (onSuccess) {
        onSuccess(successMsg);
      } else {
        toast.success(successMsg);
      }

      onGroupCreated(conversation.id);
      onClose();
    } catch (err) {
      console.error('Create group error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Grup oluşturulurken bir hata oluştu';
      if (onError) {
        onError(errorMessage);
      } else {
        toast.showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderUser = ({ item }: { item: UserBasic }) => {
    const isSelected = selectedUserIds.includes(item.id);
    return (
      <UserListItem
        user={item}
        isSelected={isSelected}
        isGroupMode={true}
        onPress={() => toggleUserSelection(item.id)}
        disabled={isLoading}
      />
    );
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Full Screen Header */}
            <FullScreenHeader
              title="Yeni Grup Oluştur"
              subtitle="Grup adı girin ve katılımcıları seçin"
              showBackButton
              onBackPress={onClose}
            />

            {/* Content */}
            <View style={[styles.modalBody, { backgroundColor: colors.background }]}>
              {/* Grup Adı */}
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.text }]}>Grup Adı *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="Grup adını girin..."
                  placeholderTextColor={colors.textMuted}
                  value={groupName}
                  onChangeText={setGroupName}
                  editable={!isLoading}
                />
              </View>

              {/* Grup Açıklaması */}
              <View style={styles.inputSection}>
                <Text style={[styles.label, { color: colors.text }]}>Açıklama (Opsiyonel)</Text>
                <TextInput
                  style={[
                    styles.textarea,
                    { backgroundColor: colors.card, color: colors.text },
                  ]}
                  placeholder="Grup açıklaması..."
                  placeholderTextColor={colors.textMuted}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                />
              </View>

              {/* Katılımcı Seçimi */}
              <View style={styles.participantsSection}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Katılımcılar ({selectedUserIds.length} seçili)
                </Text>

                {/* Search */}
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                  <Search size={20} color={colors.icon} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Kullanıcı ara..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {/* User List */}
                {isLoadingUsers ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Brand.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      Kullanıcılar yükleniyor...
                    </Text>
                  </View>
                ) : filteredUsers.length > 0 ? (
                  <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderUser}
                    style={styles.userList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      {searchQuery ? 'Kullanıcı bulunamadı' : 'Henüz başka kullanıcı yok'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Footer */}
            <SafeAreaView edges={['bottom']} style={[styles.modalFooter, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
              <Button
                title={isLoading ? 'Oluşturuluyor...' : `Grup Oluştur${selectedUserIds.length > 0 ? ` (${selectedUserIds.length} kişi)` : ''}`}
                onPress={handleCreateGroup}
                loading={isLoading}
                disabled={!groupName.trim() || selectedUserIds.length === 0 || isLoading}
                fullWidth
                variant="primary"
                style={styles.createButton}
                textStyle={styles.createButtonText}
              />
            </SafeAreaView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  modalBody: {
    flex: 1,
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodySM,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    ...Typography.bodyMD,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textarea: {
    ...Typography.bodyMD,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  participantsSection: {
    flex: 1,
    minHeight: 200,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    ...Typography.bodyMD,
    flex: 1,
  },
  userList: {
    flex: 1,
    maxHeight: 300,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    ...Typography.bodyMD,
  },
  modalFooter: {
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
});
