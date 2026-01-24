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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronLeft,
  Search,
  Filter,
  Plus,
  FileText,
  User,
  Calendar,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
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
  { id: 'all', label: 'Tümü' },
  { id: 'draft', label: 'Taslak' },
  { id: 'sent', label: 'Gönderildi' },
  { id: 'accepted', label: 'Kabul' },
  { id: 'rejected', label: 'Red' },
];

export default function QuotesScreen() {
  const colors = Colors.light;
  const isFirstRender = useRef(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quotes from API
  const fetchQuotes = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters: QuoteFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        if (activeFilter !== 'all') {
          filters.status = activeFilter as QuoteStatus;
        }

        const response = await getQuotes(filters);

        if (append) {
          setQuotes((prev) => [...prev, ...response.quotes]);
        } else {
          setQuotes(response.quotes);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Quotes fetch error:', err);
        setError(err instanceof Error ? err.message : 'Teklifler yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, activeFilter]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchQuotes(1, false);
  }, [activeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      fetchQuotes(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Refresh list when screen comes into focus (e.g., after duplicating a quote)
  // Skip on first render to avoid double-fetching
  useFocusEffect(
    useCallback(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      fetchQuotes(1, false);
    }, [fetchQuotes])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuotes(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchQuotes(pagination.current_page + 1, true);
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
              fetchQuotes(1, false);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Teklifler</Text>
        <View style={styles.headerActions}>
          {pagination && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {pagination.total} teklif
            </Text>
          )}
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Teklif no veya müşteri ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
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

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/quote/new' as any)}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterContainer: {
    paddingVertical: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
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
