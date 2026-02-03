/**
 * MessageBubble Component
 *
 * Individual message bubble for Loggy AI chat.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bot, CheckCircle, XCircle } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { AiMessage , formatMessageTime } from '@/services/endpoints/loggy';

import { useToast } from '@/hooks/use-toast';

interface MessageBubbleProps {
  message: AiMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const colors = Colors.light;
  const toast = useToast();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const hasConfirmation = message.content?.includes('onayınız gerekiyor');

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: Brand.primary }]
            : [styles.aiBubble, { backgroundColor: colors.surface }],
        ]}
      >
        {!isUser && (
          <View style={styles.aiHeader}>
            <Bot size={14} color={Brand.primary} />
            <Text style={[styles.aiLabel, { color: Brand.primary }]}>Loggy AI</Text>
          </View>
        )}
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#FFFFFF' : colors.text },
          ]}
        >
          {message.content}
        </Text>

        {/* Confirmation buttons */}
        {hasConfirmation && isAssistant && (
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: '#10b981' }]}
              onPress={() => {
                // TODO: Get execution ID from message
                toast.info('Onay özelliği yakında eklenecek');
              }}
            >
              <CheckCircle size={14} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => {
                toast.info('İptal özelliği yakında eklenecek');
              }}
            >
              <XCircle size={14} color={colors.danger} />
              <Text style={[styles.cancelButtonText, { color: colors.danger }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.timestamp,
          { color: colors.textMuted },
          isUser && styles.userTimestamp,
        ]}
      >
        {formatMessageTime(message.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userBubble: {
    borderBottomRightRadius: BorderRadius.sm,
  },
  aiBubble: {
    borderBottomLeftRadius: BorderRadius.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  aiLabel: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  messageText: {
    ...Typography.bodyMD,
    lineHeight: 22,
  },
  timestamp: {
    ...Typography.bodyXS,
    marginTop: Spacing.xs,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    ...Typography.bodySM,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
});
