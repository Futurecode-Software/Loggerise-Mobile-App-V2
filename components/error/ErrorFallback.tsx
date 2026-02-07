/**
 * Error Fallback Ekranı
 *
 * ErrorBoundary bir hata yakaladığında gösterilen tam ekran bileşeni.
 * Proje temasına uygun gradient tasarım.
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, RotateCcw } from 'lucide-react-native'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
} from '@/constants/dashboard-theme'

interface Props {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: Props) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#022920', '#044134', '#065f4a']}
        style={[styles.header, { paddingTop: insets.top + DashboardSpacing['3xl'] }]}
      >
        {/* Glow Orbs (Statik) */}
        <View style={[styles.glowOrb, styles.glowOrb1]} />
        <View style={[styles.glowOrb, styles.glowOrb2]} />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertTriangle
            size={56}
            color={DashboardColors.danger}
            strokeWidth={1.5}
          />
        </View>

        <Text style={styles.title}>Bir Hata Oluştu</Text>
        <Text style={styles.subtitle}>
          Beklenmeyen bir sorun yaşandı. Lütfen uygulamayı yeniden başlatmayı deneyin.
        </Text>

        {__DEV__ && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText} numberOfLines={4}>
              {error.message}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={resetError}
          activeOpacity={0.8}
        >
          <RotateCcw size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.buttonText}>Yeniden Başlat</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  header: {
    paddingBottom: DashboardSpacing['5xl'],
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.15,
  },
  glowOrb1: {
    width: 200,
    height: 200,
    backgroundColor: DashboardColors.accent,
    top: -40,
    right: -60,
  },
  glowOrb2: {
    width: 150,
    height: 150,
    backgroundColor: DashboardColors.accent,
    bottom: -30,
    left: -40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['3xl'],
    marginTop: -DashboardSpacing['3xl'],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: DashboardBorderRadius['2xl'],
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing['2xl'],
  },
  title: {
    fontSize: DashboardFontSizes['3xl'],
    fontWeight: '700',
    color: DashboardColors.text,
    textAlign: 'center',
    marginBottom: DashboardSpacing.sm,
  },
  subtitle: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DashboardSpacing['3xl'],
  },
  errorBox: {
    backgroundColor: DashboardColors.dangerBg,
    borderRadius: DashboardBorderRadius.md,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing['2xl'],
    width: '100%',
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.primary,
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing.lg,
    borderRadius: DashboardBorderRadius.lg,
  },
  buttonText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
