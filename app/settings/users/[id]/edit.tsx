import { UserFormScreen } from '@/src/screens/settings';
import { useLocalSearchParams } from 'expo-router';

/**
 * Kullanıcı Düzenleme Ekranı
 * Route: /settings/users/[id]/edit
 */
export default function UsersEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Pass userId to the form screen
  return <UserFormScreen userId={id ? parseInt(id, 10) : undefined} />;
}
