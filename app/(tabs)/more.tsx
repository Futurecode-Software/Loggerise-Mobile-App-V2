/**
 * Daha Fazla Menüsü
 *
 * Ana navigasyon menüsü - Tüm modüllere erişim
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useAuth } from '@/context/auth-context'
import { PageHeader } from '@/components/navigation'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface SubMenuItem {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  route: string
  color: string
}

interface MenuCategory {
  id: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
  route?: string
  subItems?: SubMenuItem[]
}

interface CollapsibleMenuProps {
  category: MenuCategory
  isExpanded: boolean
  onToggle: () => void
  router: any
}

function CollapsibleMenu({ category, isExpanded, onToggle, router }: CollapsibleMenuProps) {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }))

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 200 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded])

  const handleHeaderPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (category.route && !category.subItems) {
      router.push(category.route)
    } else if (category.subItems) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      onToggle()
    }
  }

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  const handleSubItemPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(route)
  }

  return (
    <View style={styles.categoryContainer}>
      <AnimatedPressable
        style={[styles.categoryHeader, headerStyle]}
        onPress={handleHeaderPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}15` }]}>
          <Ionicons name={category.icon} size={22} color={category.color} />
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          {category.subItems && category.subItems.length > 0 && (
            <Text style={styles.categoryCount}>{category.subItems.length} öğe</Text>
          )}
        </View>
        {category.subItems && (
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={20} color={DashboardColors.textMuted} />
          </Animated.View>
        )}
        {!category.subItems && (
          <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
        )}
      </AnimatedPressable>

      {isExpanded && category.subItems && (
        <View style={styles.subItemsContainer}>
          {category.subItems.map((subItem, index) => (
            <Pressable
              key={subItem.route}
              style={[
                styles.subItem,
                index === category.subItems!.length - 1 && styles.subItemLast
              ]}
              onPress={() => handleSubItemPress(subItem.route)}
            >
              <View style={[styles.subItemIconContainer, { backgroundColor: `${subItem.color}15` }]}>
                <Ionicons name={subItem.icon} size={18} color={subItem.color} />
              </View>
              <Text style={styles.subItemLabel}>{subItem.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={DashboardColors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

export default function MoreScreen() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    await logout()
    router.replace('/(auth)/login')
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const menuCategories: MenuCategory[] = [
    {
      id: 'muhasebe',
      icon: 'calculator',
      label: 'Muhasebe',
      color: '#3b82f6',
      subItems: [
        { icon: 'wallet', label: 'Kasalar', route: '/accounting/cash-register', color: '#14b8a6' },
        { icon: 'business', label: 'Bankalar', route: '/accounting/bank', color: '#22c55e' },
        { icon: 'receipt', label: 'Çekler', route: '/accounting/check', color: '#f97316' },
        { icon: 'document-text', label: 'Senetler', route: '/accounting/promissory-note', color: '#a855f7' },
        { icon: 'swap-horizontal', label: 'Mali Hareketler', route: '/accounting/transactions', color: '#6366f1' },
        { icon: 'people', label: 'Cariler', route: '/crm/customers', color: '#f59e0b' },
        { icon: 'document', label: 'Faturalar', route: '/finance/invoices', color: '#ef4444' },
        { icon: 'cube', label: 'Ürünler', route: '/inventory/stock/products', color: '#10b981' },
        { icon: 'pricetag', label: 'Markalar', route: '/inventory/stock/brands', color: '#8b5cf6' },
        { icon: 'layers', label: 'Modeller', route: '/inventory/stock/models', color: '#06b6d4' },
        { icon: 'file-tray-full', label: 'Kategoriler', route: '/inventory/stock/categories', color: '#10b981' },
        { icon: 'home', label: 'Depolar', route: '/inventory/warehouse', color: '#3b82f6' },
        { icon: 'swap-horizontal', label: 'Stok Hareketleri', route: '/inventory/stock/movements', color: '#ec4899' }
      ]
    },
    {
      id: 'crm',
      icon: 'sparkles',
      label: 'CRM',
      color: '#ec4899',
      subItems: [
        { icon: 'people', label: 'Müşteriler', route: '/crm/customers', color: '#ec4899' },
        { icon: 'document-text', label: 'Teklifler', route: '/crm/quotes', color: '#84cc16' }
      ]
    },
    {
      id: 'seferler',
      icon: 'navigate',
      label: 'Seferler',
      color: '#8b5cf6',
      route: '/logistics/trip'
    },
    {
      id: 'ihracatlar',
      icon: 'airplane',
      label: 'İhracatlar',
      color: '#0ea5e9',
      subItems: [
        { icon: 'clipboard', label: 'Operasyonlar', route: '/logistics/exports/operations', color: '#0ea5e9' },
        { icon: 'list', label: 'Dispozisyon', route: '/logistics/exports/disposition', color: '#8b5cf6' },
        { icon: 'location', label: 'Pozisyonlar', route: '/logistics/exports/positions', color: '#10b981' },
        { icon: 'cube', label: 'Yükler', route: '/logistics/exports/loads', color: '#f59e0b' }
      ]
    },
    {
      id: 'ithalatlar',
      icon: 'enter',
      label: 'İthalatlar',
      color: '#6366f1',
      subItems: [
        { icon: 'clipboard', label: 'Operasyonlar', route: '/logistics/imports/operations', color: '#6366f1' },
        { icon: 'list', label: 'Dispozisyon', route: '/logistics/imports/disposition', color: '#8b5cf6' },
        { icon: 'location', label: 'Pozisyonlar', route: '/logistics/imports/positions', color: '#10b981' },
        { icon: 'cube', label: 'Yükler', route: '/logistics/imports/loads', color: '#f59e0b' }
      ]
    },
    {
      id: 'filo',
      icon: 'car-sport',
      label: 'Filo Yönetimi',
      color: '#f97316',
      subItems: [
        { icon: 'clipboard', label: 'İhracat Planlama', route: '/fleet/export-planning', color: '#0ea5e9' },
        { icon: 'map', label: 'Filo Takip', route: '/fleet/tracking', color: '#22c55e' },
        { icon: 'car', label: 'Araçlar', route: '/fleet/vehicle', color: '#3b82f6' },
        { icon: 'link', label: 'Çekici-Römork Eşleştirme', route: '/fleet/tractor-trailer', color: '#f59e0b' },
        { icon: 'link', label: 'Sürücü-Çekici Eşleştirme', route: '/fleet/driver-tractor', color: '#ec4899' },
        { icon: 'disc', label: 'Lastik Deposu', route: '/fleet/tire-warehouse', color: '#8b5cf6' },
        { icon: 'warning', label: 'Arıza Bildirimleri', route: '/fleet/fault-reports', color: '#ef4444' }
      ]
    },
    {
      id: 'yurtici',
      icon: 'location',
      label: 'Yurtiçi Taşımacılık',
      color: '#10b981',
      subItems: [
        { icon: 'clipboard', label: 'İş Emirleri', route: '/logistics/domestic', color: '#10b981' },
        { icon: 'calendar', label: 'Planlama', route: '/logistics/domestic/planning', color: '#6366f1' }
      ]
    },
    {
      id: 'ihracat-depo',
      icon: 'business',
      label: 'İhracat Deposu',
      color: '#84cc16',
      subItems: [
        { icon: 'home', label: 'Depolar', route: '/export-warehouse/warehouses', color: '#84cc16' },
        { icon: 'cube-outline', label: 'İhracat Deposu Malları', route: '/export-warehouse/items', color: '#f59e0b' },
        { icon: 'car', label: 'Beklenen Mallar', route: '/export-warehouse/expected', color: '#0ea5e9' },
        { icon: 'clipboard', label: 'Pozisyon Durumu', route: '/export-warehouse/positions', color: '#8b5cf6' }
      ]
    },
    {
      id: 'insan-kaynaklari',
      icon: 'people-circle',
      label: 'İnsan Kaynakları',
      color: '#ec4899',
      subItems: [
        { icon: 'people', label: 'Personeller', route: '/hr/employee', color: '#ec4899' },
        { icon: 'briefcase', label: 'İş İlanları', route: '/hr/job-postings', color: '#f97316' },
        { icon: 'document-text', label: 'İşe Alım Başvuruları', route: '/hr/job-applications', color: '#84cc16' }
      ]
    },
    {
      id: 'loggy',
      icon: 'chatbubble-ellipses',
      label: 'Loggy',
      color: DashboardColors.primary,
      route: '/loggy'
    },
    {
      id: 'ajandam',
      icon: 'calendar',
      label: 'Ajandam',
      color: '#a855f7',
      route: '/event'
    },
    {
      id: 'raporlar',
      icon: 'bar-chart',
      label: 'Raporlar',
      color: '#14b8a6',
      subItems: [
        { icon: 'pie-chart', label: 'Kar Zarar Analizi', route: '/reports/profit-loss', color: '#14b8a6' },
        { icon: 'document-text', label: 'KDV Raporu', route: '/reports/kdv', color: '#f97316' },
        { icon: 'people', label: 'Cari Raporlar', route: '/reports/contact', color: '#ec4899' },
        { icon: 'car', label: 'Yurtiçi Raporlar', route: '/reports/domestic', color: '#10b981' }
      ]
    },
    {
      id: 'kullanici-yonetimi',
      icon: 'people',
      label: 'Kullanıcı Yönetimi',
      color: '#3b82f6',
      route: '/settings/users'
    }
  ]

  return (
    <View style={styles.container}>
      <PageHeader
        title="Daha Fazla"
        icon="apps-outline"
        subtitle="Tüm modüller ve özellikler"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kullanıcı Kartı */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'Kullanıcı'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
          <Pressable
            style={styles.editButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/(tabs)/profile')
            }}
          >
            <Ionicons name="create-outline" size={20} color={DashboardColors.primary} />
          </Pressable>
        </View>

        {/* Bilgilendirme */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={16} color={DashboardColors.primary} />
          <Text style={styles.infoText}>
            Bir kategori seçerek alt menülere erişebilirsiniz
          </Text>
        </View>

        {/* Menü Kategorileri */}
        <View style={styles.menuContainer}>
          {menuCategories.map((category) => (
            <CollapsibleMenu
              key={category.id}
              category={category}
              isExpanded={expandedCategory === category.id}
              onToggle={() => toggleCategory(category.id)}
              router={router}
            />
          ))}
        </View>

        {/* Ayarlar Bölümü */}
        <Text style={styles.sectionTitle}>Ayarlar</Text>
        <View style={styles.settingsSection}>
          <Pressable
            style={styles.settingsItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/(tabs)/profile')
            }}
          >
            <View style={[styles.settingsIconContainer, { backgroundColor: '#3b82f615' }]}>
              <Ionicons name="person" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsLabel}>Profil</Text>
              <Text style={styles.settingsDescription}>Hesap bilgilerinizi düzenleyin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </Pressable>

          <Pressable
            style={styles.settingsItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              console.log('Bildirimler')
            }}
          >
            <View style={[styles.settingsIconContainer, { backgroundColor: '#f59e0b15' }]}>
              <Ionicons name="notifications" size={20} color="#f59e0b" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsLabel}>Bildirimler</Text>
              <Text style={styles.settingsDescription}>Bildirim tercihlerinizi yönetin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.settingsItem, styles.settingsItemLast]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              console.log('Hakkında')
            }}
          >
            <View style={[styles.settingsIconContainer, { backgroundColor: '#8b5cf615' }]}>
              <Ionicons name="information-circle" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsLabel}>Hakkında</Text>
              <Text style={styles.settingsDescription}>Versiyon 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
          </Pressable>
        </View>

        {/* Çıkış Butonu */}
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={DashboardColors.danger} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </Pressable>

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
    paddingTop: DashboardSpacing.xl
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DashboardColors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  userAvatarText: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '700',
    color: DashboardColors.textOnPrimary
  },
  userInfo: {
    flex: 1,
    marginLeft: DashboardSpacing.lg
  },
  userName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  userEmail: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DashboardColors.primary}10`,
    borderRadius: DashboardBorderRadius.lg,
    padding: DashboardSpacing.md,
    marginBottom: DashboardSpacing.xl,
    gap: DashboardSpacing.sm
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    lineHeight: 18
  },
  menuContainer: {
    gap: DashboardSpacing.sm,
    marginBottom: DashboardSpacing.xl
  },
  categoryContainer: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    overflow: 'hidden',
    ...DashboardShadows.sm
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    backgroundColor: DashboardColors.surface
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryContent: {
    flex: 1,
    marginLeft: DashboardSpacing.md
  },
  categoryLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  categoryCount: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  subItemsContainer: {
    backgroundColor: DashboardColors.background,
    paddingVertical: DashboardSpacing.xs
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  subItemLast: {
    borderBottomWidth: 0
  },
  subItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  subItemLabel: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    marginLeft: DashboardSpacing.md
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.xs
  },
  settingsSection: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    overflow: 'hidden',
    marginBottom: DashboardSpacing.xl,
    ...DashboardShadows.sm
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  settingsItemLast: {
    borderBottomWidth: 0
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  settingsContent: {
    flex: 1,
    marginLeft: DashboardSpacing.md
  },
  settingsLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '500',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  settingsDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.sm,
    borderWidth: 1,
    borderColor: DashboardColors.danger,
    ...DashboardShadows.sm
  },
  logoutText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.danger
  },
  bottomSpacer: {
    height: 100
  }
})
