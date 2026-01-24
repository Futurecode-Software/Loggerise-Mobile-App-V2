import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base Skeleton component with pulsing animation
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = BorderRadius.md,
  style,
}: SkeletonProps) {
  const colors = Colors.light;
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Skeleton for list items (contact, employee, vehicle, etc.)
 */
export function ListItemSkeleton() {
  const colors = Colors.light;

  return (
    <View style={[styles.listItem, { borderBottomColor: colors.border }]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
        <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for card items (bank account, load, etc.)
 */
export function CardSkeleton() {
  const colors = Colors.light;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderContent}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="30%" height={14} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: 12 }} />
      <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
      <View style={styles.cardFooter}>
        <Skeleton width="40%" height={24} />
        <Skeleton width={60} height={24} borderRadius={BorderRadius.full} />
      </View>
    </View>
  );
}

/**
 * Skeleton for chat messages
 */
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={[styles.messageBubble, isUser && styles.userBubble]}>
        {!isUser && (
          <View style={styles.messageHeader}>
            <Skeleton width={14} height={14} borderRadius={7} />
            <Skeleton width={60} height={12} style={{ marginLeft: 6 }} />
          </View>
        )}
        <Skeleton width="100%" height={14} style={{ marginTop: isUser ? 0 : 8 }} />
        <Skeleton width="80%" height={14} style={{ marginTop: 6 }} />
        <Skeleton width="60%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for conversation list items
 */
export function ConversationSkeleton() {
  const colors = Colors.light;

  return (
    <View style={[styles.conversation, { borderBottomColor: colors.border }]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Skeleton width="50%" height={16} />
          <Skeleton width={40} height={12} />
        </View>
        <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for dashboard stat cards
 */
export function StatCardSkeleton() {
  const colors = Colors.light;

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={styles.statCardHeader}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={60} height={20} style={{ marginLeft: 'auto' }} />
      </View>
      <Skeleton width="70%" height={14} style={{ marginTop: 12 }} />
      <Skeleton width={100} height={28} style={{ marginTop: 8 }} />
    </View>
  );
}

/**
 * Skeleton for AI report items
 */
export function ReportItemSkeleton() {
  const colors = Colors.light;

  return (
    <View style={[styles.reportItem, { borderBottomColor: colors.border }]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.reportContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="30%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={18} height={18} borderRadius={9} />
    </View>
  );
}

/**
 * List of multiple skeleton items
 */
export function SkeletonList({
  count = 5,
  type = 'listItem',
}: {
  count?: number;
  type?: 'listItem' | 'card' | 'conversation' | 'message' | 'statCard' | 'report';
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  const renderItem = (index: number) => {
    switch (type) {
      case 'card':
        return <CardSkeleton key={index} />;
      case 'conversation':
        return <ConversationSkeleton key={index} />;
      case 'message':
        return <MessageSkeleton key={index} isUser={index % 2 === 1} />;
      case 'statCard':
        return <StatCardSkeleton key={index} />;
      case 'report':
        return <ReportItemSkeleton key={index} />;
      default:
        return <ListItemSkeleton key={index} />;
    }
  };

  return <View>{items.map(renderItem)}</View>;
}

const styles = StyleSheet.create({
  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  listItemContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Card
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },

  // Message
  messageContainer: {
    marginBottom: Spacing.md,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: BorderRadius.sm,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Conversation
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Stat Card
  statCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Report Item
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  reportContent: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
});
