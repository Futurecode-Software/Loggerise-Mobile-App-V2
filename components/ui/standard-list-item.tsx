import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';
import { Card } from './card';
import { Badge } from './badge';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';

export interface StandardListItemProps {
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  additionalInfo?: React.ReactNode;
  status?: {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'default' | 'info' | 'outline';
  };
  statusDot?: {
    color: string;
  };
  footer?: {
    left?: React.ReactNode;
    right?: React.ReactNode;
  };
  onPress?: () => void;
  showChevron?: boolean;
  style?: ViewStyle;
}

export function StandardListItem({
  icon: Icon,
  iconColor = Brand.primary,
  iconBg,
  title,
  subtitle,
  meta,
  additionalInfo,
  status,
  statusDot,
  footer,
  onPress,
  showChevron = true,
  style,
}: StandardListItemProps) {
  const colors = Colors.light;
  const defaultIconBg = iconBg || colors.surface;

  return (
    <Card style={style} onPress={onPress} padding="lg">
      {/* Header */}
      <View style={styles.header}>
        {Icon && (
          <View style={[styles.iconContainer, { backgroundColor: defaultIconBg }]}>
            <Icon size={20} color={iconColor} />
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            {statusDot && (
              <View
                style={[styles.statusDot, { backgroundColor: statusDot.color }]}
              />
            )}
            {status && !statusDot && (
              <Badge
                label={status.label}
                variant={status.variant || 'default'}
                size="sm"
              />
            )}
          </View>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {meta && (
            <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
              {meta}
            </Text>
          )}
          {additionalInfo && (
            typeof additionalInfo === 'string' ? (
              <Text style={[styles.additionalInfo, { color: colors.textSecondary }]} numberOfLines={2}>
                {additionalInfo}
              </Text>
            ) : (
              additionalInfo
            )
          )}
        </View>
        {status && statusDot && (
          <Badge
            label={status.label}
            variant={status.variant || 'default'}
            size="sm"
          />
        )}
        {showChevron && (
          <ChevronRight size={18} color={colors.icon} style={styles.chevron} />
        )}
      </View>

      {/* Footer */}
      {footer && (footer.left || footer.right) && (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerLeft}>
            {footer.left && (
              typeof footer.left === 'string' ? (
                <Text style={[styles.footerText, { color: colors.text }]}>{footer.left}</Text>
              ) : (
                footer.left
              )
            )}
          </View>
          {footer.right && (
            <View style={styles.footerRight}>
              {typeof footer.right === 'string' ? (
                <Text style={[styles.footerAmount, { color: colors.text }]}>{footer.right}</Text>
              ) : (
                footer.right
              )}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  subtitle: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  meta: {
    ...Typography.bodyXS,
    marginTop: 2,
  },
  additionalInfo: {
    ...Typography.bodySM,
    marginTop: Spacing.xs,
  },
  chevron: {
    marginLeft: Spacing.xs,
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerText: {
    ...Typography.bodySM,
  },
  footerAmount: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
});
