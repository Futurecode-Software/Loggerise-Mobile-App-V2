import { View, Text, StyleSheet } from 'react-native'
import type { ContactStatus } from '@/types/contact'
import { DashboardFontSizes } from '@/constants/dashboard-theme'

interface StatusBadgeProps {
  status: ContactStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: ContactStatus) => {
    const configs = {
      active: {
        label: 'Aktif',
        backgroundColor: '#10b98120',
        textColor: '#10b981'
      },
      passive: {
        label: 'Pasif',
        backgroundColor: '#f59e0b20',
        textColor: '#f59e0b'
      },
      blacklist: {
        label: 'Kara Liste',
        backgroundColor: '#ef444420',
        textColor: '#ef4444'
      },
      lost: {
        label: 'Kaybedildi',
        backgroundColor: '#94a3b820',
        textColor: '#6b7280'
      },
      converted: {
        label: 'Dönüştürüldü',
        backgroundColor: '#3b82f620',
        textColor: '#3b82f6'
      }
    }
    return configs[status] || configs.active
  }

  const config = getStatusConfig(status)

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  }
})
