import { DashboardColors } from '@/constants/dashboard-theme'
import { Stack } from 'expo-router'

export default function ExportWarehouseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        contentStyle: { backgroundColor: DashboardColors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
