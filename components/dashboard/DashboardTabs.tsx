/**
 * Dashboard Tabs Component
 *
 * Horizontal scrollable tab list for dashboard
 * Displayed in the white content area
 */

import {
    DashboardAnimations,
    DashboardBorderRadius,
    DashboardColors,
    DashboardFontSizes,
    DashboardSpacing,
} from '@/constants/dashboard-theme'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text
} from 'react-native'
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated'

interface DashboardTab {
    id: string
    label: string
    icon: keyof typeof Ionicons.glyphMap
}

interface DashboardTabsProps {
    tabs: DashboardTab[]
    activeTab: string
    onTabChange: (tabId: string) => void
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function TabItem({
    tab,
    isActive,
    onPress,
}: {
    tab: DashboardTab
    isActive: boolean
    onPress: () => void
}) {
    const scale = useSharedValue(1)

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }))

    const handlePressIn = () => {
        scale.value = withSpring(0.95, DashboardAnimations.springBouncy)
    }

    const handlePressOut = () => {
        scale.value = withSpring(1, DashboardAnimations.springBouncy)
    }

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
    }

    return (
        <AnimatedPressable
            style={[
                styles.tab,
                isActive && styles.tabActive,
                animStyle,
            ]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Ionicons
                name={tab.icon}
                size={16}
                color={isActive
                    ? '#ffffff'
                    : DashboardColors.textSecondary
                }
            />
            <Text
                style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                ]}
            >
                {tab.label}
            </Text>
        </AnimatedPressable>
    )
}

export default function DashboardTabs({
    tabs,
    activeTab,
    onTabChange,
}: DashboardTabsProps) {
    return (
        <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={styles.container}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
            >
                {tabs.map((tab) => (
                    <TabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === activeTab}
                        onPress={() => onTabChange(tab.id)}
                    />
                ))}
            </ScrollView>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: DashboardSpacing.lg,
    },
    tabsContainer: {
        paddingVertical: DashboardSpacing.xs,
        gap: DashboardSpacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DashboardSpacing.sm,
        paddingHorizontal: DashboardSpacing.lg,
        paddingVertical: DashboardSpacing.sm,
        borderRadius: DashboardBorderRadius.full,
        backgroundColor: DashboardColors.card,
        marginRight: DashboardSpacing.sm,
        borderWidth: 1,
        borderColor: DashboardColors.border,
    },
    tabActive: {
        backgroundColor: DashboardColors.primaryLight,
        borderColor: DashboardColors.primary,
    },
    tabLabel: {
        fontSize: DashboardFontSizes.sm,
        fontWeight: '500',
        color: DashboardColors.textSecondary,
    },
    tabLabelActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
})
