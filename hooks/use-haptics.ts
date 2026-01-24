import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback types
 */
export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

/**
 * Hook for haptic feedback
 *
 * Provides easy-to-use haptic feedback functions for various interactions.
 * Automatically handles platform differences (iOS/Android).
 *
 * @example
 * const { hapticLight, hapticSuccess, hapticSelection } = useHaptics();
 *
 * // On button press
 * <TouchableOpacity onPress={() => { hapticLight(); doSomething(); }}>
 *
 * // On success
 * hapticSuccess();
 *
 * // On selection change
 * hapticSelection();
 */
export function useHaptics() {
  /**
   * Light impact feedback
   * Use for: light taps, subtle interactions
   */
  const hapticLight = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }, []);

  /**
   * Medium impact feedback
   * Use for: button presses, card taps
   */
  const hapticMedium = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }, []);

  /**
   * Heavy impact feedback
   * Use for: important actions, confirmations
   */
  const hapticHeavy = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }, []);

  /**
   * Success notification feedback
   * Use for: successful operations, confirmations
   */
  const hapticSuccess = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }, []);

  /**
   * Warning notification feedback
   * Use for: warnings, cautions
   */
  const hapticWarning = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }, []);

  /**
   * Error notification feedback
   * Use for: errors, failures
   */
  const hapticError = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Silently fail if haptics not available
    }
  }, []);

  /**
   * Selection feedback
   * Use for: picker changes, toggles, selections
   */
  const hapticSelection = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Silently fail if haptics not available
    }
  }, []);

  /**
   * Generic haptic feedback by type
   */
  const haptic = useCallback(
    async (type: HapticType) => {
      switch (type) {
        case 'light':
          return hapticLight();
        case 'medium':
          return hapticMedium();
        case 'heavy':
          return hapticHeavy();
        case 'success':
          return hapticSuccess();
        case 'warning':
          return hapticWarning();
        case 'error':
          return hapticError();
        case 'selection':
          return hapticSelection();
        default:
          return hapticLight();
      }
    },
    [hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticWarning, hapticError, hapticSelection]
  );

  return {
    haptic,
    hapticLight,
    hapticMedium,
    hapticHeavy,
    hapticSuccess,
    hapticWarning,
    hapticError,
    hapticSelection,
  };
}

/**
 * Standalone haptic functions for use outside of components
 */
export const Haptic = {
  light: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {}
  },
  medium: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {}
  },
  heavy: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {}
  },
  success: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {}
  },
  warning: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {}
  },
  error: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {}
  },
  selection: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {}
  },
};
