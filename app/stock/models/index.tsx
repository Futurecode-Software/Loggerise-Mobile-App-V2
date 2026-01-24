/**
 * Models List Screen
 *
 * List all product models with search, pagination, and CRUD operations.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Search,
  Plus,
  Layers,
  ChevronRight,
  AlertCircle,
  Trash2,
} from 'lucide-react-native';
import { Card, Badge, Input } from '@/components/ui';
import { Colors, Typography, Spacing, Brand, Shadows } from '@/constants/theme';
import {
  getProductModels,
  deleteProductModel,
  ProductModel,
  Pagination,
} from '@/services/endpoints/products';
import { useToast } from '@/hooks/use-toast';

export default function ModelsScreen() {
  const colors = Colors.light;
  const { success, error: showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isInitialMount = useRef(true);

  // API state
  const [models, setModels] = useState<ProductModel[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch models from API
  const fetchModels = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setError(null);

        const filters = {
          page,
          per_page: 20,
          search: searchQuery.trim() || undefined,
        };

        const response = await getProductModels(filters);

        if (append) {
          setModels((prev) => [...prev, ...response.models]);
        } else {
          setModels(response.models);
        }
        setPagination(response.pagination);
      } catch (err) {
        console.error('Models fetch error:', err);
        setError(err instanceof Error ? err.message : 'Modeller yüklenemedi');
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
        await fetchModels(1, false);
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
    await fetchModels(1, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true);
      fetchModels(pagination.current_page + 1, true);
    }
  };

  const handleDelete = (model: ProductModel) => {
    Alert.alert('Model Sil', `"${model.name}" modelini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProductModel(model.id);
            success('Başarılı', 'Model silindi.');
            fetchModels(1, false);
          } catch (err) {
            showError('Hata', err instanceof Error ? err.message : 'Model silinemedi');
          }
        },
      },
    ]);
  };

  const renderModel = ({ item }: { item: ProductModel }) => (
    <Card style={styles.modelCard} onPress={() => router.push(`/stock/models/${item.id}` as any)}>
      <View style={styles.modelHeader}>
        <View style={[styles.modelIcon, { backgroundColor: colors.surface }]}>
          <Layers size={20} color={Brand.primary} />
        </View>
        <View style={styles.modelInfo}>
          <Text style={[styles.modelName, { color: colors.text }]}>{item.name}</Text>
          {item.description && (
            <Text style={[styles.modelDescription, { color: colors.textSecondary }]} numberOfLines={1}>
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

      <View style={[styles.modelFooter, { borderTopColor: colors.border }]}>
        <Badge
          label={item.is_active ? 'Aktif' : 'Pasif'}
          variant={item.is_active ? 'success' : 'default'}
          size="sm"
        />
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
            Modeller yükleniyor...
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
              fetchModels(1, false);
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
          <Layers size={64} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'Sonuç bulunamadı' : 'Henüz model eklenmemiş'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'Farklı bir arama terimi deneyin'
            : 'Yeni model eklemek için + butonuna tıklayın'}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Modeller</Text>
        <View style={styles.headerActions}>
          {pagination && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {pagination.total} model
            </Text>
          )}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Model adı ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.icon} />}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        data={models}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderModel}
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
        onPress={() => router.push('/stock/models/new' as any)}
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
  countText: {
    ...Typography.bodySM,
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
  modelCard: {
    marginBottom: 0,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    ...Typography.bodyMD,
    fontWeight: '600',
  },
  modelDescription: {
    ...Typography.bodySM,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
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
