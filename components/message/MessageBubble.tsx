import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui';
import { Colors, Brand, Spacing } from '@/constants/theme';
import { Message } from '@/services/endpoints/messaging';

interface MessageBubbleProps {
  item: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isGroupConversation: boolean;
}

function MessageBubbleComponent({
  item,
  isFirstInGroup,
  isLastInGroup,
  isGroupConversation,
}: MessageBubbleProps) {
  const colors = Colors.light;
  const isMine = item.is_mine;

  return (
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
              name={item.user?.name || 'Unknown'}
              size="sm"
              source={item.user?.profile_photo_url || undefined}
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
          isFirstInGroup && !isMine && styles.bubbleFirstOther,
          isFirstInGroup && isMine && styles.bubbleFirstMine,
          isLastInGroup && !isMine && styles.bubbleLastOther,
          isLastInGroup && isMine && styles.bubbleLastMine,
        ]}
      >
        {/* Sender name only in groups, only on first message */}
        {!isMine && isGroupConversation && isFirstInGroup && (
          <Text style={styles.senderName}>{item.user?.name || 'Unknown'}</Text>
        )}
        <View style={styles.messageContent}>
          <Text style={[styles.messageText, { color: isMine ? '#FFFFFF' : colors.text }]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isMine ? styles.messageTimeMine : styles.messageTimeOther]}>
            {item.formatted_time || ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

const styles = StyleSheet.create({
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
});
