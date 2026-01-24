import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useNetwork } from '@/hooks/use-network';

interface OfflineBannerProps {
  onRetry?: () => void;
}

/**
 * Offline banner that shows when the device has no internet connection
 *
 * @example
 * // In your layout or screen
 * <OfflineBanner onRetry={() => refetchData()} />
 */
export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const colors = Colors.light;
  const { isConnected, isInternetReachable, refresh } = useNetwork();

  const rotation = useSharedValue(0);
  const translateY = useSharedValue(-60);

  // Show/hide animation
  const isOffline = isConnected === false || isInternetReachable === false;

  useEffect(() => {
    translateY.value = withTiming(isOffline ? 0 : -60, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isOffline]);

  // Retry button rotation animation
  const handleRetry = async () => {
    rotation.value = withRepeat(
      withTiming(rotation.value + 360, { duration: 1000, easing: Easing.linear }),
      1,
      false
    );

    await refresh();
    onRetry?.();
  };

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const retryIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.warning },
        bannerStyle,
      ]}
    >
      <View style={styles.content}>
        <WifiOff size={18} color="#FFFFFF" />
        <Text style={styles.text}>Internet baglantisi yok</Text>
      </View>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Animated.View style={retryIconStyle}>
          <RefreshCw size={16} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Simple hook to check if currently offline
 */
export function useIsOffline(): boolean {
  const { isConnected, isInternetReachable } = useNetwork();
  return isConnected === false || isInternetReachable === false;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  text: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  retryButton: {
    padding: Spacing.sm,
  },
});
