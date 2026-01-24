import React from 'react';
import { View, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle | ImageStyle;
  backgroundColor?: string;
}

const AVATAR_COLORS = [
  '#13452d', '#227d53', '#5fbd92', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16',
];

export function Avatar({
  source,
  name,
  size = 'md',
  style,
  backgroundColor,
}: AvatarProps) {
  const colors = Colors.light;

  const getSizeValue = (): number => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 96;
      default:
        return 40;
    }
  };

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getBackgroundColor = (fullName?: string): string => {
    if (backgroundColor) return backgroundColor;
    if (!fullName) return colors.surface;
    const charSum = fullName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return AVATAR_COLORS[charSum % AVATAR_COLORS.length];
  };

  const sizeValue = getSizeValue();
  const initials = getInitials(name);
  const bgColor = getBackgroundColor(name);

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 20;
      case 'xl':
        return 32;
      default:
        return 14;
    }
  };

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[
          styles.image,
          {
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
          },
          style as ImageStyle,
        ]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {initials ? (
        <Text style={[styles.initials, { fontSize: getFontSize() }]}>
          {initials}
        </Text>
      ) : (
        <User size={sizeValue * 0.5} color="#FFFFFF" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: '#E5E7EB',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
