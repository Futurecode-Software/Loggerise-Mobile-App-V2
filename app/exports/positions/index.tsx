import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Filter, Plus, MapPin, Truck, User, Package } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows, Typography } from '@/constants/theme';
import {
  getPositions,
  Position,
  PositionFilters,
  Pagination,
  getPositionTypeLabel,
  getVehicleOwnerTypeLabel,
  getDriverFullName,
} from '@/services/endpoints/positions';

// Position status labels in Turkish
const POSITION_STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  draft: 'Taslak',
};

// Position status colors
const POSITION_STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  draft: '#f59e0b',
};

export default function ExportPositionsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [positions, setPositions] = useState<Position[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function
  const executeFetch = useCallback(async (search: string, page: number = 1, append: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current;

    try {
      setError(null);

      const filters: PositionFilters = {
        page,
        per_page: 20,
        position_type: 'export' as any, // İhracat pozisyonları - backend'e 'export' gönder
        is_active: true,
      };

      if (search.trim()) {
        filters.search = search.trim();
      }

      const response = await getPositions(filters);

      // Only update if this is still the latest request
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (append) {
          setPositions((prev) => [...prev, ...response.positions]);
        } else {
          setPositions(response.positions);
        }
        setPagination(response.pagination);
        hasInitialFetchRef.current = true;
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        console.error('Positions fetch error:', err);
        setError(err instanceof Error ? err.message : 'Pozisyonlar yüklenemedi');
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Initial fetch - only once on mount
  useEffect(() => {
    isMountedRef.current = true;
    executeFetch(searchQuery, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      executeFetch(searchQuery, 1, false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, 1, false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, pagination.current_page + 1, true);
    }
  };

  // Get status badge variant
  const getStatusVariant = (
    status?: string
  ): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const renderPosition = (item: Position) => {
    const driverName = getDriverFullName(item.driver);
    const vehicleInfo = item.truck_tractor
      ? `${item.truck_tractor.plate}${item.trailer ? ' / ' + item.trailer.plate : ''}`
      : item.trailer?.plate || '-';

    const additionalInfo = [];

    // Araç bilgisi
    if (vehicleInfo && vehicleInfo !== '-') {
      additionalInfo.push(
        <View key="vehicle" style={styles.detailRow}>
          <Truck size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{vehicleInfo}</Text>
        </View>
      );
    }

    // Sürücü bilgisi
    if (driverName && driverName !== '-') {
      additionalInfo.push(
        <View key="driver" style={styles.detailRow}>
          <User size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{driverName}</Text>
        </View>
      );
    }

    // Yük sayısı
    if (item.loads_count !== undefined && item.loads_count > 0) {
      additionalInfo.push(
        <View key="loads" style={styles.detailRow}>
          <Package size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.loads_count} yük
          </Text>
        </View>
      );
    }

    // Rota bilgisi
    if (item.route) {
      additionalInfo.push(
        <View key="route" style={styles.detailRow}>
          <MapPin size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.route}
          </Text>
        </View>
      );
    }

    return (
      <StandardListItem
        icon={MapPin}
        iconColor={Brand.primary}
        title={item.position_number || 'Taslak Pozisyon'}
        subtitle={item.name || getVehicleOwnerTypeLabel(item.vehicle_owner_type)}
        additionalInfo={
          additionalInfo.length > 0 ? (
            <View style={styles.additionalInfo}>{additionalInfo}</View>
          ) : undefined
        }
        status={{
          label: POSITION_STATUS_LABELS[item.status || 'active'] || item.status || 'Aktif',
          variant: getStatusVariant(item.status),
        }}
        statusDot={{ color: POSITION_STATUS_COLORS[item.status || 'active'] || '#6B7280' }}
        onPress={() => router.push(`/exports/positions/${item.id}` as any)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="İhracat Pozisyonları"
        subtitle={pagination ? `${pagination.total} pozisyon` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => {
              // Filter action - can be implemented later
            }}
            activeOpacity={0.7}
          >
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <StandardListContainer
        data={positions}
        renderItem={renderPosition}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Pozisyon numarası, plaka veya sürücü ara...',
        }}
        emptyState={{
          icon: MapPin,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz pozisyon eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Dispozisyon ekranından yeni pozisyon oluşturabilirsiniz',
        }}
        loading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onLoadMore={loadMore}
        pagination={pagination || undefined}
        isLoadingMore={isLoadingMore}
        error={error}
        onRetry={() => {
          setIsLoading(true);
          executeFetch(searchQuery, 1, false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  additionalInfo: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
    color: Colors.light.textSecondary,
  },
});
