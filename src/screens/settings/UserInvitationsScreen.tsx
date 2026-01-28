import React, { useState, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { userManagementService } from '../../services/api/userManagementService';
import { colors } from '../../constants/colors';
import { Invitation, Role } from '../../types/user';

const ROLE_LABELS: Record<string, string> = {
  'Süper Yönetici': 'Süper Yönetici',
  'İK Müdürü': 'İK Müdürü',
  'Lojistik Müdürü': 'Lojistik Müdürü',
  'Lojistik Operatörü': 'Lojistik Operatörü',
  'Muhasebeci': 'Muhasebeci',
};

export const UserInvitationsScreen: React.FC = () => {
  const navigation = useNavigation();

  // State
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sending, setSending] = useState(false);

  // Invite form state
  const [emails, setEmails] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Load invitations
  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userManagementService.getInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Hata', 'Davetler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load roles
  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await userManagementService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }, []);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      loadInvitations();
      loadRoles();
    }, [loadInvitations, loadRoles])
  );

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInvitations();
  }, [loadInvitations]);

  // Resend invitation
  const handleResend = useCallback(
    (invitation: Invitation) => {
      Alert.alert(
        'Daveti Yeniden Gönder',
        `${invitation.email} adresine daveti yeniden göndermek istediğinize emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Gönder',
            onPress: async () => {
              try {
                await userManagementService.resendInvitation(invitation.id);
                Alert.alert('Başarılı', 'Davet yeniden gönderildi.');
                loadInvitations();
              } catch (error: any) {
                Alert.alert(
                  'Hata',
                  error?.response?.data?.message || 'Davet gönderilemedi.'
                );
              }
            },
          },
        ]
      );
    },
    [loadInvitations]
  );

  // Cancel invitation
  const handleCancel = useCallback(
    (invitation: Invitation) => {
      Alert.alert(
        'Daveti İptal Et',
        `${invitation.email} adresine gönderilen daveti iptal etmek istediğinize emin misiniz?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'İptal Et',
            style: 'destructive',
            onPress: async () => {
              try {
                await userManagementService.cancelInvitation(invitation.id);
                Alert.alert('Başarılı', 'Davet iptal edildi.');
                loadInvitations();
              } catch (error: any) {
                Alert.alert(
                  'Hata',
                  error?.response?.data?.message || 'Davet iptal edilemedi.'
                );
              }
            },
          },
        ]
      );
    },
    [loadInvitations]
  );

  // Toggle role selection
  const toggleRole = useCallback((roleName: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  }, []);

  // Send invitation
  const handleSendInvitation = useCallback(async () => {
    if (!emails.trim()) {
      Alert.alert('Hata', 'En az bir e-posta adresi giriniz.');
      return;
    }

    if (selectedRoles.length === 0) {
      Alert.alert('Hata', 'En az bir rol seçmelisiniz.');
      return;
    }

    setSending(true);
    try {
      await userManagementService.sendInvitation({
        emails,
        roles: selectedRoles,
      });

      Alert.alert('Başarılı', 'Davet(ler) başarıyla gönderildi.');
      setShowInviteModal(false);
      setEmails('');
      setSelectedRoles([]);
      loadInvitations();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Davet gönderilemedi.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setSending(false);
    }
  }, [emails, selectedRoles, loadInvitations]);

  // Render invitation item
  const renderInvitationItem = ({ item }: { item: Invitation }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <Icon
          name={item.is_expired ? 'clock-alert-outline' : 'email-outline'}
          size={24}
          color={item.is_expired ? colors.danger.DEFAULT : colors.info.DEFAULT}
        />
        <View style={styles.invitationInfo}>
          <Text style={styles.invitationEmail}>{item.email}</Text>
          <Text style={styles.invitationMeta}>
            {item.invited_by} tarafından davet edildi
          </Text>
        </View>
      </View>

      {/* Roles */}
      <View style={styles.rolesContainer}>
        {item.roles.map((role, index) => (
          <View key={index} style={styles.roleBadge}>
            <Text style={styles.roleText}>{ROLE_LABELS[role] || role}</Text>
          </View>
        ))}
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            item.is_expired ? styles.expiredBadge : styles.pendingBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.is_expired ? styles.expiredText : styles.pendingText,
            ]}
          >
            {item.is_expired ? 'Süresi Dolmuş' : 'Bekliyor'}
          </Text>
        </View>

        <Text style={styles.expiresText}>
          Son geçerlilik: {new Date(item.expires_at).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {!item.is_expired && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resendButton]}
            onPress={() => handleResend(item)}
          >
            <Icon name="refresh" size={16} color={colors.success.DEFAULT} />
            <Text style={styles.resendButtonText}>Yeniden Gönder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => handleCancel(item)}
        >
          <Icon name="close" size={16} color={colors.danger.DEFAULT} />
          <Text style={styles.cancelButtonText}>İptal Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="email-outline" size={80} color={colors.gray[400]} />
      <Text style={styles.emptyTitle}>Bekleyen davet yok</Text>
      <Text style={styles.emptyDescription}>
        Kullanıcı davet ederek başlayın
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Bekleyen Davetler ({invitations.length})
        </Text>
        <TouchableOpacity onPress={() => setShowInviteModal(true)}>
          <Icon name="plus" size={24} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={colors.primary.DEFAULT}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={invitations}
          renderItem={renderInvitationItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kullanıcı Davet Et</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Icon name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  E-posta Adresleri <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="ornek1@email.com; ornek2@email.com"
                  placeholderTextColor={colors.gray[400]}
                  value={emails}
                  onChangeText={setEmails}
                  multiline
                  numberOfLines={4}
                />
                <Text style={styles.hint}>
                  Birden fazla e-posta için <Text style={styles.bold}>;</Text> ile
                  ayırın
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Roller <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.rolesSelectContainer}>
                  {roles.map(role => (
                    <TouchableOpacity
                      key={role.id}
                      style={styles.roleSelectItem}
                      onPress={() => toggleRole(role.name)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedRoles.includes(role.name) &&
                            styles.checkboxChecked,
                        ]}
                      >
                        {selectedRoles.includes(role.name) && (
                          <Icon name="check" size={16} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.roleSelectText}>
                        {ROLE_LABELS[role.name] || role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.infoBox}>
                <Icon name="information" size={20} color={colors.info.DEFAULT} />
                <Text style={styles.infoText}>
                  Davet e-postası 7 gün geçerli olacaktır. Kullanıcı bu süre içinde
                  kayıt olmalıdır.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowInviteModal(false)}
                disabled={sending}
              >
                <Text style={styles.modalCancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSendButton,
                  sending && styles.modalSendButtonDisabled,
                ]}
                onPress={handleSendInvitation}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSendButtonText}>Davet Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  listContent: {
    padding: 16,
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  invitationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  invitationMeta: {
    fontSize: 13,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  pendingBadge: {
    borderColor: colors.warning.DEFAULT,
    backgroundColor: colors.warning.light,
  },
  expiredBadge: {
    borderColor: colors.danger.DEFAULT,
    backgroundColor: colors.danger.light,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingText: {
    color: colors.warning.DEFAULT,
  },
  expiredText: {
    color: colors.danger.DEFAULT,
  },
  expiresText: {
    fontSize: 12,
    color: colors.gray[600],
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
  resendButton: {
    backgroundColor: colors.success.light,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success.DEFAULT,
  },
  cancelButton: {
    backgroundColor: colors.danger.light,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger.DEFAULT,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 8,
  },
  required: {
    color: colors.danger.DEFAULT,
  },
  textArea: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.gray[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  bold: {
    fontWeight: '600',
  },
  rolesSelectContainer: {
    gap: 12,
  },
  roleSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  roleSelectText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[900],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info.light,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.info.DEFAULT,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  modalSendButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary.DEFAULT,
  },
  modalSendButtonDisabled: {
    opacity: 0.5,
  },
  modalSendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
