/**
 * Checks List Screen (Placeholder)
 *
 * Coming soon - Full CRUD implementation planned for Phase 3
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FileCheck, Construction } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';

export default function ChecksScreen() {
  const colors = Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader title="Çekler" showBackButton={true} />

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${Brand.primary}15` }]}>
          <FileCheck size={64} color={Brand.primary} />
        </View>
        <Construction size={32} color={colors.warning} style={styles.constructionIcon} />
        <Text style={[styles.title, { color: colors.text }]}>Yakın Zamanda</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Çek yönetimi modülü üzerinde çalışmalar devam ediyor. Kısa sürede kullanıma açılacaktır.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  constructionIcon: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.headingLG,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
    lineHeight: 22,
  },
});
