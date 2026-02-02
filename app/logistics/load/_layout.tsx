import { Stack } from 'expo-router';
import React from 'react';

export default function LoadLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
    </Stack>
  );
}
