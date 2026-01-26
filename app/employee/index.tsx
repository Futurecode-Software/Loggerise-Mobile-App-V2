import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Filter, Plus, User, Truck, Crown, Layers, UserCheck, Coffee, UserX } from 'lucide-react-native';
import { Badge, Avatar, StandardListContainer } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getEmployees,
  Employee,
  EmployeeFilters,
  EmploymentStatus,
  Pagination,
  getFullName,
  getEmploymentStatusLabel,
  getEmploymentStatusColor,
  getContractTypeLabel,
} from '@/services/endpoints/employees';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'active', label: 'Aktif', icon: UserCheck },
  { id: 'on_leave', label: 'İzinde', icon: Coffee },
  { id: 'terminated', label: 'Ayrıldı', icon: UserX },
];

export default function EmployeesScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function - doesn't depend on search/filter state
  const executeFetch = useCallback(
    async (
      search: string,
      filter: string,
      page: number = 1,
      append: boolean = false,
      isRefresh: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        // Build filters
        const filters: EmployeeFilters = {
          page,
          per_page: 20,
        };

        // Add search filter
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add status filter
        if (filter !== 'all') {
          filters.employment_status = filter as EmploymentStatus;
        }

        const response = await getEmployees(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setEmployees((prev) => [...prev, ...response.employees]);
          } else {
            setEmployees(response.employees);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Employees fetch error:', err);
          setError(err instanceof Error ? err.message : 'Çalışanlar yüklenemedi');
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
    executeFetch(searchQuery, activeFilter, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty deps - only run on mount

  // Filter change - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(searchQuery, activeFilter, 1, false);
  }, [activeFilter]); // Only activeFilter, not search (search has debounce)

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      executeFetch(searchQuery, activeFilter, 1, false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Only searchQuery

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, activeFilter, 1, false, true);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true);
    }
  };

  const getStatusIndicatorColor = (status: EmploymentStatus) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'on_leave':
        return colors.warning;
      case 'terminated':
        return colors.danger;
      case 'suspended':
        return colors.textMuted;
      default:
        return colors.textMuted;
    }
  };

  const renderEmployee = (item: Employee) => {
    const fullName = getFullName(item);
    const isDriver = item.position?.toLowerCase().includes('sürücü') ||
                     item.position?.toLowerCase().includes('şoför') ||
                     item.position?.toLowerCase().includes('driver');
    const isManager = item.position?.toLowerCase().includes('müdür') ||
                      item.position?.toLowerCase().includes('manager') ||
                      item.position?.toLowerCase().includes('yönetici');

    const additionalBadges = [];
    if (isDriver) {
      additionalBadges.push(
        <View key="driver" style={[styles.badge, { backgroundColor: colors.infoLight }]}>
          <Truck size={12} color={colors.info} />
          <Text style={[styles.badgeText, { color: colors.info }]}>Sürücü</Text>
        </View>
      );
    }
    if (isManager) {
      additionalBadges.push(
        <View key="manager" style={[styles.badge, { backgroundColor: '#F3E8FF' }]}>
          <Crown size={12} color="#8b5cf6" />
          <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>Yönetici</Text>
        </View>
      );
    }

    return (
      <View style={styles.employeeItem}>
        <Avatar name={fullName} size="lg" />
        <View style={styles.employeeInfo}>
          <View style={styles.employeeHeader}>
            <Text style={[styles.employeeName, { color: colors.text }]} numberOfLines={1}>
              {fullName}
            </Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusIndicatorColor(item.employment_status) },
              ]}
            />
          </View>
          <Text style={[styles.employeePosition, { color: colors.textSecondary }]}>
            {item.position || '-'}
          </Text>
          <Text style={[styles.employeeDepartment, { color: colors.textMuted }]}>
            {item.department || '-'} • {getContractTypeLabel(item.contract_type)}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={getEmploymentStatusLabel(item.employment_status)}
              variant={
                item.employment_status === 'active' ? 'success' :
                item.employment_status === 'on_leave' ? 'warning' :
                item.employment_status === 'terminated' ? 'danger' : 'default'
              }
              size="sm"
            />
            {additionalBadges}
          </View>
        </View>
      </View>
    );
  };


  // Prepare tabs for header
  const headerTabs = STATUS_FILTERS.map((filter) => {
    const Icon = filter.icon;
    const isActive = activeFilter === filter.id;
    return {
      id: filter.id,
      label: filter.label,
      icon: <Icon size={16} color="#FFFFFF" strokeWidth={isActive ? 2.5 : 2} />,
      isActive,
      onPress: () => setActiveFilter(filter.id),
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Çalışanlar"
        subtitle={pagination ? `${pagination.total} kişi` : undefined}
        showBackButton={true}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity
            onPress={() => {
              // Filter action
            }}
            activeOpacity={0.7}
          >
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <StandardListContainer
        data={employees}
        renderItem={(item) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/employee/${item.id}` as any)}
            style={styles.listItemWrapper}
          >
            {renderEmployee(item)}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'İsim, e-posta veya telefon ile ara...',
        }}
        emptyState={{
          icon: User,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz çalışan eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni çalışan eklemek için + butonuna tıklayın',
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
          executeFetch(searchQuery, activeFilter, 1, false);
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/employee/new' as any)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listItemWrapper: {
    marginBottom: Spacing.md,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    color: Colors.light.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  employeePosition: {
    fontSize: 12,
    marginTop: 2,
    color: Colors.light.textSecondary,
  },
  employeeDepartment: {
    fontSize: 10,
    marginTop: 2,
    color: Colors.light.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
