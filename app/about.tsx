/**
 * Hakkında Sayfası
 *
 * Uygulama hakkında kurumsal bilgiler
 */

import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import Constants from 'expo-constants'

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  description: string
  color: string
}

function FeatureItem({ icon, title, description, color }: FeatureItemProps): React.ReactElement {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  )
}

export default function AboutScreen(): React.ReactElement {
  const handleBackPress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const appVersion = Constants.expoConfig?.version || '1.0.0'

  return (
    <View style={styles.container}>
      <PageHeader
        title="Hakkında"
        icon="information-circle-outline"
        subtitle={`Versiyon ${appVersion}`}
        showBackButton
        onBackPress={handleBackPress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo ve Başlık */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="business" size={48} color={DashboardColors.primary} />
          </View>
          <Text style={styles.appName}>Loggerise Mobile</Text>
          <Text style={styles.appTagline}>Entegre İşletme Yönetim Sistemi</Text>
        </View>

        {/* Açıklama */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            Loggerise Mobile, lojistik ve taşımacılık sektöründe faaliyet gösteren işletmelerin
            operasyonel süreçlerini dijitalleştiren, mobil tabanlı bir yönetim sistemidir.
            Muhasebe, CRM, filo yönetimi, depo ve insan kaynakları süreçlerini tek bir platformda
            birleştirerek iş akışlarınızı hızlandırır ve verimliliğinizi artırır.
          </Text>
        </View>

        {/* Özellikler */}
        <Text style={styles.sectionTitle}>Temel Özellikler</Text>
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="calculator"
            title="Muhasebe Yönetimi"
            description="Kasa, banka, çek, senet işlemleri ve fatura yönetimi"
            color="#3b82f6"
          />
          <FeatureItem
            icon="navigate"
            title="Lojistik Operasyonlar"
            description="İhracat, ithalat ve yurtiçi taşıma süreçlerinin takibi"
            color="#8b5cf6"
          />
          <FeatureItem
            icon="car-sport"
            title="Filo Yönetimi"
            description="Araç, sürücü ve römork takibi, bakım planlaması"
            color="#f97316"
          />
          <FeatureItem
            icon="business"
            title="Depo Yönetimi"
            description="Stok takibi, depo hareketleri ve pozisyon kontrolü"
            color="#10b981"
          />
          <FeatureItem
            icon="sparkles"
            title="CRM"
            description="Müşteri ilişkileri yönetimi ve teklif takibi"
            color="#ec4899"
          />
          <FeatureItem
            icon="people-circle"
            title="İnsan Kaynakları"
            description="Personel yönetimi, iş ilanları ve başvuru süreçleri"
            color="#06b6d4"
          />
          <FeatureItem
            icon="bar-chart"
            title="Raporlama"
            description="Detaylı finansal ve operasyonel raporlar"
            color="#14b8a6"
          />
          <FeatureItem
            icon="notifications"
            title="Bildirimler"
            description="Anlık bildirimler ile önemli gelişmeleri kaçırmayın"
            color="#f59e0b"
          />
        </View>

        {/* Avantajlar */}
        <Text style={styles.sectionTitle}>Avantajları</Text>
        <View style={styles.advantagesCard}>
          <View style={styles.advantageItem}>
            <Ionicons name="checkmark-circle" size={20} color={DashboardColors.success} />
            <Text style={styles.advantageText}>Mobil erişim ile her yerden yönetim</Text>
          </View>
          <View style={styles.advantageItem}>
            <Ionicons name="checkmark-circle" size={20} color={DashboardColors.success} />
            <Text style={styles.advantageText}>Gerçek zamanlı veri senkronizasyonu</Text>
          </View>
          <View style={styles.advantageItem}>
            <Ionicons name="checkmark-circle" size={20} color={DashboardColors.success} />
            <Text style={styles.advantageText}>Kullanıcı dostu arayüz</Text>
          </View>
          <View style={styles.advantageItem}>
            <Ionicons name="checkmark-circle" size={20} color={DashboardColors.success} />
            <Text style={styles.advantageText}>Güvenli veri saklama</Text>
          </View>
          <View style={styles.advantageItem}>
            <Ionicons name="checkmark-circle" size={20} color={DashboardColors.success} />
            <Text style={styles.advantageText}>Entegre iş akışları</Text>
          </View>
        </View>

        {/* Versiyon Bilgisi */}
        <View style={styles.versionCard}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Versiyon</Text>
            <Text style={styles.versionValue}>{appVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Platform</Text>
            <Text style={styles.versionValue}>React Native (Expo)</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Son Güncelleme</Text>
            <Text style={styles.versionValue}>2025</Text>
          </View>
        </View>

        {/* İletişim */}
        <View style={styles.contactCard}>
          <Ionicons name="mail" size={24} color={DashboardColors.primary} />
          <Text style={styles.contactText}>
            Destek ve öneri için lütfen sistem yöneticinizle iletişime geçin.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  scrollView: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: DashboardSpacing['2xl']
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${DashboardColors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.lg
  },
  appName: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  appTagline: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },
  descriptionCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.xl,
    ...DashboardShadows.sm
  },
  descriptionText: {
    fontSize: DashboardFontSizes.base,
    lineHeight: 24,
    color: DashboardColors.textPrimary
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.lg
  },
  featuresContainer: {
    gap: DashboardSpacing.md,
    marginBottom: DashboardSpacing.xl
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DashboardSpacing.md
  },
  featureContent: {
    flex: 1
  },
  featureTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.xs
  },
  featureDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  },
  advantagesCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.xl,
    gap: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  advantageText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    flex: 1
  },
  versionCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.xl,
    gap: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  versionLabel: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary
  },
  versionValue: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    backgroundColor: `${DashboardColors.primary}10`,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.xl
  },
  contactText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 20
  },
  bottomSpacer: {
    height: 100
  }
})
