import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Keyboard,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import {
  Plus,
  Sparkles,
  Trash2,
  Search,
  Bot,
  MessageSquare,
  AlertCircle,
  KeyRound,
  Settings,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { formatConversationTime, AiConversation, deleteConversation } from '@/services/endpoints/loggy';
import { useLoggyConversations } from '@/hooks/use-logy-conversations';
import { useLoggyMessages } from '@/hooks/use-logy-messages';
import { useLoggySearch } from '@/hooks/use-logy-search';
import { ViewMode } from '@/components/loggy/constants';
import { TypingIndicator } from '@/components/loggy/TypingIndicator';
import { QuickSuggestions } from '@/components/loggy/QuickSuggestions';
import { MessageBubble } from '@/components/loggy/MessageBubble';
import { LoggyInput } from '@/components/loggy/LoggyInput';
import { FullScreenHeader } from '@/components/header';
import { ConfirmDialog } from '@/components/ui';

export default function LoggyScreen() {
  const colors = Colors.light;
  const flatListRef = useRef<FlatList>(null);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [inputValue, setInputValue] = useState('');
  const [isAiConfigured] = useState(true); // TODO: Get from API
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

  // Custom hooks
  const {
    conversations,
    currentConversation,
    isLoading: isLoadingConversations,
    refreshing,
    error: conversationsError,
    createNewConversation,
    selectConversation,
    handleDelete,
    refresh,
  } = useLoggyConversations();

  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    error: messagesError,
    sendMessage,
    clearError,
  } = useLoggyMessages({ conversation: currentConversation });

  const {
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    clearSearch,
  } = useLoggySearch();

  // Inverted messages for FlatList (newest first)
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Animated style for keyboard
  const animatedListStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value,
  }));

  // Create new conversation handler
  const handleCreateNewConversation = async () => {
    try {
      const newConversation = await createNewConversation();
      setViewMode('chat');
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Select conversation handler
  const handleSelectConversation = async (conversation: AiConversation) => {
    selectConversation(conversation);
    setViewMode('chat');
  };

  // Send message handler
  const handleSend = async () => {
    if (!inputValue.trim() || !currentConversation || isSending) return;
    const messageContent = inputValue;
    setInputValue('');
    await sendMessage(messageContent);
  };

  // Handle suggestion click
  const handleSuggestionClick = async (prompt: string) => {
    if (isLoadingMessages || !isAiConfigured) return;

    try {
      const newConversation = await createNewConversation();
      setViewMode('chat');
      setInputValue(prompt);
      
      // Send the prompt after a short delay
      setTimeout(async () => {
        setInputValue('');
        await sendMessage(prompt);
      }, 100);
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Go back to list
  const goBackToList = () => {
    setViewMode('list');
    clearError();
    clearSearch();
    refresh();
  };

  // Handle delete click - show dialog
  const handleDeleteClick = (conversationId: number) => {
    setConversationToDelete(conversationId);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete);
        // If deleted conversation was current, go back to list
        if (currentConversation?.id === conversationToDelete) {
          setViewMode('list');
        }
        // Refresh the list to reflect the deletion
        refresh();
      } catch (err) {
        console.error('Delete conversation error:', err);
      } finally {
        setShowDeleteDialog(false);
        setConversationToDelete(null);
      }
    }
  };

  // Render conversation list item
  const renderConversationItem = ({ item }: { item: AiConversation }) => (
    <View
      style={[
        styles.conversationItem,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
        currentConversation?.id === item.id && {
          backgroundColor: Brand.primary + '15',
        },
      ]}
    >
      <TouchableOpacity
        style={styles.conversationTouchable}
        onPress={() => handleSelectConversation(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.conversationIcon, { backgroundColor: Brand.primary + '15' }]}>
          <MessageSquare size={20} color={Brand.primary} />
        </View>
        <View style={styles.conversationContent}>
          <Text style={[styles.conversationTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.conversationTime, { color: colors.textMuted }]}>
            {formatConversationTime(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteClick(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );

  // Render list empty state
  const renderListEmpty = () => {
    if (isLoadingConversations) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Konuşmalar yükleniyor...
          </Text>
        </View>
      );
    }

    if (conversationsError) {
      return (
        <View style={styles.centerState}>
          <View style={[styles.stateIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={48} color={colors.danger} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {conversationsError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => refresh()}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerState}>
        <View style={[styles.stateIcon, { backgroundColor: Brand.primary + '15' }]}>
          <Sparkles size={48} color={Brand.primary} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Henüz konuşma yok</Text>
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Loggy AI ile yük oluşturma, cari arama gibi işlemler için bana yazabilirsiniz.
        </Text>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: Brand.primary }]}
          onPress={handleCreateNewConversation}
        >
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={styles.startButtonText} numberOfLines={1}>
            Yeni Konuşma Başlat
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    const displayConversations = searchQuery.length >= 2 ? searchResults : conversations;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Full Screen Header */}
        <FullScreenHeader
          title="Loggy"
          subtitle="AI Asistan"
          showBackButton
          leftIcon={<Sparkles size={20} color="#FFFFFF" />}
          rightIcons={
            <TouchableOpacity onPress={handleCreateNewConversation} activeOpacity={0.7}>
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          }
        />

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Sohbetlerde ara..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && <ActivityIndicator size="small" color={Brand.primary} />}
        </View>

        {/* Conversations List */}
        <FlatList
          data={displayConversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderListEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Brand.primary}
            />
          }
        />

        {/* FAB */}
        {conversations.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
            onPress={handleCreateNewConversation}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          visible={showDeleteDialog}
          title="Konuşmayı Sil"
          message="Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          confirmText="Sil"
          cancelText="İptal"
          isDangerous
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setConversationToDelete(null);
          }}
        />
      </View>
    );
  }

  // ============ CHAT VIEW ============
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title={currentConversation?.title || 'Yeni Konuşma'}
        subtitle={
          currentConversation
            ? formatConversationTime(currentConversation.created_at)
            : 'Doğal dille sorgula'
        }
        showBackButton
        onBackPress={goBackToList}
        leftIcon={<Bot size={20} color="#FFFFFF" />}
        rightIcons={
          currentConversation ? (
            <TouchableOpacity
              onPress={() => handleDeleteClick(currentConversation.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* API Not Configured Overlay */}
      {!isAiConfigured && (
        <View style={styles.overlay}>
          <View style={[styles.overlayContent, { backgroundColor: colors.card }]}>
            <View style={[styles.overlayIcon, { backgroundColor: '#fbbf24' + '15' }]}>
              <KeyRound size={32} color="#f59e0b" />
            </View>
            <Text style={[styles.overlayTitle, { color: colors.text }]}>
              API Anahtarı Gerekli
            </Text>
            <Text style={[styles.overlayText, { color: colors.textSecondary }]}>
              Loggy AI asistanını kullanabilmek için önce API ayarlarınızı yapılandırmanız
              gerekiyor. Sistem ayarlarından API anahtarınızı ve model bilgilerinizi girin.
            </Text>
            <TouchableOpacity
              style={[styles.overlayButton, { backgroundColor: Brand.primary }]}
              onPress={() => router.push('/settings' as any)}
            >
              <Settings size={18} color="#FFFFFF" />
              <Text style={styles.overlayButtonText}>Sistem Ayarlarına Git</Text>
            </TouchableOpacity>
          </View>
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
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Mesajlar yükleniyor...
            </Text>
          </View>
        ) : messagesError ? (
          <View style={[styles.messagesContainer, styles.centerContainer]}>
            <AlertCircle size={64} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{messagesError}</Text>
          </View>
        ) : invertedMessages.length === 0 && !isSending ? (
          <View style={[styles.messagesContainer, styles.emptyStateContainer]}>
            <View style={styles.emptyStateContent}>
              <View style={[styles.emptyStateIcon, { backgroundColor: Brand.primary + '15' }]}>
                <Sparkles size={48} color={Brand.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz mesaj yok</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]} numberOfLines={0}>
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
                autoscrollToTopThreshold: 100,
              }}
              style={styles.flatList}
              ListHeaderComponent={
                isSending ? (
                  <TypingIndicator />
                ) : messagesError ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15' }]}>
                    <AlertCircle size={16} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>{messagesError}</Text>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Konuşmayı Sil"
        message="Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDangerous
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setConversationToDelete(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMD,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    borderBottomWidth: 1,
  },
  conversationTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  conversationContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  conversationTitle: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  conversationTime: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['4xl'],
  },
  stateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  stateTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  stateText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginTop: Spacing.sm,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing['5xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 320,
    ...(Platform.OS === 'android' && {
      flexShrink: 0,
    }),
  },
  startButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
    flexShrink: 0,
    ...(Platform.OS === 'android' && {
      includeFontPadding: false,
      textAlignVertical: 'center',
    }),
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.lg,
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  quickSuggestionsWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySM,
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: Spacing.xl,
  },
  overlayContent: {
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    ...Shadows.lg,
  },
  overlayIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  overlayTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  overlayText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  overlayButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
