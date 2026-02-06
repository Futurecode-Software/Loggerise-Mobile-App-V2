import { Stack } from 'expo-router'
import React from 'react'

export default function CashRegisterLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
