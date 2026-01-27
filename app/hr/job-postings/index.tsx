import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Layers, CheckCircle, XCircle, Globe, Lock, Briefcase } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Typography, Shadows, Brand } from '@/constants/theme';
import {
  getJobPostings,
  JobPosting,
  JobPostingFilters,
  Pagination,
  getEmploymentTypeLabel,
  getExperienceLevelLabel,
  formatSalaryRange,
  isJobPostingExpired,
} from '@/services/endpoints/job-postings';
import { formatDate } from '@/utils/formatters';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'active', label: 'Aktif', icon: CheckCircle },
  { id: 'inactive', label: 'Pasif', icon: XCircle },
  { id: 'public', label: 'Herkese Açık', icon: Globe },
  { id: 'private', label: 'Özel', icon: Lock },
];

export default function JobPostingsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // Core fetch function
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
        const filters: JobPostingFilters = {
          page,
          per_page: 20,
          exclude_expired: true,
        };

        // Add search filter
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add status filter
        if (filter === 'active') {
          filters.is_active = true;
        } else if (filter === 'inactive') {
          filters.is_active = false;
        } else if (filter === 'public') {
          filters.is_public = true;
        } else if (filter === 'private') {
          filters.is_public = false;
        }

        const response = await getJobPostings(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setJobPostings((prev) => [...prev, ...response.jobPostings]);
          } else {
            setJobPostings(response.jobPostings);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Job postings fetch error:', err);
          setError(err instanceof Error ? err.message : 'İş ilanları yüklenemedi');
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
  }, []);

  // Filter change - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(searchQuery, activeFilter, 1, false);
  }, [activeFilter]);

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
  }, [searchQuery]);

  // Refresh on screen focus (e.g., after deleting/updating a job posting)
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

  const renderJobPosting = (item: JobPosting) => {
    const isExpired = isJobPostingExpired(item);
    const applicationCount = item.applications_count || item.application_count || 0;

    const additionalInfo = (
      <View style={styles.additionalInfo}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          {item.location || 'Lokasyon belirtilmemiş'} • {getEmploymentTypeLabel(item.employment_type)}
        </Text>
        <View style={styles.badgeRow}>
          <Badge
            label={getExperienceLevelLabel(item.experience_level)}
            variant="default"
            size="sm"
          />
          <Text style={[styles.salaryText, { color: colors.textSecondary }]}>
            {formatSalaryRange(item.salary_min, item.salary_max, item.salary_currency)}
          </Text>
        </View>
      </View>
    );

    const statusBadges = [];

    // Active/Inactive badge
    if (item.is_active) {
      statusBadges.push({
        label: 'Aktif',
        variant: 'success' as const,
      });
    } else {
      statusBadges.push({
        label: 'Pasif',
        variant: 'danger' as const,
      });
    }

    // Public/Private badge
    if (item.is_public) {
      statusBadges.push({
        label: 'Herkese Açık',
        variant: 'info' as const,
      });
    }

    // Expired badge
    if (isExpired) {
      statusBadges.push({
        label: 'Süresi Doldu',
        variant: 'warning' as const,
      });
    }

    return (
      <StandardListItem
        icon={Briefcase}
        iconColor={Brand.primary}
        title={item.title}
        subtitle={item.position}
        additionalInfo={additionalInfo}
        status={statusBadges[0]}
        footer={{
          left: statusBadges.length > 1 ? (
            <View style={styles.statusBadges}>
              {statusBadges.slice(1).map((badge, index) => (
                <Badge
                  key={index}
                  label={badge.label}
                  variant={badge.variant}
                  size="sm"
                />
              ))}
            </View>
          ) : undefined,
          right: (
            <View style={styles.applicationCount}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {applicationCount} başvuru
              </Text>
            </View>
          ),
        }}
        onPress={() => router.push(`/hr/job-postings/${item.id}`)}
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
      icon: <Icon size={16} color={isActive ? colors.surface : colors.textSecondary} />,
      isActive,
      onPress: () => setActiveFilter(filter.id),
    };
  });

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="İş İlanları"
        subtitle={pagination ? `${pagination.total} ilan` : undefined}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/hr/job-postings/new')}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <StandardListContainer
          data={jobPostings}
          renderItem={renderJobPosting}
          keyExtractor={(item) => `job-posting-${item.id}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="İlan başlığı, pozisyon ara..."
          loading={isLoading}
          isLoadingMore={isLoadingMore}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onLoadMore={loadMore}
          error={error}
          emptyTitle="İş ilanı bulunamadı"
          emptySubtitle="Henüz kayıtlı iş ilanı bulunmuyor"
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
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  additionalInfo: {
    marginTop: Spacing.xs,
  },
  detailText: {
    ...Typography.bodySM,
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  salaryText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  applicationCount: {
    alignItems: 'flex-end',
  },
  countText: {
    ...Typography.bodySM,
    fontWeight: '600',
  },
});
