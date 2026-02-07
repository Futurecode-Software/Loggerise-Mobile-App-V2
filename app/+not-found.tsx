/**
 * 404 - Sayfa Bulunamadı
 *
 * Geçersiz route'lara gidildiğinde Expo Router tarafından gösterilen sayfa.
 * Auth sayfalarıyla aynı tasarım dili: AuthHeader + beyaz card.
 */

import React, { useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Link, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import AuthHeader from '@/components/auth/AuthHeader'
import { logError } from '@/utils/error-logger'
import {
  AuthColors,
  AuthSpacing,
  AuthBorderRadius,
  AuthFontSizes,
  AuthShadows,
} from '@/constants/auth-styles'

export default function NotFoundScreen() {
  const pathname = usePathname()
  const loggedRef = useRef(false)

  useEffect(() => {
    if (loggedRef.current) return
    loggedRef.current = true

    logError(new Error(`404 - Route not found: ${pathname}`), {
      errorType: 'route_not_found',
      screen: '+not-found',
      additionalData: {
        attempted_path: pathname,
      },
    })
  }, [pathname])
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <AuthHeader
        title="Kayıp Sayfa"
        subtitle="Aradığınız içerik burada değil gibi görünüyor"
        iconType="not-found"
      />

      <View style={styles.card}>
        {/* 404 Badge */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.badgeContainer}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>404</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>Sayfa Bulunamadı</Text>
          <Text style={styles.subtitle}>
            Aradığınız sayfa mevcut değil, taşınmış veya kaldırılmış olabilir.
          </Text>
        </Animated.View>

        {/* Hint */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.hintBox}
        >
          <Ionicons name="information-circle-outline" size={18} color={AuthColors.primary} />
          <Text style={styles.hintText}>
            URL&apos;yi kontrol edin veya ana sayfaya dönün
          </Text>
        </Animated.View>

        {/* Action Button */}
        <Link href="/" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
            <View style={styles.buttonIcon}>
              <Ionicons name="arrow-forward" size={18} color={AuthColors.white} />
            </View>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuthColors.primary,
  },
  card: {
    flex: 1,
    backgroundColor: AuthColors.white,
    paddingHorizontal: AuthSpacing['2xl'],
    paddingTop: AuthSpacing['3xl'],
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: AuthSpacing.xl,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: AuthBorderRadius['2xl'],
    backgroundColor: AuthColors.warningLight,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 32,
    fontWeight: '800',
    color: AuthColors.warning,
    letterSpacing: -1,
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
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AuthSpacing.sm,
    backgroundColor: 'rgba(4, 65, 52, 0.05)',
    paddingHorizontal: AuthSpacing.lg,
    paddingVertical: AuthSpacing.md,
    borderRadius: AuthBorderRadius.md,
    marginBottom: AuthSpacing['3xl'],
  },
  hintText: {
    fontSize: AuthFontSizes.md,
    color: AuthColors.textSecondary,
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
