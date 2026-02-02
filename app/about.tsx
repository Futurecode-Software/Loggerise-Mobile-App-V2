import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Hakkında"
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
      >
        <View style={[styles.logoContainer, DashboardShadows.md]}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business" size={48} color={DashboardColors.primary} />
          </View>
          <Text style={styles.appName}>Loggerise Mobile</Text>
          <Text style={styles.version}>Versiyon 1.0.0</Text>
        </View>

        <View style={[styles.infoCard, DashboardShadows.md]}>
          <Text style={styles.sectionTitle}>Uygulama Hakkında</Text>
          <Text style={styles.infoText}>
            Loggerise Mobile, lojistik operasyonlarınızı mobil cihazlarınızdan
            yönetmenizi sağlayan profesyonel bir çözümdür.
          </Text>
          <Text style={styles.infoText}>
            Yük takibi, pozisyon yönetimi, araç ve sürücü takibi gibi tüm
            operasyonlarınızı tek bir platformdan kolayca yönetin.
          </Text>
        </View>

        <View style={[styles.infoCard, DashboardShadows.md]}>
          <Text style={styles.sectionTitle}>İletişim</Text>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={20} color={DashboardColors.primary} />
            <Text style={styles.contactText}>info@loggerise.com</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color={DashboardColors.primary} />
            <Text style={styles.contactText}>+90 (XXX) XXX XX XX</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="globe-outline" size={20} color={DashboardColors.primary} />
            <Text style={styles.contactText}>www.loggerise.com</Text>
          </View>
        </View>

        <View style={[styles.infoCard, DashboardShadows.md]}>
          <Text style={styles.sectionTitle}>Telif Hakkı</Text>
          <Text style={styles.infoText}>
            © 2024 Loggerise. Tüm hakları saklıdır.
          </Text>
        </View>
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
  logoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing['2xl'],
    marginBottom: DashboardSpacing.lg,
    alignItems: 'center'
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${DashboardColors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.md
  },
  appName: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.xs
  },
  version: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.md
  },
  infoText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    lineHeight: 24,
    marginBottom: DashboardSpacing.sm
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.md
  },
  contactText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  }
})
