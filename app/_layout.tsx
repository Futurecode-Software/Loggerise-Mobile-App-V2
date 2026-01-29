import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { SplashScreen } from "@/components/dashboard/splash-screen";
import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { MessageProvider } from "@/context/message-context";
import { NotificationProvider } from "@/context/notification-context";
import { DashboardProvider, useDashboard } from "@/contexts/dashboard-context";
import { useNotificationObserver } from "@/hooks/use-notification-observer";

// Suppress known non-critical warnings from dependencies
// These warnings come from react-navigation and react-native-toast-message internals
// and cannot be fixed without modifying node_modules
const IGNORED_WARNINGS = [
  "SafeAreaView has been deprecated", // React Navigation internal usage
  "Modal with 'fullScreen' presentation style and 'transparent' value is not supported", // react-native-toast-message
];

LogBox.ignoreLogs(IGNORED_WARNINGS);

// Also suppress console.warn for these messages
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (
    typeof message === "string" &&
    IGNORED_WARNINGS.some((w) => message.includes(w))
  ) {
    return;
  }
  originalWarn(...args);
};

// Custom light theme based on Loggerise brand
// Dark mode devre disi birakildi - her zaman light mode kullanilir
const LoggeriseLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.danger,
  },
};

export const unstable_settings = {
  anchor: "(auth)",
};

/**
 * Auth Guard Hook
 * Redirects to login when not authenticated, to tabs when authenticated
 */
function useAuthGuard() {
  const { isAuthenticated, isInitializing } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for navigation to be ready and auth to initialize
    if (!navigationState?.key || isInitializing) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not in auth group - redirect to login
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but still in auth group - redirect to tabs
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isInitializing, segments, navigationState?.key]);
}

/**
 * Inner layout component that uses notification observer
 * Must be inside providers to access auth context
 */
function RootLayoutNav() {
  // Handle notification tap responses for navigation
  useNotificationObserver();

  // Handle auth-based navigation
  useAuthGuard();

  return (
    <ThemeProvider value={LoggeriseLight}>
      <SplashScreenController />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen
          name="notifications"
          options={{ presentation: "formSheet", title: "Bildirimler" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "formSheet", title: "Modal" }}
        />
        <Stack.Screen name="employee" />
        <Stack.Screen name="warehouse" />
        <Stack.Screen name="bank" />
        <Stack.Screen name="cash-register" />
        <Stack.Screen name="vehicle" />
        <Stack.Screen name="trip" />
        <Stack.Screen name="domestic" />
        <Stack.Screen name="stock" />
        <Stack.Screen name="finance" />
        <Stack.Screen name="positions" />
        <Stack.Screen name="messages" />
      </Stack>
      {/* StatusBar artık her sayfada FullScreenHeader içinde yönetiliyor */}
      <Toast position="top" topOffset={60} />
    </ThemeProvider>
  );
}

/**
 * Splash Screen Controller Component
 * Shows splash screen only on first app load until auth and dashboard data are ready
 * Must be inside providers to access auth and dashboard context
 */
function SplashScreenController() {
  const { isInitializing, isAuthenticated } = useAuth();
  const { isLoadingAvailable } = useDashboard();
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Determine if app is ready (auth initialized and dashboard data loaded if authenticated)
  const isAppReady =
    !isInitializing && (!isAuthenticated || !isLoadingAvailable);

  useEffect(() => {
    // Only show splash on first load
    if (isAppReady && !hasShownOnce) {
      // Delay fade out slightly for smooth transition
      const timer = setTimeout(() => {
        setShowSplash(false);
        setHasShownOnce(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isAppReady, hasShownOnce]);

  // Don't show splash if already shown once
  if (hasShownOnce) {
    return null;
  }

  return <SplashScreen visible={showSplash} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <KeyboardProvider>
          <AuthProvider>
            <NotificationProvider>
              <MessageProvider>
                <DashboardProvider>
                  <BottomSheetModalProvider>
                    <RootLayoutNav />
                  </BottomSheetModalProvider>
                </DashboardProvider>
              </MessageProvider>
            </NotificationProvider>
          </AuthProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
