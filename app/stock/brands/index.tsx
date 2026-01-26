/**
 * Brands List Screen
 *
 * List all product brands with search, pagination, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Plus, Tag } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getProductBrands,
  ProductBrand,
  Pagination,
} from '@/services/endpoints/products';

export default function BrandsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isInitialMount = useRef(true);

  // API state
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch brands from API
  const fetchBrands = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters = {
          page,
          per_page: 20,
          search: searchQuery.trim() || undefined,
        };

        const response = await getProductBrands(filters);

        if (append) {
          setBrands((prev) => [...prev, ...response.brands]);
        } else {
          setBrands(response.brands);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Brands fetch error:', err);
        setError(err instanceof Error ? err.message : 'Markalar yüklenemedi');
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
        await fetchBrands(1, false);
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
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBrands(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      fetchBrands(pagination.current_page + 1, true);
    }
  };

  const renderBrand = (item: ProductBrand) => (
    <StandardListItem
      icon={Tag}
      iconColor={Brand.primary}
      title={item.name}
      meta={item.description}
      status={{
        label: item.is_active ? 'Aktif' : 'Pasif',
        variant: item.is_active ? 'success' : 'default',
      }}
      statusDot={
        item.is_active ? { color: colors.success } : { color: colors.textMuted }
      }
      footer={{
        left: (
          <Badge
            label={item.is_active ? 'Aktif' : 'Pasif'}
            variant={item.is_active ? 'success' : 'default'}
            size="sm"
          />
        ),
      }}
      onPress={() => router.push(`/stock/brands/${item.id}` as any)}
    />
  );


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Markalar"
        subtitle={pagination ? `${pagination.total} marka` : undefined}
        showBackButton={true}
      />

      <StandardListContainer
        data={brands}
        renderItem={renderBrand}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Marka adı ile ara...',
        }}
        emptyState={{
          icon: Tag,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz marka eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni marka eklemek için + butonuna tıklayın',
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
          fetchBrands(1, false);
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/stock/brands/new' as any)}
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
