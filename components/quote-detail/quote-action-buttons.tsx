/**
 * QuoteActionButtons Component
 *
 * Displays action buttons for quote operations: send, duplicate, export PDF.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Send, Copy, FileDown } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Brand } from '@/constants/theme';

interface QuoteActionButtonsProps {
  status: string;
  isSending: boolean;
  isDuplicating: boolean;
  onSend: () => void;
  onDuplicate: () => void;
  onExportPdf: () => void;
  colors?: typeof Colors.light;
}

export function QuoteActionButtons({
  status,
  isSending,
  isDuplicating,
  onSend,
  onDuplicate,
  onExportPdf,
  colors = Colors.light,
}: QuoteActionButtonsProps) {
  return (
    <View style={styles.container}>
      {status === 'draft' ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Brand.primary }]}
          onPress={onSend}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Gönder</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        ]}
        onPress={onDuplicate}
        disabled={isDuplicating}
      >
        {isDuplicating ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <>
            <Copy size={20} color={colors.text} />
            <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>Kopyala</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        ]}
        onPress={onExportPdf}
      >
        <FileDown size={20} color={colors.text} />
        <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>PDF İndir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  actionButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
