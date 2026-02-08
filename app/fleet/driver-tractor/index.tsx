import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import Toast from 'react-native-toast-message'
import { PageHeader } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardBorderRadius,
  DashboardFontSizes,
  DashboardShadows,
  DashboardAnimations
} from '@/constants/dashboard-theme'
import {
  getDriverTractorAssignments,
  DriverTractorAssignment,
  DriverTractorAssignmentFilters,
  Pagination,
  deleteDriverTractorAssignment,
  toggleDriverTractorAssignment
} from '@/services/endpoints/fleet'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Skeleton Component
function AssignmentCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.sm }}>
          <Skeleton width={180} height={18} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardInfo}>
        <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="80%" height={14} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={12} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  )
}

// Card Component
interface AssignmentCardProps {
  item: DriverTractorAssignment
  onPress: () => void
  onToggle: () => void
  onDelete: () => void
}

function AssignmentCard({ item, onPress, onToggle, onDelete }: AssignmentCardProps) {
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

  const driverName = item.employee?.full_name || 'Sürücü bilgisi yok'
  const tractorPlate = item.tractor?.plate || 'Çekici bilgisi yok'

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
          <Ionicons name="person-outline" size={20} color={DashboardColors.primary} />
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>{driverName}</Text>
          <Text style={styles.cardCode}>{tractorPlate}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_active
            ? 'rgba(16, 185, 129, 0.12)'
            : 'rgba(156, 163, 175, 0.12)'
          }
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
      <View style={styles.cardInfo}>
        {item.employee?.phone_1 && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.employee.phone_1}</Text>
          </View>
        )}
        {item.tractor?.brand && (
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>
              {[item.tractor.brand, item.tractor.model].filter(Boolean).join(' ')}
            </Text>
          </View>
        )}
        {item.notes && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={14} color={DashboardColors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{item.notes}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Atanma Tarihi</Text>
          <Text style={styles.dateValue}>
            {new Date(item.assigned_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.is_active ? 'close-circle-outline' : 'checkmark-circle-outline'}
              size={20}
              color={item.is_active ? DashboardColors.warning : DashboardColors.success}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={DashboardColors.danger} />
          </TouchableOpacity>
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
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="person-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz eşleştirme yok</Text>
      <Text style={styles.emptyText}>
        Yeni sürücü-çekici eşleştirmesi eklemek için sağ üstteki + butonuna tıklayın.
      </Text>
    </View>
  )
}

export default function DriverTractorAssignmentsScreen() {
  const [refreshing, setRefreshing] = useState(false)

  // API state
  const [assignments, setAssignments] = useState<DriverTractorAssignment[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Delete dialog state
  const [itemToDelete, setItemToDelete] = useState<DriverTractorAssignment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteDialogRef = useRef<any>(null)

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

        const filters: DriverTractorAssignmentFilters = {
          page,
          per_page: 20
        }

        const response = await getDriverTractorAssignments(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setAssignments((prev) => [...prev, ...response.assignments])
          } else {
            setAssignments(response.assignments)
          }
          setPagination(response.pagination)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (__DEV__) console.error('Assignments fetch error:', err)
          setError(err instanceof Error ? err.message : 'Eşleştirmeler yüklenemedi')
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
  }, [executeFetch])

  // Ref to store executeFetch to avoid useFocusEffect re-triggering
  const executeFetchRef = useRef(executeFetch)
  useEffect(() => {
    executeFetchRef.current = executeFetch
  }, [executeFetch])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(1, false)
      }
    }, [])
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

  const handleCardPress = (item: DriverTractorAssignment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/fleet/driver-tractor/${item.id}`)
  }

  const handleNewPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/fleet/driver-tractor/new')
  }

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  const handleToggle = async (assignment: DriverTractorAssignment) => {
    try {
      await toggleDriverTractorAssignment(assignment.id)

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id ? { ...a, is_active: !a.is_active } : a
        )
      )

      Toast.show({
        type: 'success',
        text1: assignment.is_active ? 'Eşleştirme pasif edildi' : 'Eşleştirme aktif edildi',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'İşlem başarısız oldu',
        position: 'top',
        visibilityTime: 1500
      })
    }
  }

  const handleDelete = (assignment: DriverTractorAssignment) => {
    setItemToDelete(assignment)
    deleteDialogRef.current?.present()
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      await deleteDriverTractorAssignment(itemToDelete.id)
      setAssignments((prev) => prev.filter((a) => a.id !== itemToDelete.id))
      deleteDialogRef.current?.dismiss()
      setItemToDelete(null)
      Toast.show({
        type: 'success',
        text1: 'Eşleştirme başarıyla silindi',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Silme başarısız oldu',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Sürücü-Çekici Eşleştirme"
        icon="person-outline"
        subtitle={pagination ? `${pagination.total} eşleştirme` : undefined}
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
        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <AssignmentCardSkeleton />
            <AssignmentCardSkeleton />
            <AssignmentCardSkeleton />
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={64} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true)
                executeFetch(1, false)
              }}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <AssignmentCard
                item={item}
                onPress={() => handleCardPress(item)}
                onToggle={() => handleToggle(item)}
                onDelete={() => handleDelete(item)}
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

      {/* Delete Dialog */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Eşleştirmeyi Sil"
        message={
          itemToDelete
            ? `${itemToDelete.employee?.full_name || 'Sürücü'} - ${itemToDelete.tractor?.plate || 'Çekici'} eşleştirmesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : 'Bu eşleştirmeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
        }
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
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
    paddingTop: 0,
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
  cardCode: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    fontWeight: '500'
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
  },
  dateContainer: {},
  dateLabel: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textMuted,
    marginBottom: 2
  },
  dateValue: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  actions: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
    alignItems: 'center'
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DashboardColors.background,
    alignItems: 'center',
    justifyContent: 'center'
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
  },

  // Error State
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DashboardColors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DashboardSpacing.xl
  },
  errorTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
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
