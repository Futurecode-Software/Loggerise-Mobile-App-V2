/**
 * 404 - Sayfa Bulunamadı
 *
 * Geçersiz route'lara gidildiğinde Expo Router tarafından gösterilen sayfa.
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FileQuestion, Home } from 'lucide-react-native'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
} from '@/constants/dashboard-theme'

export default function NotFoundScreen() {
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
          <FileQuestion
            size={56}
            color={DashboardColors.warning}
            strokeWidth={1.5}
          />
        </View>

        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Sayfa Bulunamadı</Text>
        <Text style={styles.subtitle}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </Text>

        <Link href="/" asChild>
          <TouchableOpacity style={styles.button} activeOpacity={0.8}>
            <Home size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </Link>
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
    backgroundColor: DashboardColors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg,
  },
  code: {
    fontSize: DashboardFontSizes['6xl'],
    fontWeight: '800',
    color: DashboardColors.textMuted,
    marginBottom: DashboardSpacing.xs,
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
