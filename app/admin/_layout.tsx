import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="notification-broadcast" />
    </Stack>
  )
}
