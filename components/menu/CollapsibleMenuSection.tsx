import React, { useState, useEffect, useRef } from 'react';
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
import { ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Card } from '@/components/ui';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY_PREFIX = '@loggerise_menu_section_';

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
  defaultExpanded?: boolean;
  onItemPress: (route: string) => void;
}

export function CollapsibleMenuSection({
  id,
  title,
  icon: SectionIcon,
  iconColor = Colors.light.primary,
  items,
  defaultExpanded = false,
  onItemPress,
}: CollapsibleMenuSectionProps) {
  const colors = Colors.light;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved state from AsyncStorage
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
        if (savedState !== null) {
          const expanded = savedState === 'true';
          setIsExpanded(expanded);
          rotateAnim.setValue(expanded ? 1 : 0);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load menu section state:', error);
        setIsInitialized(true);
      }
    };
    loadState();
  }, [id]);

  // Save state to AsyncStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, String(isExpanded)).catch((error) =>
        console.error('Failed to save menu section state:', error)
      );
    }
  }, [isExpanded, id, isInitialized]);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);

    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: `${iconColor}15` }]}>
          <SectionIcon size={18} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.itemCount, { color: colors.textMuted }]}>{items.length}</Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <ChevronDown size={20} color={colors.icon} />
        </Animated.View>
      </TouchableOpacity>

      {/* Section Items */}
      {isExpanded && (
        <Card variant="outlined" padding="none" style={styles.itemsContainer}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index !== items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => onItemPress(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <ChevronDown
                size={16}
                color={colors.icon}
                style={{ transform: [{ rotate: '-90deg' }] }}
              />
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingSM,
    flex: 1,
  },
  itemCount: {
    ...Typography.bodySM,
    marginRight: Spacing.sm,
  },
  itemsContainer: {
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
    flex: 1,
  },
});

export default CollapsibleMenuSection;
