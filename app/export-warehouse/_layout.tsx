import { Stack } from 'expo-router'
import React from 'react'

export default function ExportWarehouseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'default' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
