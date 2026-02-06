import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function StockLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="brands/index" />
      <Stack.Screen name="brands/new" />
      <Stack.Screen name="brands/[id]" />
      <Stack.Screen name="models/index" />
      <Stack.Screen name="models/new" />
      <Stack.Screen name="models/[id]" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="categories/new" />
      <Stack.Screen name="categories/[id]" />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="products/new" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="movements/index" />
      <Stack.Screen name="movements/new" />
      <Stack.Screen name="movements/[id]" />
    </Stack>
  )
}
