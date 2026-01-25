import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function GroupLayout() {
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
    </Stack>
  );
}
