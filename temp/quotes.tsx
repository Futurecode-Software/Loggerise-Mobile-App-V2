import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  Filter,
  Plus,
  FileText,
  Layers,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { StandardListContainer, StandardListItem, Badge } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand } from '@/constants/theme';
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
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const renderQuote = (item: Quote) => (
    <StandardListItem
      icon={FileText}
      iconColor={Brand.primary}
      title={item.quote_number}
      subtitle={item.customer?.name || '-'}
      additionalInfo={`Teklif: ${formatDate(item.quote_date)} • Geçerlilik: ${formatDate(item.valid_until || item.quote_date)}`}
      status={{
        label: getQuoteStatusLabel(item.status),
        variant: getQuoteStatusVariant(item.status),
      }}
      footer={{
        right: formatAmount(item.total_amount, item.currency),
      }}
      onPress={() => router.push(`/quote/${item.id}` as any)}
    />
  );


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
    <View style={styles.container}>
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

      <StandardListContainer
        items={quotes}
        renderItem={renderQuote}
        loading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        pagination={pagination || undefined}
        onLoadMore={loadMore}
        onRefresh={onRefresh}
        refreshing={refreshing}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Teklif no veya müşteri ile ara..."
        emptyTitle={searchQuery ? 'Sonuç bulunamadı' : 'Henüz teklif eklenmemiş'}
        emptySubtitle={
          searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni teklif eklemek için + butonuna tıklayın'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
});
