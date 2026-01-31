import { View, StyleSheet } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardSpacing } from '@/constants/dashboard-theme'

export function ContactDetailSkeleton() {
  return (
    <View style={styles.container}>
      {/* Temel Bilgiler Card */}
      <View style={styles.card}>
        <Skeleton width="100%" height={120} style={{ marginBottom: DashboardSpacing.md }} />
      </View>

      {/* İletişim Bilgileri Card */}
      <View style={styles.card}>
        <Skeleton width="100%" height={140} style={{ marginBottom: DashboardSpacing.md }} />
      </View>

      {/* Mali Bilgiler Card */}
      <View style={styles.card}>
        <Skeleton width="100%" height={180} style={{ marginBottom: DashboardSpacing.md }} />
      </View>

      {/* Adres Bilgileri Card */}
      <View style={styles.card}>
        <Skeleton width="100%" height={100} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: DashboardSpacing.lg
  },
  card: {
    marginBottom: DashboardSpacing.md
  }
})
