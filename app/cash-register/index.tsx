import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Filter, Plus, Wallet, User, Layers, DollarSign, Euro, PoundSterling, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
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

  // Refresh when screen is focused (e.g., after delete/create/edit)
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(activeFilter, 1, false);
      }
    }, [activeFilter, executeFetch])
  );

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

  // Carousel state
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const screenWidth = Dimensions.get('window').width;
  // Peek gösterimi için kart genişliği: Bir sonraki kartın bir kısmı görünsün
  const cardWidth = screenWidth - Spacing.lg * 2 - 40; // 40px peek alanı

  const renderCarouselCard = ({ item, index }: { item: [string, number]; index: number }) => {
    const [currency, total] = item;
    const currencyRegisters = cashRegisters.filter(cr => cr.currency_type === currency);
    const positiveCount = currencyRegisters.filter(cr => cr.balance > 0).length;
    const negativeCount = currencyRegisters.filter(cr => cr.balance < 0).length;
    
    return (
      <View style={[styles.carouselCard, { width: cardWidth }]}>
        {/* Header */}
        <View style={styles.carouselHeader}>
          <View style={styles.carouselHeaderLeft}>
            <View style={styles.carouselIcon}>
              <TrendingUp size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.carouselTitle}>{currency} Kasaları</Text>
          </View>
          <View style={styles.carouselBadge}>
            <Text style={styles.carouselBadgeText}>{currencyRegisters.length} Kasa</Text>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.carouselTotal}>
          <Text style={styles.carouselTotalLabel}>Toplam Bakiye</Text>
          <Text style={styles.carouselTotalValue}>
            {formatBalance(total, currency as CurrencyType)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.carouselGrid}>
          <View style={[styles.carouselStat, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <View style={styles.carouselStatHeader}>
              <Text style={[styles.carouselStatValue, { color: '#10B981' }]}>
                {positiveCount}
              </Text>
            </View>
            <Text style={styles.carouselStatLabel}>Pozitif</Text>
          </View>

          <View style={[styles.carouselStat, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <View style={styles.carouselStatHeader}>
              <Text style={[styles.carouselStatValue, { color: '#EF4444' }]}>
                {negativeCount}
              </Text>
            </View>
            <Text style={styles.carouselStatLabel}>Negatif</Text>
          </View>
        </View>
      </View>
    );
  };

  const scrollToIndex = (index: number) => {
    const entries = Object.entries(totals);
    if (index < 0 || index >= entries.length) return;
    
    carouselRef.current?.scrollToOffset({
      offset: index * (cardWidth + Spacing.md),
      animated: true,
    });
    setActiveCarouselIndex(index);
  };

  const renderPagination = () => {
    const entries = Object.entries(totals);
    if (entries.length <= 1) return null;
    
    const currentCurrency = entries[activeCarouselIndex]?.[0] || '';
    
    return (
      <View style={styles.paginationContainer}>
        {/* Sol ok */}
        <TouchableOpacity
          onPress={() => scrollToIndex(activeCarouselIndex - 1)}
          disabled={activeCarouselIndex === 0}
          style={[
            styles.paginationArrow,
            activeCarouselIndex === 0 && styles.paginationArrowDisabled,
          ]}
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Para birimi isimleri */}
        <View style={styles.currencyTabs}>
          {entries.map(([currency], index) => (
            <TouchableOpacity
              key={currency}
              onPress={() => scrollToIndex(index)}
              style={[
                styles.currencyTab,
                index === activeCarouselIndex && styles.currencyTabActive,
              ]}
            >
              <Text
                style={[
                  styles.currencyTabText,
                  index === activeCarouselIndex && styles.currencyTabTextActive,
                ]}
              >
                {currency}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sağ ok */}
        <TouchableOpacity
          onPress={() => scrollToIndex(activeCarouselIndex + 1)}
          disabled={activeCarouselIndex === entries.length - 1}
          style={[
            styles.paginationArrow,
            activeCarouselIndex === entries.length - 1 && styles.paginationArrowDisabled,
          ]}
        >
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => {
    if (Object.keys(totals).length === 0) return null;
    const entries = Object.entries(totals);
    
    return (
      <View>
        <FlatList
          ref={carouselRef}
          data={entries}
          renderItem={renderCarouselCard}
          keyExtractor={([currency]) => currency}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + Spacing.md}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + Spacing.md));
            setActiveCarouselIndex(index);
          }}
        />
        {renderPagination()}
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
        title="Kasalar"
        subtitle={pagination ? `${pagination.total} kasa` : undefined}
        showBackButton={true}
        tabs={headerTabs}
        rightIcons={
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push('/cash-register/new' as any)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.primary,
  },
  carouselContent: {
    paddingHorizontal: 0,
    gap: Spacing.md,
  },
  carouselCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Brand.primary,
    ...Shadows.md,
  },
  carouselHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  carouselHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  carouselIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTitle: {
    ...Typography.headingSM,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  carouselBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  carouselBadgeText: {
    ...Typography.bodyXS,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  carouselTotal: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  carouselTotalLabel: {
    ...Typography.bodySM,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  carouselTotalValue: {
    ...Typography.headingLG,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  carouselGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  carouselStat: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  carouselStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  carouselStatValue: {
    ...Typography.bodyLG,
    fontWeight: '700',
  },
  carouselStatLabel: {
    ...Typography.bodyXS,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  paginationArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationArrowDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.4,
  },
  currencyTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
  currencyTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  currencyTabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    ...Shadows.sm,
  },
  currencyTabText: {
    ...Typography.bodySM,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currencyTabTextActive: {
    color: Brand.primary,
    textShadowColor: 'transparent',
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
});
