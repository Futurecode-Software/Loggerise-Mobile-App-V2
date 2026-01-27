import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Filter, Plus, User, Layers, UserCheck, Coffee, UserX } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows, Typography } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getEmployees,
  Employee,
  EmployeeFilters,
  EmploymentStatus,
  Pagination,
  getFullName,
  getEmploymentStatusLabel,
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
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
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

  // Refresh on screen focus (e.g., after deleting/updating an employee)
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, activeFilter, 1, false);
      }
    }, [searchQuery, activeFilter, executeFetch])
  );

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

  const renderEmployee = (item: Employee) => {
    const fullName = getFullName(item);
    const isDriver = item.position?.toLowerCase().includes('sürücü') ||
                     item.position?.toLowerCase().includes('şoför') ||
                     item.position?.toLowerCase().includes('driver');
    const isManager = item.position?.toLowerCase().includes('müdür') ||
                      item.position?.toLowerCase().includes('manager') ||
                      item.position?.toLowerCase().includes('yönetici');

    // Determine subtitle text
    const subtitle = item.position || '-';
    const departmentText = item.department || '-';
    const contractText = getContractTypeLabel(item.contract_type);

    // Additional info: department and contract
    const additionalInfo = (
      <Text style={[styles.detailText, { color: colors.textMuted }]}>
        {departmentText} • {contractText}
      </Text>
    );

    // Footer badges
    const footerLeftBadges = [
      <Badge
        key="status"
        label={getEmploymentStatusLabel(item.employment_status)}
        variant={
          item.employment_status === 'active' ? 'success' :
          item.employment_status === 'on_leave' ? 'warning' :
          item.employment_status === 'terminated' ? 'danger' : 'default'
        }
        size="sm"
      />
    ];

    if (isDriver) {
      footerLeftBadges.push(
        <Badge
          key="driver"
          label="Sürücü"
          variant="info"
          size="sm"
        />
      );
    }
    if (isManager) {
      footerLeftBadges.push(
        <Badge
          key="manager"
          label="Yönetici"
          variant="secondary"
          size="sm"
        />
      );
    }

    return (
      <StandardListItem
        icon={User}
        iconColor={Brand.primary}
        title={fullName}
        subtitle={subtitle}
        additionalInfo={additionalInfo}
        status={{
          label: '',
          variant: item.employment_status === 'active' ? 'success' :
                   item.employment_status === 'on_leave' ? 'warning' :
                   item.employment_status === 'terminated' ? 'danger' : 'default',
          dotOnly: true,
        }}
        footer={{
          left: <View style={{ flexDirection: 'row', gap: Spacing.sm }}>{footerLeftBadges}</View>,
        }}
        onPress={() => router.push(`/employee/${item.id}` as any)}
      />
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
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Çalışanlar"
        subtitle={pagination ? `${pagination.total} kişi` : undefined}
        showBackButton={true}
        tabs={headerTabs}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push('/employee/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Filter action
              }}
              activeOpacity={0.7}
            >
              <Filter size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.contentWrapper}>
        <StandardListContainer
          data={employees}
          renderItem={renderEmployee}
          keyExtractor={(item) => `employee-${item.id}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="İsim, e-posta veya telefon ile ara..."
          isLoading={isLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onLoadMore={loadMore}
          isLoadingMore={isLoadingMore}
          error={error}
          emptyTitle={searchQuery ? 'Sonuç bulunamadı' : 'Henüz çalışan eklenmemiş'}
          emptySubtitle={searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni çalışan eklemek için + butonuna tıklayın'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  detailText: {
    ...Typography.bodySM,
  },
});
