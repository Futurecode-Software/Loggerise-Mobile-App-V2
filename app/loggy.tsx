import { ViewMode } from '@/components/loggy/constants'
import { LoggyInput } from '@/components/loggy/LoggyInput'
import { MessageBubble } from '@/components/loggy/MessageBubble'
import { QuickSuggestions } from '@/components/loggy/QuickSuggestions'
import { TypingIndicator } from '@/components/loggy/TypingIndicator'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardAnimations,
  DashboardBorderRadius,
  DashboardColors,
  DashboardFontSizes,
  DashboardShadows,
  DashboardSpacing
} from '@/constants/dashboard-theme'
import { useLoggyConversations } from '@/hooks/use-logy-conversations'
import { useLoggyMessages } from '@/hooks/use-logy-messages'
import { useLoggySearch } from '@/hooks/use-logy-search'
import {
  AiConversation,
  checkAiConfiguration,
  deleteConversation,
  formatConversationTime
} from '@/services/endpoints/loggy'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { router, useFocusEffect } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Skeleton Component
function ConversationCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>
    </View>
  )
}

// Card Component
interface ConversationCardProps {
  item: AiConversation
  isActive: boolean
  onPress: () => void
  onDelete: () => void
}

function ConversationCard({ item, isActive, onPress, onDelete }: ConversationCardProps) {
  const scale = useSharedValue(1)

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
      style={[
        styles.card,
        animStyle,
        isActive && styles.cardActive
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardTime}>{formatConversationTime(item.created_at)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButtonIcon}
          onPress={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={DashboardColors.danger} />
        </TouchableOpacity>
      </View>
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="sparkles" size={64} color={DashboardColors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Henüz konuşma yok</Text>
      <Text style={styles.emptyText}>
        Loggy AI ile yük oluşturma, cari arama gibi işlemler için bana yazabilirsiniz.
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={onCreateNew}
        activeOpacity={0.7}
      >
        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        <Text style={styles.startButtonText}>Yeni Konuşma Başlat</Text>
      </TouchableOpacity>
    </View>
  )
}

// Error State
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorState}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
      </View>
      <Text style={styles.errorTitle}>Bir hata oluştu</Text>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function LoggyScreen() {
  const flatListRef = useRef<FlatList>(null)
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [inputValue, setInputValue] = useState('')
  const [isAiConfigured, setIsAiConfigured] = useState(true)
  const [isCheckingConfig, setIsCheckingConfig] = useState(true)
  const [aiConfigMessage, setAiConfigMessage] = useState('')
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Custom hooks
  const {
    conversations,
    currentConversation,
    isLoading: isLoadingConversations,
    refreshing,
    error: conversationsError,
    createNewConversation,
    selectConversation,
    refresh
  } = useLoggyConversations()

  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    error: messagesError,
    sendMessage,
    clearError
  } = useLoggyMessages({ conversation: currentConversation })

  const {
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    clearSearch
  } = useLoggySearch()

  // Check AI configuration on mount
  React.useEffect(() => {
    const checkConfig = async () => {
      setIsCheckingConfig(true)
      try {
        const config = await checkAiConfiguration()
        setIsAiConfigured(config.isConfigured)
        setAiConfigMessage(config.helpText || config.message)
      } catch (error) {
        // Hata durumunda AI'yi kapalı kabul et ve hatayı göster
        setIsAiConfigured(false)
        setAiConfigMessage(
          error instanceof Error
            ? error.message
            : 'AI yapılandırması kontrol edilemedi.'
        )
      } finally {
        setIsCheckingConfig(false)
      }
    }

    checkConfig()
  }, [])

  // Refresh on focus (CLAUDE.md pattern)
  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'list') {
        refresh()
      }
    }, [viewMode, refresh])
  )

  // Inverted messages for FlatList (newest first)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages])

  // Animated style for keyboard
  const animatedListStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value
  }))

  // Create new conversation handler
  const handleCreateNewConversation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      await createNewConversation()
      setViewMode('chat')
    } catch {
      // Error already handled in hook
    }
  }

  // Select conversation handler
  const handleSelectConversation = async (conversation: AiConversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    selectConversation(conversation)
    setViewMode('chat')
  }

  // Send message handler
  const handleSend = async () => {
    if (!inputValue.trim() || !currentConversation || isSending) return
    const messageContent = inputValue
    setInputValue('')
    await sendMessage(messageContent)
  }

  // Handle suggestion click
  const handleSuggestionClick = async (prompt: string) => {
    if (isLoadingMessages || !isAiConfigured) return

    try {
      await createNewConversation()
      setViewMode('chat')
      setInputValue(prompt)

      // Send the prompt after a short delay
      setTimeout(async () => {
        setInputValue('')
        await sendMessage(prompt)
      }, 100)
    } catch {
      // Error already handled in hook
    }
  }

  // Go back to list
  const goBackToList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setViewMode('list')
    clearError()
    clearSearch()
    refresh()
  }

  // Handle delete click - show dialog
  const handleDeleteClick = (conversationId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setConversationToDelete(conversationId)
    deleteDialogRef.current?.present()
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!conversationToDelete) return

    setIsDeleting(true)
    try {
      await deleteConversation(conversationToDelete)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Konuşma başarıyla silindi',
        position: 'top',
        visibilityTime: 1500
      })

      // If deleted conversation was current, go back to list
      if (currentConversation?.id === conversationToDelete) {
        setViewMode('list')
      }

      // Refresh the list to reflect the deletion
      setTimeout(() => {
        refresh()
      }, 300)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Konuşma silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
      setConversationToDelete(null)
    }
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  // ============ RENDER ============
  const displayConversations = searchQuery.length >= 2 ? searchResults : conversations

  return (
    <>
      {viewMode === 'list' ? (
        // LIST VIEW
        <View style={styles.container}>
          <PageHeader
            title="Loggy"
            icon="sparkles-outline"
            subtitle="AI Asistan"
            showBackButton
            onBackPress={handleBackPress}
            rightAction={{
              icon: 'add',
              onPress: handleCreateNewConversation
            }}
          />

          <View style={styles.content}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search" size={20} color={DashboardColors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Sohbetlerde ara..."
                  placeholderTextColor={DashboardColors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {isSearching && <ActivityIndicator size="small" color={DashboardColors.primary} />}
              </View>
            </View>

            {/* Conversations List */}
            {isLoadingConversations ? (
              <View style={styles.listContent}>
                <ConversationCardSkeleton />
                <ConversationCardSkeleton />
                <ConversationCardSkeleton />
              </View>
            ) : conversationsError ? (
              <ErrorState message={conversationsError} onRetry={refresh} />
            ) : (
              <FlatList
                data={displayConversations}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <ConversationCard
                    item={item}
                    isActive={currentConversation?.id === item.id}
                    onPress={() => handleSelectConversation(item)}
                    onDelete={() => handleDeleteClick(item.id)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<EmptyState onCreateNew={handleCreateNewConversation} />}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    tintColor={DashboardColors.primary}
                  />
                }
              />
            )}
          </View>
        </View>
      ) : (
        // CHAT VIEW
        <View style={styles.container}>
          <PageHeader
            title={currentConversation?.title || 'Yeni Konuşma'}
            icon="chatbubble-ellipses-outline"
            subtitle={
              currentConversation
                ? formatConversationTime(currentConversation.created_at)
                : 'Doğal dille sorgula'
            }
            showBackButton
            onBackPress={goBackToList}
            rightAction={
              currentConversation
                ? {
                  icon: 'trash-outline',
                  onPress: () => handleDeleteClick(currentConversation.id)
                }
                : undefined
            }
          />

          <View style={styles.content}>
            {/* API Not Configured Overlay */}
            {!isAiConfigured && !isCheckingConfig && (
              <View style={styles.overlay}>
                <View style={styles.overlayContent}>
                  <View style={styles.overlayIcon}>
                    <Ionicons name="key" size={32} color="#f59e0b" />
                  </View>
                  <Text style={styles.overlayTitle}>AI Yapılandırması Gerekli</Text>
                  <Text style={styles.overlayText}>
                    {aiConfigMessage || 'Loggy AI asistanını kullanabilmek için web panelinde AI ayarlarınızı yapılandırmanız gerekiyor.'}
                  </Text>
                  <Text style={styles.overlayTextSecondary}>
                    Web panelinde Ayarlar {'>'} Sistem Ayarları bölümünden API anahtarınızı ve model bilgilerinizi girebilirsiniz.
                  </Text>
                </View>
              </View>
            )}

            {/* Config Check Loading */}
            {isCheckingConfig && (
              <View style={styles.overlay}>
                <ActivityIndicator size="large" color={DashboardColors.primary} />
                <Text style={[styles.loadingText, { marginTop: DashboardSpacing.md }]}>
                  AI yapılandırması kontrol ediliyor...
                </Text>
              </View>
            )}

            {/* Chat Content */}
            <Pressable
              style={styles.chatContainer}
              onPress={() => Keyboard.dismiss()}
              android_disableSound
            >
              {/* Messages */}
              {isLoadingMessages && messages.length === 0 ? (
                <View style={[styles.messagesContainer, styles.centerContainer]}>
                  <ActivityIndicator size="large" color={DashboardColors.primary} />
                  <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
                </View>
              ) : messagesError ? (
                <View style={[styles.messagesContainer, styles.centerContainer]}>
                  <View style={styles.errorIconLarge}>
                    <Ionicons name="alert-circle" size={64} color={DashboardColors.danger} />
                  </View>
                  <Text style={styles.chatErrorTitle}>Bir hata oluştu</Text>
                  <Text style={styles.chatErrorText}>{messagesError}</Text>
                </View>
              ) : invertedMessages.length === 0 && !isSending ? (
                <View style={[styles.messagesContainer, styles.emptyStateContainer]}>
                  <View style={styles.emptyStateContent}>
                    <View style={styles.chatEmptyIcon}>
                      <Ionicons name="sparkles" size={48} color={DashboardColors.primary} />
                    </View>
                    <Text style={styles.chatEmptyTitle}>Henüz mesaj yok</Text>
                    <Text style={styles.chatEmptyText}>
                      Merhaba! Ben Loggy, sizin AI asistanınızım.{'\n'}
                      Yük oluşturma, cari arama gibi işlemlerde size yardımcı olabilirim.
                    </Text>
                  </View>
                  <View style={styles.quickSuggestionsWrapper}>
                    <QuickSuggestions
                      onSuggestionClick={handleSuggestionClick}
                      isLoading={isLoadingMessages}
                      isAiConfigured={isAiConfigured}
                    />
                  </View>
                </View>
              ) : (
                <Animated.View style={[styles.messagesContainer, animatedListStyle]}>
                  <FlatList
                    ref={flatListRef}
                    data={invertedMessages}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => <MessageBubble message={item} />}
                    inverted
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    removeClippedSubviews={Platform.OS === 'android'}
                    maxToRenderPerBatch={15}
                    windowSize={21}
                    initialNumToRender={20}
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                      autoscrollToTopThreshold: 100
                    }}
                    style={styles.flatList}
                    ListHeaderComponent={
                      isSending ? (
                        <TypingIndicator />
                      ) : messagesError ? (
                        <View style={styles.errorBanner}>
                          <Ionicons name="alert-circle" size={16} color={DashboardColors.danger} />
                          <Text style={styles.errorBannerText}>{messagesError}</Text>
                        </View>
                      ) : null
                    }
                  />
                </Animated.View>
              )}

              {/* Input Bar */}
              <LoggyInput
                value={inputValue}
                onChangeText={setInputValue}
                onSend={handleSend}
                isSending={isSending}
                disabled={!isAiConfigured}
              />
            </Pressable>
          </View>

        </View>
      )}

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Konuşmayı Sil"
        message="Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </>
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

  // Search
  searchContainer: {
    marginHorizontal: DashboardSpacing.lg,
    marginTop: 0,
    marginBottom: DashboardSpacing.sm
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    gap: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    padding: 0
  },

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.xl
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  cardActive: {
    backgroundColor: DashboardColors.primaryGlow,
    borderWidth: 2,
    borderColor: DashboardColors.primary
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md
  },
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardTime: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
  },
  deleteButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing['3xl']
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    marginTop: DashboardSpacing.xl,
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
    minWidth: 220
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  },

  // Error State
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  },

  // Chat View
  chatContainer: {
    flex: 1
  },
  messagesContainer: {
    flex: 1
  },
  flatList: {
    flex: 1
  },
  messagesList: {
    paddingHorizontal: DashboardSpacing.md,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.md
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing.xl
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
  },
  errorIconLarge: {
    marginBottom: DashboardSpacing.md
  },
  chatErrorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.lg
  },
  chatErrorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginTop: DashboardSpacing.sm
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: DashboardSpacing['3xl'],
    paddingBottom: DashboardSpacing.xl
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.xl,
    marginBottom: DashboardSpacing.xl
  },
  chatEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  chatEmptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  chatEmptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: DashboardSpacing.md
  },
  quickSuggestionsWrapper: {
    flex: 1,
    paddingHorizontal: DashboardSpacing.lg
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.dangerBg,
    marginBottom: DashboardSpacing.md
  },
  errorBannerText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    flex: 1
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: DashboardSpacing.xl
  },
  overlayContent: {
    maxWidth: 400,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing['2xl'],
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    ...DashboardShadows.lg
  },
  overlayIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  overlayTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  overlayText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.md,
    lineHeight: 22
  },
  overlayTextSecondary: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary
  },
  overlayButtonText: {
    color: '#FFFFFF',
    fontSize: DashboardFontSizes.base,
    fontWeight: '600'
  }
})
