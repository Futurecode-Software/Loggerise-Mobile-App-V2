/**
 * Categories List Screen
 *
 * List all product categories with search, pagination, and CRUD operations.
 * Supports hierarchical categories with parent_id.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  Plus,
  FolderTree,
  ChevronRight,
  AlertCircle,
  Trash2,
  CornerDownRight,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getProductCategories,
  deleteProductCategory,
  ProductCategory,
  Pagination,
} from '@/services/endpoints/products';
import { useToast } from '@/hooks/use-toast';

export default function CategoriesScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isInitialMount = useRef(true);

  // API state
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from API
  const fetchCategories = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters = {
          page,
          per_page: 20,
          search: searchQuery.trim() || undefined,
        };

        const response = await getProductCategories(filters);

        if (append) {
          setCategories((prev) => [...prev, ...response.categories]);
        } else {
          setCategories(response.categories);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Categories fetch error:', err);
        setError(err instanceof Error ? err.message : 'Kategoriler yüklenemedi');
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
        await fetchCategories(1, false);
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
    await fetchCategories(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      fetchCategories(pagination.current_page + 1, true);
    }
  };

  const handleDelete = (category: ProductCategory) => {
    Alert.alert(
      'Kategori Sil',
      `"${category.name}" kategorisini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProductCategory(category.id);
              success('Başarılı', 'Kategori silindi.');
              fetchCategories(1, false);
            } catch (err) {
              showError('Hata', err instanceof Error ? err.message : 'Kategori silinemedi');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: ProductCategory }) => (
    <Card
      style={styles.categoryCard}
      onPress={() => router.push(`/stock/categories/${item.id}` as any)}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.surface }]}>
          <FolderTree size={20} color={Brand.primary} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
          {item.parent && (
            <View style={styles.parentInfo}>
              <CornerDownRight size={12} color={colors.textMuted} />
              <Text style={[styles.parentName, { color: colors.textMuted }]}>
                {item.parent.name}
              </Text>
            </View>
          )}
          {item.description && (
            <Text
              style={[styles.categoryDescription, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.is_active ? colors.success : colors.textMuted },
          ]}
        />
      </View>

      <View style={[styles.categoryFooter, { borderTopColor: colors.border }]}>
        <View style={styles.footerLeft}>
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
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          >
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
          <ChevronRight size={18} color={colors.icon} />
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Kategoriler yükleniyor...
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
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Bir hata oluştu</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Brand.primary }]}
            onPress={() => {
              setIsLoading(true);
              fetchCategories(1, false);
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
          <FolderTree size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kategori eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni kategori eklemek için + butonuna tıklayın'}
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FullScreenHeader
        title="Kategoriler"
        subtitle={pagination ? `${pagination.total} kategori` : undefined}
        showBackButton={true}
      />

      <View style={styles.searchContainer}>
        <Input
          placeholder="Kategori adı ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Brand.primary, ...Shadows.lg }]}
        onPress={() => router.push('/stock/categories/new' as any)}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    flexGrow: 1,
  },
  categoryCard: {
    marginBottom: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  parentName: {
    ...Typography.bodyXS,
  },
  categoryDescription: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  childrenCount: {
    ...Typography.bodyXS,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.xs,
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
    borderRadius: 8,
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
