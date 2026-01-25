import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Send,
  Settings,
  Users,
  MessageCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { Avatar } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  getConversation,
  sendMessage,
  markConversationAsRead,
  sendTypingIndicator,
  Message,
  ConversationDetail,
  Participant,
} from '@/services/endpoints/messaging';
import { useMessagingWebSocket } from '@/hooks/use-messaging-websocket';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;
  const { user } = useAuth();
  const currentUserId = user?.id || 0;
  const insets = useSafeAreaInsets();

  // State
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<boolean>(false);

  // WebSocket for real-time messaging
  const { isConnected, typingUsers } = useMessagingWebSocket({
    userId: currentUserId,
    conversationId: id ? parseInt(id, 10) : undefined,
    onNewMessage: (message: Message) => {
      // Add message to list (avoid duplicates)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Mark as read
      if (id) {
        markConversationAsRead(parseInt(id, 10));
      }
    },
  });

  // Fetch conversation data
  const fetchConversation = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getConversation(parseInt(id, 10));
      setConversation(data.conversation);
      setMessages(data.messages);
      setParticipants(data.participants);

      // Mark as read
      await markConversationAsRead(parseInt(id, 10));
    } catch (err) {
      console.error('Conversation fetch error:', err);
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Handle typing indicator
  const handleTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!id || lastTypingRef.current === isTyping) return;

      lastTypingRef.current = isTyping;
      sendTypingIndicator(parseInt(id, 10), isTyping);

      // Auto-stop typing after 2 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          lastTypingRef.current = false;
          sendTypingIndicator(parseInt(id, 10), false);
        }, 2000);
      }
    },
    [id]
  );

  // Handle text change
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    handleTypingIndicator(text.length > 0);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Stop typing indicator
    handleTypingIndicator(false);

    try {
      const sentMessage = await sendMessage({
        conversation_id: parseInt(id, 10),
        message: messageText,
      });

      // Add to messages list
      setMessages((prev) => [...prev, sentMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Send message error:', err);
      Alert.alert('Hata', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      setNewMessage(messageText); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  // Get display name
  const getDisplayName = () => {
    if (!conversation) return '';
    if (conversation.type === 'group') {
      return conversation.name || 'İsimsiz Grup';
    }
    return conversation.other_user?.name || conversation.name || 'Bilinmeyen';
  };

  // Get subtitle
  const getSubtitle = () => {
    if (!conversation) return '';

    // Show typing users
    const typingUsersList = Object.values(typingUsers);
    if (typingUsersList.length > 0) {
      return `${typingUsersList[0].name} yazıyor...`;
    }

    // Show connection status if disconnected
    if (!isConnected) {
      return 'Bağlanıyor...';
    }

    if (conversation.type === 'group') {
      return conversation.description || `${participants.length} katılımcı`;
    }
    return conversation.other_user?.email || '';
  };

  // Render message item
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.is_mine;
    const showDate =
      index === 0 ||
      messages[index - 1].formatted_date !== item.formatted_date;

    // Check if next message is from same user (for grouping)
    const nextMessage = messages[index + 1];
    const isLastInGroup = !nextMessage || nextMessage.user_id !== item.user_id;
    const prevMessage = messages[index - 1];
    const isFirstInGroup = !prevMessage || prevMessage.user_id !== item.user_id ||
      prevMessage.formatted_date !== item.formatted_date;

    return (
      <>
        {showDate && (
          <View style={styles.dateContainer}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>
                {item.formatted_date}
              </Text>
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageRow,
            isMine ? styles.messageRowMine : styles.messageRowOther,
            !isLastInGroup && styles.messageRowGrouped,
          ]}
        >
          {/* Avatar only for other users, only on last message in group */}
          {!isMine && (
            <View style={styles.avatarContainer}>
              {isLastInGroup ? (
                <Avatar
                  name={item.user.name}
                  size="xs"
                  source={item.user.profile_photo_url || undefined}
                />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
              // Rounded corners based on position in group
              isFirstInGroup && !isMine && styles.bubbleFirstOther,
              isFirstInGroup && isMine && styles.bubbleFirstMine,
              isLastInGroup && !isMine && styles.bubbleLastOther,
              isLastInGroup && isMine && styles.bubbleLastMine,
            ]}
          >
            {/* Sender name only in groups, only on first message */}
            {!isMine && conversation?.type === 'group' && isFirstInGroup && (
              <Text style={styles.senderName}>
                {item.user.name}
              </Text>
            )}
            <View style={styles.messageContent}>
              <Text
                style={[
                  styles.messageText,
                  { color: isMine ? '#FFFFFF' : colors.text },
                ]}
              >
                {item.message}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  isMine ? styles.messageTimeMine : styles.messageTimeOther,
                ]}
              >
                {item.formatted_time}
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
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
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Mesajlar yükleniyor...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchConversation();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <MessageCircle size={64} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Henüz mesaj yok
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          İlk mesajı siz gönderin!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F0F2F5' }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#FFFFFF' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            {conversation?.type === 'group' ? (
              <View style={[styles.groupAvatar, { backgroundColor: Brand.primary }]}>
                <Users size={20} color="#FFFFFF" />
              </View>
            ) : (
              <Avatar
                name={getDisplayName()}
                size="sm"
                source={conversation?.other_user?.profile_photo_url || undefined}
              />
            )}
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {getDisplayName()}
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  {
                    color: Object.keys(typingUsers).length > 0 ? Brand.primary : colors.textMuted,
                  },
                ]}
                numberOfLines={1}
              >
                {getSubtitle()}
              </Text>
            </View>
          </View>

          {conversation?.type === 'group' && (
            <TouchableOpacity
              onPress={() => router.push(`/message/group/${id}` as any)}
              style={styles.settingsButton}
            >
              <Settings size={22} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <View style={[styles.messagesContainer, { backgroundColor: '#F0F2F5' }]}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.messagesListEmpty,
            ]}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderTypingIndicator}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        </View>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: '#F0F2F5', paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Mesaj yazın..."
              placeholderTextColor="#8696A0"
              value={newMessage}
              onChangeText={handleTextChange}
              multiline
              maxLength={5000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() && !isSending ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  settingsButton: {
    padding: 8,
    marginRight: -4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 4,
    paddingTop: Spacing.md,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#667781',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingHorizontal: Spacing.sm,
    alignItems: 'flex-end',
  },
  messageRowGrouped: {
    marginBottom: 1,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 28,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  messageBubbleMine: {
    backgroundColor: Brand.primary,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    marginLeft: 50,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
  },
  // Bubble variations for grouped messages
  bubbleFirstOther: {
    borderTopLeftRadius: 18,
  },
  bubbleFirstMine: {
    borderTopRightRadius: 18,
  },
  bubbleLastOther: {
    borderBottomLeftRadius: 4,
    marginBottom: 8,
  },
  bubbleLastMine: {
    borderBottomRightRadius: 4,
    marginBottom: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.primary,
    marginBottom: 2,
  },
  messageContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  messageTime: {
    fontSize: 11,
    marginLeft: 8,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  messageTimeMine: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOther: {
    color: '#8696A0',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 24,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonActive: {
    backgroundColor: Brand.primary,
  },
  sendButtonInactive: {
    backgroundColor: '#B8C4CE',
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
