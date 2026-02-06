import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    />
  )
}
