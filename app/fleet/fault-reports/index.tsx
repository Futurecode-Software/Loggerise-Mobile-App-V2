import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AlertTriangle, Filter } from 'lucide-react-native';
import { StandardListContainer, StandardListItem, Badge } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing } from '@/constants/theme';
import {
  getFaultReports,
  FaultReport,
  FaultReportFilters,
  Pagination,
  getFaultTypeLabel,
  getSeverityLabel,
  getFaultStatusLabel,
  getSeverityColor,
  getFaultStatusColor,
} from '@/services/endpoints/fleet';

export default function FaultReportsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [faultReports, setFaultReports] = useState<FaultReport[]>([]);
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
  const executeFetch = useCallback(
    async (search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: FaultReportFilters = {
          page,
          per_page: 20,
          sort_by: 'created_at',
          sort_order: 'desc',
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        const response = await getFaultReports(filters);

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setFaultReports((prev) => [...prev, ...response.fault_reports]);
          } else {
            setFaultReports(response.fault_reports);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Fault reports fetch error:', err);
          setError(err instanceof Error ? err.message : 'Arıza bildirimleri yüklenemedi');
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

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(searchQuery, 1, false);
      }
    }, [searchQuery, executeFetch])
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

  const getSeverityBadgeVariant = (
    severity: string
  ): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (severity) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'warning';
      case 'critical':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'success';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const renderFaultReport = (item: FaultReport) => {
    const vehicleInfo = item.vehicle
      ? `${item.vehicle.plate}${
          item.vehicle.brand || item.vehicle.model
            ? ` • ${[item.vehicle.brand, item.vehicle.model].filter(Boolean).join(' ')}`
            : ''
        }`
      : 'Araç bilgisi yok';

    const reportedBy =
      item.reported_by_employee?.full_name ||
      item.reported_by_user?.name ||
      'Bilinmiyor';

    const additionalInfo = (
      <View style={styles.additionalInfo}>
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Araç:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{vehicleInfo}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Arıza Tipi:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {getFaultTypeLabel(item.fault_type)}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Bildirim:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Bildiren:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{reportedBy}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
            Bildirim Tarihi:
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {new Date(item.reported_at).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.badgeItem}>
            <Text style={[styles.badgeLabel, { color: colors.textSecondary }]}>Önem:</Text>
            <Badge variant={getSeverityBadgeVariant(item.severity)}>
              {getSeverityLabel(item.severity)}
            </Badge>
          </View>
          <View style={styles.badgeItem}>
            <Text style={[styles.badgeLabel, { color: colors.textSecondary }]}>Durum:</Text>
            <Badge variant={getStatusBadgeVariant(item.status)}>
              {getFaultStatusLabel(item.status)}
            </Badge>
          </View>
        </View>
      </View>
    );

    return (
      <StandardListItem
        icon={AlertTriangle}
        iconColor={getSeverityColor(item.severity)}
        title={`Arıza #${item.id} - ${item.vehicle?.plate || 'Araç'}`}
        subtitle={getFaultTypeLabel(item.fault_type)}
        additionalInfo={additionalInfo}
        statusDot={{ color: getFaultStatusColor(item.status) }}
        onPress={() => router.push(`/fleet/fault-reports/${item.id}` as any)}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Arıza Bildirimleri"
        subtitle={pagination ? `${pagination.total} arıza kaydı` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => {
              // Filter modal açılabilir
            }}
            activeOpacity={0.7}
          >
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <StandardListContainer
        data={faultReports}
        renderItem={renderFaultReport}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Araç plakası veya arıza açıklaması ile ara...',
        }}
        emptyState={{
          icon: AlertTriangle,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz arıza kaydı yok',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Arıza bildirimleri burada görünecektir',
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
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 100,
  },
  infoValue: {
    fontSize: 12,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeLabel: {
    fontSize: 11,
  },
});
