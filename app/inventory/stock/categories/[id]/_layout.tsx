import { Stack } from 'expo-router'

export default function CategoryDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
    </Stack>
  )
}
