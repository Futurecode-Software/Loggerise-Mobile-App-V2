import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default'
      }}
    >
      {/* Login varsayılan/ilk ekran - logout sonrası gösterilir */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      {/* Setup status sadece kayıt sonrası gösterilir, varsayılan değil */}
      <Stack.Screen name="setup-status" />
    </Stack>
  )
}
