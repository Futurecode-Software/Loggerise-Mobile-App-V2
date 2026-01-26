/**
 * Position Detail Screen
 *
 * Shows position details with loads, vehicle info and driver info.
 * Matches web version at /lojistik-yonetimi/ihracatlar/pozisyonlar/{id}
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
import {
  MapPin,
  Truck,
  User,
  Package,
  Calendar,
  AlertTriangle,
  Ship,
  Train,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { FullScreenHeader } from '@/components/header/FullScreenHeader';
import { Colors, Typography, Spacing, Brand, BorderRadius } from '@/constants/theme';
import {
  getPositions,
  Position,
  getPositionTypeLabel,
  getVehicleOwnerTypeLabel,
  getDriverFullName,
} from '@/services/endpoints/positions';

// Position status labels
const POSITION_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  draft: 'Taslak',
};

export default function PositionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = Colors.light;

  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch position data
  const fetchPosition = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      // API'de tekil pozisyon endpoint'i yoksa, liste endpoint'i kullanıp filtrele
      const { positions } = await getPositions({ search: id });
      const found = positions.find((p) => p.id === parseInt(id, 10));
      if (found) {
        setPosition(found);
      } else {
        setError('Pozisyon bulunamadı');
      }
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

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Render info row
  const renderInfoRow = (label: string, value?: string | number | boolean, icon?: any) => {
    if (value === undefined || value === null || value === '') return null;
    const Icon = icon;
    const displayValue = typeof value === 'boolean' ? (value ? 'Evet' : 'Hayır') : String(value);

    return (
      <View style={styles.infoRow}>
        {Icon && <Icon size={16} color={colors.textMuted} />}
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{displayValue}</Text>
      </View>
    );
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

  const driverName = getDriverFullName(position.driver);
  const vehicleInfo = position.truck_tractor
    ? `${position.truck_tractor.plate}${position.trailer ? ' / ' + position.trailer.plate : ''}`
    : position.trailer?.plate || '-';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title={position.position_number || 'Pozisyon Detayı'}
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryHeader}>
            <View style={[styles.typeIconLarge, { backgroundColor: Brand.primary + '15' }]}>
              <MapPin size={32} color={Brand.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {position.position_number || 'Taslak Pozisyon'}
              </Text>
              {position.name && (
                <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
                  {position.name}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.badgeRow}>
            <Badge
              label={POSITION_STATUS_LABELS[position.status || 'active'] || 'Aktif'}
              variant={position.status === 'active' ? 'success' : 'default'}
              size="sm"
            />
            {position.is_roro && (
              <Badge label="RoRo" variant="info" size="sm" />
            )}
            {position.is_train && (
              <Badge label="Tren" variant="info" size="sm" />
            )}
            {position.is_mafi && (
              <Badge label="MAFI" variant="info" size="sm" />
            )}
          </View>
        </View>

        {/* Araç Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Araç Bilgileri</Text>
          {renderInfoRow('Çekici', position.truck_tractor?.plate, Truck)}
          {renderInfoRow('Römork', position.trailer?.plate, Package)}
          {renderInfoRow('Römork Sınıfı', position.trailer_class)}
          {renderInfoRow('Araç Sahibi', getVehicleOwnerTypeLabel(position.vehicle_owner_type))}
          {position.manual_location && renderInfoRow('Manuel Konum', position.manual_location, MapPin)}
        </Card>

        {/* Sürücü Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sürücü Bilgileri</Text>
          {renderInfoRow('Sürücü', driverName, User)}
          {position.second_driver && renderInfoRow(
            '2. Sürücü',
            `${position.second_driver.first_name} ${position.second_driver.last_name}`,
            User
          )}
        </Card>

        {/* Rota Bilgileri */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rota Bilgileri</Text>
          {renderInfoRow('Rota', position.route, MapPin)}
          {renderInfoRow('Tahmini Varış', formatDate(position.estimated_arrival_date), Calendar)}
          {renderInfoRow('Gerçek Varış', formatDate(position.actual_arrival_date), Calendar)}
        </Card>

        {/* Taşıma Türü */}
        {(position.is_roro || position.is_train || position.is_mafi) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Taşıma Türü</Text>
            {position.is_roro && (
              <View style={styles.transportTypeRow}>
                <Ship size={20} color={colors.info} />
                <Text style={[styles.transportTypeText, { color: colors.text }]}>RoRo Taşımacılık</Text>
              </View>
            )}
            {position.is_train && (
              <View style={styles.transportTypeRow}>
                <Train size={20} color={colors.warning} />
                <Text style={[styles.transportTypeText, { color: colors.text }]}>Tren Taşımacılık</Text>
              </View>
            )}
            {position.is_mafi && (
              <View style={styles.transportTypeRow}>
                <Package size={20} color={colors.success} />
                <Text style={[styles.transportTypeText, { color: colors.text }]}>MAFI Taşımacılık</Text>
              </View>
            )}
          </Card>
        )}

        {/* Garaj Bilgileri */}
        {(position.garage_location || position.garage_entry_date) && (
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Garaj Bilgileri</Text>
            {renderInfoRow('Garaj Konumu', position.garage_location)}
            {renderInfoRow('Giriş Tarihi', formatDate(position.garage_entry_date), Calendar)}
            {renderInfoRow('Çıkış Tarihi', formatDate(position.garage_exit_date), Calendar)}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  typeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    ...Typography.headingLG,
  },
  summarySubtitle: {
    ...Typography.bodyMD,
    marginTop: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionCard: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headingSM,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  infoLabel: {
    ...Typography.bodySM,
    minWidth: 100,
  },
  infoValue: {
    ...Typography.bodySM,
    flex: 1,
    fontWeight: '500',
  },
  transportTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  transportTypeText: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
});
