import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function NotificationBroadcastLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
    </Stack>
  )
}
