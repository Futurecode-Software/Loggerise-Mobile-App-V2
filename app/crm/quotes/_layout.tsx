/**
 * Quote Stack Layout
 *
 * Manages navigation stack for quote-related screens.
 */

import { Stack } from 'expo-router';

export default function QuoteLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
