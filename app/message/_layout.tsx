/**
 * Message Module Layout
 *
 * Handles routing for all messaging screens:
 * - [id]: Conversation detail (handles both DM and group)
 * - new: New direct message
 * - group/new: New group creation
 * - group/[id]: Group settings (full page)
 */

import { Stack } from 'expo-router'
import { DashboardColors } from '@/constants/dashboard-theme'

export default function MessageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DashboardColors.background },
        animation: 'default'
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
      <Stack.Screen name="group/new" />
      <Stack.Screen name="group/[id]" />
    </Stack>
  )
}
