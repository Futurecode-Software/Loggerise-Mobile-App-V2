/**
 * Error Fallback Ekranı
 *
 * ErrorBoundary bir hata yakaladığında gösterilen tam ekran bileşeni.
 * Auth sayfalarıyla aynı tasarım dili: AuthHeader + beyaz card.
 *
 * NOT: Bu component AuthProvider dışında render edilebilir (ErrorBoundary
 * tüm provider'ları sarmalar). Bu yüzden AuthHeader'ı doğrudan kullanmak
 * yerine, aynı görsel yapıyı inline olarak oluşturuyoruz.
 */

import React from 'react'
import { View, Text, Pressable, Image, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import {
  AuthColors,
  AuthSpacing,
  AuthBorderRadius,
  AuthFontSizes,
  AuthSizes,
  AuthShadows,
} from '@/constants/auth-styles'

const LogoWhite = require('../../assets/images/logo-white.png')

interface Props {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: Props) {
  return (
    <View style={styles.container}>
      {/* Header - AuthHeader tarzı */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#054a3a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Dekoratif ikonlar */}
        <View style={styles.decorativePrimary}>
          <Ionicons name="warning-outline" size={100} color="rgba(255,255,255,0.15)" />
        </View>
        <View style={styles.decorativeSecondary}>
          <Ionicons name="bug-outline" size={60} color="rgba(255,255,255,0.08)" />
        </View>
        <View style={styles.decorativeTertiary}>
          <Ionicons name="refresh-outline" size={40} color="rgba(255,255,255,0.1)" />
        </View>

        {/* Glass orb'lar */}
        <View style={styles.glowOrb} />
        <View style={styles.glassOrb1} />
        <View style={styles.glassOrb2} />

        {/* Content */}
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image source={LogoWhite} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>Bir Sorun Oluştu</Text>
          <Text style={styles.headerSubtitle}>
            Uygulama beklenmedik bir hatayla karşılaştı
          </Text>
        </View>

        {/* Bottom curve */}
        <View style={styles.curveOverlay} />
      </View>

      {/* Card content */}
      <View style={styles.card}>
        {/* Error Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="alert-circle" size={40} color={AuthColors.error} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Beklenmeyen Hata</Text>
          <Text style={styles.subtitle}>
            Uygulamayı yeniden başlatarak sorunu çözebilirsiniz.
            Sorun devam ederse destek ekibimize ulaşın.
          </Text>
        </View>

        {/* Dev mode error detail */}
        {__DEV__ && (
          <View style={styles.errorBox}>
            <View style={styles.errorBoxHeader}>
              <Ionicons name="code-slash-outline" size={14} color={AuthColors.error} />
              <Text style={styles.errorBoxLabel}>Hata Detayı</Text>
            </View>
            <Text style={styles.errorText} numberOfLines={4}>
              {error.message}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <Pressable style={styles.button} onPress={resetError}>
          <Text style={styles.buttonText}>Yeniden Başlat</Text>
          <View style={styles.buttonIcon}>
            <Ionicons name="refresh" size={18} color={AuthColors.white} />
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuthColors.primary,
  },
  // Header
  headerContainer: {
    paddingTop: 60,
    paddingBottom: AuthSpacing['4xl'],
    paddingHorizontal: AuthSpacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
    minHeight: 220,
  },
  headerContent: {
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: AuthSpacing.xl,
  },
  logo: {
    width: AuthSizes.logoWidth,
    height: AuthSizes.logoHeight,
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: AuthFontSizes['5xl'],
    fontWeight: '700',
    color: AuthColors.textOnDark,
    marginBottom: AuthSpacing.sm,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: AuthFontSizes.lg,
    color: AuthColors.textOnDarkMuted,
    lineHeight: 22,
    maxWidth: '85%',
  },
  // Dekoratif elementler
  glowOrb: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  decorativePrimary: {
    position: 'absolute',
    top: 30,
    right: 10,
  },
  decorativeSecondary: {
    position: 'absolute',
    top: 100,
    right: 80,
  },
  decorativeTertiary: {
    position: 'absolute',
    top: 60,
    right: 130,
  },
  glassOrb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassOrb2: {
    position: 'absolute',
    bottom: 20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: AuthColors.white,
    borderTopLeftRadius: AuthSpacing['3xl'],
    borderTopRightRadius: AuthSpacing['3xl'],
  },
  // Card
  card: {
    flex: 1,
    backgroundColor: AuthColors.white,
    paddingHorizontal: AuthSpacing['2xl'],
    paddingTop: AuthSpacing.lg,
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: AuthSpacing.xl,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: AuthBorderRadius['2xl'],
    backgroundColor: AuthColors.errorLight,
    borderWidth: 1.5,
    borderColor: AuthColors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: AuthSpacing['2xl'],
  },
  title: {
    fontSize: AuthFontSizes['4xl'],
    fontWeight: '700',
    color: AuthColors.textPrimary,
    marginBottom: AuthSpacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: AuthFontSizes.base,
    color: AuthColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  errorBox: {
    backgroundColor: AuthColors.errorLight,
    borderRadius: AuthBorderRadius.md,
    padding: AuthSpacing.lg,
    marginBottom: AuthSpacing['2xl'],
    width: '100%',
    borderWidth: 1,
    borderColor: AuthColors.errorBorder,
  },
  errorBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.xs,
    marginBottom: AuthSpacing.sm,
  },
  errorBoxLabel: {
    fontSize: AuthFontSizes.xs,
    fontWeight: '600',
    color: AuthColors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: AuthFontSizes.sm,
    color: AuthColors.error,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  button: {
    backgroundColor: AuthColors.primary,
    height: 56,
    borderRadius: AuthBorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AuthSpacing.sm,
    paddingHorizontal: AuthSpacing['3xl'],
    ...AuthShadows.glow,
  },
  buttonText: {
    color: AuthColors.white,
    fontSize: AuthFontSizes.xl,
    fontWeight: '700',
  },
  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: AuthSpacing.xs,
  },
})
