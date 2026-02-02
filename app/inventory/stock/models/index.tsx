/**
 * Models List Screen
 *
 * List all product models with search, pagination, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Layers } from 'lucide-react-native';
import { Badge, StandardListContainer, StandardListItem } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getProductModels,
  ProductModel,
  Pagination,
} from '@/services/endpoints/products';

export default function ModelsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [models, setModels] = useState<ProductModel[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

        const response = await getProductModels(filters);

        // Only update if this is still the latest request
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setModels((prev) => [...prev, ...response.models]);
          } else {
            setModels(response.models);
          }
          setPagination(response.pagination);
          hasInitialFetchRef.current = true;
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Models fetch error:', err);
          setError(err instanceof Error ? err.message : 'Modeller yüklenemedi');
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

  // Refs for useFocusEffect to avoid re-triggering
  const executeFetchRef = useRef(executeFetch);
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    executeFetchRef.current = executeFetch;
    searchQueryRef.current = searchQuery;
  }, [executeFetch, searchQuery]);

  // Refresh when screen is focused (e.g., after delete/create/edit)
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(searchQueryRef.current, 1, false);
      }
    }, [])
  );

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

  const renderModel = (item: ProductModel) => (
    <StandardListItem
      icon={Layers}
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
      onPress={() => router.push(`/inventory/stock/models/${item.id}` as any)}
    />
  );


  return (
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Modeller"
        subtitle={pagination ? `${pagination.total} model` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => router.push('/inventory/stock/models/new' as any)}
            activeOpacity={0.7}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.contentArea}>
        <StandardListContainer
        data={models}
        renderItem={renderModel}
        keyExtractor={(item) => String(item.id)}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Model adı ile ara...',
        }}
        emptyState={{
          icon: Layers,
          title: searchQuery ? 'Sonuç bulunamadı' : 'Henüz model eklenmemiş',
          subtitle: searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni model eklemek için + butonuna tıklayın',
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
});
