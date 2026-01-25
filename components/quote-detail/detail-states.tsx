/**
 * Detail States Components
 *
 * Loading and Error state components for detail screens.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Brand } from '@/constants/theme';

interface LoadingStateProps {
  message?: string;
  colors?: typeof Colors.light;
}

export function LoadingState({ message = 'Yükleniyor...', colors = Colors.light }: LoadingStateProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={Brand.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  colors?: typeof Colors.light;
}

export function ErrorState({
  title = 'Bir hata oluştu',
  message = 'Veriler yüklenemedi',
  onRetry,
  colors = Colors.light,
}: ErrorStateProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <AlertCircle size={64} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{message}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: Brand.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
});
