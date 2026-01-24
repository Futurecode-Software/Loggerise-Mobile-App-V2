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
  Landmark,
  Copy,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
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
  { id: 'all', label: 'Tümü' },
  { id: 'TRY', label: 'TRY' },
  { id: 'USD', label: 'USD' },
  { id: 'EUR', label: 'EUR' },
  { id: 'GBP', label: 'GBP' },
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

  // Fetch banks from API
  const fetchBanks = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        // Build filters
        const filters: BankFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        // Add currency filter
        if (activeFilter !== 'all') {
          filters.currency_type = activeFilter as CurrencyType;
        }

        const response = await getBanks(filters);

        if (append) {
          setBanks((prev) => [...prev, ...response.banks]);
        } else {
          setBanks(response.banks);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Banks fetch error:', err);
        setError(err instanceof Error ? err.message : 'Banka hesapları yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeFilter]
  );

  // Initial load and filter changes
  useEffect(() => {
    setIsLoading(true);
    fetchBanks(1, false);
  }, [activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBanks(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchBanks(pagination.current_page + 1, true);
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

  const renderBankAccount = ({ item }: { item: Bank }) => (
    <Card
      style={styles.accountCard}
      onPress={() => router.push(`/bank/${item.id}` as any)}
    >
      {/* Header */}
      <View style={styles.accountHeader}>
        <View style={[styles.bankIcon, { backgroundColor: colors.surface }]}>
          <Landmark size={20} color={Brand.primary} />
        </View>
        <View style={styles.bankInfo}>
          <Text style={[styles.bankName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.branchName, { color: colors.textSecondary }]}>
            {item.branch || '-'}
          </Text>
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.is_active ? colors.success : colors.textMuted },
          ]}
        />
      </View>

      {/* Account Number & IBAN */}
      <View style={styles.accountDetails}>
        <Text style={[styles.accountNumber, { color: colors.textMuted }]}>
          {item.account_number ? `**** **** ${item.account_number.slice(-4)}` : '-'}
        </Text>
        {item.iban && (
          <TouchableOpacity
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
        )}
      </View>

      {/* Balance */}
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

      {/* Footer */}
      <View style={[styles.accountFooter, { borderTopColor: colors.border }]}>
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
            Banka hesapları yükleniyor...
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
              fetchBanks(1, false);
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
          <Landmark size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Henüz banka hesabı eklenmemiş
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Yeni hesap eklemek için + butonuna tıklayın
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
      {/* Total Balance Card */}
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

      {/* Currency Filters */}
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
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Banka Hesapları</Text>
        <View style={styles.headerActions}>
          {pagination && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {pagination.total} hesap
            </Text>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={banks}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBankAccount}
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

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/bank/new' as any)}
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
  accountCard: {
    marginBottom: 0,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  branchName: {
    ...Typography.bodySM,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accountDetails: {
    marginBottom: Spacing.md,
  },
  accountNumber: {
    ...Typography.bodySM,
    marginBottom: Spacing.xs,
  },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iban: {
    ...Typography.bodySM,
    flex: 1,
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
  accountFooter: {
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
