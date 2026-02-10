/**
 * Conversation Detail Screen
 *
 * Modern mesajlaşma ekranı - CLAUDE.md detay sayfası standardına uygun
 * LinearGradient header, statik glow orbs, geliştirilmiş UI/UX
 */

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence
} from 'react-native-reanimated'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/auth-context'
import { useConversationMessages } from '@/hooks/use-conversation-messages'
import { MessageListView, MessageInput } from '@/components/message'
import { ConfirmDialog } from '@/components/modals'
import CustomBottomSheet from '@/components/modals/CustomBottomSheet'
import { Avatar } from '@/components/ui'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { blockUser, reportMessage, Message } from '@/services/endpoints/messaging'
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()

  // Typing indicator animation
  const dot1Opacity = useSharedValue(0.3)
  const dot2Opacity = useSharedValue(0.3)
  const dot3Opacity = useSharedValue(0.3)

  // Custom hook for all conversation logic
  const {
    conversation,
    messages,
    participants,
    isLoading,
    isSending,
    error,
    newMessage,
    isConnected,
    typingUsers,
    handleTextChange,
    handleSendMessage,
    refetch,
    flatListRef
  } = useConversationMessages({
    conversationId: id,
    currentUserId
  })

  // Block/Report state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const messageActionsRef = useRef<BottomSheetModal>(null)
  const reportSheetRef = useRef<BottomSheetModal>(null)
  const headerMenuRef = useRef<BottomSheetModal>(null)

  const otherUserId = conversation?.other_user?.id

  const handleMessageLongPress = useCallback((message: Message) => {
    if (message.is_mine) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSelectedMessage(message)
    messageActionsRef.current?.present()
  }, [])

  const handleReportPress = useCallback(() => {
    messageActionsRef.current?.dismiss()
    setReportReason('')
    setTimeout(() => {
      reportSheetRef.current?.present()
    }, 300)
  }, [])

  const handleBlockFromActions = useCallback(() => {
    messageActionsRef.current?.dismiss()
    setTimeout(() => {
      setShowBlockConfirm(true)
    }, 300)
  }, [])

  const handleBlockFromMenu = useCallback(() => {
    headerMenuRef.current?.dismiss()
    setTimeout(() => {
      setShowBlockConfirm(true)
    }, 300)
  }, [])

  const handleConfirmBlock = useCallback(async () => {
    if (!otherUserId) return
    setIsBlocking(true)
    try {
      await blockUser(otherUserId)
      Toast.show({
        type: 'success',
        text1: 'Kullanıcı engellendi',
        position: 'top',
        visibilityTime: 1500
      })
      setShowBlockConfirm(false)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Engellenirken bir hata oluştu'
      Toast.show({ type: 'error', text1: msg, position: 'top', visibilityTime: 1500 })
    } finally {
      setIsBlocking(false)
    }
  }, [otherUserId])

  const handleSubmitReport = useCallback(async () => {
    if (!selectedMessage || !reportReason.trim()) {
      Toast.show({ type: 'error', text1: 'Rapor sebebi gerekli', position: 'top', visibilityTime: 1500 })
      return
    }
    setIsReporting(true)
    try {
      await reportMessage(selectedMessage.id, reportReason.trim())
      Toast.show({
        type: 'success',
        text1: 'Mesaj raporlandı',
        text2: 'İncelenmek üzere kaydedildi',
        position: 'top',
        visibilityTime: 1500
      })
      reportSheetRef.current?.dismiss()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Raporlanırken bir hata oluştu'
      Toast.show({ type: 'error', text1: msg, position: 'top', visibilityTime: 1500 })
    } finally {
      setIsReporting(false)
    }
  }, [selectedMessage, reportReason])

  const handleOpenHeaderMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    headerMenuRef.current?.present()
  }, [])

  // Typing dots animation
  useEffect(() => {
    const typingUsersList = Object.values(typingUsers)
    if (typingUsersList.length > 0) {
      dot1Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      )
      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 150 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      )
      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 150 })
        ),
        -1,
        false
      )
    }
  }, [typingUsers, dot1Opacity, dot2Opacity, dot3Opacity])

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }))
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }))
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }))

  // Determine if this is a group conversation
  const isGroupConversation = conversation?.type === 'group'

  // Header content
  const displayName = (() => {
    if (!conversation) return 'Mesajlar'
    if (isGroupConversation) {
      return conversation.name || 'İsimsiz Grup'
    }
    return conversation.other_user?.name || conversation.name || 'Bilinmeyen'
  })()

  const subtitle = (() => {
    if (!conversation) return ''

    const typingUsersList = Object.values(typingUsers)
    if (typingUsersList.length > 0) {
      return 'typing'
    }

    if (!isConnected) {
      return 'Bağlanıyor...'
    }

    if (isGroupConversation) {
      return conversation.description || `${participants.length} katılımcı`
    }
    return conversation.other_user?.email || ''
  })()

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/messages')
    }
  }, [])

  // Navigate to group settings
  const handleOpenGroupSettings = useCallback(() => {
    router.push(`/message/group/${id}` as any)
  }, [id])

  // Connection status indicator
  const renderConnectionStatus = () => {
    if (isConnected) return null
    return (
      <View style={styles.connectionBanner}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.connectionText}>Bağlanıyor...</Text>
      </View>
    )
  }

  // Typing indicator in subtitle
  const renderSubtitle = () => {
    if (subtitle === 'typing') {
      return (
        <View style={styles.typingIndicator}>
          <Text style={styles.subtitleText}>yazıyor</Text>
          <View style={styles.typingDotsContainer}>
            <Animated.View style={[styles.typingDot, dot1Style]} />
            <Animated.View style={[styles.typingDot, dot2Style]} />
            <Animated.View style={[styles.typingDot, dot3Style]} />
          </View>
        </View>
      )
    }
    return <Text style={styles.subtitleText} numberOfLines={1}>{subtitle}</Text>
  }

  return (
    <View style={styles.container}>
      {/* StatusBar root layout'tan yönetilir */}

      {/* Header - Detay sayfası standardı (statik glow orbs) */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Statik dekoratif daireler */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />
        <View style={styles.glowOrb3} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            {/* Sol: Geri Butonu */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Orta: Avatar + Başlık */}
            <TouchableOpacity
              style={styles.headerCenter}
              activeOpacity={isGroupConversation ? 0.7 : 1}
              onPress={isGroupConversation ? handleOpenGroupSettings : undefined}
            >
              {isGroupConversation ? (
                <View style={styles.groupAvatarContainer}>
                  <LinearGradient
                    colors={[DashboardColors.accent, DashboardColors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.groupAvatar}
                  >
                    <Ionicons name="people" size={18} color="#fff" />
                  </LinearGradient>
                  {/* Online indicator for groups */}
                  <View style={styles.onlineIndicator} />
                </View>
              ) : (
                <View style={styles.avatarWrapper}>
                  <Avatar
                    name={displayName}
                    size="sm"
                    source={conversation?.other_user?.profile_photo_url || undefined}
                  />
                  {isConnected && <View style={styles.onlineIndicator} />}
                </View>
              )}

              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {displayName}
                </Text>
                {renderSubtitle()}
              </View>
            </TouchableOpacity>

            {/* Sağ: Ayarlar (grup) / Menü (DM) */}
            {isGroupConversation ? (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleOpenGroupSettings}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleOpenHeaderMenu}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Alt eğri */}
        <View style={styles.bottomCurve} />
      </View>

      {/* Connection status banner */}
      {renderConnectionStatus()}

      {/* Messages */}
      <MessageListView
        messages={messages}
        isGroupConversation={isGroupConversation}
        isLoading={isLoading}
        error={error}
        typingUsers={typingUsers}
        keyboardHeight={keyboardHeight}
        flatListRef={flatListRef}
        onRetry={refetch}
        onMessageLongPress={handleMessageLongPress}
      />

      {/* Input */}
      <MessageInput
        value={newMessage}
        onChangeText={handleTextChange}
        onSend={handleSendMessage}
        isSending={isSending}
      />

      {/* Header Menu (DM) */}
      <CustomBottomSheet
        ref={headerMenuRef}
        snapPoints={['25%']}
        enableDynamicSizing={false}
      >
        <View style={styles.sheetContainer}>
          <TouchableOpacity
            style={styles.sheetOption}
            onPress={handleBlockFromMenu}
            activeOpacity={0.7}
          >
            <View style={[styles.sheetOptionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="ban-outline" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Kullanıcıyı Engelle</Text>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>

      {/* Message Actions Sheet */}
      <CustomBottomSheet
        ref={messageActionsRef}
        snapPoints={['30%']}
        enableDynamicSizing={false}
      >
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Mesaj İşlemleri</Text>
          <TouchableOpacity
            style={styles.sheetOption}
            onPress={handleReportPress}
            activeOpacity={0.7}
          >
            <View style={[styles.sheetOptionIcon, { backgroundColor: `${DashboardColors.warning}20` }]}>
              <Ionicons name="flag-outline" size={22} color={DashboardColors.warning} />
            </View>
            <Text style={styles.sheetOptionText}>Mesajı Raporla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetOption}
            onPress={handleBlockFromActions}
            activeOpacity={0.7}
          >
            <View style={[styles.sheetOptionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="ban-outline" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Kullanıcıyı Engelle</Text>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>

      {/* Report Reason Sheet */}
      <CustomBottomSheet
        ref={reportSheetRef}
        snapPoints={['40%']}
        enableDynamicSizing={false}
      >
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Mesajı Raporla</Text>
          <Text style={styles.sheetDescription}>Bu mesajı neden raporladığınızı açıklayın</Text>
          <BottomSheetTextInput
            style={styles.reportInput}
            placeholder="Rapor sebebinizi yazın..."
            placeholderTextColor={DashboardColors.textMuted}
            value={reportReason}
            onChangeText={setReportReason}
            multiline
            autoFocus
          />
          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => reportSheetRef.current?.dismiss()}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetSubmitBtn, isReporting && { opacity: 0.6 }]}
              onPress={handleSubmitReport}
              disabled={isReporting}
              activeOpacity={0.7}
            >
              {isReporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sheetSubmitText}>Raporla</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CustomBottomSheet>

      {/* Block Confirm Dialog */}
      <ConfirmDialog
        visible={showBlockConfirm}
        title="Kullanıcıyı Engelle"
        message="Bu kullanıcıyı engellemek istediğinize emin misiniz? Engellenen kullanıcıdan mesaj alamazsınız."
        type="danger"
        confirmText="Engelle"
        cancelText="İptal"
        onConfirm={handleConfirmBlock}
        onCancel={() => setShowBlockConfirm(false)}
        isLoading={isBlocking}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },

  // Header styles - CLAUDE.md detay sayfası standardı
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 32
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 40,
    left: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  glowOrb3: {
    position: 'absolute',
    top: 20,
    left: '40%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.06)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerButtonPlaceholder: {
    width: 44,
    height: 44
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: DashboardSpacing.md,
    gap: DashboardSpacing.md
  },
  avatarWrapper: {
    position: 'relative'
  },
  groupAvatarContainer: {
    position: 'relative'
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#044134'
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: '#fff'
  },
  subtitleText: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
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

  // Bottom sheet styles
  sheetContainer: {
    paddingHorizontal: DashboardSpacing.xl,
    paddingBottom: DashboardSpacing.xl,
    gap: DashboardSpacing.sm
  },
  sheetTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  sheetDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.md
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetOptionText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    flex: 1
  },
  reportInput: {
    height: 80,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    backgroundColor: DashboardColors.surface,
    textAlignVertical: 'top',
    marginBottom: DashboardSpacing.lg
  },
  sheetActions: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  sheetCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.background,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  sheetCancelText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  sheetSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.warning
  },
  sheetSubmitText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF'
  },

  // Connection banner
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.warning,
    paddingVertical: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.lg
  },
  connectionText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: '#fff'
  }
})
