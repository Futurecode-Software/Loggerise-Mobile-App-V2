/**
 * İhracat Yükleri Ekranı
 *
 * Dashboard teması ile ihracat yüklerini listeler.
 * CLAUDE.md standartlarına tam uyumlu.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
import { getLoads } from '@/services/endpoints/loads'
import type { Load, Pagination } from '@/services/endpoints/loads'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Durum renkleri
const STATUS_COLORS: Record<string, { primary: string; bg: string }> = {
  pending: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  confirmed: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  in_transit: { primary: '#227d53', bg: 'rgba(34, 125, 83, 0.12)' },
  delivered: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  completed: { primary: '#13452d', bg: 'rgba(19, 69, 45, 0.12)' },
  cancelled: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  loading: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  assigned: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  loaded: { primary: '#227d53', bg: 'rgba(34, 125, 83, 0.12)' },
  at_customs: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  in_progress: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' }
}

// Durum etiketleri
const getStatusLabel = (status?: string) => {
  if (!status) return '-'
  const labels: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    in_transit: 'Yolda',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
    completed: 'Tamamlandı',
    in_progress: 'İşlemde',
    loading: 'Yükleniyor',
    assigned: 'Atandı',
    loaded: 'Yüklendi',
    at_customs: 'Gümrükte',
    'Beklemede': 'Beklemede',
    'Hazırlanıyor': 'Hazırlanıyor',
    'Hazır': 'Hazır',
    'Yükleniyor': 'Yükleniyor',
    'Yüklendi': 'Yüklendi',
    'Yolda': 'Yolda',
    'Gümrükte': 'Gümrükte',
    'Boşaltılıyor': 'Boşaltılıyor',
    'Teslim Edildi': 'Teslim Edildi',
    'Tamamlandı': 'Tamamlandı',
    'İptal Edildi': 'İptal Edildi'
  }
  return labels[status] || status
}

// Skeleton Bileşeni
function LoadCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={120} height={18} />
          <Skeleton width={80} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width={150} height={14} />
        <Skeleton width={120} height={14} />
      </View>
    </View>
  )
}

// Yük Kartı Bileşeni
interface LoadCardProps {
  item: Load
  onPress: () => void
}

function LoadCard({ item, onPress }: LoadCardProps) {
  const scale = useSharedValue(1)
  const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.pending

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  // Yük tipi etiketi
  const getLoadTypeLabel = (type?: string) => {
    if (type === 'full') return 'Komple'
    if (type === 'partial') return 'Parsiyel'
    return '-'
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
        <View style={[styles.cardIcon, { backgroundColor: statusColors.bg }]}>
          <Ionicons name="cube-outline" size={20} color={statusColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardNumber} numberOfLines={1}>
            {item.load_number}
          </Text>
          <Text style={styles.cardCargo}>{item.cargo_name || '-'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.primary }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Bilgi Satırları */}
      <View style={styles.cardInfo}>
        {item.customer?.name && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.customer.name}
            </Text>
          </View>
        )}
        {item.declaration_no && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              Beyanname: {item.declaration_no}
            </Text>
          </View>
        )}
        {item.load_type && (
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText}>
              {getLoadTypeLabel(item.load_type)}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.directionContainer}>
          <Ionicons name="arrow-up-circle" size={14} color={DashboardColors.primary} />
          <Text style={styles.directionText}>İhracat</Text>
        </View>
        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
        </View>
      </View>

      {/* Durum Noktası */}
      <View style={[
        styles.statusDot,
        { backgroundColor: statusColors.primary }
      ]} />
    </AnimatedPressable>
  )
}

// Boş Durum Bileşeni
function EmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cube-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Sonuç bulunamadı' : 'Henüz ihracat yükü yok'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Farklı bir arama terimi deneyin'
          : 'Yeni ihracat yükü oluşturmak için + butonuna tıklayın'}
      </Text>
    </View>
  )
}

export default function ExportLoadsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [loads, setLoads] = useState<Load[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitialFetchRef = useRef(false)

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(async (search: string, page: number = 1, append: boolean = false) => {
    const currentFetchId = ++fetchIdRef.current

    try {
      setError(null)

      const response = await getLoads({
        page,
        per_page: 20,
        direction: 'export',
        is_active: true,
        assigned_to_trip: 'all',
        search: search.trim() || undefined
      })

      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        if (append) {
          setLoads((prev) => [...prev, ...response.loads])
        } else {
          setLoads(response.loads)
        }
        setPagination(response.pagination)
        hasInitialFetchRef.current = true
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        console.error('Loads fetch error:', err)
        setError(err instanceof Error ? err.message : 'Yükler yüklenemedi')
      }
    } finally {
      if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
        setRefreshing(false)
      }
    }
  }, [])

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(searchQuery, 1, false)

    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Arama debounce
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsLoading(true)
      executeFetch(searchQuery, 1, false)
    }, 500)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Focus effect için refs
  const executeFetchRef = useRef(executeFetch)
  const searchQueryRef = useRef(searchQuery)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    searchQueryRef.current = searchQuery
  }, [executeFetch, searchQuery])

  // Ekrana dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(searchQueryRef.current, 1, false)
      }
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await executeFetch(searchQuery, 1, false)
  }

  const loadMore = () => {
    if (!isLoadingMore && pagination && pagination.current_page < pagination.last_page) {
      setIsLoadingMore(true)
      executeFetch(searchQuery, pagination.current_page + 1, true)
    }
  }

  const handleLoadPress = (load: Load) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/logistics/load/${load.id}`)
  }

  const handleCreateLoad = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/logistics/load/new?direction=export')
  }

  const renderLoad = ({ item }: { item: Load }) => (
    <LoadCard item={item} onPress={() => handleLoadPress(item)} />
  )

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <LoadCardSkeleton key={i} />
      ))}
    </View>
  )

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={DashboardColors.primary} />
        <Text style={styles.footerLoaderText}>Yükleniyor...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="İhracat Yükleri"
        subtitle={pagination ? `${pagination.total} yük` : undefined}
        showBackButton
        rightButton={{
          icon: 'add',
          onPress: handleCreateLoad
        }}
      />

      <View style={styles.content}>
        {/* Arama */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={DashboardColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Yük numarası, kargo veya müşteri ara..."
              placeholderTextColor={DashboardColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Liste */}
        {isLoading && !refreshing ? (
          renderSkeleton()
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true)
                executeFetch(searchQuery, 1, false)
              }}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : loads.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <FlatList
            data={loads}
            renderItem={renderLoad}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
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

  // Arama
  searchContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingVertical: DashboardSpacing.md,
    backgroundColor: DashboardColors.background
  },
  searchInputWrapper: {
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
    color: DashboardColors.textPrimary,
    paddingVertical: 0
  },

  // Liste
  listContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing['3xl']
  },

  // Kart
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.md,
    overflow: 'visible',
    position: 'relative'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.md,
    gap: DashboardSpacing.sm
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderContent: {
    flex: 1
  },
  cardNumber: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: 2
  },
  cardCargo: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary
  },
  statusBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.full
  },
  statusText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },
  cardInfo: {
    paddingHorizontal: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.sm,
    gap: DashboardSpacing.xs
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  infoText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textSecondary,
    flex: 1
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  directionText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
  },
  cardArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusDot: {
    position: 'absolute',
    top: DashboardSpacing.md,
    right: DashboardSpacing.md,
    width: 8,
    height: 8,
    borderRadius: 4
  },

  // Skeleton
  skeletonContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },

  // Footer Loader
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.lg
  },
  footerLoaderText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  emptyTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center'
  },

  // Error State
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginTop: DashboardSpacing.md,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  errorText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    textAlign: 'center',
    marginBottom: DashboardSpacing.xl
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.danger,
    paddingHorizontal: DashboardSpacing.xl,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg
  },
  retryButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  }
})
