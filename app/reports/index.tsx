import { PageHeader } from '@/components/navigation'
import {
  DashboardAnimations,
  DashboardBorderRadius,
  DashboardColors,
  DashboardFontSizes,
  DashboardShadows,
  DashboardSpacing
} from '@/constants/dashboard-theme'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import React from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface ReportItem {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  route: string
}

const REPORTS: ReportItem[] = [
  {
    id: 'profit-loss',
    title: 'Kar/Zarar Analizi',
    description: 'Gelir, gider ve karlılık raporları',
    icon: 'trending-up-outline',
    iconColor: DashboardColors.primary,
    iconBg: DashboardColors.primaryGlow,
    route: '/reports/profit-loss'
  },
  {
    id: 'kdv',
    title: 'KDV Raporu',
    description: 'KDV beyanı ve hesaplamaları',
    icon: 'document-text-outline',
    iconColor: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    route: '/reports/kdv'
  },
  {
    id: 'contact',
    title: 'Cari Raporları',
    description: 'Alacak, borç ve yaşlandırma raporları',
    icon: 'people-outline',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139, 92, 246, 0.12)',
    route: '/reports/contact'
  },
  {
    id: 'domestic',
    title: 'Yurtiçi Raporlar',
    description: 'Yurtiçi taşıma istatistikleri',
    icon: 'car-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245, 158, 11, 0.12)',
    route: '/reports/domestic'
  }
]

interface ReportCardProps {
  item: ReportItem
  onPress: () => void
}

function ReportCard({ item, onPress }: ReportCardProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  function handlePressIn(): void {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  function handlePressOut(): void {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.cardIcon, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={24} color={item.iconColor} />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>

      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

function InfoCard() {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIconContainer}>
        <Ionicons name="bar-chart-outline" size={20} color={DashboardColors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>Rapor Bilgilendirmesi</Text>
        <Text style={styles.infoText}>
          Tüm raporlar gerçek zamanlı veriler üzerinden hesaplanmaktadır.
          İhtiyacınız olan raporu seçerek detaylı analizlere ulaşabilirsiniz.
        </Text>
      </View>
    </View>
  )
}

export default function ReportsIndexScreen() {
  function handleCardPress(item: ReportItem): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(item.route as any)
  }

  function handleBackPress(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Raporlar"
        icon="stats-chart-outline"
        subtitle="İş analitiği ve raporlama"
        showBackButton
        onBackPress={handleBackPress}
      />

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {REPORTS.map((report) => (
              <ReportCard
                key={report.id}
                item={report}
                onPress={() => handleCardPress(report)}
              />
            ))}
          </View>

          <InfoCard />
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing['3xl']
  },
  grid: {
    gap: DashboardSpacing.md
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md,
    ...DashboardShadows.md
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: DashboardBorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardContent: {
    flex: 1
  },
  cardTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: 4
  },
  cardDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  cardArrow: {
    padding: DashboardSpacing.xs
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    marginTop: DashboardSpacing.xl,
    padding: DashboardSpacing.lg,
    backgroundColor: DashboardColors.primaryGlow,
    borderRadius: DashboardBorderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: DashboardColors.primary,
    gap: DashboardSpacing.md
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  }
})
