import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LucideIcon, Search, AlertCircle } from 'lucide-react-native';
import { Input } from './input';
import { Colors, Typography, Spacing, Brand, BorderRadius, Shadows } from '@/constants/theme';

export interface FilterChip {
  id: string;
  label: string;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
}

export interface StandardListContainerProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  search?: {
    value: string;
    onChange: (text: string) => void;
    placeholder?: string;
  };
  /** Backward compatibility - alternative to search prop */
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  filters?: {
    items: FilterChip[];
    activeId: string;
    onChange: (id: string) => void;
  };
  emptyState?: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    showRetry?: boolean;
    onRetry?: () => void;
  };
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  pagination?: Pagination;
  isLoadingMore?: boolean;
  error?: string | null;
  onRetry?: () => void;
  contentContainerStyle?: any;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export function StandardListContainer<T>({
  data,
  renderItem,
  keyExtractor,
  search,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters,
  emptyState,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  pagination,
  isLoadingMore = false,
  error,
  onRetry,
  contentContainerStyle,
  ListHeaderComponent,
  ListFooterComponent,
}: StandardListContainerProps<T>) {
  const colors = Colors.light;

  // Backward compatibility: convert searchQuery/onSearchChange to search object
  const searchConfig = search || (searchQuery !== undefined && onSearchChange ? {
    value: searchQuery,
    onChange: onSearchChange,
    placeholder: searchPlaceholder,
  } : undefined);

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Yükleniyor...
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
          {onRetry && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Brand.primary }]}
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (emptyState) {
      const EmptyIcon = emptyState.icon;
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <EmptyIcon size={64} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyState.title}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {emptyState.subtitle}
          </Text>
          {emptyState.showRetry && emptyState.onRetry && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Brand.primary }]}
              onPress={emptyState.onRetry}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (ListFooterComponent) {
      return ListFooterComponent;
    }

    if (isLoadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={Brand.primary} />
        </View>
      );
    }

    return null;
  };

  const renderFilters = () => {
    if (!filters || filters.items.length === 0) return null;

    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters.items}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filters.activeId === item.id ? Brand.primary : colors.card,
                  borderColor: filters.activeId === item.id ? Brand.primary : colors.border,
                },
              ]}
              onPress={() => filters.onChange(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: filters.activeId === item.id ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      {searchConfig && (
        <View style={styles.searchContainer}>
          <Input
            placeholder={searchConfig.placeholder || 'Ara...'}
            value={searchConfig.value}
            onChangeText={searchConfig.onChange}
            leftIcon={<Search size={20} color={colors.icon} />}
            containerStyle={styles.searchInput}
          />
        </View>
      )}

      {/* Filters */}
      {renderFilters()}

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item, index }) => renderItem(item, index)}
        contentContainerStyle={[
          styles.listContent,
          data.length === 0 && styles.listContentEmpty,
          contentContainerStyle,
        ]}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={renderFooter}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.primary} />
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.sm,
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
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
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
});
