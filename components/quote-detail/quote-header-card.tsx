/**
 * QuoteHeaderCard Component
 *
 * Displays the quote header with number, status, and customer info.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText, User } from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
import { Quote, getQuoteStatusLabel, getQuoteStatusVariant } from '@/services/endpoints/quotes';

interface QuoteHeaderCardProps {
  quote: Quote;
  colors?: typeof Colors.light;
}

export function QuoteHeaderCard({ quote, colors = Colors.light }: QuoteHeaderCardProps) {
  return (
    <Card style={styles.headerCard}>
      <View style={styles.headerCardTop}>
        <View style={[styles.quoteIcon, { backgroundColor: colors.surface }]}>
          <FileText size={32} color={Brand.primary} />
        </View>
        <View style={styles.headerCardInfo}>
          <Text style={[styles.quoteNumber, { color: colors.text }]}>{quote.quote_number}</Text>
          <Badge
            label={getQuoteStatusLabel(quote.status)}
            variant={getQuoteStatusVariant(quote.status)}
            size="sm"
          />
        </View>
      </View>

      {quote.customer ? (
        <View style={styles.customerRow}>
          <User size={16} color={colors.textMuted} />
          <Text style={[styles.customerText, { color: colors.textSecondary }]}>
            {quote.customer.name}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: 0,
  },
  headerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quoteIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerCardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  quoteNumber: {
    ...Typography.headingMD,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customerText: {
    ...Typography.bodyMD,
  },
});
