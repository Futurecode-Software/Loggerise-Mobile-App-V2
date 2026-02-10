/**
 * Daha Fazla Menüsü
 *
 * Ana navigasyon menüsü - Tüm modüllere erişim
 */

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
import { useRouter } from 'expo-router'
import React, { useMemo, useRef, useState } from 'react'
import { InteractionManager, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'


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
  onToggle: (measureAndScroll: () => void) => void
  router: any
  scrollViewRef: React.RefObject<ScrollView>
}

function CollapsibleMenu({ category, isExpanded, onToggle, router, scrollViewRef }: CollapsibleMenuProps) {
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const viewRef = useRef<View>(null)

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

  const measureAndScroll = () => {
    if (viewRef.current && scrollViewRef.current) {
      viewRef.current.measureLayout(
        scrollViewRef.current as any,
        (_x, y) => {
          const scrollY = Math.max(0, y - DashboardSpacing.md)
          scrollViewRef.current?.scrollTo({ y: scrollY, animated: true })
        },
        () => { }
      )
    }
  }

  const handleHeaderPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (category.route && !category.subItems) {
      router.push(category.route)
    } else if (category.subItems) {
      onToggle(measureAndScroll)
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
    <View ref={viewRef} style={styles.categoryContainer}>
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
              <View style={styles.subItemConnector}>
                <View style={[
                  styles.connectorLine,
                  index === category.subItems!.length - 1 && styles.connectorLineLast
                ]} />
                <View style={styles.connectorDot} />
              </View>
              <Text style={styles.subItemLabel}>{subItem.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={DashboardColors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

export default function MoreScreen() {
  const router = useRouter()
  const scrollViewRef = useRef<ScrollView>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    router.replace('/(auth)/logging-out')
  }

  const toggleCategory = (categoryId: string, measureAndScroll: () => void) => {
    const isOpening = expandedCategory !== categoryId

    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)

    // Menü açılıyorsa, render tamamlandıktan hemen sonra scroll et
    if (isOpening) {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          measureAndScroll()
        })
      })
    }
  }

  const menuCategories = useMemo<MenuCategory[]>(() => [
    {
      id: 'muhasebe',
      icon: 'calculator',
      label: 'Muhasebe',
      color: '#3b82f6',
      subItems: [
        { icon: 'people', label: 'Cariler', route: '/accounting/contacts', color: '#f59e0b' },
        { icon: 'wallet', label: 'Kasalar', route: '/accounting/cash-register', color: '#14b8a6' },
        { icon: 'business', label: 'Bankalar', route: '/accounting/bank', color: '#22c55e' },
        { icon: 'receipt', label: 'Çekler', route: '/accounting/check', color: '#f97316' },
        { icon: 'document-text', label: 'Senetler', route: '/accounting/promissory-note', color: '#a855f7' },
        { icon: 'swap-horizontal', label: 'Mali Hareketler', route: '/accounting/transactions', color: '#6366f1' },
        { icon: 'document', label: 'Faturalar', route: '/accounting/invoices', color: '#ef4444' },
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
      id: 'ihracat-depolari',
      icon: 'storefront',
      label: 'İhracat Depoları',
      color: '#14b8a6',
      subItems: [
        { icon: 'home', label: 'Depolar', route: '/warehouse/exports', color: '#14b8a6' },
        { icon: 'cube', label: 'İhracat Deposu Malları', route: '/warehouse/export-items', color: '#f59e0b' },
        { icon: 'time', label: 'Beklenen Mallar', route: '/warehouse/export-expected', color: '#8b5cf6' },
        { icon: 'location', label: 'Pozisyon Durumu', route: '/warehouse/export-positions', color: '#0ea5e9' }
      ]
    },
    {
      id: 'filo',
      icon: 'car-sport',
      label: 'Filo Yönetimi',
      color: '#f97316',
      subItems: [
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
      route: '/logistics/domestic'
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
    },
    {
      id: 'sistem-yonetimi',
      icon: 'settings',
      label: 'Sistem Yönetimi',
      color: '#6366f1',
      subItems: [
        { icon: 'notifications', label: 'Bildirim Yönetimi', route: '/admin/notification-broadcast', color: '#f59e0b' }
      ]
    }
  ], [])

  // Arama filtreleme
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return menuCategories
    }

    const query = searchQuery.toLowerCase().trim()
    return menuCategories.filter(category => {
      // Kategori adı eşleşiyorsa
      if (category.label.toLowerCase().includes(query)) {
        return true
      }

      // Alt öğelerde arama
      if (category.subItems) {
        return category.subItems.some(subItem =>
          subItem.label.toLowerCase().includes(query)
        )
      }

      return false
    }).map(category => {
      // Alt öğeleri de filtrele
      if (category.subItems) {
        return {
          ...category,
          subItems: category.subItems.filter(subItem =>
            subItem.label.toLowerCase().includes(query)
          )
        }
      }
      return category
    })
  }, [searchQuery, menuCategories])

  return (
    <View style={styles.container}>
      <PageHeader
        title="Daha Fazla"
        icon="apps-outline"
        subtitle="Tüm modüller ve özellikler"
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Arama */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={DashboardColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Menüde ara..."
            placeholderTextColor={DashboardColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            enterKeyHint="search"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && Platform.OS === 'android' && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Menü Kategorileri */}
        <View style={styles.menuContainer}>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <CollapsibleMenu
                key={category.id}
                category={category}
                isExpanded={searchQuery ? true : expandedCategory === category.id}
                onToggle={(measureAndScroll) => toggleCategory(category.id, measureAndScroll)}
                router={router}
                scrollViewRef={scrollViewRef}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={DashboardColors.textMuted} />
              <Text style={styles.emptyStateText}>Sonuç bulunamadı</Text>
              <Text style={styles.emptyStateSubtext}>
                Farklı bir arama terimi deneyin
              </Text>
            </View>
          )}
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
            style={[styles.settingsItem, styles.settingsItemLast]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push('/about')
            }}
          >
            <View style={[styles.settingsIconContainer, { backgroundColor: '#8b5cf615' }]}>
              <Ionicons name="information-circle" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsLabel}>Hakkında</Text>
              <Text style={styles.settingsDescription}>Uygulama hakkında bilgi</Text>
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
    paddingTop: 0
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    paddingHorizontal: DashboardSpacing.md,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  searchIcon: {
    marginRight: DashboardSpacing.sm
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary,
    paddingVertical: DashboardSpacing.sm
  },
  clearButton: {
    padding: DashboardSpacing.xs,
    marginLeft: DashboardSpacing.xs
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
    backgroundColor: DashboardColors.surface,
    paddingLeft: DashboardSpacing.xl + 22,
    paddingBottom: DashboardSpacing.sm
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DashboardSpacing.sm + 2,
    paddingRight: DashboardSpacing.lg,
    minHeight: 40
  },
  subItemLast: {
    // Son eleman için özel stil gerekirse
  },
  subItemConnector: {
    width: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginRight: DashboardSpacing.sm
  },
  connectorLine: {
    position: 'absolute',
    left: 11,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: DashboardColors.borderLight
  },
  connectorLineLast: {
    bottom: '50%'
  },
  connectorDot: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DashboardColors.textMuted
  },
  subItemLabel: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyStateText: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.md,
    marginBottom: DashboardSpacing.xs
  },
  emptyStateSubtext: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  },
  bottomSpacer: {
    height: 100
  }
})
