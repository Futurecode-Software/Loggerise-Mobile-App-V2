import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Login is the default/first screen - shown after logout */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      {/* Setup status is only shown after registration, not as default */}
      <Stack.Screen name="setup-status" />
    </Stack>
  );
}
