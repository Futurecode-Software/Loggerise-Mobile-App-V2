/**
 * Root Layout - Entry Point
 *
 * Wraps the entire app with providers and handles initial navigation
 */

import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'
import { AuthProvider, useAuth } from '@/context/auth-context'
import { DashboardProvider } from '@/context/dashboard-context'
import { MessageProvider } from '@/context/message-context'
import { NotificationProvider } from '@/context/notification-context'
import { QuickActionsProvider } from '@/contexts/quick-actions-context'
import { useNotificationObserver } from '@/hooks/use-notification-observer'
import * as SplashScreen from 'expo-splash-screen'

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync()

/**
 * Navigation Controller
 * Handles automatic navigation based on auth state
 */
function NavigationController() {
  const { isAuthenticated, isInitializing, isSetupComplete } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  // Notification observer - handles push notification taps
  useNotificationObserver()

  useEffect(() => {
    // Wait for auth to initialize
    if (isInitializing) return

    const inAuthGroup = segments[0] === '(auth)'
    const onSplash = segments.length === 0 || segments[0] === 'index' || (segments.length === 1 && segments[0] === undefined)
    const currentPage = segments[1]

    if (!isAuthenticated) {
      // Not authenticated - go to login
      if (!inAuthGroup || (currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'forgot-password')) {
        router.replace('/(auth)/login')
      }
    } else {
      // Authenticated
      if (!isSetupComplete) {
        // Setup not complete - go to setup status screen
        if (!inAuthGroup || currentPage !== 'setup-status') {
          router.replace('/(auth)/setup-status')
        }
      } else {
        // Setup complete - go to app
        // Splash, auth group (logging-out hariç) veya başka sayfadaysa tabs'a git
        if (onSplash || (inAuthGroup && currentPage !== 'logging-out')) {
          router.replace('/(tabs)')
        }
      }
    }
  }, [isAuthenticated, isInitializing, isSetupComplete, segments, router])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="accounting" />
      <Stack.Screen name="crm" />
      <Stack.Screen name="logistics" />
      <Stack.Screen name="hr" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="fleet" />
    </Stack>
  )
}

/**
 * Root Layout
 * Sets up all providers
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <BottomSheetModalProvider>
            <AuthProvider>
              <DashboardProvider>
                <MessageProvider>
                  <NotificationProvider>
                    <QuickActionsProvider>
                      <StatusBar style="light" />
                      <NavigationController />
                      <Toast />
                    </QuickActionsProvider>
                  </NotificationProvider>
                </MessageProvider>
              </DashboardProvider>
            </AuthProvider>
          </BottomSheetModalProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
