/**
 * Products List Screen
 *
 * List all products with search, pagination, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Plus, Package } from 'lucide-react-native';
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

export default function ProductsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isInitialMount = useRef(true);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from API
  const fetchProducts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters = {
          page,
          per_page: 20,
          search: searchQuery.trim() || undefined,
        };

        const response = await getProducts(filters);

        if (append) {
          setProducts((prev) => [...prev, ...response.products]);
        } else {
          setProducts(response.products);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Products fetch error:', err);
        setError(err instanceof Error ? err.message : 'Ürünler yüklenemedi');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery]
  );

  // Single useEffect for both initial load and search
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!ignore) {
        setIsLoading(true);
        await fetchProducts(1, false);
      }
    };

    // Initial mount - fetch immediately
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadData();
      return;
    }

    // Search change - debounce
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      fetchProducts(pagination.current_page + 1, true);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Ürünler"
        subtitle={pagination ? `${pagination.total} ürün` : undefined}
        showBackButton={true}
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
          fetchProducts(1, false);
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
