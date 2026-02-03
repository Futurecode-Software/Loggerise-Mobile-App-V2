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
import Toast from 'react-native-toast-message'
import { AuthProvider, useAuth } from '@/context/auth-context'
import { DashboardProvider } from '@/context/dashboard-context'
import { MessageProvider } from '@/context/message-context'
import { NotificationProvider } from '@/context/notification-context'
import { QuickActionsProvider } from '@/contexts/quick-actions-context'
import * as SplashScreen from 'expo-splash-screen'

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync()

/**
 * Navigation Controller
 * Handles automatic navigation based on auth state
 */
function NavigationController() {
  const { isAuthenticated, isInitializing } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to initialize
    if (isInitializing) return

    // Hide splash screen once auth is ready
    SplashScreen.hideAsync()

    const inAuthGroup = segments[0] === '(auth)'
    const currentPage = segments[1]

    if (!isAuthenticated) {
      // Not authenticated - ensure we're on login page
      if (!inAuthGroup || currentPage !== 'login') {
        router.replace('/(auth)/login')
      }
    } else if (isAuthenticated && inAuthGroup && currentPage !== 'logging-out') {
      // Authenticated and in auth group (but not logging out) - go to app
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isInitializing, segments, router])

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
