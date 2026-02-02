/**
 * Kategoriler Liste Sayfası
 *
 * Ürün kategorilerini listeler. CLAUDE.md tasarım ilkelerine uygun.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Pressable
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
  getProductCategories,
  ProductCategory,
  Pagination
} from '@/services/endpoints/products'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Skeleton Component
function CategoryCardSkeleton() {
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
      <View style={styles.cardInfo}>
        <Skeleton width={120} height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
    </View>
  )
}

// Card Component
interface CategoryCardProps {
  item: ProductCategory
  onPress: () => void
}

function CategoryCard({ item, onPress }: CategoryCardProps) {
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
        <View style={styles.cardIcon}>
          <Ionicons name="folder-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.parent && (
            <View style={styles.parentInfo}>
              <Ionicons name="return-down-forward-outline" size={12} color={DashboardColors.textMuted} />
              <Text style={styles.parentName} numberOfLines={1}>{item.parent.name}</Text>
            </View>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(156, 163, 175, 0.12)' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.is_active ? DashboardColors.success : DashboardColors.textMuted }
          ]}>
            {item.is_active ? 'Aktif' : 'Pasif'}
          </Text>
        </View>
      </View>

      {/* Info */}
      {item.description && (
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.description}</Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        {item.children_count !== undefined && item.children_count > 0 && (
          <View style={styles.childrenBadge}>
            <Ionicons name="layers-outline" size={14} color={DashboardColors.primary} />
            <Text style={styles.childrenText}>{item.children_count} alt kategori</Text>
          </View>
        )}
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
function EmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="folder-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kategori yok'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni kategori eklemek için sağ üstteki + butonuna tıklayın.'
        }
      </Text>
    </View>
  )
}

export default function CategoriesScreen() {
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const currentFetchId = ++fetchIdRef.current

      try {
        setError(null)

        const filters = {
          page,
          per_page: 20
        }

        const response = await getProductCategories(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setCategories((prev) => [...prev, ...response.categories])
          } else {
            setCategories(response.categories)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Categories fetch error:', err)
          setError(err instanceof Error ? err.message : 'Kategoriler yüklenemedi')
        }
      } finally {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          setIsLoading(false)
          setIsLoadingMore(false)
          setRefreshing(false)
        }
      }
    },
    []
  )

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(1, false)

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetch(1, false)
      }
    }, [executeFetch])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(1, false)
  }

  const loadMore = () => {
    if (
      !isLoadingMore &&
      pagination &&
      pagination.current_page < pagination.last_page
    ) {
      setIsLoadingMore(true)
      executeFetch(pagination.current_page + 1, true)
    }
  }

  const handleCardPress = (item: ProductCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/inventory/stock/categories/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/inventory/stock/categories/new')
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Kategoriler"
        icon="folder-outline"
        subtitle={pagination ? `${pagination.total} kategori` : undefined}
        showBackButton
        onBackPress={handleBackPress}
        rightAction={{
          icon: 'add',
          onPress: handleNewPress
        }}
      />

      <View style={styles.content}>
        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <CategoryCardSkeleton />
            <CategoryCardSkeleton />
            <CategoryCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <CategoryCard
                item={item}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState />}
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

  // List
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
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
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: DashboardColors.primaryGlow,
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
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  parentName: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  cardInfo: {
    gap: DashboardSpacing.xs,
    paddingBottom: DashboardSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  infoText: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: DashboardSpacing.md
  },
  childrenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.xs,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.primaryGlow
  },
  childrenText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600',
    color: DashboardColors.primary
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
    bottom: DashboardSpacing.lg + 8
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
