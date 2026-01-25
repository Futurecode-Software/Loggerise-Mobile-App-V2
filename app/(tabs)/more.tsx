import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  // Stock Management
  Package,
  Box,
  Tag,
  Layers,
  FolderTree,
  Warehouse,
  ArrowLeftRight,
  // Finance
  Landmark,
  Wallet,
  BarChart3,
  Receipt,
  FileCheck,
  ScrollText,
  // Logistics
  Car,
  Route,
  Truck,
  MapPin,
  // Management
  Users,
  Handshake,
  FileText,
  // Communication
  MessageCircle,
  Sparkles,
  // UI
  Settings,
} from 'lucide-react-native';
import { CollapsibleMenuSection } from '@/components/menu';
import { Colors, Typography, Spacing, Brand } from '@/constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EXPANDED_SECTION_STORAGE_KEY = '@loggerise_menu_expanded_section';

/**
 * Menu sections configuration matching web sidebar structure
 */
const MENU_SECTIONS = [
  {
    id: 'stock',
    title: 'Stok Yönetimi',
    icon: Package,
    iconColor: '#f59e0b',
    items: [
      { id: 'products', label: 'Ürünler', icon: Box, color: '#f59e0b', route: '/products' },
      { id: 'brands', label: 'Markalar', icon: Tag, color: '#8b5cf6', route: '/stock/brands' },
      { id: 'models', label: 'Modeller', icon: Layers, color: '#06b6d4', route: '/stock/models' },
      {
        id: 'categories',
        label: 'Kategoriler',
        icon: FolderTree,
        color: '#10b981',
        route: '/stock/categories',
      },
      { id: 'warehouses', label: 'Depolar', icon: Warehouse, color: '#3b82f6', route: '/warehouse' },
      {
        id: 'movements',
        label: 'Stok Hareketleri',
        icon: ArrowLeftRight,
        color: '#ec4899',
        route: '/stock/movements',
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finans',
    icon: Landmark,
    iconColor: '#22c55e',
    items: [
      { id: 'cash', label: 'Kasalar', icon: Wallet, color: '#14b8a6', route: '/cash-register' },
      { id: 'banks', label: 'Banka Hesapları', icon: Landmark, color: '#22c55e', route: '/bank' },
      { id: 'checks', label: 'Çekler', icon: FileCheck, color: '#f97316', route: '/finance/checks' },
      {
        id: 'notes',
        label: 'Senetler',
        icon: ScrollText,
        color: '#a855f7',
        route: '/finance/notes',
      },
      {
        id: 'transactions',
        label: 'Mali Hareketler',
        icon: BarChart3,
        color: '#6366f1',
        route: '/transactions',
      },
      { id: 'invoices', label: 'Faturalar', icon: Receipt, color: '#ef4444', route: '/invoices' },
    ],
  },
  {
    id: 'logistics',
    title: 'Lojistik',
    icon: Truck,
    iconColor: '#3b82f6',
    items: [
      { id: 'vehicles', label: 'Araçlar', icon: Car, color: '#3b82f6', route: '/vehicle' },
      { id: 'trips', label: 'Seferler', icon: Route, color: '#8b5cf6', route: '/trips' },
      {
        id: 'domestic',
        label: 'Yurtiçi İş Emirleri',
        icon: Truck,
        color: '#f59e0b',
        route: '/domestic/orders',
      },
      { id: 'positions', label: 'Pozisyonlar', icon: MapPin, color: '#10b981', route: '/positions' },
    ],
  },
  {
    id: 'management',
    title: 'Yönetim',
    icon: Users,
    iconColor: '#ec4899',
    items: [
      { id: 'employees', label: 'Çalışanlar', icon: Users, color: '#ec4899', route: '/employee' },
      { id: 'crm', label: 'CRM Müşteriler', icon: Handshake, color: '#f97316', route: '/crm' },
      { id: 'quotes', label: 'Teklifler', icon: FileText, color: '#84cc16', route: '/quotes' },
    ],
  },
  {
    id: 'communication',
    title: 'İletişim',
    icon: MessageCircle,
    iconColor: '#0ea5e9',
    items: [
      // Mesajlar artık tab'da - More menüsünden kaldırıldı
      { id: 'ai', label: 'Loggy AI', icon: Sparkles, color: Brand.primary, route: '/ai-reports' },
    ],
  },
];

export default function MoreScreen() {
  const colors = Colors.light;
  // Accordion state: only one section can be expanded at a time
  // null means no section is expanded
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved expanded section from AsyncStorage
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedSection = await AsyncStorage.getItem(EXPANDED_SECTION_STORAGE_KEY);
        if (savedSection) {
          setExpandedSectionId(savedSection);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load menu state:', error);
        setIsInitialized(true);
      }
    };
    loadState();
  }, []);

  // Save expanded section to AsyncStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      if (expandedSectionId) {
        AsyncStorage.setItem(EXPANDED_SECTION_STORAGE_KEY, expandedSectionId).catch((error) =>
          console.error('Failed to save menu state:', error)
        );
      } else {
        AsyncStorage.removeItem(EXPANDED_SECTION_STORAGE_KEY).catch((error) =>
          console.error('Failed to remove menu state:', error)
        );
      }
    }
  }, [expandedSectionId, isInitialized]);

  const handleToggle = useCallback((sectionId: string) => {
    LayoutAnimation.configureNext({
      duration: 250,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setExpandedSectionId((current) => (current === sectionId ? null : sectionId));
  }, []);

  const handleItemPress = useCallback((route: string) => {
    router.push(route as any);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Daha Fazla</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings' as any)}
        >
          <Settings size={22} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info text */}
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          Bir kategori seçerek alt menülere erişebilirsiniz
        </Text>

        {MENU_SECTIONS.map((section) => (
          <CollapsibleMenuSection
            key={section.id}
            id={section.id}
            title={section.title}
            icon={section.icon}
            iconColor={section.iconColor}
            items={section.items}
            isExpanded={expandedSectionId === section.id}
            onToggle={handleToggle}
            onItemPress={handleItemPress}
          />
        ))}

        {/* Version Info */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>Loggerise v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.headingLG,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  infoText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  versionText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
