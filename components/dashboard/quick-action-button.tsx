/**
 * Quick Action Button Component
 *
 * Individual button for dashboard quick actions.
 * Supports badges, disabled state, and haptic feedback.
 */

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { QuickAction } from '@/contexts/quick-actions-context';

/**
 * Corporate Light Theme Colors (matches dashboard theme)
 */
const Theme = {
  accent: '#13452d',
  accentLight: '#227d53',
  accentMuted: 'rgba(19, 69, 45, 0.08)',
  textPrimary: '#1F2937',
  textMuted: '#9CA3AF',
  danger: '#dc2626',
  surface: '#FFFFFF',
  border: '#EBEDF0',
};

/**
 * Quick Action Button Props
 */
interface QuickActionButtonProps extends QuickAction {}

/**
 * Quick Action Button Component
 */
export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  icon: Icon,
  onPress,
  badge,
  disabled,
}) => {
  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon
          size={24}
          color={disabled ? Theme.textMuted : Theme.accent}
          strokeWidth={2}
        />
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.label, disabled && styles.disabledLabel]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    minWidth: 80,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Theme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Theme.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Theme.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    color: Theme.textPrimary,
    fontWeight: '500',
  },
  disabledLabel: {
    color: Theme.textMuted,
  },
});
