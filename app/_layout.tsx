import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { Colors } from '@/constants/theme';

// Suppress known non-critical warnings from dependencies
// These warnings come from react-navigation and react-native-toast-message internals
// and cannot be fixed without modifying node_modules
const IGNORED_WARNINGS = [
  'SafeAreaView has been deprecated', // React Navigation internal usage
  "Modal with 'fullScreen' presentation style and 'transparent' value is not supported", // react-native-toast-message
];

LogBox.ignoreLogs(IGNORED_WARNINGS);

// Also suppress console.warn for these messages
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && IGNORED_WARNINGS.some((w) => message.includes(w))) {
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
  anchor: '(auth)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider value={LoggeriseLight}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="notifications" options={{ presentation: 'formSheet', title: 'Bildirimler' }} />
              <Stack.Screen name="modal" options={{ presentation: 'formSheet', title: 'Modal' }} />
              <Stack.Screen name="employee" />
              <Stack.Screen name="warehouse" />
              <Stack.Screen name="bank" />
              <Stack.Screen name="cash-register" />
              <Stack.Screen name="vehicle" />
            </Stack>
            <StatusBar style="dark" />
            <Toast />
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
