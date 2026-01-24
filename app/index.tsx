import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { Brand } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated, isInitializing } = useAuth();

  // Show loading while checking auth state
  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
