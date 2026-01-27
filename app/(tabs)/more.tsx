import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
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
  Calculator,
  Building2,
  // Logistics
  Car,
  Route,
  Truck,
  MapPin,
  MapPinned,
  Link2,
  CircleGauge,
  AlertTriangle,
  // Exports (İhracatlar)
  Ship,
  ClipboardList,
  Boxes,
  // Management
  Users,
  Handshake,
  FileText,
  UsersRound,
  Briefcase,
  // Communication
  MessageCircle,
  Sparkles,
  Bot,
  // Reports
  PieChart,
  // UI
  Settings,
  Shield,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { CollapsibleMenuSection } from '@/components/menu';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';

const EXPANDED_SECTION_STORAGE_KEY = '@loggerise_menu_expanded_section';

// Type definitions for menu sections
interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route: string;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  route?: string; // Direkt link için
  items?: MenuItem[]; // Alt menü için
}

/**
 * Menu sections configuration matching web sidebar structure
 * Fully aligned with app-sidebar.tsx from web application
 */
const MENU_SECTIONS: MenuSection[] = [
  {
    id: 'accounting',
    title: 'Muhasebe',
    icon: Calculator,
    iconColor: '#3b82f6',
    items: [
      // Finance Management (Finans Yönetimi)
      { id: 'cash', label: 'Kasalar', icon: Wallet, color: '#14b8a6', route: '/cash-register' },
      { id: 'banks', label: 'Bankalar', icon: Building2, color: '#22c55e', route: '/bank' },
      { id: 'checks', label: 'Çekler', icon: Receipt, color: '#f97316', route: '/finance/checks' },
      { id: 'notes', label: 'Senetler', icon: ScrollText, color: '#a855f7', route: '/finance/notes' },
      { id: 'transactions', label: 'Mali Hareketler', icon: ArrowLeftRight, color: '#6366f1', route: '/transactions' },
      // Contact Management (Cari Yönetimi)
      { id: 'contacts', label: 'Cariler', icon: Users, color: '#f59e0b', route: '/contacts' },
      // Invoice Management (Fatura Yönetimi)
      { id: 'invoices', label: 'Faturalar', icon: FileText, color: '#ef4444', route: '/invoices' },
      // Stock Management (Stok Yönetimi)
      { id: 'products', label: 'Ürünler', icon: Box, color: '#10b981', route: '/products' },
      { id: 'brands', label: 'Markalar', icon: Tag, color: '#8b5cf6', route: '/stock/brands' },
      { id: 'models', label: 'Modeller', icon: Layers, color: '#06b6d4', route: '/stock/models' },
      { id: 'categories', label: 'Kategoriler', icon: FolderTree, color: '#10b981', route: '/stock/categories' },
      { id: 'warehouses', label: 'Depolar', icon: Warehouse, color: '#3b82f6', route: '/warehouse' },
    ],
  },
  {
    id: 'crm',
    title: 'CRM',
    icon: Sparkles,
    iconColor: '#ec4899',
    items: [
      { id: 'customers', label: 'Müşteriler', icon: Users, color: '#ec4899', route: '/crm' },
      { id: 'quotes', label: 'Teklifler', icon: FileText, color: '#84cc16', route: '/quotes' },
    ],
  },
  {
    id: 'trips',
    title: 'Seferler',
    icon: MapPin,
    iconColor: '#8b5cf6',
    route: '/trip', // Direkt link - alt menü yok
  },
  {
    id: 'exports',
    title: 'İhracatlar',
    icon: Truck,
    iconColor: '#0ea5e9',
    items: [
      { id: 'export-operations', label: 'Operasyonlar', icon: ClipboardList, color: '#0ea5e9', route: '/exports/operations' },
      { id: 'export-disposition', label: 'Dispozisyon', icon: ClipboardList, color: '#8b5cf6', route: '/exports/disposition' },
      { id: 'export-positions', label: 'Pozisyonlar', icon: MapPin, color: '#10b981', route: '/exports/positions' },
      { id: 'export-loads', label: 'Yükler', icon: Package, color: '#f59e0b', route: '/exports/loads' },
    ],
  },
  {
    id: 'imports',
    title: 'İthalatlar',
    icon: Truck,
    iconColor: '#6366f1',
    items: [
      { id: 'import-operations', label: 'Operasyonlar', icon: ClipboardList, color: '#6366f1', route: '/imports/operations' },
      { id: 'import-disposition', label: 'Dispozisyon', icon: ClipboardList, color: '#8b5cf6', route: '/imports/disposition' },
      { id: 'import-positions', label: 'Pozisyonlar', icon: MapPin, color: '#10b981', route: '/imports/positions' },
      { id: 'import-loads', label: 'Yükler', icon: Package, color: '#f59e0b', route: '/imports/loads' },
    ],
  },
  {
    id: 'fleet',
    title: 'Filo Yönetimi',
    icon: Truck,
    iconColor: '#f97316',
    items: [
      { id: 'export-planning', label: 'İhracat Planlama', icon: ClipboardList, color: '#0ea5e9', route: '/fleet/export-planning' },
      { id: 'fleet-tracking', label: 'Filo Takip', icon: MapPinned, color: '#22c55e', route: '/fleet/tracking' },
      { id: 'vehicles', label: 'Araçlar', icon: Car, color: '#3b82f6', route: '/vehicle' },
      { id: 'tractor-trailer', label: 'Çekici-Römork Eşleştirme', icon: Link2, color: '#f59e0b', route: '/fleet/tractor-trailer' },
      { id: 'driver-tractor', label: 'Sürücü-Çekici Eşleştirme', icon: Link2, color: '#ec4899', route: '/fleet/driver-tractor' },
      { id: 'tire-warehouse', label: 'Lastik Deposu', icon: CircleGauge, color: '#8b5cf6', route: '/fleet/tire-warehouse' },
      { id: 'fault-reports', label: 'Arıza Bildirimleri', icon: AlertTriangle, color: '#ef4444', route: '/fleet/fault-reports' },
    ],
  },
  {
    id: 'domestic',
    title: 'Yurtiçi Taşımacılık',
    icon: Truck,
    iconColor: '#10b981',
    items: [
      { id: 'work-orders', label: 'İş Emirleri', icon: ClipboardList, color: '#10b981', route: '/domestic' },
      { id: 'planning', label: 'Planlama', icon: Calendar, color: '#6366f1', route: '/domestic/planning' },
    ],
  },
  {
    id: 'export-warehouse',
    title: 'İhracat Deposu',
    icon: Warehouse,
    iconColor: '#84cc16',
    items: [
      { id: 'warehouses', label: 'Depolar', icon: Warehouse, color: '#84cc16', route: '/export-warehouse/warehouses' },
      { id: 'items', label: 'İhracat Deposu Malları', icon: Boxes, color: '#f59e0b', route: '/export-warehouse/items' },
      { id: 'expected', label: 'Beklenen Mallar', icon: Truck, color: '#0ea5e9', route: '/export-warehouse/expected' },
      { id: 'positions', label: 'Pozisyon Durumu', icon: ClipboardList, color: '#8b5cf6', route: '/export-warehouse/positions' },
    ],
  },
  {
    id: 'hr',
    title: 'İnsan Kaynakları',
    icon: UsersRound,
    iconColor: '#ec4899',
    items: [
      { id: 'employees', label: 'Personeller', icon: UsersRound, color: '#ec4899', route: '/employee' },
      { id: 'job-postings', label: 'İş İlanları', icon: Briefcase, color: '#f97316', route: '/hr/job-postings' },
      { id: 'job-applications', label: 'İşe Alım Başvuruları', icon: FileText, color: '#84cc16', route: '/hr/job-applications' },
    ],
  },
  {
    id: 'ai',
    title: 'Loggy',
    icon: Bot,
    iconColor: Brand.primary,
    route: '/loggy', // Direkt link - alt menü yok
  },
  {
    id: 'agenda',
    title: 'Ajandam',
    icon: Calendar,
    iconColor: '#a855f7',
    route: '/agenda', // Direkt link - alt menü yok
  },
  {
    id: 'reports',
    title: 'Raporlar',
    icon: BarChart3,
    iconColor: '#14b8a6',
    items: [
      { id: 'profit-loss', label: 'Kar Zarar Analizi', icon: PieChart, color: '#14b8a6', route: '/reports/profit-loss' },
      { id: 'vat', label: 'KDV Raporu', icon: FileText, color: '#f97316', route: '/reports/vat' },
      { id: 'contact-reports', label: 'Cari Raporlar', icon: Users, color: '#ec4899', route: '/reports/contacts' },
      { id: 'domestic-reports', label: 'Yurtiçi Raporlar', icon: Truck, color: '#10b981', route: '/reports/domestic' },
    ],
  },
  {
    id: 'system',
    title: 'Sistem Yönetimi',
    icon: Settings,
    iconColor: '#6366f1',
    items: [
      { id: 'users', label: 'Kullanıcılar', icon: Users, color: '#3b82f6', route: '/settings/users' },
      { id: 'roles', label: 'Roller', icon: Shield, color: '#8b5cf6', route: '/settings/roles' },
      { id: 'system-settings', label: 'Sistem Ayarları', icon: Settings, color: '#6366f1', route: '/settings/system' },
      { id: 'demo-data', label: 'Demo Veri Yönetimi', icon: Sparkles, color: '#ec4899', route: '/settings/demo-data' },
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
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      {/* Full Screen Header */}
      <FullScreenHeader
        title="Daha Fazla"
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            activeOpacity={0.7}
          >
            <Settings size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Content Area with White Background and Rounded Corners */}
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
        {/* Info text */}
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          Bir kategori seçerek alt menülere erişebilirsiniz
        </Text>

        {MENU_SECTIONS.map((section) => {
          // Direkt link ise (route varsa ve items yoksa)
          if (section.route) {
            const SectionIcon = section.icon;
            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.directLinkSection, { backgroundColor: colors.surface }]}
                onPress={() => router.push(section.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.directLinkIcon, { backgroundColor: `${section.iconColor}15` }]}>
                  <SectionIcon size={20} color={section.iconColor} strokeWidth={2.5} />
                </View>
                <Text style={[styles.directLinkTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
                <ChevronRight size={20} color={colors.icon} />
              </TouchableOpacity>
            );
          }

          // Alt menülü section ise
          return (
            <CollapsibleMenuSection
              key={section.id}
              id={section.id}
              title={section.title}
              icon={section.icon}
              iconColor={section.iconColor}
              items={section.items || []}
              isExpanded={expandedSectionId === section.id}
              onToggle={handleToggle}
              onItemPress={handleItemPress}
            />
          );
        })}

        {/* Version Info */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>Loggerise v1.0.0</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  // Header styles removed - using FullScreenHeader component
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
  // Direkt link (alt menü olmayan) section stilleri
  directLinkSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  directLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  directLinkTitle: {
    ...Typography.headingSM,
    flex: 1,
    fontWeight: '600',
  },
});
