/**
 * Conversation Detail Screen
 *
 * Unified screen for both direct messages and group conversations.
 * Uses shared MessageListView component.
 * Group settings accessible via full-page navigation.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useLocalSearchParams, router } from 'expo-router';
import { Settings, Users } from 'lucide-react-native';
import { Colors, Brand } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useConversationMessages } from '@/hooks/use-conversation-messages';
import { MessageListView, MessageInput } from '@/components/message';
import { FullScreenHeader } from '@/components/header';
import { Avatar } from '@/components/ui';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;
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

  // Determine if this is a group conversation
  const isGroupConversation = conversation?.type === 'group';

  // Header content
  const displayName = (() => {
    if (!conversation) return 'Mesajlar';
    if (isGroupConversation) {
      return conversation.name || 'İsimsiz Grup';
    }
    return conversation.other_user?.name || conversation.name || 'Bilinmeyen';
  })();

  const subtitle = (() => {
    if (!conversation) return '';

    const typingUsersList = Object.values(typingUsers);
    if (typingUsersList.length > 0) {
      return `${typingUsersList[0].name} yazıyor...`;
    }

    if (!isConnected) {
      return 'Bağlanıyor...';
    }

    if (isGroupConversation) {
      return conversation.description || `${participants.length} katılımcı`;
    }
    return conversation.other_user?.email || '';
  })();

  // Navigate to group settings
  const handleOpenGroupSettings = () => {
    router.push(`/message/group/${id}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F0F2F5' }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title={displayName}
        subtitle={subtitle}
        showBackButton
        leftIcon={
          isGroupConversation ? (
            <View style={[styles.groupAvatar, { backgroundColor: Brand.primary }]}>
              <Users size={20} color="#FFFFFF" />
            </View>
          ) : (
            <Avatar
              name={displayName}
              size="sm"
              source={conversation?.other_user?.profile_photo_url || undefined}
            />
          )
        }
        rightIcons={
          isGroupConversation ? (
            <TouchableOpacity onPress={handleOpenGroupSettings} activeOpacity={0.7}>
              <Settings size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />

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
      />

      {/* Input */}
      <MessageInput
        value={newMessage}
        onChangeText={handleTextChange}
        onSend={handleSendMessage}
        isSending={isSending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  groupAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
