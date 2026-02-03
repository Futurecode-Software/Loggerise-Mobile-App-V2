import React, { useState, useCallback, useRef, useMemo } from 'react';
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
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Mail,
  Clock,
  RefreshCw,
  X,
  Check,
  Info,
} from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header';
import { userManagementService } from '../../services/api/userManagementService';
import { Colors, Spacing, Typography, BorderRadius, Shadows, Brand } from '@/constants/theme';
import { Invitation, Role } from '../../types/user';

const ROLE_LABELS: Record<string, string> = {
  'Süper Yönetici': 'Süper Yönetici',
  'İK Müdürü': 'İK Müdürü',
  'Lojistik Müdürü': 'Lojistik Müdürü',
  'Lojistik Operatörü': 'Lojistik Operatörü',
  'Muhasebeci': 'Muhasebeci',
};

// Use colors from theme
const colors = Colors.light;

export const UserInvitationsScreen: React.FC = () => {
  // Refs
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // State
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  // Invite form state
  const [emails, setEmails] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Bottom Sheet Configuration
  const snapPoints = useMemo(() => ['90%'], []);

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500,
  });

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

  // Modal dismiss handler
  const handleDismiss = useCallback(() => {
    setTimeout(() => {
      setEmails('');
      setSelectedRoles([]);
    }, 200);
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
      bottomSheetRef.current?.dismiss();
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
        {item.is_expired ? (
          <Clock size={24} color={colors.danger} />
        ) : (
          <Mail size={24} color={colors.info} />
        )}
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
            <RefreshCw size={16} color={colors.success} />
            <Text style={styles.resendButtonText}>Yeniden Gönder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => handleCancel(item)}
        >
          <X size={16} color={colors.danger} />
          <Text style={styles.cancelButtonText}>İptal Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Mail size={80} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Bekleyen davet yok</Text>
      <Text style={styles.emptyDescription}>
        Kullanıcı davet ederek başlayın
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <FullScreenHeader
        title="Kullanıcı Davetleri"
        subtitle={`${invitations.length} bekleyen davet`}
        showBackButton
        rightIcons={
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.present()}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Content Area */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
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
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Invite Modal */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
        animateOnMount={true}
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.modalBackground}
        handleIndicatorStyle={styles.modalHandleIndicator}
        onDismiss={handleDismiss}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kullanıcı Davet Et</Text>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  E-posta Adresleri <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="ornek1@email.com; ornek2@email.com"
                  placeholderTextColor={colors.textMuted}
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
                          <Check size={16} color="#fff" />
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
                <Info size={20} color={colors.info} />
                <Text style={styles.infoText}>
                  Davet e-postası 7 gün geçerli olacaktır. Kullanıcı bu süre içinde
                  kayıt olmalıdır.
                </Text>
              </View>
            </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => bottomSheetRef.current?.dismiss()}
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
        </BottomSheetScrollView>
      </BottomSheetModal>
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
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 4,
  },
  invitationMeta: {
    fontSize: 13,
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
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  expiredBadge: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pendingText: {
    color: colors.warning,
  },
  expiredText: {
    color: colors.danger,
  },
  expiresText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.successLight,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.dangerLight,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
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
  },
  // Modal styles
  modalBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  modalHandleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  modalContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
  },
  modalHeader: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headingMD,
    color: colors.text,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing['2xl'],
  },
  label: {
    ...Typography.headingSM,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  required: {
    color: colors.danger,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyMD,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    ...Typography.bodyXS,
    color: colors.textMuted,
    marginTop: Spacing.xs,
  },
  bold: {
    fontWeight: '600',
  },
  rolesSelectContainer: {
    gap: Spacing.md,
  },
  roleSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleSelectText: {
    ...Typography.bodyMD,
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    ...Typography.bodySM,
    color: colors.info,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalCancelButtonText: {
    ...Typography.buttonMD,
    color: colors.text,
  },
  modalSendButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.primary,
  },
  modalSendButtonDisabled: {
    opacity: 0.6,
  },
  modalSendButtonText: {
    ...Typography.buttonMD,
    color: '#FFFFFF',
  },
});
