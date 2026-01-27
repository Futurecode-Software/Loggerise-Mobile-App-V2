import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Search,
  Filter,
  Plus,
  Package,
  Tag,
  Layers,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { FullScreenHeader } from '@/components/header';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';
import {
  getProducts,
  getProductCategories,
  Product,
  ProductCategory,
  ProductFilters,
  Pagination,
  getProductTypeLabel,
  getProductUnitLabel,
  formatPrice,
} from '@/services/endpoints/products';

export default function ProductsScreen() {
  const colors = Colors.light;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories for filter chips
  const fetchCategories = useCallback(async () => {
    try {
      const response = await getProductCategories({ is_active: true, per_page: 100 });
      setCategories(response.categories);
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  }, []);

  // Fetch products from API
  const fetchProducts = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters: ProductFilters = {
          page,
          per_page: 20,
          is_active: true,
        };

        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        if (activeFilter !== 'all') {
          filters.product_category_id = parseInt(activeFilter, 10);
        }

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
    [searchQuery, activeFilter]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts(1, false);
  }, [activeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      fetchProducts(1, false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true);
      fetchProducts(pagination.current_page + 1, true);
    }
  };

  const filterChips = [
    { id: 'all', label: 'Tümü' },
    ...categories.slice(0, 5).map((cat) => ({ id: String(cat.id), label: cat.name })),
  ];

  const renderProduct = ({ item }: { item: Product }) => (
    <Card
      style={styles.productCard}
      onPress={() => router.push(`/stock/products/${item.id}` as any)}
    >
      <View style={styles.productHeader}>
        <View style={[styles.productIcon, { backgroundColor: colors.surface }]}>
          <Package size={20} color={Brand.primary} />
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
          {item.code && (
            <Text style={[styles.productCode, { color: colors.textSecondary }]}>
              {item.code}
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

      <View style={styles.detailsRow}>
        {item.brand && (
          <View style={styles.detailItem}>
            <Tag size={12} color={colors.icon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {item.brand.name}
            </Text>
          </View>
        )}
        {item.category && (
          <View style={styles.detailItem}>
            <Layers size={12} color={colors.icon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {item.category.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.badgeRow}>
        <Badge label={getProductTypeLabel(item.product_type)} variant="outline" size="sm" />
        <Badge label={getProductUnitLabel(item.unit)} variant="outline" size="sm" />
      </View>

      {(item.sale_price || item.purchase_price) && (
        <View style={styles.priceRow}>
          {item.sale_price && (
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Satış:</Text>
              <Text style={[styles.priceValue, { color: colors.success }]}>
                {formatPrice(item.sale_price)}
              </Text>
            </View>
          )}
          {item.purchase_price && (
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Alış:</Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                {formatPrice(item.purchase_price)}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.productFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {item.barcode || '-'}
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
            Ürünler yükleniyor...
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
              fetchProducts(1, false);
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
          <Package size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz ürün eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni ürün eklemek için + butonuna tıklayın'}
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
    <View style={[styles.container, { backgroundColor: Brand.primary }]}>
      <FullScreenHeader
        title="Ürünler"
        subtitle={pagination ? `${pagination.total} ürün` : undefined}
        showBackButton={true}
        rightIcons={
          <TouchableOpacity
            onPress={() => {
              // Filter action
            }}
            activeOpacity={0.7}
          >
            <Filter size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.contentArea}>
        <View style={styles.searchContainer}>
        <Input
          placeholder="Ürün adı veya kod ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filterChips}
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
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProduct}
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
  contentArea: {
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
  productCard: {
    marginBottom: 0,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  productCode: {
    ...Typography.bodySM,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    ...Typography.bodySM,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  priceLabel: {
    ...Typography.bodySM,
  },
  priceValue: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  footerText: {
    ...Typography.bodySM,
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
