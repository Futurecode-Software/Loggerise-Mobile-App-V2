import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Filter, Plus, Wallet, User, Layers, DollarSign, Euro, PoundSterling } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getCashRegisters,
  CashRegister,
  CashRegisterFilters,
  Pagination,
  CurrencyType,
  formatBalance,
} from '@/services/endpoints/cash-registers';

const CURRENCY_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'TRY', label: 'TRY', icon: DollarSign },
  { id: 'USD', label: 'USD', icon: DollarSign },
  { id: 'EUR', label: 'EUR', icon: Euro },
  { id: 'GBP', label: 'GBP', icon: PoundSterling },
];

export default function CashRegistersScreen() {
  const colors = Colors.light;

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // API state
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const hasInitialFetchRef = useRef(false);

  // Core fetch function - no dependencies on state
  const executeFetch = useCallback(
    async (filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: CashRegisterFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (filter !== 'all') {
          filters.currency_type = filter as CurrencyType;
        }

        const response = await getCashRegisters(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setCashRegisters((prev) => [...prev, ...response.cashRegisters]);
          } else {
            setCashRegisters(response.cashRegisters);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Cash registers fetch error:', err);
          setError(err instanceof Error ? err.message : 'Kasalar yüklenemedi');
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
    executeFetch(activeFilter, 1, false);

    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty deps - only run on mount

  // Filter change - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(activeFilter, 1, false);
  }, [activeFilter]); // Only activeFilter

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(activeFilter, 1, false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      executeFetch(activeFilter, pagination.current_page + 1, true);
    }
  };

  // Calculate totals by currency
  const getTotals = () => {
    const totals: Record<string, number> = {};
    cashRegisters.forEach((cr) => {
      if (!totals[cr.currency_type]) {
        totals[cr.currency_type] = 0;
      }
      totals[cr.currency_type] += cr.balance;
    });
    return totals;
  };

  const totals = getTotals();

  const renderCashRegister = (item: CashRegister) => {
    const additionalInfo = [];
    if (item.location) {
      additionalInfo.push(
        <Text key="location" style={[styles.location, { color: colors.textSecondary }]}>
          {item.location}
        </Text>
      );
    }
    if (item.responsible_user) {
      additionalInfo.push(
        <View key="responsible" style={styles.responsibleRow}>
          <User size={14} color={colors.icon} />
          <Text style={[styles.responsibleText, { color: colors.textSecondary }]}>
            {item.responsible_user.name}
          </Text>
        </View>
      );
    }

    return (
      <StandardListItem
        icon={Wallet}
        iconColor={Brand.primary}
        title={item.name}
        subtitle={item.code}
        additionalInfo={
          additionalInfo.length > 0 ? (
            <View style={styles.additionalInfo}>{additionalInfo}</View>
          ) : undefined
        }
        status={{
          label: item.currency_type,
          variant: 'outline',
        }}
        statusDot={
          item.is_active ? { color: colors.success } : { color: colors.textMuted }
        }
        footer={{
          left: (
            <View style={styles.footerLeftContent}>
              <Text
                style={[
                  styles.balance,
                  { color: item.balance >= 0 ? colors.success : colors.danger },
                ]}
              >
                {formatBalance(item.balance, item.currency_type)}
              </Text>
              <Text style={[styles.openingBalance, { color: colors.textMuted }]}>
                Açılış: {formatBalance(item.opening_balance, item.currency_type)}
              </Text>
            </View>
          ),
        }}
        onPress={() => router.push(`/cash-register/${item.id}` as any)}
      />
    );
  };

  const renderHeader = () => {
    if (Object.keys(totals).length === 0) return null;
    return (
      <View style={[styles.totalCard, { backgroundColor: Brand.primary }]}>
        <Text style={styles.totalLabel}>Toplam Bakiye</Text>
        <View style={styles.currencyBreakdown}>
          {Object.entries(totals).map(([currency, total]) => (
            <View key={currency} style={styles.currencyChip}>
              <Text style={styles.currencyChipText}>
                {currency}: {formatBalance(total, currency as CurrencyType)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Prepare tabs for header
  const headerTabs = CURRENCY_FILTERS.map((filter) => {
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
        title="Kasalar"
        subtitle={pagination ? `${pagination.total} kasa` : undefined}
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
        data={cashRegisters}
        renderItem={renderCashRegister}
        keyExtractor={(item) => String(item.id)}
        emptyState={{
          icon: Wallet,
          title: 'Henüz kasa eklenmemiş',
          subtitle: 'Yeni kasa eklemek için + butonuna tıklayın',
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
          executeFetch(activeFilter, 1, false);
        }}
        ListHeaderComponent={renderHeader()}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/cash-register/new' as any)}
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
  totalCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  totalLabel: {
    ...Typography.bodyMD,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.md,
  },
  currencyBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  currencyChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  currencyChipText: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  additionalInfo: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  location: {
    ...Typography.bodySM,
    color: Colors.light.textSecondary,
  },
  responsibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  responsibleText: {
    ...Typography.bodySM,
    color: Colors.light.textSecondary,
  },
  footerLeftContent: {
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  balance: {
    ...Typography.headingLG,
  },
  openingBalance: {
    ...Typography.bodySM,
    color: Colors.light.textMuted,
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
