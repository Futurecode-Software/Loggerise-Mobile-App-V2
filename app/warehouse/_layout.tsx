import { DashboardColors } from '@/constants/dashboard-theme'
import { Stack } from 'expo-router'

export default function WarehouseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        contentStyle: { backgroundColor: DashboardColors.background },
      }}
    >
      <Stack.Screen name="exports" />
      <Stack.Screen name="export-items" />
      <Stack.Screen name="export-positions" />
      <Stack.Screen name="export-expected" />
    </Stack>
  )
}
