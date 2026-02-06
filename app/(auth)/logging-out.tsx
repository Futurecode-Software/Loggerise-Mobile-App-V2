/**
 * Çıkış Yapılıyor Sayfası
 *
 * Logout işlemi sırasında gösterilen loading ekranı
 * - BackHandler ile geri tuşunu engeller
 * - Logout işlemini otomatik başlatır
 * - Tamamlandığında login sayfasına yönlendirir
 */

import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, BackHandler, Image } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '@/context/auth-context'
import { DashboardColors, DashboardFontSizes, DashboardSpacing } from '@/constants/dashboard-theme'

const LogoWhite = require('../../assets/images/logo-white.png')

export default function LoggingOutScreen() {
  const { logout } = useAuth()
  const hasLoggedOut = useRef(false)

  // Animasyon değerleri
  const opacity1 = useSharedValue(0.3)
  const opacity2 = useSharedValue(0.3)
  const opacity3 = useSharedValue(0.3)
  const logoOpacity = useSharedValue(0)

  // BackHandler - Geri tuşunu engelle
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // true dönerek back button'ı engelliyoruz
      return true
    })

    return () => backHandler.remove()
  }, [])

  // Animasyonları başlat
  useEffect(() => {
    // Logo fade-in
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })

    // Nokta animasyonları (ardışık)
    const animateDots = () => {
      opacity1.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      )

      setTimeout(() => {
        opacity2.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        )
      }, 200)

      setTimeout(() => {
        opacity3.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        )
      }, 400)
    }

    const interval = setInterval(animateDots, 1200)
    return () => clearInterval(interval)
  }, [])

  // Logout işlemini başlat
  useEffect(() => {
    const performLogout = async () => {
      if (hasLoggedOut.current) return
      hasLoggedOut.current = true

      try {
        // Logout işlemini başlat
        await logout()

        // 2 saniye göster (UX için)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // NavigationController otomatik olarak login'e yönlendirecek
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    performLogout()
  }, [logout])

  // Animasyon stilleri
  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value
  }))

  const dot1Style = useAnimatedStyle(() => ({
    opacity: opacity1.value
  }))

  const dot2Style = useAnimatedStyle(() => ({
    opacity: opacity2.value
  }))

  const dot3Style = useAnimatedStyle(() => ({
    opacity: opacity3.value
  }))

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Gradient Background */}
      <LinearGradient
        colors={['#022920', '#044134', '#065f4a']}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated Glow Orbs (Statik) */}
      <View style={[styles.glowOrb, styles.glowOrb1]} />
      <View style={[styles.glowOrb, styles.glowOrb2]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimStyle]}>
          <Image
            source={LogoWhite}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text */}
        <Text style={styles.title}>Çıkış yapılıyor</Text>

        {/* Animated Dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Lütfen bekleyin</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['3xl']
  },
  logoContainer: {
    marginBottom: DashboardSpacing['3xl']
  },
  logo: {
    width: 180,
    height: 60
  },
  title: {
    fontSize: DashboardFontSizes['4xl'],
    fontWeight: '700',
    color: DashboardColors.textOnPrimary,
    marginBottom: DashboardSpacing.lg,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.xl
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DashboardColors.textOnPrimary
  },
  subtitle: {
    fontSize: DashboardFontSizes.lg,
    color: DashboardColors.textOnPrimaryMuted,
    textAlign: 'center'
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  glowOrb1: {
    top: -100,
    right: -100
  },
  glowOrb2: {
    bottom: -120,
    left: -120,
    backgroundColor: 'rgba(212, 175, 55, 0.12)'
  }
})
