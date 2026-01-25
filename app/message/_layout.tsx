/**
 * Message Module Layout
 *
 * Handles routing for all messaging screens:
 * - [id]: Conversation detail (handles both DM and group)
 * - new: New direct message
 * - group/new: New group creation
 * - group/[id]: Group settings (full page)
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function MessageLayout() {
  const colors = Colors.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
      <Stack.Screen name="group/new" />
      <Stack.Screen name="group/[id]" />
    </Stack>
  );
}
