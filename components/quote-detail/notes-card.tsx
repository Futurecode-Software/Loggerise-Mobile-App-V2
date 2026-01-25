/**
 * NotesCard Component
 *
 * Displays quote notes including terms, internal notes, and customer notes.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface NotesCardProps {
  termsConditions?: string | null;
  internalNotes?: string | null;
  customerNotes?: string | null;
  colors?: typeof Colors.light;
}

function NoteSection({
  label,
  text,
  colors,
}: {
  label: string;
  text: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.noteSection}>
      <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.noteText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

export function NotesCard({
  termsConditions,
  internalNotes,
  customerNotes,
  colors = Colors.light,
}: NotesCardProps) {
  const hasNotes = termsConditions || internalNotes || customerNotes;

  if (!hasNotes) {
    return null;
  }

  return (
    <Card style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notlar</Text>

      {termsConditions ? (
        <NoteSection label="Şartlar ve Koşullar:" text={termsConditions} colors={colors} />
      ) : null}

      {internalNotes ? (
        <NoteSection label="Dahili Notlar:" text={internalNotes} colors={colors} />
      ) : null}

      {customerNotes ? (
        <NoteSection label="Müşteri Notları:" text={customerNotes} colors={colors} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    ...Typography.headingMD,
  },
  noteSection: {
    marginBottom: Spacing.md,
  },
  noteLabel: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  noteText: {
    ...Typography.bodySM,
    lineHeight: 20,
  },
});
