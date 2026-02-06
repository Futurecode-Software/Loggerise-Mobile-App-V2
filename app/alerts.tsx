import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'

export default function AlertsScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = () => {
    setRefreshing(true)
    // Simulated refresh
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Placeholder alerts - replace with actual data from backend
  const alerts = [
    {
      id: 1,
      type: 'warning',
      icon: 'alert-circle',
      title: 'Evrak Süresi Dolmak Üzere',
      message: 'TR34ABC123 plakalı aracın muayene süresi 7 gün içinde dolacak.',
      date: '2 saat önce'
    },
    {
      id: 2,
      type: 'danger',
      icon: 'warning',
      title: 'Ödeme Gecikti',
      message: 'ABC Müşteri için 15.000 TL tutarında ödeme süresi geçti.',
      date: '5 saat önce'
    },
    {
      id: 3,
      type: 'info',
      icon: 'information-circle',
      title: 'Yeni Yük Teklifi',
      message: 'İstanbul - Ankara güzergahı için yeni yük teklifi aldınız.',
      date: '1 gün önce'
    }
  ]

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return DashboardColors.danger
      case 'warning':
        return DashboardColors.warning
      case 'info':
        return DashboardColors.info
      default:
        return DashboardColors.primary
    }
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Uyarılar"
        variant="compact"
        leftAction={{
          icon: 'arrow-back',
          onPress: () => router.back()
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, DashboardShadows.md]}>
              <View style={styles.alertHeader}>
                <View
                  style={[
                    styles.alertIconContainer,
                    { backgroundColor: `${getAlertColor(alert.type)}20` }
                  ]}
                >
                  <Ionicons
                    name={alert.icon as any}
                    size={24}
                    color={getAlertColor(alert.type)}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertDate}>{alert.date}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={DashboardColors.success} />
            </View>
            <Text style={styles.emptyTitle}>Harika!</Text>
            <Text style={styles.emptyText}>Şu anda hiç uyarınız bulunmuyor.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md
  },
  alertHeader: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertContent: {
    flex: 1
  },
  alertTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.xs
  },
  alertMessage: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20,
    marginBottom: DashboardSpacing.xs
  },
  alertDate: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${DashboardColors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm
  },
  emptyText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  }
})
