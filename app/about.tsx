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
        <View style={styles.headerContainer}>
          <Text style={styles.appName}>Loggerise Mobile</Text>
          <Text style={styles.appTagline}>İşletmeniz İçin Akıllı, Entegre ve Mobil Çözümler</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Vizyonumuz</Text>
          <Text style={styles.descriptionText}>
            Loggerise Mobile olarak vizyonumuz, lojistik ve saha operasyonları yürüten işletmelerin dijital dönüşümüne liderlik etmektir. Karmaşık iş süreçlerini basitleştiren, tüm operasyonel birimleri tek bir platformda birleştiren ve mobil teknolojinin gücüyle işletmenize her an her yerden erişim imkanı sunan yenilikçi bir ekosistem sağlıyoruz. Amacımız, verimliliği maksimize ederek ve stratejik karar alma süreçlerinizi anlık verilerle destekleyerek pazarınızda rekabet avantajı elde etmenizi sağlamaktır.
          </Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Çekirdek Modüllerimiz</Text>
          <Text style={styles.moduleDescriptionText}>
            Uygulamamız, işletmenizin her alanını kapsayacak şekilde tasarlanmış güçlü modüllerden oluşur:
          </Text>
          
          <View style={styles.moduleGrid}>
            <ModuleItem icon="navigate" title="Lojistik ve Operasyon" description="Yurtiçi ve uluslararası taşımalarınızı, seferlerinizi ve yüklerinizi anlık olarak yönetin." color="#8b5cf6" />
            <ModuleItem icon="calculator" title="Finans ve Muhasebe" description="Kasa, banka, çek, senet ve tüm finansal akışınızı kontrol altında tutun." color="#3b82f6" />
            <ModuleItem icon="car-sport" title="Filo Yönetimi" description="Araçlarınızın, sürücülerinizin ve bakım süreçlerinizin tam kontrolünü sağlayın." color="#f97316" />
            <ModuleItem icon="sparkles" title="CRM ve Satış" description="Müşteri ilişkilerinizi güçlendirin ve tekliften satışa tüm süreci yönetin." color="#ec4899" />
            <ModuleItem icon="business" title="Stok ve Depo" description="Depolarınızdaki stok hareketlerini ve ürün pozisyonlarını hassasiyetle izleyin." color="#10b981" />
            <ModuleItem icon="people-circle" title="İnsan Kaynakları" description="Personel yönetimi, işe alım ve performans takibi süreçlerinizi dijitalleştirin." color="#06b6d4" />
          </View>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Neden Loggerise Mobile?</Text>
          <AdvantageItem text="Tüm iş süreçlerini tek bir entegre platformda birleştirin." />
          <AdvantageItem text="Mobil erişim sayesinde ofis dışında bile tam kontrol sağlayın." />
          <AdvantageItem text="Anlık veri akışı ile hızlı ve doğru kararlar alın." />
          <AdvantageItem text="Kullanıcı dostu arayüzü ile ekibinizin hızla adapte olmasını sağlayın." />
          <AdvantageItem text="Güçlü raporlama araçlarıyla işletmenizin performansını derinlemesine analiz edin." />
        </View>


        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  )
}

function ModuleItem({ icon, title, description, color }: { icon: keyof typeof Ionicons.glyphMap, title: string, description: string, color: string }) {
  return (
    <View style={styles.moduleItem}>
      <View style={[styles.moduleIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.moduleTextContainer}>
        <Text style={styles.moduleTitle}>{title}</Text>
        <Text style={styles.moduleItemDescription}>{description}</Text>
      </View>
    </View>
  )
}

function AdvantageItem({ text }: { text: string }) {
  return (
    <View style={styles.advantageItem}>
      <Ionicons name="checkmark-circle-outline" size={20} color={DashboardColors.success} />
      <Text style={styles.advantageText}>{text}</Text>
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
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
  },
  appName: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: 'bold',
    color: DashboardColors.textPrimary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.sm,
  },
  appTagline: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.lg,
    ...DashboardShadows.sm
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: 'bold',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.md,
  },
  descriptionText: {
    fontSize: DashboardFontSizes.base,
    lineHeight: 24,
    color: DashboardColors.textSecondary,
  },
  moduleDescriptionText: {
    fontSize: DashboardFontSizes.base,
    lineHeight: 24,
    color: DashboardColors.textSecondary,
    marginBottom: DashboardSpacing.lg,
  },
  moduleGrid: {
    gap: DashboardSpacing.lg,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
  },
  moduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTextContainer: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: 2,
  },
  moduleItemDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 18,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.sm,
  },
  advantageText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  footerCard: {
    backgroundColor: 'transparent',
    borderRadius: DashboardBorderRadius.xl,
    paddingVertical: DashboardSpacing.sm,
    paddingHorizontal: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.xl,
    borderWidth: 1,
    borderColor: DashboardColors.border,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
  },
  versionLabel: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    flex: 1,
  },
  versionValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
  },
  bottomSpacer: {
    height: 100
  }
})

