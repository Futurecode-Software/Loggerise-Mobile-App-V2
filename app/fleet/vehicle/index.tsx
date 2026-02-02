import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Filter, Plus, Truck, Calendar, Gauge } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getVehicles,
  Vehicle,
  VehicleFilters,
  Pagination,
  getStatusLabel,
  getStatusColor,
} from '@/services/endpoints/vehicles';

// Vehicle type labels in Turkish
const VEHICLE_TYPE_LABELS: Record<string, string> = {
  truck_tractor: 'Çekici',
  trailer: 'Römork',
  truck: 'Kamyon',
  light_truck: 'Hafif Kamyon',
  car: 'Otomobil',
  minibus: 'Minibüs',
  bus: 'Otobüs',
  tractor: 'Traktör',
  motorcycle: 'Motosiklet',
  construction_machine: 'İş Makinesi',
  van: 'Kamyonet',
  pickup: 'Pikap',
  other: 'Diğer',
};

export default function VehicleScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialFetchRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  // Core fetch function - no dependencies on state
  const executeFetch = useCallback(
    async (search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: VehicleFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        const response = await getVehicles(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setVehicles((prev) => [...prev, ...response.vehicles]);
          } else {
            setVehicles(response.vehicles);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Vehicles fetch error:', err);
          setError(err instanceof Error ? err.message : 'Araçlar yüklenemedi');
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

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
  }, []); // Empty deps - only run on mount

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
  }, [searchQuery]); // Only searchQuery

  // Refs for useFocusEffect to avoid re-triggering
  const executeFetchRef = useRef(executeFetch);
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    executeFetchRef.current = executeFetch;
    searchQueryRef.current = searchQuery;
  }, [executeFetch, searchQuery]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      // Refresh data when screen comes into focus
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(searchQueryRef.current, 1, false);
      }
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, 1, false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, pagination.current_page + 1, true);
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in_use':
        return 'default';
      case 'in_maintenance':
      case 'maintenance':
        return 'warning';
      case 'out_of_service':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderVehicle = (item: Vehicle) => {
    const vehicleTypeLabel = VEHICLE_TYPE_LABELS[item.vehicle_type] || item.vehicle_type;
    const brandModel = [item.brand, item.model].filter(Boolean).join(' ');

    const additionalInfo = [];

    // Marka/Model ve yıl
    if (brandModel || item.model_year) {
      additionalInfo.push(
        <View key="brand" style={styles.detailRow}>
          <Truck size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {[brandModel, item.model_year].filter(Boolean).join(' • ')}
          </Text>
        </View>
      );
    }

    // Kilometre
    if (item.total_km) {
      additionalInfo.push(
        <View key="km" style={styles.detailRow}>
          <Gauge size={14} color={colors.icon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {Number(item.total_km).toLocaleString('tr-TR')} km
          </Text>
        </View>
      );
    }

    return (
      <StandardListItem
        icon={Truck}
        iconColor={Brand.primary}
        title={item.plate}
        subtitle={vehicleTypeLabel}
        additionalInfo={additionalInfo.length > 0 ? <View style={styles.additionalInfo}>{additionalInfo}</View> : undefined}
        status={{
          label: getStatusLabel(item.status),
          variant: getStatusVariant(item.status),
        }}
        statusDot={{ color: getStatusColor(item.status) }}
        onPress={() => router.push(`/fleet/vehicle/${item.id}` as any)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Araçlar"
        subtitle={pagination ? `${pagination.total} araç` : undefined}
        showBackButton={true}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => {
                // Filter action - can be implemented later
              }}
              activeOpacity={0.7}
            >
              <Filter size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/fleet/vehicle/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <StandardListContainer
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Plaka, marka veya model ile ara...',
        }}
        emptyState={{
          icon: Truck,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz araç eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni araç eklemek için + butonuna tıklayın',
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
