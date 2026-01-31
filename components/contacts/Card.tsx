import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DashboardColors, DashboardSpacing, DashboardFontSizes, DashboardBorderRadius, DashboardShadows } from '@/constants/dashboard-theme'

interface CardProps {
  title: string
  description?: string
  icon?: keyof typeof Ionicons.glyphMap
  children: React.ReactNode
}

export function Card({ title, description, icon, children }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={18} color={DashboardColors.primary} />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleContainer: {
    flex: 1
  },
  title: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text
  },
  description: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: 2
  },
  cardContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  }
})
