/**
 * Import Position Detail Screen
 *
 * Dashboard-style position detail view with tab navigation in header.
 * Matches web version at /lojistik-yonetimi/ithalatlar/pozisyonlar/{id}
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Info,
  Package,
  Ship,
  Truck,
  MapPin,
  Shield,
  Fuel,
  Wallet,
  Receipt,
  FileText,
  AlertTriangle,
} from 'lucide-react-native';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import { DashboardTheme } from '@/constants/dashboard-theme';
import {
  getPosition,
  Position,
  getPositionTypeLabel,
} from '@/services/endpoints/positions';

// Import section components
import { GeneralInfoSection } from '@/components/position/sections/GeneralInfoSection';
import { LoadsSection } from '@/components/position/sections/LoadsSection';
import { TransportDetailsSection } from '@/components/position/sections/TransportDetailsSection';
import { VehicleInfoSection } from '@/components/position/sections/VehicleInfoSection';
import { BorderCrossingSection } from '@/components/position/sections/BorderCrossingSection';
import { InsuranceFuelSection } from '@/components/position/sections/InsuranceFuelSection';
import { FuelRecordsSection } from '@/components/position/sections/FuelRecordsSection';
import { AdvancesSection } from '@/components/position/sections/AdvancesSection';
import { ExpensesSection } from '@/components/position/sections/ExpensesSection';
import { DocumentsSection } from '@/components/position/sections/DocumentsSection';

// Tab type definition
type PositionDetailTab =
  | 'general'
  | 'loads'
  | 'transport'
  | 'vehicle'
  | 'border'
  | 'insurance'
  | 'fuel'
  | 'advances'
  | 'expenses'
  | 'documents';

// Tab configuration with icons
const TABS: Array<{ id: PositionDetailTab; label: string; icon: React.ElementType }> = [
  { id: 'general', label: 'Genel', icon: Info },
  { id: 'loads', label: 'Yukler', icon: Package },
  { id: 'transport', label: 'Tasima', icon: Ship },
  { id: 'vehicle', label: 'Arac', icon: Truck },
  { id: 'border', label: 'Sinir', icon: MapPin },
  { id: 'insurance', label: 'Sigorta', icon: Shield },
  { id: 'fuel', label: 'Yakit', icon: Fuel },
  { id: 'advances', label: 'Avans', icon: Wallet },
  { id: 'expenses', label: 'Masraf', icon: Receipt },
  { id: 'documents', label: 'Evrak', icon: FileText },
];

export default function ImportPositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;

  // State
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PositionDetailTab>('general');

  // Fetch position data
  const fetchPosition = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getPosition(parseInt(id, 10));
      setPosition(data);
    } catch (err) {
      console.error('Position fetch error:', err);
      setError(err instanceof Error ? err.message : 'Pozisyon bilgileri yuklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosition();
  }, [fetchPosition]);

  // Prepare tabs for header
  const headerTabs = TABS.map((tab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return {
      id: tab.id,
      label: tab.label,
      icon: <Icon size={16} color="#FFFFFF" strokeWidth={isActive ? 2.5 : 2} />,
      isActive,
      onPress: () => setActiveTab(tab.id),
    };
  });

  // Render active tab content
  const renderTabContent = () => {
    if (!position) return null;

    switch (activeTab) {
      case 'general':
        return <GeneralInfoSection position={position} />;
      case 'loads':
        return <LoadsSection position={position} onUpdate={fetchPosition} />;
      case 'transport':
        return <TransportDetailsSection position={position} onUpdate={fetchPosition} />;
      case 'vehicle':
        return <VehicleInfoSection position={position} onUpdate={fetchPosition} />;
      case 'border':
        return <BorderCrossingSection position={position} onUpdate={fetchPosition} />;
      case 'insurance':
        return <InsuranceFuelSection position={position} onUpdate={fetchPosition} />;
      case 'fuel':
        return <FuelRecordsSection position={position} onUpdate={fetchPosition} />;
      case 'advances':
        return <AdvancesSection position={position} onUpdate={fetchPosition} />;
      case 'expenses':
        return <ExpensesSection position={position} onUpdate={fetchPosition} />;
      case 'documents':
        return <DocumentsSection position={position} onUpdate={fetchPosition} />;
      default:
        return <GeneralInfoSection position={position} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <FullScreenHeader
          title="Pozisyon Detayi"
          subtitle="Yukleniyor..."
          showBackButton
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DashboardTheme.accent} />
          <Text style={styles.loadingText}>Pozisyon bilgileri yukleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !position) {
    return (
      <View style={styles.container}>
        <FullScreenHeader
          title="Pozisyon Detayi"
          showBackButton
        />
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: DashboardTheme.dangerBg }]}>
            <AlertTriangle size={48} color={DashboardTheme.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata olustu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Pozisyon bulunamadi'}
          </Text>
        </View>
      </View>
    );
  }

  // Build subtitle with position type badge info
  const subtitle = position.route || getPositionTypeLabel(position.position_type);

  return (
    <View style={styles.container}>
      {/* Full Screen Header with Tabs - Dashboard Style */}
      <FullScreenHeader
        title={position.position_number || 'Pozisyon Detayi'}
        subtitle={subtitle}
        showBackButton
        tabs={headerTabs}
      />

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardTheme.accent}
          />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardTheme.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
    color: DashboardTheme.textMuted,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
});
