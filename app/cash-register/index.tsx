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
  Filter,
  Plus,
  Wallet,
  User,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
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
  { id: 'all', label: 'Tümü' },
  { id: 'TRY', label: 'TRY' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
  { id: 'GBP', label: 'GBP' },
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

  // Fetch cash registers from API
  const fetchCashRegisters = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters: CashRegisterFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (activeFilter !== 'all') {
          filters.currency_type = activeFilter as CurrencyType;
        }

        const response = await getCashRegisters(filters);

        if (append) {
          setCashRegisters((prev) => [...prev, ...response.cashRegisters]);
        } else {
          setCashRegisters(response.cashRegisters);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Cash registers fetch error:', err);
        setError(err instanceof Error ? err.message : 'Kasalar yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchCashRegisters(1, false);
  }, [activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCashRegisters(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchCashRegisters(pagination.current_page + 1, true);
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

  const renderCashRegister = ({ item }: { item: CashRegister }) => (
    <Card
      style={styles.registerCard}
      onPress={() => router.push(`/cash-register/${item.id}` as any)}
    >
      <View style={styles.registerHeader}>
        <View style={[styles.registerIcon, { backgroundColor: colors.surface }]}>
          <Wallet size={20} color={Brand.primary} />
        </View>
        <View style={styles.registerInfo}>
          <Text style={[styles.registerName, { color: colors.text }]}>{item.name}</Text>
          {item.code && (
            <Text style={[styles.registerCode, { color: colors.textSecondary }]}>
              {item.code}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.is_active ? colors.success : colors.textMuted },
          ]}
        />
      </View>

      {item.location && (
        <Text style={[styles.location, { color: colors.textSecondary }]}>
          {item.location}
        </Text>
      )}

      {item.responsible_user && (
        <View style={styles.responsibleRow}>
          <User size={14} color={colors.icon} />
          <Text style={[styles.responsibleText, { color: colors.textSecondary }]}>
            {item.responsible_user.name}
          </Text>
        </View>
      )}

      <View style={styles.balanceRow}>
        <Text
          style={[
            styles.balance,
            { color: item.balance >= 0 ? colors.success : colors.danger },
          ]}
        >
          {formatBalance(item.balance, item.currency_type)}
        </Text>
        <Badge label={item.currency_type} variant="outline" size="sm" />
      </View>

      <View style={[styles.registerFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.openingBalance, { color: colors.textMuted }]}>
          Açılış: {formatBalance(item.opening_balance, item.currency_type)}
        </Text>
        <ChevronRight size={18} color={colors.icon} />
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Kasalar yükleniyor...
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
              fetchCashRegisters(1, false);
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
          <Wallet size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Henüz kasa eklenmemiş
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Yeni kasa eklemek için + butonuna tıklayın
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

  const renderHeader = () => (
    <>
      {Object.keys(totals).length > 0 && (
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
      )}

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={CURRENCY_FILTERS}
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
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Kasalar</Text>
        <View style={styles.headerActions}>
          {pagination && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {pagination.total} kasa
            </Text>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={cashRegisters}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCashRegister}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/cash-register/new' as any)}
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
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  totalCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
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
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterContent: {
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
  registerCard: {
    marginBottom: 0,
  },
  registerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  registerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  registerInfo: {
    flex: 1,
  },
  registerName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  registerCode: {
    ...Typography.bodySM,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  location: {
    ...Typography.bodySM,
    marginBottom: Spacing.sm,
  },
  responsibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  responsibleText: {
    ...Typography.bodySM,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  balance: {
    ...Typography.headingLG,
  },
  registerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  openingBalance: {
    ...Typography.bodySM,
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
