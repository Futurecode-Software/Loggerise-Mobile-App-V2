import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function ImportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="operations/index" />
      <Stack.Screen name="disposition/index" />
      <Stack.Screen name="positions/index" />
      <Stack.Screen name="positions/[id]" />
      <Stack.Screen name="loads/index" />
    </Stack>
  )
}
