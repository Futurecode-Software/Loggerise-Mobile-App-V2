/**
 * DatesInfoCard Component
 *
 * Displays quote dates and related information.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Send, User } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { InfoRow } from './info-row';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';
import { Quote, formatDate } from '@/services/endpoints/quotes';

interface DatesInfoCardProps {
  quote: Quote;
  colors?: typeof Colors.light;
}

export function DatesInfoCard({ quote, colors = Colors.light }: DatesInfoCardProps) {
  const preparedByName = quote.preparedBy?.name || (quote as any).prepared_by?.name;

  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <Calendar size={20} color={Brand.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarihler ve Bilgiler</Text>
      </View>

      <InfoRow label="Teklif Tarihi" value={formatDate(quote.quote_date)} icon={Calendar} colors={colors} />
      <InfoRow label="Geçerlilik Tarihi" value={formatDate(quote.valid_until)} icon={Calendar} colors={colors} />
      <InfoRow label="Oluşturulma" value={formatDate(quote.created_at)} icon={Calendar} colors={colors} />
      {quote.sent_at ? (
        <InfoRow label="Gönderim" value={formatDate(quote.sent_at)} icon={Send} colors={colors} />
      ) : null}
      {preparedByName ? (
        <InfoRow label="Hazırlayan" value={preparedByName} icon={User} colors={colors} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
});
