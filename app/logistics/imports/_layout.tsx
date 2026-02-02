import { Stack } from 'expo-router';
import React from 'react';

export default function ImportsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="operations/index" />
      <Stack.Screen name="disposition/index" />
      <Stack.Screen name="positions/index" />
      <Stack.Screen name="positions/[id]" />
      <Stack.Screen name="loads/index" />
    </Stack>
  );
}
