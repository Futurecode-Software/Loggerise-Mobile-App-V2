import { Stack } from 'expo-router';
import React from 'react';

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="checks/index" />
      <Stack.Screen name="notes/index" />
      <Stack.Screen name="invoices/index" />
      <Stack.Screen name="invoices/[id]" />
      <Stack.Screen name="invoices/new" />
    </Stack>
  );
}
