import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function LoadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
