import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  User,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getFinancialTransactions,
  FinancialTransaction,
  TransactionFilters,
  TransactionSummary,
  Pagination,
  TransactionType,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  formatAmount,
  formatDate,
} from '@/services/endpoints/financial-transactions';

const TYPE_FILTERS = [
  { id: 'all', label: 'Tümü', icon: null },
  { id: 'income', label: 'Gelir', icon: ArrowDownLeft },
  { id: 'expense', label: 'Gider', icon: ArrowUpRight },
  { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
];

export default function TransactionsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isFirstFocusRef = useRef(true);

  // Fetch transactions from API
  const fetchTransactions = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters: TransactionFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        if (activeFilter !== 'all') {
          filters.transaction_type = activeFilter as TransactionType;
        }

        const response = await getFinancialTransactions(filters);

        if (append) {
          setTransactions((prev) => [...prev, ...response.transactions]);
        } else {
          setTransactions(response.transactions);
        }
        setSummary(response.summary);
        setPagination(response.pagination);
      } catch (err) {
        console.error('Transactions fetch error:', err);
        setError(err instanceof Error ? err.message : 'İşlemler yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, activeFilter]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchTransactions(1, false);
  }, [activeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      fetchTransactions(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      // Refresh data when screen comes into focus
      fetchTransactions(1, false);
    }, [fetchTransactions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchTransactions(pagination.current_page + 1, true);
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return ArrowDownLeft;
      case 'expense':
        return ArrowUpRight;
      case 'transfer':
        return ArrowLeftRight;
      default:
        return ArrowLeftRight;
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return colors.success;
      case 'expense':
        return colors.danger;
      case 'transfer':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  const renderTransaction = ({ item }: { item: FinancialTransaction }) => {
    const TypeIcon = getTypeIcon(item.transaction_type);
    const typeColor = getTypeColor(item.transaction_type);

    return (
      <Card
        style={styles.transactionCard}
        onPress={() => router.push(`/transaction/${item.id}` as any)}
      >
        <View style={styles.transactionHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeColor + '15' }]}>
            <TypeIcon size={20} color={typeColor} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionDesc, { color: colors.text }]} numberOfLines={1}>
              {item.description || item.category || getTransactionTypeLabel(item.transaction_type)}
            </Text>
            <View style={styles.transactionMeta}>
              <Calendar size={12} color={colors.textMuted} />
              <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                {formatDate(item.transaction_date)}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.transaction_type === 'income' ? colors.success : colors.danger },
            ]}
          >
            {item.transaction_type === 'income' ? '+' : '-'}
            {formatAmount(item.amount, item.currency_type)}
          </Text>
        </View>

        {item.contact && (
          <View style={styles.contactRow}>
            <User size={14} color={colors.icon} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>
              {item.contact.name}
            </Text>
          </View>
        )}

        <View style={styles.badgeRow}>
          <Badge
            label={getTransactionTypeLabel(item.transaction_type)}
            variant={
              item.transaction_type === 'income' ? 'success' :
              item.transaction_type === 'expense' ? 'danger' : 'info'
            }
            size="sm"
          />
          <Badge
            label={getTransactionStatusLabel(item.status)}
            variant={
              item.status === 'approved' ? 'success' :
              item.status === 'pending' ? 'warning' :
              item.status === 'rejected' ? 'danger' : 'default'
            }
            size="sm"
          />
          {item.is_reconciled && (
            <Badge label="Mutabık" variant="outline" size="sm" />
          )}
        </View>

        <View style={[styles.transactionFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.referenceText, { color: colors.textMuted }]}>
            {item.reference_number || item.category || '-'}
          </Text>
          <ChevronRight size={18} color={colors.icon} />
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            İşlemler yükleniyor...
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
              fetchTransactions(1, false);
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
          <ArrowLeftRight size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz işlem eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni işlem eklemek için + butonuna tıklayın'}
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
      {summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <TrendingUp size={16} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Toplam Gelir</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatAmount(summary.total_credit, 'TRY')}
                </Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <TrendingDown size={16} color={colors.danger} />
              </View>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Toplam Gider</Text>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  {formatAmount(summary.total_debit, 'TRY')}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.netBalanceRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.netBalanceLabel, { color: colors.textSecondary }]}>Net Bakiye</Text>
            <Text
              style={[
                styles.netBalanceValue,
                { color: summary.net_balance >= 0 ? colors.success : colors.danger },
              ]}
            >
              {formatAmount(summary.net_balance, 'TRY')}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={TYPE_FILTERS}
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
              {item.icon && (
                <item.icon
                  size={16}
                  color={activeFilter === item.id ? '#FFFFFF' : colors.textSecondary}
                />
              )}
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
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Mali İşlemler"
        subtitle={pagination ? `${pagination.total} işlem` : undefined}
        showBackButton={true}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => {
                // Filter action
              }}
              activeOpacity={0.7}
            >
              <Filter size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/transaction/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.contentArea}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Açıklama veya referans ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTransaction}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    ...Typography.bodyXS,
  },
  summaryValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  netBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  netBalanceLabel: {
    ...Typography.bodySM,
  },
  netBalanceValue: {
    ...Typography.headingMD,
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    ...Typography.bodySM,
    fontWeight: '500',
  },
  transactionCard: {
    marginBottom: 0,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    ...Typography.bodyMD,
    fontWeight: '500',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  transactionDate: {
    ...Typography.bodyXS,
  },
  transactionAmount: {
    ...Typography.bodyMD,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contactText: {
    ...Typography.bodySM,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  referenceText: {
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
});
