/**
 * Mesajlar Listesi Ekranı
 *
 * Ana mesaj listesi - arama, WebSocket ve pull-to-refresh
 * CLAUDE.md standartlarına uygun - DashboardColors, PageHeader
 */

import GroupCreateModal, { GroupCreateModalRef } from '@/components/modals/GroupCreateModal'
import UserSelectModal, { UserSelectModalRef } from '@/components/modals/UserSelectModal'
import { PageHeader } from '@/components/navigation'
import { Avatar } from '@/components/ui'
import {
  DashboardAnimations,
  DashboardBorderRadius,
  DashboardColors,
  DashboardFontSizes,
  DashboardShadows,
  DashboardSpacing
} from '@/constants/dashboard-theme'
import { useAuth } from '@/context/auth-context'
import { useMessageContext } from '@/context/message-context'
import { useMessagingWebSocket } from '@/hooks/use-messaging-websocket'
import { scheduleMessageNotification } from '@/hooks/use-notification-observer'
import {
  Conversation,
  ConversationFilters,
  getConversationAvatar,
  getConversationName,
  getConversations,
  getLastMessageTime,
  getMessagePreview,
  Message
} from '@/services/endpoints/messaging'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Konuşma kartı bileşeni
interface ConversationCardProps {
  item: Conversation
  currentUserId: number
  onPress: () => void
}

function ConversationCard({ item, currentUserId, onPress }: ConversationCardProps) {
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const hasUnread = (item.unread_count || 0) > 0
  const displayName = getConversationName(item, currentUserId)
  const avatar = getConversationAvatar(item, currentUserId)
  const lastMessagePreview = getMessagePreview(item.last_message)
  const timestamp = getLastMessageTime(item.last_message)
  const isGroup = item.type === 'group'

  return (
    <View>
      <AnimatedPressable
        style={[styles.conversationCard, hasUnread && styles.conversationCardUnread, animStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {isGroup ? (
            <View style={styles.groupAvatar}>
              <Ionicons name="people" size={22} color={DashboardColors.textOnPrimary} />
            </View>
          ) : (
            <Avatar
              name={displayName}
              size="md"
              source={avatar.url || undefined}
            />
          )}
          {/* Online göstergesi - sadece bireysel konuşmalar için */}
          {!isGroup && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        {/* İçerik */}
        <View style={styles.conversationContent}>
          {/* Üst satır: İsim + Zaman */}
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text
                style={[styles.conversationName, hasUnread && styles.conversationNameUnread]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {isGroup && item.participant_count && (
                <View style={styles.participantBadge}>
                  <Text style={styles.participantCount}>{item.participant_count}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.timestamp, hasUnread && styles.timestampUnread]}>
              {timestamp}
            </Text>
          </View>

          {/* Alt satır: Son mesaj + Okunmamış sayısı */}
          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
              numberOfLines={2}
            >
              {item.last_message?.sender_name
                ? `${item.last_message.sender_name}: ${lastMessagePreview}`
                : lastMessagePreview || 'Henüz mesaj yok'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unread_count! > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sağ ok */}
        <View style={styles.cardArrow}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={DashboardColors.textMuted}
          />
        </View>
      </AnimatedPressable>
    </View>
  )
}

export default function MessagesScreen() {
  const { user } = useAuth()
  const { updateUnreadCount, incrementUnreadCount } = useMessageContext()

  // Refs
  const isFirstRender = useRef(true)
  const hasInitialFetchRef = useRef(false)
  const appState = useRef(AppState.currentState)
  const conversationsRef = useRef<Conversation[]>([])
  const userSelectModalRef = useRef<UserSelectModalRef>(null)
  const groupCreateModalRef = useRef<GroupCreateModalRef>(null)

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Keep conversations ref in sync
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  // Current user ID
  const currentUserId = user?.id ? (typeof user.id === 'string' ? parseInt(user.id, 10) : user.id) : 0

  // Ref to store updateUnreadCount to avoid re-creating fetchConversations
  const updateUnreadCountRef = useRef(updateUnreadCount)
  useEffect(() => {
    updateUnreadCountRef.current = updateUnreadCount
  }, [updateUnreadCount])

  // Fetch conversations from API
  const fetchConversations = useCallback(async (showLoading = true) => {
    try {
      setError(null)
      if (showLoading) setIsLoading(true)

      const filters: ConversationFilters = {}
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim()
      }

      const response = await getConversations(filters)
      setConversations(response.conversations)
      setTotalUnreadCount(response.totalUnreadCount)
      updateUnreadCountRef.current(response.totalUnreadCount)
      hasInitialFetchRef.current = true
    } catch (err) {
      if (__DEV__) console.error('Conversations fetch error:', err)
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [searchQuery])

  // Handle new message from WebSocket
  const handleNewConversationMessage = useCallback((message: Message, conversationId: number) => {
    setConversations((prevConversations) => {
      const existingConversation = prevConversations.find((c) => c.id === conversationId)

      if (existingConversation) {
        const senderName = message.user?.name || 'Bilinmeyen'
        const messageText = message.message || ''
        const conversationType = existingConversation.type === 'group' ? 'group' : 'private'

        scheduleMessageNotification(
          senderName,
          messageText,
          conversationId,
          conversationType
        )

        const updatedConversation: Conversation = {
          ...existingConversation,
          last_message: {
            message: message.message,
            created_at: 'Şimdi',
            sender_name: senderName
          },
          unread_count: (existingConversation.unread_count || 0) + 1,
          updated_at: new Date().toISOString()
        }

        return [
          updatedConversation,
          ...prevConversations.filter((c) => c.id !== conversationId)
        ]
      }

      fetchConversations(false)
      return prevConversations
    })

    setTotalUnreadCount((prev) => prev + 1)
    incrementUnreadCount()
  }, [fetchConversations, incrementUnreadCount])

  // Handle participant added
  const handleParticipantAdded = useCallback(() => {
    fetchConversations(false)
  }, [fetchConversations])

  // WebSocket for real-time updates
  const { reconnect } = useMessagingWebSocket({
    userId: currentUserId,
    onNewConversationMessage: handleNewConversationMessage,
    onParticipantAdded: handleParticipantAdded
  })

  // Handle AppState changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        await reconnect()
        fetchConversations(false)
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [fetchConversations, reconnect])

  // Initial load - only run once on mount
  useEffect(() => {
    fetchConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search with debounce - only trigger on searchQuery changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timeoutId = setTimeout(() => {
      fetchConversations()
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Refresh on screen focus - use ref to avoid dependency issues
  const fetchConversationsRef = useRef(fetchConversations)
  useEffect(() => {
    fetchConversationsRef.current = fetchConversations
  }, [fetchConversations])

  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        fetchConversationsRef.current(false)
      }
    }, [])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchConversations(false)
  }, [fetchConversations])

  const handleOpenNewMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    userSelectModalRef.current?.present()
  }

  const handleOpenNewGroup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    groupCreateModalRef.current?.present()
  }

  const handleConversationCreated = () => {
    fetchConversations(false)
  }

  const handleGroupCreated = () => {
    fetchConversations(false)
  }

  const handleConversationPress = (conversation: Conversation) => {
    router.push(`/message/${conversation.id}` as never)
  }

  // Sort conversations by last message time (newest first)
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return dateB - dateA
    })
  }, [conversations])

  // Boş durum render
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
          <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={DashboardColors.danger}
            />
          </View>
          <Text style={styles.emptyStateTitle}>Bir hata oluştu</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true)
              setError(null)
              fetchConversations()
            }}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="chatbubbles-outline"
            size={48}
            color={DashboardColors.textMuted}
          />
        </View>
        <Text style={styles.emptyStateTitle}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz mesajınız yok'}
        </Text>
        <Text style={styles.emptyStateText}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni konuşma başlatmak için + butonuna tıklayın'}
        </Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleOpenNewMessage}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={styles.createButtonText}>Yeni Mesaj</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <PageHeader
        title="Mesajlar"
        icon="chatbubbles-outline"
        subtitle={
          totalUnreadCount > 0
            ? `${totalUnreadCount} okunmamış mesaj`
            : 'Tüm konuşmalarınız'
        }
        leftAction={{
          icon: 'people-outline',
          onPress: handleOpenNewGroup
        }}
        rightAction={{
          icon: 'add',
          onPress: handleOpenNewMessage
        }}
      />

      {/* İçerik */}
      <View style={styles.content}>
        {/* Arama Kutusu */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search"
              size={20}
              color={DashboardColors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Kişi veya mesaj ara..."
              placeholderTextColor={DashboardColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={DashboardColors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Konuşma Listesi */}
        <FlatList
          data={sortedConversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ConversationCard
              item={item}
              currentUserId={currentUserId}
              onPress={() => handleConversationPress(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            sortedConversations.length === 0 && styles.listContentEmpty
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DashboardColors.primary}
              colors={[DashboardColors.primary]}
            />
          }
        />
      </View>

      {/* User Select Modal */}
      <UserSelectModal
        ref={userSelectModalRef}
        onConversationCreated={handleConversationCreated}
      />

      {/* Group Create Modal */}
      <GroupCreateModal
        ref={groupCreateModalRef}
        onGroupCreated={handleGroupCreated}
      />
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

  // Arama
  searchContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.sm
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  searchIcon: {
    marginRight: DashboardSpacing.sm
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },
  clearButton: {
    padding: DashboardSpacing.xs
  },

  // Liste
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  listContentEmpty: {
    flex: 1
  },

  // Konuşma Kartı
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.md,
    marginBottom: DashboardSpacing.sm,
    ...DashboardShadows.sm
  },
  conversationCardUnread: {
    backgroundColor: DashboardColors.surface,
    borderLeftWidth: 3,
    borderLeftColor: DashboardColors.primary
  },
  avatarContainer: {
    position: 'relative',
    marginRight: DashboardSpacing.md
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DashboardColors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: DashboardColors.success,
    borderWidth: 2,
    borderColor: DashboardColors.surface
  },
  conversationContent: {
    flex: 1,
    marginRight: DashboardSpacing.sm
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DashboardSpacing.xs
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: DashboardSpacing.sm
  },
  conversationName: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    flexShrink: 1
  },
  conversationNameUnread: {
    fontWeight: '700'
  },
  participantBadge: {
    backgroundColor: DashboardColors.primaryGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DashboardBorderRadius.sm,
    marginLeft: DashboardSpacing.xs
  },
  participantCount: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  timestamp: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  timestampUnread: {
    color: DashboardColors.primary,
    fontWeight: '600'
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  lastMessage: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 18
  },
  lastMessageUnread: {
    color: DashboardColors.textPrimary,
    fontWeight: '500'
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DashboardColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: DashboardSpacing.sm
  },
  unreadCount: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
    color: DashboardColors.textOnPrimary
  },
  cardArrow: {
    padding: DashboardSpacing.xs
  },

  // Loading State
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['4xl']
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
  },

  // Boş durum
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl']
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
    ...DashboardShadows.sm
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
  emptyStateTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyStateText: {
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  createButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  }
})
