import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route: string;
}

interface CollapsibleMenuSectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  items: MenuItem[];
  isExpanded: boolean;
  onToggle: (sectionId: string) => void;
  onItemPress: (route: string) => void;
}

export function CollapsibleMenuSection({
  id,
  title,
  icon: SectionIcon,
  iconColor = Colors.light.primary,
  items,
  isExpanded,
  onToggle,
  onItemPress,
}: CollapsibleMenuSectionProps) {
  const colors = Colors.light;
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  // Animate rotation when isExpanded changes
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const handleToggle = () => {
    LayoutAnimation.configureNext({
      duration: 250,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    onToggle(id);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.section}>
      {/* Section Header - Main Category */}
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          isExpanded && styles.sectionHeaderExpanded,
          isExpanded && { borderColor: `${iconColor}30` },
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        aria-expanded={isExpanded}
      >
        <View style={[styles.sectionIcon, { backgroundColor: `${iconColor}15` }]}>
          <SectionIcon size={20} color={iconColor} strokeWidth={2.5} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.sectionRight}>
          <View style={[styles.itemCountBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.itemCount, { color: colors.textMuted }]}>{items.length}</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
            <ChevronDown size={20} color={colors.icon} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Section Items - Subcategories */}
      {isExpanded && (
        <View style={[styles.itemsContainer, { borderLeftColor: `${iconColor}30` }]}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === items.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => onItemPress(item.route)}
              activeOpacity={0.6}
            >
              {/* Subcategory: Simple gray icon without background */}
              <item.icon size={18} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <ChevronRight size={16} color={colors.border} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingSM,
    flex: 1,
    fontWeight: '600',
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemCountBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  itemCount: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  itemsContainer: {
    marginLeft: Spacing.lg,
    paddingLeft: Spacing.md,
    borderLeftWidth: 2,
    marginTop: -1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  menuItemLast: {
    marginBottom: Spacing.sm,
  },
  menuLabel: {
    ...Typography.bodyMD,
    fontWeight: '400',
    flex: 1,
  },
});

export default CollapsibleMenuSection;
