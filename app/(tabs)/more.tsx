import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Car,
  Boxes,
  BarChart3,
  Users,
  Handshake,
  FileText,
  MessageCircle,
  Settings,
  Landmark,
  Wallet,
  Package,
  Warehouse,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir

const MENU_SECTIONS = [
  {
    title: 'Lojistik',
    items: [
      { id: 'vehicles', label: 'Araçlar', icon: Car, color: '#3b82f6', route: '/vehicle' },
      { id: 'warehouse', label: 'Depo', icon: Warehouse, color: '#8b5cf6', route: '/warehouse' },
      { id: 'products', label: 'Ürünler', icon: Package, color: '#f59e0b', route: '/products' },
    ],
  },
  {
    title: 'Finans',
    items: [
      { id: 'banks', label: 'Banka Hesapları', icon: Landmark, color: '#22c55e', route: '/bank' },
      { id: 'cash', label: 'Kasalar', icon: Wallet, color: '#14b8a6', route: '/cash-register' },
      { id: 'transactions', label: 'İşlemler', icon: BarChart3, color: '#6366f1', route: '/transactions' },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { id: 'employees', label: 'Çalışanlar', icon: Users, color: '#ec4899', route: '/employee' },
      { id: 'crm', label: 'CRM', icon: Handshake, color: '#f97316', route: '/crm' },
      { id: 'quotes', label: 'Teklifler', icon: FileText, color: '#84cc16', route: '/quotes' },
    ],
  },
  {
    title: 'İletişim',
    items: [
      { id: 'messages', label: 'Mesajlar', icon: MessageCircle, color: '#0ea5e9', route: '/messages' },
      { id: 'ai', label: 'Loggy AI', icon: Sparkles, color: Brand.primary, route: '/ai-reports' },
    ],
  },
];

export default function MoreScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;

  const handleItemPress = (route: string) => {
    router.push(route as any);
  };

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
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
            <Card variant="outlined" padding="none">
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index !== section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => handleItemPress(item.route)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                    <item.icon size={22} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* Version Info */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          Loggerise v1.0.0
        </Text>
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    ...Typography.bodyMD,
    fontWeight: '500',
    flex: 1,
  },
  versionText: {
    ...Typography.bodySM,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
