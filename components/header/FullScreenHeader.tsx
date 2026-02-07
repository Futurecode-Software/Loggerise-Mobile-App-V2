/**
 * FullScreenHeader Component
 * 
 * Tam ekran yeşil header yapısı - status bar dahil
 * Logonun yeşil rengini kullanarak tam ekran arka plan sağlar
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Brand, Typography, Spacing } from '@/constants/theme';

export interface FullScreenHeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  leftContent?: ReactNode; // Sol tarafta avatar ve kullanıcı bilgileri için
  rightIcons?: ReactNode;
  onBackPress?: () => void;
  showBackButton?: boolean;
  tabs?: {
    id: string;
    label: string;
    icon?: ReactNode;
    isActive?: boolean;
    onPress?: () => void;
  }[];
  rightAction?: {
    icon: ReactNode;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    backgroundColor?: string;
    iconColor?: string;
  };
  leftActions?: {
    icon: ReactNode;
    onPress: () => void;
  }[];
}

export function FullScreenHeader({
  title,
  subtitle,
  leftIcon,
  leftContent,
  rightIcons,
  onBackPress,
  showBackButton = false,
  tabs,
  rightAction,
  leftActions,
}: FullScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // Status bar yüksekliği - Android için yaklaşık 24dp, iOS için insets.top
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : 24;
  // Status bar ile içerik arasında ekstra padding - iOS için minimum padding
  const extraTopPadding = Platform.OS === 'ios' ? 0 : Spacing.lg;
  const totalTopPadding = statusBarHeight + extraTopPadding;

  return (
    <>
      {/* Header Container - Tam ekran yeşil arka plan */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: Brand.primary,
            paddingTop: totalTopPadding,
          },
        ]}
      >
        {/* Header Content */}
        <View
          style={[
            styles.headerContent,
            {
              paddingBottom: tabs ? Spacing.sm : Spacing.lg,
            },
          ]}
        >
          {/* Sol Taraf - Avatar + Bilgiler veya Back Button */}
          <View style={styles.leftSection}>
            {/* Left Actions - Rendered before back button */}
            {leftActions && leftActions.length > 0 && (
              <View style={styles.leftActionsContainer}>
                {leftActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={action.onPress}
                    style={styles.leftActionButton}
                    activeOpacity={0.7}
                  >
                    {action.icon}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {showBackButton && (
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {leftContent ? (
              leftContent
            ) : (
              <>
                {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
                {(title || subtitle) && (
                  <View style={styles.leftTextContainer}>
                    {title && (
                      <Text style={styles.leftTitle} numberOfLines={1}>
                        {title}
                      </Text>
                    )}
                    {subtitle && (
                      <Text style={styles.leftSubtitle} numberOfLines={1}>
                        {subtitle}
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Sağ Taraf */}
          <View style={styles.rightSection}>
            {rightIcons}
            {rightAction && (
              <TouchableOpacity
                onPress={rightAction.onPress}
                disabled={rightAction.disabled || rightAction.loading}
                style={[
                  styles.rightActionButton,
                  rightAction.backgroundColor && {
                    backgroundColor: rightAction.backgroundColor,
                  },
                  (rightAction.disabled || rightAction.loading) && styles.rightActionButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                {rightAction.loading ? (
                  <ActivityIndicator size="small" color={rightAction.iconColor || '#FFFFFF'} />
                ) : (
                  rightAction.icon
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Headerleri (varsa) */}
        {tabs && tabs.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            style={styles.tabsScrollContainer}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, tab.isActive && styles.tabActive]}
                onPress={tab.onPress}
                activeOpacity={0.7}
              >
                {tab.icon && <View style={styles.tabIcon}>{tab.icon}</View>}
                <Text style={[styles.tabLabel, tab.isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? Spacing.xs : Spacing.md,
    paddingBottom: Spacing.md,
    minHeight: Platform.OS === 'ios' ? 56 : 72,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  leftIconContainer: {
    // Avatar için container
  },
  leftTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  leftTitle: {
    ...Typography.headingMD,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  leftSubtitle: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
    fontSize: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    justifyContent: 'flex-end',
  },
  leftActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  leftActionButton: {
    padding: Spacing.sm,
  },
  rightActionButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionButtonDisabled: {
    opacity: 0.5,
  },
  tabsScrollContainer: {
    maxHeight: 56,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
    marginRight: Spacing.xs,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabIcon: {
    // Icon için container
  },
  tabLabel: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    opacity: 0.85,
    fontWeight: '500',
    fontSize: 13,
  },
  tabLabelActive: {
    opacity: 1,
    fontWeight: '600',
  },
});
