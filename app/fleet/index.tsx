import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'
import PageHeader from '@/components/navigation/PageHeader'

interface ModuleCardProps {
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  iconBg: string
  route: string
}

function ModuleCard({ title, description, icon, iconBg, route }: ModuleCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, DashboardShadows.md]}
      onPress={() => router.push(route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
    </TouchableOpacity>
  )
}

export default function FleetDashboard() {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Filo Yönetimi"
        icon="car-sport-outline"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ModuleCard
          title="Araçlar"
          description="Araç kayıtları ve bilgileri"
          icon="car-sport-outline"
          iconBg="#10b981"
          route="/fleet/vehicle"
        />

        <ModuleCard
          title="Lastik Deposu"
          description="Lastik stok yönetimi"
          icon="ellipse-outline"
          iconBg="#3b82f6"
          route="/fleet/tire-warehouse"
        />

        <ModuleCard
          title="Çekici-Sürücü Eşleştirme"
          description="Sürücü ve çekici atamaları"
          icon="people-outline"
          iconBg="#f59e0b"
          route="/fleet/driver-tractor"
        />

        <ModuleCard
          title="Çekici-Dorse Eşleştirme"
          description="Çekici ve dorse atamaları"
          icon="git-merge-outline"
          iconBg="#8b5cf6"
          route="/fleet/tractor-trailer"
        />

        <ModuleCard
          title="Arıza Bildirimleri"
          description="Araç arıza kayıtları"
          icon="warning-outline"
          iconBg="#ef4444"
          route="/fleet/fault-reports"
        />
      </ScrollView>
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
  contentContainer: {
    padding: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    gap: DashboardSpacing.md
  },
  iconContainer: {
    width: 56,
    height: 56,
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
    color: DashboardColors.textSecondary
  }
})
