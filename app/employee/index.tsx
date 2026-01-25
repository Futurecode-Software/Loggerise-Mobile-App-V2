import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Filter, Plus, User, Truck, Crown } from 'lucide-react-native';
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
  { id: 'all', label: 'Tümü' },
  { id: 'active', label: 'Aktif' },
  { id: 'on_leave', label: 'İzinde' },
  { id: 'terminated', label: 'Ayrıldı' },
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

  // Fetch employees from API
  const fetchEmployees = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        // Build filters
        const filters: EmployeeFilters = {
          page,
          per_page: 20,
        };

        // Add search filter
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        // Add status filter
        if (activeFilter !== 'all') {
          filters.employment_status = activeFilter as EmploymentStatus;
        }

        const response = await getEmployees(filters);

        if (append) {
          setEmployees((prev) => [...prev, ...response.employees]);
        } else {
          setEmployees(response.employees);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Employees fetch error:', err);
        setError(err instanceof Error ? err.message : 'Çalışanlar yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, activeFilter]
  );

  // Initial load and filter changes
  useEffect(() => {
    setIsLoading(true);
    fetchEmployees(1, false);
  }, [activeFilter]);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      fetchEmployees(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchEmployees(pagination.current_page + 1, true);
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


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Çalışanlar"
        subtitle={pagination ? `${pagination.total} kişi` : undefined}
        showBackButton={true}
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
        filters={{
          items: STATUS_FILTERS,
          activeId: activeFilter,
          onChange: setActiveFilter,
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
          fetchEmployees(1, false);
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
