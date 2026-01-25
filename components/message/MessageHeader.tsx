import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Settings, Users } from 'lucide-react-native';
import { Avatar } from '@/components/ui';
import { Colors, Brand } from '@/constants/theme';
import { ConversationDetail } from '@/services/endpoints/messaging';

interface MessageHeaderProps {
  conversation: ConversationDetail | null;
  typingUsers: Record<number, { name: string; userId: number }>;
  isConnected: boolean;
  participantCount: number;
  conversationId: string;
}

function MessageHeaderComponent({
  conversation,
  typingUsers,
  isConnected,
  participantCount,
  conversationId,
}: MessageHeaderProps) {
  const colors = Colors.light;

  const displayName = (() => {
    if (!conversation) return '';
    if (conversation.type === 'group') {
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

    if (conversation.type === 'group') {
      return conversation.description || `${participantCount} katılımcı`;
    }
    return conversation.other_user?.email || '';
  })();

  return (
    <View style={[styles.header, { backgroundColor: '#FFFFFF' }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={24} color={colors.text} />
      </TouchableOpacity>

      <Pressable style={styles.headerContent} onPress={() => Keyboard.dismiss()}>
        {conversation?.type === 'group' ? (
          <View style={[styles.groupAvatar, { backgroundColor: Brand.primary }]}>
            <Users size={20} color="#FFFFFF" />
          </View>
        ) : (
          <Avatar
            name={displayName}
            size="sm"
            source={conversation?.other_user?.profile_photo_url || undefined}
          />
        )}
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: Object.keys(typingUsers).length > 0 ? Brand.primary : colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </Pressable>

      {conversation?.type === 'group' && (
        <TouchableOpacity
          onPress={() => router.push(`/message/group/${conversationId}` as any)}
          style={styles.settingsButton}
        >
          <Settings size={22} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export const MessageHeader = memo(MessageHeaderComponent);

const styles = StyleSheet.create({
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
});
