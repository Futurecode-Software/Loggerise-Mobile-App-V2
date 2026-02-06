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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
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
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>İnsan Kaynakları</Text>
            </View>
            <View style={styles.backButton} />
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

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
  headerContainer: {
    position: 'relative',
    paddingBottom: 24,
    overflow: 'hidden'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.md
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: '#fff'
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
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
