/**
 * Checks List Screen (Placeholder)
 *
 * Coming soon - Full CRUD implementation planned for Phase 3
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ChevronLeft, FileCheck, Construction } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';

export default function ChecksScreen() {
  const colors = Colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Çekler</Text>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
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
