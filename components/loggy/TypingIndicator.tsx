/**
 * TypingIndicator Component
 *
 * Animated typing indicator for Loggy AI messages.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Bot } from 'lucide-react-native';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

export function TypingIndicator() {
  const colors = Colors.light;
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Her nokta için sıralı animasyon
    dot1.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
      ),
      -1,
      false
    );

    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );

    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View style={[styles.messageContainer, styles.aiMessageContainer]}>
      <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
        <View style={styles.aiHeader}>
          <Bot size={14} color={Brand.primary} />
          <Text style={[styles.aiLabel, { color: Brand.primary }]}>Loggy AI</Text>
        </View>
        <View style={styles.loadingDots}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: Brand.primary },
              animatedStyle1,
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: Brand.primary },
              animatedStyle2,
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: Brand.primary },
              animatedStyle3,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: Spacing.md,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  aiBubble: {
    borderBottomLeftRadius: BorderRadius.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  aiLabel: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
