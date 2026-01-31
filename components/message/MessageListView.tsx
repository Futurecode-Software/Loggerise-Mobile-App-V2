/**
 * MessageListView Component
 *
 * Modern mesaj listesi - CLAUDE.md tasarım standartlarına uygun
 * Loading, error ve empty state'ler Dashboard theme ile uyumlu
 */

import React, { useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native'
import Animated, { useAnimatedStyle, SharedValue, FadeIn } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { MessageBubble } from './MessageBubble'
import { Message } from '@/services/endpoints/messaging'

interface MessageListViewProps {
  messages: Message[]
  isGroupConversation: boolean
  isLoading: boolean
  error: string | null
  typingUsers: Record<number, { name: string; userId: number }>
  keyboardHeight: SharedValue<number>
  flatListRef: React.RefObject<FlatList<any> | null>
  onRetry: () => void
}

export function MessageListView({
  messages,
  isGroupConversation,
  isLoading,
  error,
  typingUsers,
  keyboardHeight,
  flatListRef,
  onRetry
}: MessageListViewProps) {
  // Inverted messages for FlatList (newest first)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages])

  // Animated style for keyboard
  const animatedListStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value
  }))

  // Typing indicator component
  const renderTypingIndicator = useCallback(() => {
    const typingUserNames = Object.values(typingUsers)
    if (typingUserNames.length === 0) return null

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <Animated.View
              entering={FadeIn.delay(0).duration(300)}
              style={styles.typingDot}
            />
            <Animated.View
              entering={FadeIn.delay(150).duration(300)}
              style={[styles.typingDot, styles.typingDotMiddle]}
            />
            <Animated.View
              entering={FadeIn.delay(300).duration(300)}
              style={styles.typingDot}
            />
          </View>
        </View>
      </View>
    )
  }, [typingUsers])

  // Render message item
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const nextMessage = invertedMessages[index + 1]
      const prevMessage = invertedMessages[index - 1]

      const showDate =
        !nextMessage ||
        (nextMessage.formatted_date !== item.formatted_date && item.formatted_date)

      const isLastInGroup = !prevMessage || prevMessage.user_id !== item.user_id
      const isFirstInGroup =
        !nextMessage ||
        nextMessage.user_id !== item.user_id ||
        nextMessage.formatted_date !== item.formatted_date

      return (
        <>
          {showDate && item.formatted_date && (
            <View style={styles.dateContainer}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{item.formatted_date}</Text>
              </View>
            </View>
          )}
          <MessageBubble
            item={item}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            isGroupConversation={isGroupConversation}
          />
        </>
      )
    },
    [invertedMessages, isGroupConversation]
  )

  // Key extractor
  const keyExtractor = useCallback((item: Message) => String(item.id), [])

  // Loading state - CLAUDE.md standardına uygun
  if (isLoading) {
    return (
      <View style={[styles.messagesContainer, styles.centerContainer]}>
        <View style={styles.loadingIconContainer}>
          <ActivityIndicator size="large" color={DashboardColors.primary} />
        </View>
        <Text style={styles.loadingTitle}>Mesajlar Yükleniyor</Text>
        <Text style={styles.loadingText}>Lütfen bekleyin...</Text>
      </View>
    )
  }

  // Error state - CLAUDE.md error state standardı
  if (error) {
    return (
      <View style={[styles.messagesContainer, styles.centerContainer]}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
        </View>
        <Text style={styles.errorTitle}>Bir hata oluştu</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Empty state
  if (invertedMessages.length === 0) {
    return (
      <View style={[styles.messagesContainer, styles.centerContainer]}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="chatbubbles-outline" size={56} color={DashboardColors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
        <Text style={styles.emptyText}>
          Sohbeti başlatmak için ilk mesajı gönderin
        </Text>
      </View>
    )
  }

  // Message list
  return (
    <Animated.View style={[styles.messagesContainer, animatedListStyle]}>
      <FlatList
        ref={flatListRef}
        data={invertedMessages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messagesList}
        ListHeaderComponent={renderTypingIndicator}
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
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  flatList: {
    flex: 1
  },
  messagesList: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingTop: DashboardSpacing.sm,
    paddingBottom: DashboardSpacing.md
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: DashboardSpacing.md
  },
  dateBadge: {
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: 6,
    borderRadius: DashboardBorderRadius.lg,
    ...DashboardShadows.sm
  },
  dateText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
    marginLeft: 42,
    marginBottom: 8
  },
  typingBubble: {
    backgroundColor: DashboardColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: DashboardBorderRadius.xl,
    borderBottomLeftRadius: 4,
    ...DashboardShadows.sm
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center'
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DashboardColors.primary
  },
  typingDotMiddle: {
    opacity: 0.6
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl']
  },

  // Loading state
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  loadingTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },

  // Error state - CLAUDE.md standardı
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

  // Empty state
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  }
})
