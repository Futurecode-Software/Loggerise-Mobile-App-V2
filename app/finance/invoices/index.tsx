import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Filter,
  Plus,
  FileText,
  Calendar,
  DollarSign,
  User,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getInvoices,
  Invoice,
  InvoiceFilters,
  InvoiceType,
  InvoiceStatus,
  PaymentStatus,
  Pagination,
  getInvoiceTypeLabel,
  getInvoiceStatusLabel,
  getPaymentStatusLabel,
  getInvoiceStatusColor,
  getPaymentStatusColor,
  formatInvoiceTotal,
} from '@/services/endpoints/invoices';
import { formatBalance } from '@/services/endpoints/cash-registers';
import { formatDate } from '@/utils/formatters';

// Type filters
const TYPE_FILTERS = [
  { id: 'all', label: 'Tümü', icon: FileText },
  { id: 'sale', label: 'Satış', icon: DollarSign },
  { id: 'purchase', label: 'Alış', icon: DollarSign },
  { id: 'service', label: 'Hizmet', icon: FileText },
];

// Status filters
const STATUS_FILTERS: Array<{ id: 'all' | InvoiceStatus; label: string; color: string }> = [
  { id: 'all', label: 'Tümü', color: '#6B7280' },
  { id: 'draft', label: 'Taslak', color: '#6B7280' },
  { id: 'approved', label: 'Onaylı', color: '#10B981' },
  { id: 'cancelled', label: 'İptal', color: '#EF4444' },
];

// Payment status filters
const PAYMENT_FILTERS: Array<{ id: 'all' | PaymentStatus; label: string; icon: any }> = [
  { id: 'all', label: 'Tümü', icon: FileText },
  { id: 'pending', label: 'Bekliyor', icon: Clock },
  { id: 'paid', label: 'Ödendi', icon: CheckCircle2 },
  { id: 'overdue', label: 'Vadesi Geçti', icon: AlertCircle },
];

export default function InvoicesListScreen() {
  const colors = Colors.light;

  // Filter state
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [activePaymentFilter, setActivePaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  // API state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const hasInitialFetchRef = useRef(false);

  // Core fetch function
  const executeFetch = useCallback(
    async (
      typeFilter: string,
      statusFilter: 'all' | InvoiceStatus,
      paymentFilter: 'all' | PaymentStatus,
      search: string,
      start: string | undefined,
      end: string | undefined,
      page: number = 1,
      append: boolean = false
    ) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        // Build filters
        const filters: InvoiceFilters = {
          page,
          per_page: 20,
        };

        // Add type filter
        if (typeFilter !== 'all') {
          filters.type = typeFilter as InvoiceType;
        }

        // Add status filter
        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }

        // Add payment status filter
        if (paymentFilter !== 'all') {
          filters.payment_status = paymentFilter;
        }

        // Add search
        if (search.trim()) {
          filters.search = search.trim();
        }

        // Add date filters
        if (start) {
          filters.start_date = start;
        }
        if (end) {
          filters.end_date = end;
        }

        const response = await getInvoices(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setInvoices((prev) => [...prev, ...response.invoices]);
          } else {
            setInvoices(response.invoices);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Invoices fetch error:', err);
          setError(err instanceof Error ? err.message : 'Faturalar yüklenemedi');
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
    executeFetch(
      activeTypeFilter,
      activeStatusFilter,
      activePaymentFilter,
      searchQuery,
      startDate,
      endDate,
      1,
      false
    );

    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty deps - only run on mount

  // Filter changes - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(
      activeTypeFilter,
      activeStatusFilter,
      activePaymentFilter,
      searchQuery,
      startDate,
      endDate,
      1,
      false
    );
  }, [
    activeTypeFilter,
    activeStatusFilter,
    activePaymentFilter,
    searchQuery,
    startDate,
    endDate,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(
      activeTypeFilter,
      activeStatusFilter,
      activePaymentFilter,
      searchQuery,
      startDate,
      endDate,
      1,
      false
    );
  };

  // Auto-refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(
          activeTypeFilter,
          activeStatusFilter,
          activePaymentFilter,
          searchQuery,
          startDate,
          endDate,
          1,
          false
        );
      }
    }, [
      activeTypeFilter,
      activeStatusFilter,
      activePaymentFilter,
      searchQuery,
      startDate,
      endDate,
      executeFetch,
    ])
  );

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      executeFetch(
        activeTypeFilter,
        activeStatusFilter,
        activePaymentFilter,
        searchQuery,
        startDate,
        endDate,
        pagination.current_page + 1,
        true
      );
    }
  };

  const renderInvoice = (item: Invoice) => {
    const statusColor = getInvoiceStatusColor(item.status);
    const paymentColor = getPaymentStatusColor(item.payment_status);

    return (
      <StandardListItem
        icon={FileText}
        iconColor={statusColor}
        title={item.invoice_no || `#${item.id}`}
        subtitle={item.contact?.name}
        additionalInfo={
          <View style={styles.invoiceInfo}>
            <View style={styles.infoRow}>
              <Calendar size={14} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {formatDate(item.invoice_date)}
              </Text>
            </View>
            {item.due_date && (
              <View style={styles.infoRow}>
                <Clock size={14} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Vade: {formatDate(item.due_date)}
                </Text>
              </View>
            )}
          </View>
        }
        status={{
          label: getInvoiceTypeLabel(item.type),
          variant: 'outline',
        }}
        statusDot={{ color: statusColor }}
        footer={{
          left: (
            <View style={styles.footerContent}>
              <Badge
                label={getPaymentStatusLabel(item.payment_status)}
                variant={
                  item.payment_status === 'paid'
                    ? 'success'
                    : item.payment_status === 'overdue'
                      ? 'danger'
                      : item.payment_status === 'partial'
                        ? 'info'
                        : 'warning'
                }
                size="sm"
              />
              <Text
                style={[
                  styles.total,
                  { color: colors.text, fontWeight: '600' },
                ]}
              >
                {formatInvoiceTotal(item)}
              </Text>
            </View>
          ),
        }}
        onPress={() => router.push(`/finance/invoices/${item.id}` as any)}
      />
    );
  };

  const renderHeader = () => {
    if (invoices.length === 0) return null;

    // Calculate summary by currency
    const summaryByCurrency: Record<string, { total: number; paid: number; pending: number; overdue: number }> = {};
    
    invoices.forEach((inv) => {
      const currency = inv.currency_type || 'TRY';
      if (!summaryByCurrency[currency]) {
        summaryByCurrency[currency] = { total: 0, paid: 0, pending: 0, overdue: 0 };
      }
      summaryByCurrency[currency].total += inv.total;
      if (inv.payment_status === 'paid') summaryByCurrency[currency].paid += inv.total;
      else if (inv.payment_status === 'pending') summaryByCurrency[currency].pending += inv.total;
      else if (inv.payment_status === 'overdue') summaryByCurrency[currency].overdue += inv.total;
    });

    // Get primary currency (first one or TRY)
    const primaryCurrency = Object.keys(summaryByCurrency)[0] || 'TRY';
    const summary = summaryByCurrency[primaryCurrency];

    return (
      <View style={styles.summaryCard}>
        {/* Header */}
        <View style={styles.summaryHeader}>
          <View style={styles.summaryHeaderLeft}>
            <View style={styles.summaryIcon}>
              <TrendingUp size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryTitle}>Fatura Özeti</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{invoices.length} Fatura</Text>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Toplam Tutar</Text>
          <Text style={styles.summaryTotalValue}>
            {formatBalance(summary.total, primaryCurrency as any)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryStat, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <View style={styles.summaryStatHeader}>
              <Wallet size={16} color="#10B981" />
              <Text style={[styles.summaryStatValue, { color: '#10B981' }]}>
                {formatBalance(summary.paid, primaryCurrency as any)}
              </Text>
            </View>
            <Text style={styles.summaryStatLabel}>Ödendi</Text>
          </View>

          <View style={[styles.summaryStat, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <View style={styles.summaryStatHeader}>
              <Clock size={16} color="#F59E0B" />
              <Text style={[styles.summaryStatValue, { color: '#F59E0B' }]}>
                {formatBalance(summary.pending, primaryCurrency as any)}
              </Text>
            </View>
            <Text style={styles.summaryStatLabel}>Bekliyor</Text>
          </View>

          {summary.overdue > 0 && (
            <View style={[styles.summaryStat, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <View style={styles.summaryStatHeader}>
                <AlertTriangle size={16} color="#EF4444" />
                <Text style={[styles.summaryStatValue, { color: '#EF4444' }]}>
                  {formatBalance(summary.overdue, primaryCurrency as any)}
                </Text>
              </View>
              <Text style={styles.summaryStatLabel}>Vadesi Geçti</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Prepare type tabs for header
  const typeTabs = TYPE_FILTERS.map((filter) => {
    const Icon = filter.icon;
    const isActive = activeTypeFilter === filter.id;
    return {
      id: filter.id,
      label: filter.label,
      icon: <Icon size={16} color="#FFFFFF" strokeWidth={isActive ? 2.5 : 2} />,
      isActive,
      onPress: () => setActiveTypeFilter(filter.id),
    };
  });

  return (
    <View style={styles.container}>
      <FullScreenHeader
        title="Faturalar"
        subtitle={
          pagination ? `${pagination.total} fatura` : isLoading ? 'Yükleniyor...' : undefined
        }
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Filter size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/finance/invoices/new' as any)}>
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
        tabs={typeTabs}
      />
      {showFilters && (
        <View style={[styles.filtersCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Durum Filtresi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
                {STATUS_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor:
                          activeStatusFilter === filter.id ? filter.color : colors.background,
                        borderColor: filter.color,
                      },
                    ]}
                    onPress={() => setActiveStatusFilter(filter.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: activeStatusFilter === filter.id ? '#FFFFFF' : filter.color,
                        },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.filterTitle, { color: colors.text, marginTop: Spacing.md }]}>
              Ödeme Durumu
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {PAYMENT_FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activePaymentFilter === filter.id;
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isActive ? Brand.primary : colors.background,
                          borderColor: Brand.primary,
                        },
                      ]}
                      onPress={() => setActivePaymentFilter(filter.id)}
                    >
                      <Icon size={14} color={isActive ? '#FFFFFF' : Brand.primary} />
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isActive ? '#FFFFFF' : Brand.primary,
                            marginLeft: 4,
                          },
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
      )}
      <StandardListContainer
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => String(item.id)}
        loading={isLoading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        pagination={pagination || undefined}
        error={error}
        emptyState={{
          icon: FileText,
          title: 'Fatura bulunamadı',
          subtitle: searchQuery
            ? 'Arama kriterleriyle eşleşen fatura bulunamadı'
            : 'Henüz fatura oluşturulmamış',
        }}
        ListHeaderComponent={renderHeader()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  invoiceInfo: {
    marginTop: 4,
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    ...Typography.bodyXS,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  total: {
    ...Typography.bodyMD,
  },
  summaryCard: {
    marginHorizontal: 0,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Brand.primary,
    ...Shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    ...Typography.headingSM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryBadgeText: {
    ...Typography.bodyXS,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryTotal: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryTotalLabel: {
    ...Typography.bodySM,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  summaryTotalValue: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryStat: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryStatValue: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  summaryStatLabel: {
    ...Typography.bodyXS,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filtersCard: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  filterTitle: {
    ...Typography.bodySM,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
});
