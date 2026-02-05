/**
 * Models List Screen
 *
 * List all product models with search, pagination, and CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  getProductModels,
  ProductModel,
  Pagination,
} from '@/services/endpoints/products'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Skeleton Component
function ModelCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={160} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>
    </View>
  )
}

// Card Component
interface ModelCardProps {
  item: ProductModel
  onPress: () => void
}

function ModelCard({ item, onPress }: ModelCardProps) {
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: DashboardColors.primaryGlow }]}>
          <Ionicons name="layers-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={1}>{item.description}</Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_active ? DashboardColors.successBg : DashboardColors.surface }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.is_active ? DashboardColors.success : DashboardColors.textMuted }
          ]}>
            {item.is_active ? 'Aktif' : 'Pasif'}
          </Text>
        </View>
      </View>

      {/* Status Dot */}
      <View style={[
        styles.statusDot,
        { backgroundColor: item.is_active ? DashboardColors.success : DashboardColors.textMuted }
      ]} />

      {/* Arrow */}
      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
      </View>
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="layers-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz model yok'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni model eklemek için sağ üstteki + butonuna tıklayın.'}
      </Text>
    </View>
  )
}

export default function ModelsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [models, setModels] = useState<ProductModel[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  // Refs to prevent duplicate calls
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitialFetchRef = useRef(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleCardPress = (item: ProductModel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/inventory/stock/models/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/inventory/stock/models/new')
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Modeller"
        icon="layers-outline"
        subtitle={pagination ? `${pagination.total} model` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'add',
            onPress: handleNewPress
          }
        ]}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={DashboardColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Model adı ile ara..."
              placeholderTextColor={DashboardColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <ModelCardSkeleton />
            <ModelCardSkeleton />
            <ModelCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={models}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ModelCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.primary
  },
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },

  // Search
  searchContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    backgroundColor: DashboardColors.background
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    gap: DashboardSpacing.sm,
    ...DashboardShadows.sm
  },
  searchInput: {
    flex: 1,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
  },

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.sm,
    paddingBottom: DashboardSpacing.xl
  },

  // Card
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    padding: DashboardSpacing.lg,
    marginBottom: DashboardSpacing.md,
    position: 'relative',
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.sm,
    marginRight: DashboardSpacing.md
  },
  cardName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  cardDescription: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '700'
  },
  statusDot: {
    position: 'absolute',
    top: DashboardSpacing.lg,
    right: DashboardSpacing.lg,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  cardArrow: {
    position: 'absolute',
    right: DashboardSpacing.md,
    bottom: DashboardSpacing.lg
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing['3xl'],
    paddingHorizontal: DashboardSpacing.xl
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DashboardColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.text,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24
  }
})
