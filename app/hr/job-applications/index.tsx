import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Plus,
  Layers,
  Mail,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Ban,
  Users,
} from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Typography, Shadows, Brand } from '@/constants/theme';
import {
  getJobApplications,
  JobApplication,
  JobApplicationFilters,
  Pagination,
  getApplicationStatusLabel,
  getApplicationStatusColor,
  getFullName,
  formatDate,
} from '@/services/endpoints/job-applications';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'başvuru_alındı', label: 'Başvuru Alındı', icon: Mail },
  { id: 'değerlendiriliyor', label: 'Değerlendiriliyor', icon: Eye },
  { id: 'mülakat_planlandı', label: 'Mülakat', icon: Calendar },
  { id: 'onaylandı', label: 'Onaylandı', icon: CheckCircle },
  { id: 'reddedildi', label: 'Reddedildi', icon: XCircle },
  { id: 'iptal_edildi', label: 'İptal', icon: Ban },
];

export default function JobApplicationsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
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

        const filters: JobApplicationFilters = {
          page,
          per_page: 20,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        if (filter !== 'all') {
          filters.status = filter as any;
        }

        const response = await getJobApplications(filters);

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setJobApplications((prev) => [...prev, ...response.jobApplications]);
          } else {
            setJobApplications(response.jobApplications);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Job applications fetch error:', err);
          setError(err instanceof Error ? err.message : 'Başvurular yüklenemedi');
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

  // Initial fetch
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

  // Filter change
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

  // Refresh on screen focus
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

  const renderJobApplication = (item: JobApplication) => {
    const additionalInfo = (
      <View style={styles.additionalInfo}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          📧 {item.email}
        </Text>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          📞 {item.phone}
        </Text>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          💼 {item.position}
        </Text>
        {item.job_posting && (
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            📋 {item.job_posting.title}
          </Text>
        )}
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          📅 {formatDate(item.application_date)}
        </Text>
      </View>
    );

    return (
      <StandardListItem
        icon={Users}
        iconColor={Brand.primary}
        title={getFullName(item)}
        subtitle={item.position}
        additionalInfo={additionalInfo}
        status={{
          label: getApplicationStatusLabel(item.status),
          variant: getApplicationStatusColor(item.status),
        }}
        footer={{
          left: item.job_posting ? (
            <Badge
              label={item.job_posting.position}
              variant="default"
              size="sm"
            />
          ) : undefined,
          right: item.interviews && item.interviews.length > 0 ? (
            <Text style={[styles.interviewCount, { color: colors.textSecondary }]}>
              {item.interviews.length} görüşme
            </Text>
          ) : undefined,
        }}
        onPress={() => router.push(`/hr/job-applications/${item.id}`)}
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
        title="İşe Alım Başvuruları"
        subtitle={pagination ? `${pagination.total} başvuru` : undefined}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/hr/job-applications/new')}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <StandardListContainer
          data={jobApplications}
          renderItem={renderJobApplication}
          keyExtractor={(item) => `job-application-${item.id}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Ad, e-posta, telefon ara..."
          loading={isLoading}
          isLoadingMore={isLoadingMore}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onLoadMore={loadMore}
          error={error}
          emptyTitle="Başvuru bulunamadı"
          emptySubtitle="Henüz kayıtlı başvuru bulunmuyor"
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
    marginBottom: 2,
  },
  interviewCount: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
});
