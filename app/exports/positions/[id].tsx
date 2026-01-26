/**
 * Position Detail Screen
 *
 * Shows comprehensive position details with 12 sections matching web version.
 * URL: /lojistik-yonetimi/seferler/1?position=1
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
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

// Section type
type SectionType =
  | 'general'
  | 'loads'
  | 'transport_details'
  | 'vehicle_info'
  | 'border_crossing'
  | 'insurance_fuel'
  | 'fuel_records'
  | 'advances'
  | 'expenses'
  | 'documents';

// Section tabs
const SECTIONS: { key: SectionType; label: string }[] = [
  { key: 'general', label: 'Genel' },
  { key: 'loads', label: 'Yükler' },
  { key: 'transport_details', label: 'Taşıma' },
  { key: 'vehicle_info', label: 'Araç' },
  { key: 'border_crossing', label: 'Sınır' },
  { key: 'insurance_fuel', label: 'Sigorta' },
  { key: 'fuel_records', label: 'Yakıt' },
  { key: 'advances', label: 'Avanslar' },
  { key: 'expenses', label: 'Masraflar' },
  { key: 'documents', label: 'Evraklar' },
];

export default function PositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;

  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('general');

  // Fetch position data
  const fetchPosition = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getPosition(parseInt(id, 10));
      setPosition(data);
    } catch (err) {
      console.error('Position fetch error:', err);
      setError(err instanceof Error ? err.message : 'Pozisyon bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosition();
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Pozisyon Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Pozisyon bilgileri yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !position) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader
          title="Pozisyon Detayı"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <AlertTriangle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Pozisyon bulunamadı'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={fetchPosition}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <FullScreenHeader
          title={position.position_number || 'Pozisyon Detayı'}
          showBackButton
          onBackPress={() => router.back()}
        />

        {/* Summary Bar */}
        <View style={styles.summaryBar}>
          <Badge
            label={getPositionTypeLabel(position.position_type)}
            variant={position.position_type === 'import' ? 'success' : 'info'}
            size="sm"
          />
          <Badge
            label={position.is_active ? 'Aktif' : 'Pasif'}
            variant={position.is_active ? 'success' : 'default'}
            size="sm"
          />
          {position.is_roro && <Badge label="RoRo" variant="info" size="sm" />}
          {position.is_train && <Badge label="Tren" variant="warning" size="sm" />}
          {position.is_mafi && <Badge label="MAFI" variant="default" size="sm" />}
        </View>

        {/* Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.key}
              style={[
                styles.tab,
                activeSection === section.key && [
                  styles.tabActive,
                  { borderBottomColor: Brand.primary },
                ],
              ]}
              onPress={() => setActiveSection(section.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  activeSection === section.key && [
                    styles.tabTextActive,
                    { color: Brand.primary },
                  ],
                ]}
              >
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {activeSection === 'general' && <GeneralInfoSection position={position} />}
        {activeSection === 'loads' && (
          <LoadsSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'transport_details' && (
          <TransportDetailsSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'vehicle_info' && (
          <VehicleInfoSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'border_crossing' && (
          <BorderCrossingSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'insurance_fuel' && (
          <InsuranceFuelSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'fuel_records' && (
          <FuelRecordsSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'advances' && (
          <AdvancesSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'expenses' && (
          <ExpensesSection position={position} onUpdate={fetchPosition} />
        )}
        {activeSection === 'documents' && (
          <DocumentsSection position={position} onUpdate={fetchPosition} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  tabsContainer: {
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMD,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  errorTitle: {
    ...Typography.headingMD,
  },
  errorText: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
});
