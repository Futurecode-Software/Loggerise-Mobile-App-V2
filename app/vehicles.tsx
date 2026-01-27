import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  Plus,
  Truck,
  Car,
  AlertTriangle,
  Box,
  AlertCircle,
  X,
  Settings2,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import { formatNumber } from '@/utils/formatters';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getVehicles,
  Vehicle,
  VehicleType,
  VehicleStatus,
  VehicleFilters,
  Pagination,
} from '@/services/endpoints/vehicles';

// Web ile aynı araç tipleri
const TYPE_FILTERS = [
  { id: 'all', label: 'Tümü', icon: null },
  { id: 'truck_tractor', label: 'Çekici', icon: Truck },
  { id: 'trailer', label: 'Römork', icon: Box },
  { id: 'truck', label: 'Kamyon', icon: Truck },
  { id: 'light_truck', label: 'H. Kamyon', icon: Truck },
  { id: 'car', label: 'Otomobil', icon: Car },
];

// Durum filtreleri
const STATUS_FILTERS = [
  { id: 'all', label: 'Tüm Durumlar' },
  { id: 'available', label: 'Uygun' },
  { id: 'in_use', label: 'Kullanımda' },
  { id: 'in_maintenance', label: 'Bakımda' },
];

// Sahiplik filtreleri
const OWNERSHIP_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'owned', label: 'Özmal' },
  { id: 'rented', label: 'Kiralık' },
];

// Web ile aynı label'lar
const vehicleTypeLabels: Record<string, string> = {
  trailer: 'Römork',
  car: 'Otomobil',
  minibus: 'Minibüs',
  bus: 'Otobüs',
  light_truck: 'Hafif Kamyon',
  truck: 'Kamyon',
  truck_tractor: 'Çekici',
  tractor: 'Traktör',
  motorcycle: 'Motosiklet',
  construction_machine: 'İş Makinesi',
  van: 'Panelvan',
  pickup: 'Pikap',
};

const statusLabels: Record<string, string> = {
  available: 'Uygun',
  in_use: 'Kullanımda',
  in_maintenance: 'Bakımda',
  maintenance: 'Bakımda',
  out_of_service: 'Hizmet Dışı',
};

const ownershipLabels: Record<string, string> = {
  owned: 'Özmal',
  rented: 'Kiralık',
};

export default function VehiclesScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownershipFilter, setOwnershipFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  // Core fetch function - doesn't depend on search/filter state
  const executeFetch = useCallback(
    async (
      search: string,
      typeFilter: string,
      status: string,
      ownership: string,
      page: number = 1,
      append: boolean = false,
      isRefresh: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        // Build filters
        const filters: VehicleFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        // Add search filter
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add type filter
        if (typeFilter !== 'all') {
          filters.vehicle_type = typeFilter as VehicleType;
        }

        // Add status filter
        if (status !== 'all') {
          filters.status = status as VehicleStatus;
        }

        // Add ownership filter
        if (ownership !== 'all') {
          filters.ownership_type = ownership;
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
    executeFetch(searchQuery, activeFilter, statusFilter, ownershipFilter, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty deps - only run on mount

  // Filter changes - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(searchQuery, activeFilter, statusFilter, ownershipFilter, 1, false);
  }, [activeFilter, statusFilter, ownershipFilter]); // Only filter deps

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      executeFetch(searchQuery, activeFilter, statusFilter, ownershipFilter, 1, false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Only searchQuery

  // Refresh when screen comes into focus (e.g., after adding a new vehicle)
  // Skip on first render to avoid double-fetching
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }

      // Only refresh if we've already fetched once
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, activeFilter, statusFilter, ownershipFilter, 1, false);
      }
    }, [searchQuery, activeFilter, statusFilter, ownershipFilter, executeFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, activeFilter, statusFilter, ownershipFilter, 1, false, true);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, activeFilter, statusFilter, ownershipFilter, pagination.current_page + 1, true);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getTypeIcon = (type: VehicleType) => {
    switch (type) {
      case 'truck':
        return Truck;
      case 'trailer':
        return Box;
      case 'van':
      case 'pickup':
      case 'car':
        return Car;
      default:
        return Truck;
    }
  };

  const getLocalStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return colors.success;
      case 'in_use':
        return colors.info;
      case 'maintenance':
        return colors.warning;
      case 'out_of_service':
        return colors.textMuted;
      default:
        return colors.textMuted;
    }
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => {
    const TypeIcon = getTypeIcon(item.vehicle_type);
    const isNearExpiry = item.insurance_expiry_date &&
      new Date(item.insurance_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const needsMaintenance = item.status === 'maintenance' || item.status === 'in_maintenance';

    return (
      <Card style={styles.vehicleCard} onPress={() => router.push(`/vehicle/${item.id}` as any)}>
        {/* Header */}
        <View style={styles.vehicleHeader}>
          <View style={styles.plateContainer}>
            <Text style={[styles.plate, { color: colors.text }]}>{item.plate}</Text>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getLocalStatusColor(item.status) },
              ]}
            />
          </View>
          <View style={[styles.typeIcon, { backgroundColor: colors.surface }]}>
            <TypeIcon size={20} color={colors.icon} />
          </View>
        </View>

        {/* Info - Web ile aynı */}
        <View style={styles.vehicleInfo}>
          <Text style={[styles.brandModel, { color: colors.text }]}>
            {item.brand || '-'}
          </Text>
          <Text style={[styles.modelYear, { color: colors.textSecondary }]}>
            {item.model || ''} {item.year ? `(${item.year})` : ''}
          </Text>
        </View>

        {/* Status Badges - Web ile aynı sıra */}
        <View style={styles.statusRow}>
          <Badge
            label={vehicleTypeLabels[item.vehicle_type] || item.vehicle_type}
            variant="info"
            size="sm"
          />
          <Badge
            label={ownershipLabels[item.ownership_type] || item.ownership_type}
            variant={item.ownership_type === 'owned' ? 'success' : 'warning'}
            size="sm"
          />
          <Badge
            label={statusLabels[item.status] || item.status}
            variant={
              item.status === 'available' ? 'success' :
              item.status === 'in_use' ? 'info' :
              (item.status === 'maintenance' || item.status === 'in_maintenance') ? 'danger' : 'default'
            }
            size="sm"
          />
        </View>

        {/* KM Counter - Web ile aynı */}
        <View style={styles.kmRow}>
          <Text style={[styles.kmLabel, { color: colors.textMuted }]}>Toplam KM:</Text>
          <Text style={[styles.kmValue, { color: colors.text }]}>
            {formatNumber(item.km_counter || item.total_km, 'km')}
          </Text>
        </View>

        {/* Warnings */}
        {(isNearExpiry || needsMaintenance) && (
          <View style={[styles.warningContainer, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
            <AlertTriangle size={14} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              {needsMaintenance ? 'Bakımda' : 'Sigorta süresi dolmak üzere!'}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Araçlar yükleniyor...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.danger + '15' }]}>
            <AlertCircle size={64} color={colors.danger} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Bir hata oluştu
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              executeFetch(searchQuery, activeFilter, statusFilter, ownershipFilter, 1, false);
            }}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <Truck size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz araç eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni araç eklemek için + butonuna tıklayın'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Brand.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <FullScreenHeader
        title="Araçlar"
        subtitle={pagination ? `${pagination.total} araç` : undefined}
        showBackButton
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              activeOpacity={0.7}
            >
              <Settings2 size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/vehicle/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Advanced Filters */}
      {showFilters && (
        <View style={[styles.advancedFilters, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Durum:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {STATUS_FILTERS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterChipSmall,
                      {
                        backgroundColor: statusFilter === item.id ? Brand.primary : colors.background,
                        borderColor: statusFilter === item.id ? Brand.primary : colors.border,
                      },
                    ]}
                    onPress={() => setStatusFilter(item.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipTextSmall,
                        { color: statusFilter === item.id ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sahiplik:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                {OWNERSHIP_FILTERS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterChipSmall,
                      {
                        backgroundColor: ownershipFilter === item.id ? Brand.primary : colors.background,
                        borderColor: ownershipFilter === item.id ? Brand.primary : colors.border,
                      },
                    ]}
                    onPress={() => setOwnershipFilter(item.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipTextSmall,
                        { color: ownershipFilter === item.id ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          {(statusFilter !== 'all' || ownershipFilter !== 'all') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setStatusFilter('all');
                setOwnershipFilter('all');
              }}
            >
              <X size={14} color={colors.danger} />
              <Text style={[styles.clearFiltersText, { color: colors.danger }]}>
                Filtreleri Temizle
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Plaka veya marka ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Type Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={TYPE_FILTERS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === item.id ? Brand.primary : colors.card,
                  borderColor: activeFilter === item.id ? Brand.primary : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(item.id)}
            >
              {item.icon && (
                <item.icon
                  size={16}
                  color={activeFilter === item.id ? '#FFFFFF' : colors.textSecondary}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === item.id ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Vehicle List */}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderVehicle}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Brand.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterContainer: {
    paddingVertical: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  vehicleCard: {
    marginBottom: 0,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  plate: {
    ...Typography.headingMD,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    marginBottom: Spacing.sm,
  },
  brandModel: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  modelYear: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  year: {
    ...Typography.bodySM,
  },
  kmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  kmLabel: {
    ...Typography.bodySM,
  },
  kmValue: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  advancedFilters: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  filterLabel: {
    ...Typography.bodySM,
    fontWeight: '500',
    minWidth: 60,
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterChipSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipTextSmall: {
    ...Typography.bodyXS,
    fontWeight: '500',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  clearFiltersText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  capacityRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  capacityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  capacityText: {
    ...Typography.bodySM,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  warningText: {
    ...Typography.bodySM,
    flex: 1,
  },
  inspectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  inspectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inspectionText: {
    ...Typography.bodyXS,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  loadingText: {
    ...Typography.bodyMD,
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.headingMD,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMD,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
