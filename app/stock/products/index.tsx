/**
 * Products List Screen
 *
 * List all products with search, pagination, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Plus, Package, Layers, CheckCircle, XCircle, Filter } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getProducts,
  Product,
  Pagination,
  getProductTypeLabel,
  getProductUnitLabel,
} from '@/services/endpoints/products';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tümü', icon: Layers },
  { id: 'active', label: 'Aktif', icon: CheckCircle },
  { id: 'passive', label: 'Pasif', icon: XCircle },
];

export default function ProductsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitialFetchRef = useRef(false);

  // Core fetch function - no dependencies on state
  const executeFetch = useCallback(
    async (search: string, filter: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters: any = {
          page,
          per_page: 20,
          search: search.trim() || undefined,
        };

        // Add active filter
        if (filter === 'active') {
          filters.is_active = true;
        } else if (filter === 'passive') {
          filters.is_active = false;
        }

        const response = await getProducts(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setProducts((prev) => [...prev, ...response.products]);
          } else {
            setProducts(response.products);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Products fetch error:', err);
          setError(err instanceof Error ? err.message : 'Ürünler yüklenemedi');
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

  // Search with debounce
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

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, activeFilter, 1, false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, activeFilter, pagination.current_page + 1, true);
    }
  };

  const renderProduct = (item: Product) => {
    const additionalInfo = [];
    
    if (item.code) {
      additionalInfo.push(
        <Text
          key="code"
          style={[styles.productCode, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          Kod: {item.code}
        </Text>
      );
    }
    
    if (item.brand || item.category) {
      const infoParts = [];
      if (item.brand) {
        infoParts.push(item.brand.name);
      }
      if (item.category) {
        infoParts.push(item.category.name);
      }
      if (infoParts.length > 0) {
        additionalInfo.push(
          <Text
            key="brand-category"
            style={[styles.productInfo, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {infoParts.join(' • ')}
          </Text>
        );
      }
    }

    return (
      <StandardListItem
        icon={Package}
        iconColor={Brand.primary}
        title={item.name}
        meta={item.description}
        additionalInfo={
          additionalInfo.length > 0 ? (
            <View style={styles.additionalInfo}>{additionalInfo}</View>
          ) : undefined
        }
        status={{
          label: item.is_active ? 'Aktif' : 'Pasif',
          variant: item.is_active ? 'success' : 'default',
        }}
        statusDot={
          item.is_active ? { color: colors.success } : { color: colors.textMuted }
        }
        footer={{
          left: (
            <View style={styles.footerLeftContent}>
              <Badge
                label={item.is_active ? 'Aktif' : 'Pasif'}
                variant={item.is_active ? 'success' : 'default'}
                size="sm"
              />
              <Text style={[styles.productType, { color: colors.textSecondary }]}>
                {getProductTypeLabel(item.product_type)} • {getProductUnitLabel(item.unit)}
              </Text>
            </View>
          ),
        }}
        onPress={() => router.push(`/stock/products/${item.id}` as any)}
      />
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Ürünler"
        subtitle={pagination ? `${pagination.total} ürün` : undefined}
        showBackButton={true}
        tabs={headerTabs}
        rightIcons={
          <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <StandardListContainer
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Ürün adı veya kodu ile ara...',
        }}
        emptyState={{
          icon: Package,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz ürün eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni ürün eklemek için + butonuna tıklayın',
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
          executeFetch(searchQuery, activeFilter, 1, false);
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/stock/products/new' as any)}
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
  additionalInfo: {
    gap: 2,
    marginTop: Spacing.sm,
  },
  productCode: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  productInfo: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
  footerLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  productType: {
    fontSize: 10,
    color: Colors.light.textSecondary,
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
