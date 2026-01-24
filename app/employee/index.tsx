import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Search,
  Filter,
  Plus,
  User,
  ChevronRight,
  Truck,
  Crown,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge, Avatar, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
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

  const renderEmployee = ({ item }: { item: Employee }) => {
    const fullName = getFullName(item);
    const isDriver = item.position?.toLowerCase().includes('sürücü') ||
                     item.position?.toLowerCase().includes('şoför') ||
                     item.position?.toLowerCase().includes('driver');
    const isManager = item.position?.toLowerCase().includes('müdür') ||
                      item.position?.toLowerCase().includes('manager') ||
                      item.position?.toLowerCase().includes('yönetici');

    return (
      <TouchableOpacity
        style={[
          styles.employeeItem,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
        onPress={() => router.push(`/employee/${item.id}` as any)}
      >
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
            {isDriver && (
              <View style={[styles.badge, { backgroundColor: colors.infoLight }]}>
                <Truck size={12} color={colors.info} />
                <Text style={[styles.badgeText, { color: colors.info }]}>Sürücü</Text>
              </View>
            )}
            {isManager && (
              <View style={[styles.badge, { backgroundColor: '#F3E8FF' }]}>
                <Crown size={12} color="#8b5cf6" />
                <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>Yönetici</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Çalışanlar yükleniyor...
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
              fetchEmployees(1, false);
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
          <User size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz çalışan eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni çalışan eklemek için + butonuna tıklayın'}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Çalışanlar</Text>
        <View style={styles.headerActions}>
          {pagination && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {pagination.total} kişi
            </Text>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="İsim, e-posta veya telefon ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
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

      {/* Employee List */}
      <FlatList
        data={employees}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEmployee}
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/employee/new' as any)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    ...Typography.headingLG,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  countText: {
    ...Typography.bodySM,
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
    flexGrow: 1,
    paddingBottom: 100,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  employeeName: {
    ...Typography.bodyMD,
    fontWeight: '600',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  employeePosition: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  employeeDepartment: {
    ...Typography.bodyXS,
    marginTop: 2,
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
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.bodyXS,
    fontWeight: '500',
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
