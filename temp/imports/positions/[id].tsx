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
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
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
  { id: 'loads', label: 'Yükler', icon: Package },
  { id: 'transport', label: 'Taşıma', icon: Ship },
  { id: 'vehicle', label: 'Araç', icon: Truck },
  { id: 'border', label: 'Sınır', icon: MapPin },
  { id: 'insurance', label: 'Sigorta', icon: Shield },
  { id: 'fuel', label: 'Yakıt', icon: Fuel },
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
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Pozisyon Detayi"
          subtitle="Yukleniyor..."
          showBackButton
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Pozisyon bilgileri yukleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !position) {
    return (
      <View style={[styles.container, { backgroundColor: Brand.primary }]}>
        <FullScreenHeader
          title="Pozisyon Detayi"
          showBackButton
        />
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <AlertTriangle size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.errorTitle}>Bir hata olustu</Text>
          <Text style={styles.errorText}>
            {error || 'Pozisyon bulunamadi'}
          </Text>
        </View>
      </View>
    );
  }

  // Build subtitle with position type badge info
  const subtitle = position.route || getPositionTypeLabel(position.position_type);

  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      {/* Full Screen Header with Tabs - Dashboard Style */}
      <FullScreenHeader
        title={position.position_number || 'Pozisyon Detayi'}
        subtitle={subtitle}
        showBackButton
        tabs={headerTabs}
      />

      {/* Content Card */}
      <View style={styles.contentCard}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Brand.primary}
              />
            }
          >
            {renderTabContent()}
          </ScrollView>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorTitle: {
    ...Typography.headingMD,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
});
