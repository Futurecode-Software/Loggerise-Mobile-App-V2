/**
 * Quick Action Button Component
 *
 * Modern, animated button for dashboard quick actions.
 * Features scale animation, haptic feedback, and elegant styling.
 */

import React from 'react';
import { Text, View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useHaptics } from '@/hooks/use-haptics';
import { QuickAction } from '@/contexts/quick-actions-context';
import { DashboardTheme } from '@/constants/dashboard-theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columns with padding

interface QuickActionButtonProps extends QuickAction {}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  icon: Icon,
  onPress,
  badge,
  disabled,
}) => {
  const { hapticLight } = useHaptics();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      pressed.value = withTiming(1, { duration: 100 });
    })
    .onFinalize((_, success) => {
      'worklet';
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      pressed.value = withTiming(0, { duration: 150 });
      if (success && !disabled) {
        runOnJS(hapticLight)();
        runOnJS(onPress)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const iconContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      pressed.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor:
        backgroundColor > 0.5
          ? DashboardTheme.accent
          : DashboardTheme.accentMuted,
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(
      pressed.value,
      [0, 1],
      [1, 1.1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: iconScale }],
    };
  });

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.card,
            animatedStyle,
            disabled && styles.cardDisabled,
          ]}
        >
          {/* Decorative corner accent */}
          <View style={styles.cornerAccent} />

          {/* Icon Container */}
          <Animated.View
            style={[
              styles.iconContainer,
              iconContainerStyle,
              disabled && styles.iconContainerDisabled,
            ]}
          >
            <Animated.View style={iconStyle}>
              <Icon
                size={22}
                color={disabled ? DashboardTheme.textMuted : DashboardTheme.accent}
                strokeWidth={2}
              />
            </Animated.View>
          </Animated.View>

          {/* Badge */}
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}

          {/* Label */}
          <Text
            style={[styles.label, disabled && styles.labelDisabled]}
            numberOfLines={2}
          >
            {label}
          </Text>

          {/* Subtle arrow indicator */}
          <View style={styles.arrowContainer}>
            <View style={[styles.arrow, disabled && styles.arrowDisabled]} />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: DashboardTheme.card,
    borderRadius: 14,
    padding: 16,
    minHeight: 110,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
    position: 'relative',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: DashboardTheme.accentGlow,
    borderBottomLeftRadius: 40,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: DashboardTheme.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    color: DashboardTheme.textPrimary,
    fontWeight: '600',
    lineHeight: 18,
  },
  labelDisabled: {
    color: DashboardTheme.textMuted,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  arrow: {
    width: 16,
    height: 16,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: DashboardTheme.accentLight,
    transform: [{ rotate: '-45deg' }],
    opacity: 0.4,
  },
  arrowDisabled: {
    borderColor: DashboardTheme.textMuted,
  },
});
