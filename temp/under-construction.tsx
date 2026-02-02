import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Construction, ArrowLeft } from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';

export default function UnderConstructionScreen() {
  const colors = Colors.light;
  const { title } = useLocalSearchParams<{ title?: string }>();

  const pageTitle = title || 'Bu Sayfa';

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader title="Yapım Aşamasında" showBackButton />

      <View style={styles.content}>
        <View style={styles.contentContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
            <Construction size={64} color={colors.warning} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {pageTitle} Yapım Aşamasında
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Bu özellik şu anda geliştirme aşamasındadır. En kısa sürede kullanıma sunulacaktır.
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Brand.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.headingLG,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
