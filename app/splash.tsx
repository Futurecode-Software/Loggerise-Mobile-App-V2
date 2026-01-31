import React, { useEffect } from 'react'
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import * as SplashScreenModule from 'expo-splash-screen'
import { useAuth } from '@/context/auth-context'

export default function Splash() {
  const router = useRouter()
  const { isAuthenticated, isInitializing } = useAuth()

  const logoImage = require('../assets/images/logo-white.png')

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreenModule.hideAsync()
      } catch (e) {
        console.warn(e)
      }
    }

    prepare()
  }, [])

  useEffect(() => {
    if (!isInitializing) {
      const loadCompleteTimeout = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)')
        } else {
          router.replace('/login')
        }
      }, 2000)

      return () => clearTimeout(loadCompleteTimeout)
    }
  }, [isInitializing, isAuthenticated, router])

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={logoImage}
          style={styles.logo}
          resizeMode="contain"
        />
        {isInitializing && (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={styles.loading}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#044134',
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
