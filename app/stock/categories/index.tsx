/**
 * Categories List Screen
 *
 * List all product categories with search, pagination, and CRUD operations.
 * Supports hierarchical categories with parent_id.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Plus, FolderTree, CornerDownRight } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getProductCategories,
  ProductCategory,
  Pagination,
} from '@/services/endpoints/products';

export default function CategoriesScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [categories, setCategories] = useState<ProductCategory[]>([]);
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
    async (search: string, page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current;

      try {
        setError(null);

        const filters = {
          page,
          per_page: 20,
          search: search.trim() || undefined,
        };

        const response = await getProductCategories(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setCategories((prev) => [...prev, ...response.categories]);
          } else {
            setCategories(response.categories);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Categories fetch error:', err);
          setError(err instanceof Error ? err.message : 'Kategoriler yüklenemedi');
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
    executeFetch(searchQuery, 1, false);

    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty deps - only run on mount

  // Search with debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
      executeFetch(searchQuery, 1, false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Only searchQuery

  const onRefresh = async () => {
    setRefreshing(true);
    await executeFetch(searchQuery, 1, false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      executeFetch(searchQuery, pagination.current_page + 1, true);
    }
  };

  const renderCategory = (item: ProductCategory) => {
    const additionalInfo = [];
    if (item.parent) {
      additionalInfo.push(
        <View key="parent" style={styles.parentInfo}>
          <CornerDownRight size={12} color={colors.textMuted} />
          <Text style={[styles.parentName, { color: colors.textMuted }]}>
            {item.parent.name}
          </Text>
        </View>
      );
    }
    if (item.description) {
      additionalInfo.push(
        <Text
          key="description"
          style={[styles.categoryDescription, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.description}
        </Text>
      );
    }

    return (
      <StandardListItem
        icon={FolderTree}
        iconColor={Brand.primary}
        title={item.name}
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
              {item.children_count !== undefined && item.children_count > 0 && (
                <Text style={[styles.childrenCount, { color: colors.textSecondary }]}>
                  {item.children_count} alt kategori
                </Text>
              )}
            </View>
          ),
        }}
        onPress={() => router.push(`/stock/categories/${item.id}` as any)}
      />
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Kategoriler"
        subtitle={pagination ? `${pagination.total} kategori` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/stock/categories/new' as any)}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.contentArea}>
        <StandardListContainer
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Kategori adı ile ara...',
        }}
        emptyState={{
          icon: FolderTree,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz kategori eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni kategori eklemek için + butonuna tıklayın',
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
          executeFetch(searchQuery, 1, false);
        }}
      />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...Shadows.lg,
  },
  additionalInfo: {
    gap: 2,
    marginTop: Spacing.sm,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  parentName: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
  categoryDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  footerLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  childrenCount: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
});
