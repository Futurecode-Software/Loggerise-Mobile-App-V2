import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Filter, Plus, Landmark, Copy, Check, Layers, DollarSign, Euro, PoundSterling } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
// useColorScheme kaldirildi - her zaman light mode kullanilir
import {
  getBanks,
  Bank,
  BankFilters,
  Pagination,
  CurrencyType,
  formatBalance,
  getCurrencySymbol,
} from '@/services/endpoints/banks';

const CURRENCY_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'TRY', label: 'TRY', icon: DollarSign },
  { id: 'USD', label: 'USD', icon: DollarSign },
  { id: 'EUR', label: 'EUR', icon: Euro },
  { id: 'GBP', label: 'GBP', icon: PoundSterling },
];

export default function BankAccountsScreen() {
  // Her zaman light mode kullanilir
  const colors = Colors.light;

  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // API state
  const [banks, setBanks] = useState<Bank[]>([]);
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

        // Build filters
        const filters: BankFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        // Add currency filter
        if (filter !== 'all') {
          filters.currency_type = filter as CurrencyType;
        }

        const response = await getBanks(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setBanks((prev) => [...prev, ...response.banks]);
          } else {
            setBanks(response.banks);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Banks fetch error:', err);
          setError(err instanceof Error ? err.message : 'Banka hesapları yüklenemedi');
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

  // Auto-refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(activeFilter, 1, false);
      }
    }, [activeFilter, executeFetch])
  );

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

  const handleCopyIban = (id: number, _iban: string) => {
    // In a real app, use Clipboard.setString(iban)
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate totals by currency
  const getTotals = () => {
    const totals: Record<string, number> = {};
    banks.forEach((bank) => {
      if (!totals[bank.currency_type]) {
        totals[bank.currency_type] = 0;
      }
      totals[bank.currency_type] += bank.balance;
    });
    return totals;
  };

  const totals = getTotals();

  const renderBankAccount = (item: Bank) => {
    const accountDetails = [];
    if (item.account_number) {
      accountDetails.push(
        <Text key="account" style={[styles.accountNumber, { color: colors.textMuted }]}>
          {`**** **** ${item.account_number.slice(-4)}`}
        </Text>
      );
    }
    if (item.iban) {
      accountDetails.push(
        <TouchableOpacity
          key="iban"
          style={styles.ibanRow}
          onPress={() => handleCopyIban(item.id, item.iban!)}
        >
          <Text style={[styles.iban, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.iban}
          </Text>
          {copiedId === item.id ? (
            <Check size={16} color={colors.success} />
          ) : (
            <Copy size={16} color={colors.icon} />
          )}
        </TouchableOpacity>
      );
    }

    return (
      <StandardListItem
        icon={Landmark}
        iconColor={Brand.primary}
        title={item.name}
        subtitle={item.branch || undefined}
        additionalInfo={
          accountDetails.length > 0 ? (
            <View style={styles.accountDetails}>{accountDetails}</View>
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
        onPress={() => router.push(`/bank/${item.id}` as any)}
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
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Banka Hesapları"
        subtitle={pagination ? `${pagination.total} hesap` : undefined}
        showBackButton={true}
        tabs={headerTabs}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push('/bank/new' as any)}
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

      <StandardListContainer
        data={banks}
        renderItem={renderBankAccount}
        keyExtractor={(item) => String(item.id)}
        emptyState={{
          icon: Landmark,
          title: 'Henüz banka hesabı eklenmemiş',
          subtitle: 'Yeni hesap eklemek için + butonuna tıklayın',
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  totalCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
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
  accountDetails: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  accountNumber: {
    ...Typography.bodySM,
    color: Colors.light.textMuted,
  },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iban: {
    ...Typography.bodySM,
    flex: 1,
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
});
