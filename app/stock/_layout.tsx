import { Stack } from 'expo-router';
import React from 'react';

export default function StockLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
  );
}
