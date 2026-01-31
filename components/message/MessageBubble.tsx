/**
 * MessageBubble Component
 *
 * Modern mesaj balonu - CLAUDE.md tasarım standartlarına uygun
 * Dashboard theme renkleri ve modern görünüm
 */

import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Avatar } from '@/components/ui'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { Message } from '@/services/endpoints/messaging'

interface MessageBubbleProps {
  item: Message
  isFirstInGroup: boolean
  isLastInGroup: boolean
  isGroupConversation: boolean
}

function MessageBubbleComponent({
  item,
  isFirstInGroup,
  isLastInGroup,
  isGroupConversation
}: MessageBubbleProps) {
  const isMine = item.is_mine

  return (
    <View
      style={[
        styles.messageRow,
        isMine ? styles.messageRowMine : styles.messageRowOther,
        !isLastInGroup && styles.messageRowGrouped
      ]}
    >
      {/* Avatar only for other users, only on last message in group */}
      {!isMine && (
        <View style={styles.avatarContainer}>
          {isLastInGroup ? (
            <Avatar
              name={item.user?.name || 'Unknown'}
              size="xs"
              source={item.user?.profile_photo_url || undefined}
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
      )}

      {/* Message bubble */}
      {isMine ? (
        <LinearGradient
          colors={[DashboardColors.primary, DashboardColors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.messageBubble,
            styles.messageBubbleMine,
            isFirstInGroup && styles.bubbleFirstMine,
            isLastInGroup && styles.bubbleLastMine
          ]}
        >
          <View style={styles.messageContent}>
            <Text style={styles.messageTextMine}>{item.message}</Text>
            <Text style={styles.messageTimeMine}>
              {item.formatted_time || ''}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.messageBubble,
            styles.messageBubbleOther,
            isFirstInGroup && styles.bubbleFirstOther,
            isLastInGroup && styles.bubbleLastOther
          ]}
        >
          {/* Sender name only in groups, only on first message */}
          {isGroupConversation && isFirstInGroup && (
            <Text style={styles.senderName}>{item.user?.name || 'Unknown'}</Text>
          )}
          <View style={styles.messageContent}>
            <Text style={styles.messageTextOther}>{item.message}</Text>
            <Text style={styles.messageTimeOther}>
              {item.formatted_time || ''}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

export const MessageBubble = memo(MessageBubbleComponent)

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingHorizontal: DashboardSpacing.sm,
    alignItems: 'flex-end'
  },
  messageRowGrouped: {
    marginBottom: 1
  },
  messageRowMine: {
    justifyContent: 'flex-end'
  },
  messageRowOther: {
    justifyContent: 'flex-start'
  },
  avatarContainer: {
    width: 28,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  avatarPlaceholder: {
    width: 28,
    height: 28
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: DashboardBorderRadius.xl
  },
  messageBubbleMine: {
    borderTopRightRadius: DashboardBorderRadius.xl,
    borderTopLeftRadius: DashboardBorderRadius.xl,
    borderBottomLeftRadius: DashboardBorderRadius.xl,
    borderBottomRightRadius: 4,
    marginLeft: 50,
    ...DashboardShadows.sm
  },
  messageBubbleOther: {
    backgroundColor: DashboardColors.surface,
    borderTopRightRadius: DashboardBorderRadius.xl,
    borderTopLeftRadius: DashboardBorderRadius.xl,
    borderBottomRightRadius: DashboardBorderRadius.xl,
    borderBottomLeftRadius: 4,
    ...DashboardShadows.sm
  },
  bubbleFirstOther: {
    borderTopLeftRadius: DashboardBorderRadius.xl
  },
  bubbleFirstMine: {
    borderTopRightRadius: DashboardBorderRadius.xl
  },
  bubbleLastOther: {
    borderBottomLeftRadius: 4,
    marginBottom: DashboardSpacing.sm
  },
  bubbleLastMine: {
    borderBottomRightRadius: 4,
    marginBottom: DashboardSpacing.sm
  },
  senderName: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
    color: DashboardColors.primary,
    marginBottom: 4,
    letterSpacing: 0.2
  },
  messageContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  messageTextMine: {
    fontSize: DashboardFontSizes.base,
    lineHeight: 22,
    color: '#fff',
    flexShrink: 1
  },
  messageTextOther: {
    fontSize: DashboardFontSizes.base,
    lineHeight: 22,
    color: DashboardColors.textPrimary,
    flexShrink: 1
  },
  messageTimeMine: {
    fontSize: DashboardFontSizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 10,
    marginTop: 2,
    alignSelf: 'flex-end'
  },
  messageTimeOther: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginLeft: 10,
    marginTop: 2,
    alignSelf: 'flex-end'
  }
})
