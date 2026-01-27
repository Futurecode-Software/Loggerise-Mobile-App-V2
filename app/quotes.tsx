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
  FileText,
  User,
  Calendar,
  ChevronRight,
  AlertCircle,
  Layers,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getQuotes,
  Quote,
  QuoteFilters,
  QuoteStatus,
  Pagination,
  getQuoteStatusLabel,
  getQuoteStatusVariant,
  formatAmount,
  formatDate,
} from '@/services/endpoints/quotes';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'draft', label: 'Taslak', icon: FileText },
  { id: 'sent', label: 'Gönderildi', icon: Send },
  { id: 'accepted', label: 'Kabul', icon: CheckCircle },
  { id: 'rejected', label: 'Red', icon: XCircle },
];

export default function QuotesScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasInitialFetchRef = useRef(false);
  const isFirstFocusRef = useRef(true);

  // Core fetch function - doesn't depend on search/filter state
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

        const filters: QuoteFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }

        if (filter !== 'all') {
          filters.status = filter as QuoteStatus;
        }

        const response = await getQuotes(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setQuotes((prev) => [...prev, ...response.quotes]);
          } else {
            setQuotes(response.quotes);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Quotes fetch error:', err);
          setError(err instanceof Error ? err.message : 'Teklifler yüklenemedi');
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
  }, []); // Empty deps - only run on mount

  // Filter change - immediate fetch
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    setIsLoading(true);
    executeFetch(searchQuery, activeFilter, 1, false);
  }, [activeFilter]); // Only activeFilter

  // Search change - with debounce
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
  }, [searchQuery]); // Only searchQuery

  // Refresh list when screen comes into focus (e.g., after duplicating a quote)
  // Skip on first render to avoid double-fetching
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }

      // Only refresh if we've already fetched once (screen was previously mounted)
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

  const renderQuote = ({ item }: { item: Quote }) => (
    <Card
      style={styles.quoteCard}
      onPress={() => router.push(`/quote/${item.id}` as any)}
    >
      <View style={styles.quoteHeader}>
        <View style={[styles.quoteIcon, { backgroundColor: colors.surface }]}>
          <FileText size={20} color={Brand.primary} />
        </View>
        <View style={styles.quoteInfo}>
          <Text style={[styles.quoteNumber, { color: colors.text }]}>{item.quote_number}</Text>
          {item.customer && (
            <View style={styles.customerRow}>
              <User size={12} color={colors.textMuted} />
              <Text style={[styles.customerName, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.customer.name}
              </Text>
            </View>
          )}
        </View>
        <Badge
          label={getQuoteStatusLabel(item.status)}
          variant={getQuoteStatusVariant(item.status)}
          size="sm"
        />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Teklif: {formatDate(item.quote_date)}
          </Text>
        </View>
        {item.valid_until && (
          <View style={styles.metaItem}>
            <Calendar size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Geçerlilik: {formatDate(item.valid_until)}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.quoteFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.totalAmount, { color: colors.text }]}>
          {formatAmount(item.total_amount, item.currency)}
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
            Teklifler yükleniyor...
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
              executeFetch(searchQuery, activeFilter, 1, false);
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
          <FileText size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz teklif eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni teklif eklemek için + butonuna tıklayın'}
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

  // Prepare tabs for header
  const headerTabs = STATUS_FILTERS.map((filter) => {
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
        title="Teklifler"
        subtitle={pagination ? `${pagination.total} teklif` : undefined}
        showBackButton={true}
        tabs={headerTabs}
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
              onPress={() => router.push('/quote/new' as any)}
              activeOpacity={0.7}
            >
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.contentWrapper}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Teklif no veya müşteri ile ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={20} color={colors.icon} />}
            containerStyle={styles.searchInput}
          />
        </View>

        <FlatList
          data={quotes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderQuote}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
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
    flexGrow: 1,
  },
  quoteCard: {
    marginBottom: 0,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  quoteInfo: {
    flex: 1,
  },
  quoteNumber: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  customerName: {
    ...Typography.bodySM,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaText: {
    ...Typography.bodySM,
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  totalAmount: {
    ...Typography.bodyLG,
    fontWeight: '700',
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
