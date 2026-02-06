import { Stack } from 'expo-router'
import React from 'react'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function DriverTractorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
