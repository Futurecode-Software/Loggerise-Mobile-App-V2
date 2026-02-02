import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  Search,
  Plus,
  MessageCircle,
  Users,
  AlertCircle,
} from 'lucide-react-native';
import { Avatar, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  getConversations,
  Conversation,
  ConversationFilters,
  getConversationName,
  getConversationAvatar,
  getMessagePreview,
  getLastMessageTime,
  Message,
} from '@/services/endpoints/messaging';
import { useMessagingWebSocket } from '@/hooks/use-messaging-websocket';
import { scheduleMessageNotification } from '@/hooks/use-notification-observer';

export default function MessagesScreen() {
  const colors = Colors.light;
  const { user } = useAuth();

  // Refs
  const isFirstRender = useRef(true);
  const appState = useRef(AppState.currentState);
  const conversationsRef = useRef<Conversation[]>([]);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep conversations ref in sync
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Current user ID
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;

  // Fetch conversations from API
  const fetchConversations = useCallback(async (showLoading = true) => {
    try {
      setError(null);
      if (showLoading) setIsLoading(true);

      const filters: ConversationFilters = {};
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const response = await getConversations(filters);
      setConversations(response.conversations);
      setTotalUnreadCount(response.totalUnreadCount);
    } catch (err) {
      console.error('Conversations fetch error:', err);
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Handle new message from WebSocket
  const handleNewConversationMessage = useCallback((message: Message, conversationId: number) => {
    setConversations((prevConversations) => {
      const existingConversation = prevConversations.find((c) => c.id === conversationId);

      if (existingConversation) {
        // Show local notification for new message
        const senderName = message.user?.name || 'Bilinmeyen';
        const messageText = message.message || '';
        const conversationType = existingConversation.type === 'group' ? 'group' : 'private';

        scheduleMessageNotification(
          senderName,
          messageText,
          conversationId,
          conversationType
        );

        const updatedConversation: Conversation = {
          ...existingConversation,
          last_message: {
            message: message.message,
            created_at: 'Şimdi',
            sender_name: senderName,
          },
          unread_count: (existingConversation.unread_count || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        return [
          updatedConversation,
          ...prevConversations.filter((c) => c.id !== conversationId),
        ];
      }

      // If conversation doesn't exist, fetch the list (using ref to avoid closure issues)
      fetchConversations(false);
      return prevConversations;
    });

    setTotalUnreadCount((prev) => prev + 1);
  }, [fetchConversations]);

  // Handle participant added
  const handleParticipantAdded = useCallback(() => {
    fetchConversations(false);
  }, [fetchConversations]);

  // WebSocket for real-time updates
  const { isConnected, reconnect } = useMessagingWebSocket({
    userId: currentUserId as number,
    onNewConversationMessage: handleNewConversationMessage,
    onParticipantAdded: handleParticipantAdded,
  });

  // Handle AppState changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App came to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Re-initialize WebSocket connection
        await reconnect();
        // Refresh conversations
        fetchConversations(false);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [fetchConversations, reconnect]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Search with debounce
  useEffect(() => {
    // Skip initial render
    if (isFirstRender.current) return;

    const timeoutId = setTimeout(() => {
      fetchConversations();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchConversations]);

  // Refresh list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      // Refresh without showing loading spinner
      fetchConversations(false);
    }, [fetchConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations(false);
    setRefreshing(false);
  }, [fetchConversations]);

  // Sort conversations by last message time (newest first) - memoized
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [conversations]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const hasUnread = (item.unread_count || 0) > 0;
    const displayName = getConversationName(item, currentUserId);
    const avatar = getConversationAvatar(item, currentUserId);
    const lastMessagePreview = getMessagePreview(item.last_message);
    const timestamp = getLastMessageTime(item.last_message);

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: hasUnread ? colors.card : colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={() => router.push(`/message/${item.id}` as any)}
      >
        <View style={styles.avatarContainer}>
          {item.type === 'group' ? (
            <View style={[styles.groupAvatar, { backgroundColor: Brand.primary }]}>
              {avatar.url ? (
                <Avatar name={displayName} size="md" />
              ) : (
                <Users size={24} color="#FFFFFF" />
              )}
            </View>
          ) : (
            <Avatar
              name={displayName}
              size="md"
              source={avatar.url || undefined}
            />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationName,
                { color: colors.text },
                hasUnread && styles.unreadName,
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <View style={styles.headerRight}>
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {timestamp}
              </Text>
            </View>
          </View>

          {item.type === 'group' && item.participant_count && (
            <Text style={[styles.participants, { color: colors.textMuted }]}>
              {item.participant_count} kişi
            </Text>
          )}

          <View style={styles.lastMessageRow}>
            <Text
              style={[
                styles.lastMessage,
                { color: colors.textSecondary },
                hasUnread && styles.unreadMessage,
              ]}
              numberOfLines={2}
            >
              {item.last_message?.sender_name
                ? `${item.last_message.sender_name}: ${lastMessagePreview}`
                : lastMessagePreview || 'Henüz mesaj yok'}
            </Text>
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.unreadCount}>
                  {item.unread_count! > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Mesajlar yükleniyor...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchConversations();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <MessageCircle size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz mesajınız yok'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni konuşma başlatmak için + butonuna tıklayın'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title="Mesajlar"
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
            {/* Yeni Grup Butonu */}
            <TouchableOpacity
              onPress={() => router.push('/message/group/new' as any)}
              style={[styles.groupButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              activeOpacity={0.7}
            >
              <Users size={18} color="#FFFFFF" />
            </TouchableOpacity>
            {/* Plus Butonu */}
            <TouchableOpacity
              onPress={() => router.push('/message/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
            {totalUnreadCount > 0 && (
              <View style={[styles.headerUnreadBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.headerUnreadCount}>
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </View>
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Kişi veya mesaj ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Conversation List */}
      <FlatList
        data={sortedConversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  groupButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUnreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerUnreadCount: {
    ...Typography.bodyXS,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    ...Typography.bodyMD,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadName: {
    fontWeight: '700',
  },
  timestamp: {
    ...Typography.bodyXS,
  },
  participants: {
    ...Typography.bodyXS,
    marginBottom: 2,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    ...Typography.bodySM,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadCount: {
    ...Typography.bodyXS,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
