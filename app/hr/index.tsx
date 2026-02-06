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
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows
} from '@/constants/dashboard-theme'

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

export default function HRDashboard() {
  return (
    <View style={styles.container}>
      <PageHeader
        title="İnsan Kaynakları"
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ModuleCard
          title="Çalışanlar"
          description="Personel kayıtları ve bilgileri"
          icon="people-outline"
          iconBg="#10b981"
          route="/hr/employee"
        />

        <ModuleCard
          title="İş İlanları"
          description="Açık pozisyonlar ve ilanlar"
          icon="megaphone-outline"
          iconBg="#3b82f6"
          route="/hr/job-postings"
        />

        <ModuleCard
          title="İş Başvuruları"
          description="Gelen başvurular ve değerlendirmeler"
          icon="document-text-outline"
          iconBg="#f59e0b"
          route="/hr/job-applications"
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
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0,
    paddingBottom: DashboardSpacing.lg,
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
