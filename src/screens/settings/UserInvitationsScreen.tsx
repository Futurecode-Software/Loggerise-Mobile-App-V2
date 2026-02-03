/**
 * Kullanıcı Davetleri Ekranı
 *
 * CLAUDE.md standartlarına uygun modern tasarım
 * PageHeader, animasyonlu kartlar, skeleton, ConfirmDialog
 */

import React, { useState, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Pressable
} from 'react-native'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs
} from '@gorhom/bottom-sheet'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import { PageHeader } from '@/components/navigation'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { userManagementService } from '../../services/api/userManagementService'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import { Invitation, Role } from '../../types/user'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const ROLE_LABELS: Record<string, string> = {
  'Süper Yönetici': 'Süper Yönetici',
  'İK Müdürü': 'İK Müdürü',
  'Lojistik Müdürü': 'Lojistik Müdürü',
  'Lojistik Operatörü': 'Lojistik Operatörü',
  'Muhasebeci': 'Muhasebeci'
}

// Skeleton Component
function InvitationCardSkeleton(): React.ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.md }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.rolesContainer}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={100} height={24} borderRadius={12} />
      </View>
      <View style={styles.statusContainer}>
        <Skeleton width={80} height={24} borderRadius={12} />
        <Skeleton width={120} height={14} />
      </View>
      <View style={styles.actionsContainer}>
        <Skeleton width="48%" height={40} borderRadius={8} />
        <Skeleton width="48%" height={40} borderRadius={8} />
      </View>
    </View>
  )
}

// Card Component
interface InvitationCardProps {
  item: Invitation
  onResend: () => void
  onCancel: () => void
}

function InvitationCard({ item, onResend, onCancel }: InvitationCardProps): React.ReactElement {
  const scale = useSharedValue(1)
  const isExpired = item.is_expired

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[
          styles.cardIcon,
          { backgroundColor: isExpired ? DashboardColors.dangerBg : DashboardColors.infoBg }
        ]}>
          <Ionicons
            name={isExpired ? 'time-outline' : 'mail-outline'}
            size={24}
            color={isExpired ? DashboardColors.danger : DashboardColors.info}
          />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.cardMeta}>{item.invited_by} tarafından davet edildi</Text>
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
        <View style={[
          styles.statusBadge,
          isExpired ? styles.expiredBadge : styles.pendingBadge
        ]}>
          <Text style={[
            styles.statusText,
            isExpired ? styles.expiredText : styles.pendingText
          ]}>
            {isExpired ? 'Süresi Dolmuş' : 'Bekliyor'}
          </Text>
        </View>
        <Text style={styles.expiresText}>
          Son geçerlilik: {new Date(item.expires_at).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {!isExpired && (
          <TouchableOpacity
            style={[styles.actionButton, styles.resendButton]}
            onPress={onResend}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={16} color={DashboardColors.success} />
            <Text style={styles.resendButtonText}>Yeniden Gönder</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.cancelButton,
            !isExpired && { flex: 1 }
          ]}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close-outline" size={16} color={DashboardColors.danger} />
          <Text style={styles.cancelButtonText}>İptal Et</Text>
        </TouchableOpacity>
      </View>
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState(): React.ReactElement {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="mail-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Bekleyen davet yok</Text>
      <Text style={styles.emptyText}>
        Kullanıcı davet etmek için sağ üstteki + butonuna tıklayın.
      </Text>
    </View>
  )
}

export function UserInvitationsScreen(): React.ReactElement {
  // Refs
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const confirmDialogRef = useRef<BottomSheetModal>(null)
  const isMountedRef = useRef(true)

  // State
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)

  // Invite form state
  const [emails, setEmails] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  // Confirm dialog state
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string
    message: string
    type: 'danger' | 'warning'
    confirmText: string
    onConfirm: () => Promise<void>
  } | null>(null)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)

  // Bottom Sheet Configuration
  const snapPoints = useMemo(() => ['92%'], [])

  const animationConfigs = useBottomSheetSpringConfigs({
    damping: 80,
    overshootClamping: true,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
    stiffness: 500
  })

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
  )

  // Load invitations
  const loadInvitations = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    }

    try {
      const data = await userManagementService.getInvitations()
      if (isMountedRef.current) {
        setInvitations(data)
      }
    } catch (error) {
      console.error('Error loading invitations:', error)
      if (isMountedRef.current) {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: 'Davetler yüklenirken bir hata oluştu',
          position: 'top',
          visibilityTime: 1500
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  // Load roles
  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await userManagementService.getRoles()
      if (isMountedRef.current) {
        setRoles(rolesData)
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }, [])

  // Initial load and focus effect
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true
      loadInvitations()
      loadRoles()

      return () => {
        isMountedRef.current = false
      }
    }, [loadInvitations, loadRoles])
  )

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadInvitations(false)
  }, [loadInvitations])

  // Resend invitation
  const handleResend = useCallback((invitation: Invitation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setConfirmDialogConfig({
      title: 'Daveti Yeniden Gönder',
      message: `${invitation.email} adresine daveti yeniden göndermek istediğinize emin misiniz?`,
      type: 'warning',
      confirmText: 'Gönder',
      onConfirm: async () => {
        setIsConfirmLoading(true)
        try {
          await userManagementService.resendInvitation(invitation.id)
          confirmDialogRef.current?.dismiss()
          Toast.show({
            type: 'success',
            text1: 'Başarılı',
            text2: 'Davet yeniden gönderildi',
            position: 'top',
            visibilityTime: 1500
          })
          loadInvitations(false)
        } catch (error: unknown) {
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Davet gönderilemedi'
          Toast.show({
            type: 'error',
            text1: 'Hata',
            text2: errorMessage || 'Davet gönderilemedi',
            position: 'top',
            visibilityTime: 1500
          })
        } finally {
          setIsConfirmLoading(false)
        }
      }
    })
    confirmDialogRef.current?.present()
  }, [loadInvitations])

  // Cancel invitation
  const handleCancel = useCallback((invitation: Invitation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setConfirmDialogConfig({
      title: 'Daveti İptal Et',
      message: `${invitation.email} adresine gönderilen daveti iptal etmek istediğinize emin misiniz?`,
      type: 'danger',
      confirmText: 'İptal Et',
      onConfirm: async () => {
        setIsConfirmLoading(true)
        try {
          await userManagementService.cancelInvitation(invitation.id)
          confirmDialogRef.current?.dismiss()
          Toast.show({
            type: 'success',
            text1: 'Başarılı',
            text2: 'Davet iptal edildi',
            position: 'top',
            visibilityTime: 1500
          })
          loadInvitations(false)
        } catch (error: unknown) {
          const errorMessage = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Davet iptal edilemedi'
          Toast.show({
            type: 'error',
            text1: 'Hata',
            text2: errorMessage || 'Davet iptal edilemedi',
            position: 'top',
            visibilityTime: 1500
          })
        } finally {
          setIsConfirmLoading(false)
        }
      }
    })
    confirmDialogRef.current?.present()
  }, [loadInvitations])

  // Toggle role selection
  const toggleRole = useCallback((roleName: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    )
  }, [])

  // Modal dismiss handler
  const handleDismiss = useCallback(() => {
    setTimeout(() => {
      setEmails('')
      setSelectedRoles([])
    }, 200)
  }, [])

  // Send invitation
  const handleSendInvitation = useCallback(async () => {
    if (!emails.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'En az bir e-posta adresi giriniz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    if (selectedRoles.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: 'En az bir rol seçmelisiniz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    setSending(true)
    try {
      await userManagementService.sendInvitation({
        emails,
        roles: selectedRoles
      })

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Davet(ler) başarıyla gönderildi',
        position: 'top',
        visibilityTime: 1500
      })
      bottomSheetRef.current?.dismiss()
      loadInvitations(false)
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Davet gönderilemedi'
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: errorMessage || 'Davet gönderilemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setSending(false)
    }
  }, [emails, selectedRoles, loadInvitations])

  // Navigation handlers
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    bottomSheetRef.current?.present()
  }

  // Render invitation item
  const renderInvitationItem = ({ item }: { item: Invitation }) => (
    <InvitationCard
      item={item}
      onResend={() => handleResend(item)}
      onCancel={() => handleCancel(item)}
    />
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <PageHeader
        title="Kullanıcı Davetleri"
        icon="mail-outline"
        subtitle={`${invitations.length} bekleyen davet`}
        showBackButton
        onBackPress={handleBackPress}
        rightAction={{
          icon: 'add',
          onPress: handleNewPress
        }}
      />

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.listContent}>
            <InvitationCardSkeleton />
            <InvitationCardSkeleton />
            <InvitationCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={invitations}
            renderItem={renderInvitationItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
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
        enablePanDownToClose
        enableContentPanningGesture={false}
        enableDynamicSizing={false}
        animateOnMount
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
            <View style={styles.modalHeaderIcon}>
              <Ionicons name="person-add" size={20} color={DashboardColors.primary} />
            </View>
            <Text style={styles.modalTitle}>Kullanıcı Davet Et</Text>
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.dismiss()}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={DashboardColors.textSecondary} />
            </TouchableOpacity>
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
                placeholderTextColor={DashboardColors.textMuted}
                value={emails}
                onChangeText={setEmails}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.hint}>
                Birden fazla e-posta için <Text style={styles.bold}>;</Text> ile ayırın
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
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedRoles.includes(role.name) && styles.checkboxChecked
                    ]}>
                      {selectedRoles.includes(role.name) && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
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
              <Ionicons name="information-circle-outline" size={20} color={DashboardColors.info} />
              <Text style={styles.infoText}>
                Davet e-postası 7 gün geçerli olacaktır. Kullanıcı bu süre içinde kayıt olmalıdır.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => bottomSheetRef.current?.dismiss()}
              disabled={sending}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelButtonText}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSendButton,
                sending && styles.modalSendButtonDisabled
              ]}
              onPress={handleSendInvitation}
              disabled={sending}
              activeOpacity={0.7}
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

      {/* Confirm Dialog */}
      {confirmDialogConfig && (
        <ConfirmDialog
          ref={confirmDialogRef}
          title={confirmDialogConfig.title}
          message={confirmDialogConfig.message}
          type={confirmDialogConfig.type}
          confirmText={confirmDialogConfig.confirmText}
          cancelText="Vazgeç"
          onConfirm={confirmDialogConfig.onConfirm}
          onCancel={() => confirmDialogRef.current?.dismiss()}
          isLoading={isConfirmLoading}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing['3xl']
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.md
  },
  cardEmail: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  cardMeta: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },

  // Roles
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.md
  },
  roleBadge: {
    backgroundColor: DashboardColors.infoBg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full
  },
  roleText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.info
  },

  // Status
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DashboardSpacing.md,
    paddingTop: DashboardSpacing.md,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full
  },
  pendingBadge: {
    backgroundColor: DashboardColors.warningBg
  },
  expiredBadge: {
    backgroundColor: DashboardColors.dangerBg
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  pendingText: {
    color: DashboardColors.warning
  },
  expiredText: {
    color: DashboardColors.danger
  },
  expiresText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md,
    gap: DashboardSpacing.xs
  },
  resendButton: {
    backgroundColor: DashboardColors.successBg
  },
  resendButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.success
  },
  cancelButton: {
    backgroundColor: DashboardColors.dangerBg
  },
  cancelButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.danger
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  },

  // Modal
  modalBackground: {
    backgroundColor: DashboardColors.surface,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },
  modalHandleIndicator: {
    backgroundColor: DashboardColors.borderLight,
    width: 40,
    height: 4
  },
  modalContent: {
    paddingHorizontal: DashboardSpacing.xl,
    paddingBottom: DashboardSpacing.xl
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    marginBottom: DashboardSpacing.lg
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    flex: 1,
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md
  },
  modalCloseButton: {
    padding: DashboardSpacing.xs
  },
  modalBody: {
    marginBottom: DashboardSpacing.lg
  },
  formGroup: {
    marginBottom: DashboardSpacing.xl
  },
  label: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  required: {
    color: DashboardColors.danger
  },
  textArea: {
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  hint: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginTop: DashboardSpacing.xs
  },
  bold: {
    fontWeight: '600'
  },
  rolesSelectContainer: {
    gap: DashboardSpacing.md
  },
  roleSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: DashboardColors.border,
    borderRadius: DashboardBorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxChecked: {
    backgroundColor: DashboardColors.primary,
    borderColor: DashboardColors.primary
  },
  roleSelectText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DashboardColors.infoBg,
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    gap: DashboardSpacing.sm
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.info,
    lineHeight: 20
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.border,
    backgroundColor: DashboardColors.surface
  },
  modalCancelButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  modalSendButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary
  },
  modalSendButtonDisabled: {
    opacity: 0.6
  },
  modalSendButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF'
  }
})
