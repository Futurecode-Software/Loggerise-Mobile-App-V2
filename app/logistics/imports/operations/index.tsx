/**
 * İthalat Operasyonları Ekranı
 *
 * Aktif ithalat pozisyonlarını ve dashboard'u gösterir.
 * Cash Register ve Positions modülleriyle uyumlu Dashboard teması.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { PageHeader } from '@/components/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations,
} from '@/constants/dashboard-theme';
import {
  getDispositionData,
  DispositionData,
} from '@/services/endpoints/disposition';
import { Position, getDriverFullName } from '@/services/endpoints/positions';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pozisyon durum etiketleri
const POSITION_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  draft: 'Taslak',
};

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  active: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  completed: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  draft: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
};

// İstatistik Kartı Skeleton
function StatCardSkeleton() {
  return (
    <View style={[styles.statCard, { backgroundColor: DashboardColors.surface }]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <Skeleton width={40} height={28} style={{ marginTop: DashboardSpacing.sm }} />
      <Skeleton width={80} height={14} style={{ marginTop: DashboardSpacing.xs }} />
    </View>
  );
}

// İstatistik Kartı
interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  color: { primary: string; bg: string };
  onPress: () => void;
}

function StatCard({ icon, value, label, color, onPress }: StatCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, DashboardAnimations.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy);
  };

  return (
    <AnimatedPressable
      style={[styles.statCard, animStyle, { backgroundColor: DashboardColors.surface }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.statIcon, { backgroundColor: color.bg }]}>
        <Ionicons name={icon} size={24} color={color.primary} />
      </View>
      <Text style={[styles.statValue, { color: DashboardColors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: DashboardColors.textSecondary }]}>{label}</Text>
    </AnimatedPressable>
  );
}

// Pozisyon Kartı Skeleton
function PositionCardSkeleton() {
  return (
    <View style={styles.positionCard}>
      <View style={styles.positionHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.positionMeta}>
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  );
}

// Pozisyon Kartı
interface PositionCardProps {
  position: Position;
  onPress: () => void;
}

function PositionCard({ position, onPress }: PositionCardProps) {
  const scale = useSharedValue(1);
  const colors = STATUS_COLORS[position.status || 'active'] || STATUS_COLORS.active;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy);
  };

  const driverName = getDriverFullName(position.driver);
  const vehicleInfo = position.truck_tractor
    ? `${position.truck_tractor.plate}${position.trailer ? ' / ' + position.trailer.plate : ''}`
    : position.trailer?.plate || '-';

  return (
    <AnimatedPressable
      style={[styles.positionCard, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.positionHeader}>
        <View style={[styles.positionIcon, { backgroundColor: colors.bg }]}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.positionInfo}>
          <Text style={styles.positionNumber} numberOfLines={1}>
            {position.position_number || 'Pozisyon'}
          </Text>
          {position.name && (
            <Text style={styles.positionName} numberOfLines={1}>
              {position.name}
            </Text>
          )}
        </View>
        <View style={styles.positionRight}>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>
              {POSITION_STATUS_LABELS[position.status || 'active']}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={DashboardColors.textMuted}
          />
        </View>
      </View>

      <View style={styles.positionMeta}>
        {vehicleInfo && vehicleInfo !== '-' && (
          <View style={styles.metaItem}>
            <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.metaText}>{vehicleInfo}</Text>
          </View>
        )}
        {driverName && driverName !== '-' && (
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.metaText}>{driverName}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="cube-outline" size={14} color={DashboardColors.textMuted} />
          <Text style={styles.metaText}>{position.loads_count || 0} yük</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// Hızlı Aksiyon Butonu
interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

function QuickAction({ icon, label, onPress, variant = 'primary' }: QuickActionProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, DashboardAnimations.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy);
  };

  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      style={[
        styles.quickActionBtn,
        animStyle,
        {
          backgroundColor: isPrimary
            ? DashboardColors.primary
            : DashboardColors.surface,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: DashboardColors.borderLight,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isPrimary ? '#FFFFFF' : DashboardColors.primary}
      />
      <Text
        style={[
          styles.quickActionText,
          { color: isPrimary ? '#FFFFFF' : DashboardColors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// Boş Durum
function EmptyState() {
  return (
    <View style={styles.emptySection}>
      <View style={styles.emptyIcon}>
        <Ionicons name="location-outline" size={32} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyText}>Aktif pozisyon bulunmuyor</Text>
    </View>
  );
}

// Loading Durumu
function LoadingState() {
  return (
    <View style={styles.content}>
      <View style={styles.statsGrid}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>
      <View style={styles.skeletonActions}>
        <Skeleton width="48%" height={48} borderRadius={DashboardBorderRadius.lg} />
        <Skeleton width="48%" height={48} borderRadius={DashboardBorderRadius.lg} />
      </View>
      <View style={styles.section}>
        <Skeleton width={140} height={20} style={{ marginBottom: DashboardSpacing.md }} />
        <PositionCardSkeleton />
        <PositionCardSkeleton />
        <PositionCardSkeleton />
      </View>
    </View>
  );
}

// Hata Durumu
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
      </View>
      <Text style={styles.errorTitle}>Bir hata oluştu</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ImportOperationsScreen() {
  // Veri state'i
  const [data, setData] = useState<DispositionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const hasInitialFetchRef = useRef(false);

  // Veri çekme
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getDispositionData('import');
      if (isMountedRef.current) {
        setData(result);
        hasInitialFetchRef.current = true;
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

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        fetchData();
      }
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRetry = () => {
    setIsLoading(true);
    fetchData();
  };

  // Sayfa gezinme handler'ları
  const handlePositionsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/logistics/imports/positions' as any);
  };

  const handleDispositionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/logistics/imports/disposition' as any);
  };

  const handleLoadsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/logistics/imports/loads' as any);
  };

  const handlePositionPress = (position: Position) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/logistics/imports/positions/${position.id}` as any);
  };

  const activePositions = data?.active_positions || [];
  const draftPositions = data?.draft_positions || [];
  const unassignedLoads = data?.unassigned_loads || [];

  const totalPositions = activePositions.length + draftPositions.length;
  const totalLoads =
    unassignedLoads.length +
    activePositions.reduce((sum, p) => sum + (p.loads_count || 0), 0);

  // Loading durumu
  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="İthalat Operasyonları"
          icon="briefcase-outline"
          showBackButton
        />
        <LoadingState />
      </View>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="İthalat Operasyonları"
          icon="briefcase-outline"
          showBackButton
        />
        <ErrorState error={error} onRetry={handleRetry} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="İthalat Operasyonları"
        icon="briefcase-outline"
        subtitle={`${totalPositions} pozisyon • ${totalLoads} yük`}
        showBackButton
      />

      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DashboardColors.primary}
            />
          }
        >
          {/* İstatistik Kartları */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="location-outline"
              value={activePositions.length}
              label="Aktif Pozisyon"
              color={STATUS_COLORS.active}
              onPress={handlePositionsPress}
            />
            <StatCard
              icon="document-outline"
              value={draftPositions.length}
              label="Taslak"
              color={STATUS_COLORS.draft}
              onPress={handleDispositionPress}
            />
            <StatCard
              icon="cube-outline"
              value={unassignedLoads.length}
              label="Atanmamış Yük"
              color={{ primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }}
              onPress={handleLoadsPress}
            />
          </View>

          {/* Hızlı Aksiyonlar */}
          <View style={styles.quickActions}>
            <QuickAction
              icon="map-outline"
              label="Dispozisyon"
              onPress={handleDispositionPress}
              variant="primary"
            />
            <QuickAction
              icon="cube-outline"
              label="Tüm Yükler"
              onPress={handleLoadsPress}
              variant="secondary"
            />
          </View>

          {/* Aktif Pozisyonlar */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aktif Pozisyonlar</Text>
              <TouchableOpacity onPress={handlePositionsPress}>
                <Text style={styles.seeAllText}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>

            {activePositions.length > 0 ? (
              <View style={styles.positionsList}>
                {activePositions.slice(0, 5).map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onPress={() => handlePositionPress(position)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState />
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary,
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['2xl'],
    gap: DashboardSpacing.lg,
  },

  // İstatistik Grid
  statsGrid: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: DashboardFontSizes['2xl'],
    fontWeight: '800',
    marginTop: DashboardSpacing.sm,
  },
  statLabel: {
    fontSize: DashboardFontSizes.xs,
    textAlign: 'center',
    marginTop: DashboardSpacing.xs,
  },

  // Hızlı Aksiyonlar
  quickActions: {
    flexDirection: 'row',
    gap: DashboardSpacing.md,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    gap: DashboardSpacing.sm,
  },
  quickActionText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
  },

  // Bölüm
  section: {
    gap: DashboardSpacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
  },
  seeAllText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary,
  },

  // Pozisyon Listesi
  positionsList: {
    gap: DashboardSpacing.sm,
  },
  positionCard: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    ...DashboardShadows.sm,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md,
  },
  positionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionInfo: {
    flex: 1,
  },
  positionNumber: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
  },
  positionName: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    marginTop: 2,
  },
  positionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md,
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700',
  },
  positionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: DashboardSpacing.md,
    paddingTop: DashboardSpacing.md,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight,
    gap: DashboardSpacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
  },

  // Boş Durum
  emptySection: {
    alignItems: 'center',
    padding: DashboardSpacing.xl,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    gap: DashboardSpacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
  },

  // Skeleton
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DashboardSpacing.md,
  },

  // Hata Durumu
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl'],
    backgroundColor: DashboardColors.background,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff',
  },
});
