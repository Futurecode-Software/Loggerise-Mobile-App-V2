/**
 * Splash Screen
 *
 * Uygulama başlangıç ekranı
 * Auth durumuna göre login veya dashboard'a yönlendirir
 */

import React, { useEffect } from 'react'
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native'
import * as SplashScreenModule from 'expo-splash-screen'
import { DashboardColors } from '@/constants/dashboard-theme'

const logoImage = require('../assets/images/logo-white.png')

export default function Splash() {
  useEffect(() => {
    // Native splash screen'i gizle
    const hideSplash = async () => {
      try {
        await SplashScreenModule.hideAsync()
      } catch (e) {
        console.warn('Splash screen hide error:', e)
      }
    }

    hideSplash()
  }, [])

  // Yönlendirme NavigationController tarafından yönetilir
  // Bu sayfa sadece loading UI gösterir

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={logoImage}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator
          size="large"
          color="#fff"
          style={styles.loading}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DashboardColors.primary,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  loading: {
    marginTop: 24,
  },
})
