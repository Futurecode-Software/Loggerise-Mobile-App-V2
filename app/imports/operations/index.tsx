/**
 * Import Operations Screen
 *
 * Shows active import positions and loads dashboard.
 * Mobile version of web import-operations/index.tsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  MapPin,
  Package,
  Truck,
  User,
  BarChart3,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getDispositionData,
  DispositionData,
} from '@/services/endpoints/disposition';
import { Position, getDriverFullName } from '@/services/endpoints/positions';

// Position status labels
const POSITION_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  draft: 'Taslak',
};

export default function ImportOperationsScreen() {
  const colors = Colors.light;

  // Data state
  const [data, setData] = useState<DispositionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const isMountedRef = useRef(true);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getDispositionData('import');
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Operations fetch error:', err);
        setError(err instanceof Error ? err.message : 'Veriler yüklenemedi');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Render position card
  const renderPositionCard = (position: Position) => {
    const driverName = getDriverFullName(position.driver);
    const vehicleInfo = position.truck_tractor
      ? `${position.truck_tractor.plate}${position.trailer ? ' / ' + position.trailer.plate : ''}`
      : position.trailer?.plate || '-';

    return (
      <TouchableOpacity
        key={position.id}
        activeOpacity={0.7}
        onPress={() => router.push(`/imports/positions/${position.id}` as any)}
      >
        <Card style={styles.positionCard}>
          <View style={styles.positionHeader}>
            <View style={[styles.positionIcon, { backgroundColor: Brand.primary + '15' }]}>
              <MapPin size={20} color={Brand.primary} />
            </View>
            <View style={styles.positionInfo}>
              <Text style={[styles.positionNumber, { color: colors.text }]}>
                {position.position_number || 'Pozisyon'}
              </Text>
              {position.name && (
                <Text style={[styles.positionName, { color: colors.textSecondary }]}>
                  {position.name}
                </Text>
              )}
            </View>
            <View style={styles.positionRight}>
              <Badge
                label={POSITION_STATUS_LABELS[position.status || 'active'] || 'Aktif'}
                variant={position.status === 'active' ? 'success' : 'default'}
                size="sm"
              />
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
          </View>

          <View style={[styles.positionMeta, { borderTopColor: colors.border }]}>
            {vehicleInfo && vehicleInfo !== '-' && (
              <View style={styles.metaItem}>
                <Truck size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{vehicleInfo}</Text>
              </View>
            )}
            {driverName && driverName !== '-' && (
              <View style={styles.metaItem}>
                <User size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{driverName}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Package size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {position.loads_count || 0} yük
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="İthalat Operasyonları" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FullScreenHeader title="İthalat Operasyonları" showBackButton />
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activePositions = data?.active_positions || [];
  const draftPositions = data?.draft_positions || [];
  const unassignedLoads = data?.unassigned_loads || [];

  const totalPositions = activePositions.length + draftPositions.length;
  const totalLoads = unassignedLoads.length + activePositions.reduce((sum, p) => sum + (p.loads_count || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="İthalat Operasyonları"
        subtitle={`${totalPositions} pozisyon • ${totalLoads} yük`}
        showBackButton
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/imports/positions' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: Brand.primary + '15' }]}>
              <MapPin size={24} color={Brand.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{activePositions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aktif Pozisyon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/imports/disposition' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
              <BarChart3 size={24} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{draftPositions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taslak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/imports/loads' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
              <Package size={24} color={colors.info} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{unassignedLoads.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Atanmamış Yük</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: Brand.primary }]}
            onPress={() => router.push('/imports/disposition' as any)}
            activeOpacity={0.8}
          >
            <MapPin size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Dispozisyon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: colors.info }]}
            onPress={() => router.push('/imports/loads' as any)}
            activeOpacity={0.8}
          >
            <Package size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Tüm Yükler</Text>
          </TouchableOpacity>
        </View>

        {/* Active Positions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aktif Pozisyonlar</Text>
            <TouchableOpacity onPress={() => router.push('/imports/positions' as any)}>
              <Text style={[styles.seeAllText, { color: Brand.primary }]}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {activePositions.length > 0 ? (
            <View style={styles.positionsList}>
              {activePositions.slice(0, 5).map(renderPositionCard)}
            </View>
          ) : (
            <View style={[styles.emptySection, { backgroundColor: colors.surface }]}>
              <MapPin size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aktif pozisyon bulunmuyor
              </Text>
            </View>
          )}
        </View>
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
    gap: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.headingMD,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.bodyXS,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  quickActionText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.headingSM,
  },
  seeAllText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
  positionsList: {
    gap: Spacing.sm,
  },
  positionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  positionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionInfo: {
    flex: 1,
  },
  positionNumber: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  positionName: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  positionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  positionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.bodyXS,
  },
  emptySection: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodySM,
  },
});
