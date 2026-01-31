/**
 * Cari Sayfaları Layout
 *
 * Cari detay ve oluşturma sayfaları için stack navigator
 */

import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function ContactLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: DashboardColors.background
        },
        animation: 'default'
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
    </Stack>
  )
}
