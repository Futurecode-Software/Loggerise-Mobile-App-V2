/**
 * List Card Component
 *
 * Displays a list of items with optional status badges.
 * Used for showing recent trips, expiring documents, etc.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { DashboardTheme } from '@/constants/dashboard-theme';
import { CorporateCard } from './corporate-card';

interface ListItem {
  id: string | number;
  title: string;
  meta?: string;
  dotColor?: string;
  status?: {
    text: string;
    isActive?: boolean;
  };
}

interface ListCardProps {
  title?: string;
  titleIcon?: LucideIcon;
  titleIconColor?: string;
  items: ListItem[];
  maxItems?: number;
}

export const ListCard = ({
  title,
  titleIcon: TitleIcon,
  titleIconColor = DashboardTheme.accent,
  items,
  maxItems = 4,
}: ListCardProps) => {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <View>
      {title && (
        <View style={styles.header}>
          {TitleIcon && (
            <TitleIcon size={18} color={titleIconColor} strokeWidth={2} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <CorporateCard style={styles.card}>
        {displayItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.item,
              index !== displayItems.length - 1 && styles.itemBorder,
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: item.dotColor || DashboardTheme.textMuted },
              ]}
            />
            <View style={styles.content}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.meta && <Text style={styles.itemMeta}>{item.meta}</Text>}
            </View>
            {item.status && (
              <View
                style={[
                  styles.statusBadge,
                  item.status.isActive
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: item.status.isActive
                        ? DashboardTheme.success
                        : DashboardTheme.textMuted,
                    },
                  ]}
                >
                  {item.status.text}
                </Text>
              </View>
            )}
          </View>
        ))}
      </CorporateCard>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: DashboardTheme.textPrimary,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DashboardTheme.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: DashboardTheme.textPrimary,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: DashboardTheme.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: DashboardTheme.successBg,
  },
  statusInactive: {
    backgroundColor: DashboardTheme.accentMuted,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
