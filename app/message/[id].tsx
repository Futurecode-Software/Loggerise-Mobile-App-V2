import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useLocalSearchParams } from 'expo-router';
import { MessageCircle, AlertCircle } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useConversationMessages } from '@/hooks/use-conversation-messages';
import { MessageHeader, MessageBubble, MessageInput } from '@/components/message';
import { Message } from '@/services/endpoints/messaging';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { user } = useAuth();
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : (user?.id || 0);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

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
    flatListRef,
  } = useConversationMessages({
    conversationId: id,
    currentUserId,
  });

  // Inverted messages for FlatList (newest first)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Animated style for keyboard
  const animatedListStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value,
  }));

  // Typing indicator component
  const renderTypingIndicator = useCallback(() => {
    const typingUserNames = Object.values(typingUsers);
    if (typingUserNames.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, styles.typingDotMiddle]} />
            <View style={styles.typingDot} />
          </View>
        </View>
      </View>
    );
  }, [typingUsers]);

  // Render message item
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const nextMessage = invertedMessages[index + 1];
      const prevMessage = invertedMessages[index - 1];

      const showDate =
        !nextMessage || (nextMessage.formatted_date !== item.formatted_date && item.formatted_date);

      const isLastInGroup = !prevMessage || prevMessage.user_id !== item.user_id;
      const isFirstInGroup =
        !nextMessage ||
        nextMessage.user_id !== item.user_id ||
        nextMessage.formatted_date !== item.formatted_date;

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
            isGroupConversation={conversation?.type === 'group'}
          />
        </>
      );
    },
    [invertedMessages, conversation?.type]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Message) => String(item.id), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F0F2F5' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <MessageHeader
        conversation={conversation}
        typingUsers={typingUsers}
        isConnected={isConnected}
        participantCount={participants.length}
        conversationId={id || ''}
      />

      {/* Messages */}
      {isLoading ? (
        <View style={[styles.messagesContainer, styles.centerContainer]}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Mesajlar yükleniyor...
          </Text>
        </View>
      ) : error ? (
        <View style={[styles.messagesContainer, styles.centerContainer]}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={refetch}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : invertedMessages.length === 0 ? (
        <View style={[styles.messagesContainer, styles.centerContainer]}>
          <MessageCircle size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz mesaj yok</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            İlk mesajı siz gönderin!
          </Text>
        </View>
      ) : (
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
              autoscrollToTopThreshold: 100,
            }}
            style={styles.flatList}
          />
        </Animated.View>
      )}

      {/* Input */}
      <MessageInput
        value={newMessage}
        onChangeText={handleTextChange}
        onSend={handleSendMessage}
        isSending={isSending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  flatList: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: Spacing.md,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#667781',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
    marginLeft: 42,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8696A0',
  },
  typingDotMiddle: {
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  errorText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
