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
import { BottomSheetModal } from '@gorhom/bottom-sheet'
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
import { userManagementService } from '@/src/services/api/userManagementService'
import { User, UserFilters } from '@/src/types/user'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Rol renkleri
const ROLE_COLORS: Record<string, { primary: string; bg: string }> = {
  'Süper Yönetici': { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  'İK Müdürü': { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  'Lojistik Müdürü': { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  'Lojistik Operatörü': { primary: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  'Muhasebeci': { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' }
}

// Varsayılan rol rengi
const DEFAULT_ROLE_COLOR = { primary: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' }

// Skeleton Component
function UserCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={52} height={52} borderRadius={26} />
        <View style={{ flex: 1, marginLeft: DashboardSpacing.md }}>
          <Skeleton width={140} height={18} />
          <Skeleton width={180} height={14} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardRoles}>
        <Skeleton width={90} height={24} borderRadius={12} />
        <Skeleton width={110} height={24} borderRadius={12} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={36} borderRadius={8} />
        <Skeleton width={80} height={36} borderRadius={8} />
      </View>
    </View>
  )
}

// Card Component
interface UserCardProps {
  item: User
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}

function UserCard({ item, onPress, onEdit, onDelete }: UserCardProps) {
  const scale = useSharedValue(1)
  const isProtected = item.id === 1

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  function handlePressIn() {
    scale.value = withSpring(0.98, DashboardAnimations.springBouncy)
  }

  function handlePressOut() {
    scale.value = withSpring(1, DashboardAnimations.springBouncy)
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  function handleEditPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onEdit()
  }

  function handleDeletePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onDelete()
  }

  const userInitial = item.name.charAt(0).toUpperCase()
  const primaryRole = item.roles[0]
  const roleColor = primaryRole
    ? ROLE_COLORS[primaryRole.name] || DEFAULT_ROLE_COLOR
    : DEFAULT_ROLE_COLOR

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: roleColor.bg }]}>
          <Text style={[styles.avatarText, { color: roleColor.primary }]}>
            {userInitial}
          </Text>
        </View>
        <View style={styles.cardHeaderContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={12} color={DashboardColors.textMuted} />
            <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={20} color={DashboardColors.textMuted} />
        </View>
      </View>

      {/* Roles */}
      <View style={styles.cardRoles}>
        {item.roles.map((role, index) => {
          const colors = ROLE_COLORS[role.name] || DEFAULT_ROLE_COLOR
          return (
            <View key={index} style={[styles.roleBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {role.name}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Footer */}
      {!isProtected ? (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditPress}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={DashboardColors.warning} />
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeletePress}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={DashboardColors.danger} />
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardFooterProtected}>
          <View style={styles.protectedBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color={DashboardColors.success} />
            <Text style={styles.protectedText}>Korumalı Hesap</Text>
          </View>
        </View>
      )}
    </AnimatedPressable>
  )
}

// Empty State
function EmptyState({ onCreatePress }: { onCreatePress: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={64} color={DashboardColors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Henüz kullanıcı yok</Text>
      <Text style={styles.emptyText}>
        Yeni kullanıcı eklemek için aşağıdaki butona tıklayın.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onCreatePress}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Kullanıcı Ekle</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function UsersScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // API state
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)
  const [userLimits, setUserLimits] = useState<{
    max_users: number | null
    current_users: number
    can_add_more: boolean
  } | null>(null)

  // Delete dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const hasInitialFetchRef = useRef(false)
  const confirmDialogRef = useRef<BottomSheetModal>(null)

  // Search debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Veri çekme fonksiyonu
  const executeFetch = useCallback(
    async (page: number = 1, append: boolean = false, search: string = '') => {
      const currentFetchId = ++fetchIdRef.current

      try {
        const filters: UserFilters = {
          page,
          per_page: 20
        }

        if (search) {
          filters.search = search
        }

        const response = await userManagementService.getUsers(filters)

        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          if (append) {
            setUsers((prev) => [...prev, ...response.data])
          } else {
            setUsers(response.data)
          }
          setCurrentPage(response.current_page)
          setHasMorePages(response.current_page < response.last_page)
          setTotalUsers(response.total)
          hasInitialFetchRef.current = true
        }
      } catch (err) {
        if (currentFetchId === fetchIdRef.current && isMountedRef.current) {
          console.error('Users fetch error:', err)
          Toast.show({
            type: 'error',
            text1: 'Hata',
            text2: 'Kullanıcılar yüklenemedi',
            position: 'top',
            visibilityTime: 1500
          })
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

  // Limitleri çek
  const fetchLimits = useCallback(async () => {
    try {
      const limits = await userManagementService.getUserLimits()
      if (isMountedRef.current) {
        setUserLimits(limits)
      }
    } catch (err) {
      console.error('User limits fetch error:', err)
    }
  }, [])

  // İlk yükleme
  useEffect(() => {
    isMountedRef.current = true
    executeFetch(1, false, '')
    fetchLimits()

    return () => {
      isMountedRef.current = false
    }
  }, [executeFetch, fetchLimits])

  // Search değişimi
  useEffect(() => {
    if (!hasInitialFetchRef.current) return

    setIsLoading(true)
    executeFetch(1, false, debouncedSearch)
  }, [debouncedSearch, executeFetch])

  // Ref for useFocusEffect
  const executeFetchRef = useRef(executeFetch)
  const debouncedSearchRef = useRef(debouncedSearch)
  useEffect(() => {
    executeFetchRef.current = executeFetch
    debouncedSearchRef.current = debouncedSearch
  }, [executeFetch, debouncedSearch])

  // Ekran focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetchRef.current) {
        executeFetchRef.current(1, false, debouncedSearchRef.current)
        fetchLimits()
      }
    }, [fetchLimits])
  )

  function handleRefresh() {
    setRefreshing(true)
    executeFetch(1, false, debouncedSearch)
    fetchLimits()
  }

  function handleLoadMore() {
    if (!isLoadingMore && hasMorePages) {
      setIsLoadingMore(true)
      executeFetch(currentPage + 1, true, debouncedSearch)
    }
  }

  function handleCardPress(item: User) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/settings/users/${item.id}`)
  }

  function handleEditPress(item: User) {
    router.push(`/settings/users/${item.id}/edit`)
  }

  function handleDeletePress(item: User) {
    if (item.id === 1) {
      Toast.show({
        type: 'error',
        text1: 'Uyarı',
        text2: 'İlk kullanıcı silinemez',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }
    setUserToDelete(item)
    setDeleteDialogVisible(true)
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      await userManagementService.deleteUser(userToDelete.id)
      setDeleteDialogVisible(false)
      setUserToDelete(null)
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Kullanıcı silindi',
        position: 'top',
        visibilityTime: 1500
      })
      executeFetch(1, false, debouncedSearch)
      fetchLimits()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error?.response?.data?.message || 'Kullanıcı silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function handleDeleteCancel() {
    setDeleteDialogVisible(false)
    setUserToDelete(null)
  }

  function handleNewPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (userLimits && !userLimits.can_add_more) {
      Toast.show({
        type: 'error',
        text1: 'Limit Aşıldı',
        text2: `Paketiniz ${userLimits.max_users} kullanıcıya izin veriyor`,
        position: 'top',
        visibilityTime: 2000
      })
      return
    }
    router.push('/settings/users/new')
  }

  function handleInvitationsPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/settings/users/invitations')
  }

  function handleBackPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  function handleClearSearch() {
    setSearchQuery('')
  }

  // Subtitle
  function getSubtitle(): string {
    if (userLimits && userLimits.max_users !== null) {
      return `${userLimits.current_users} / ${userLimits.max_users} kullanıcı`
    }
    return `${totalUsers} kullanıcı`
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Kullanıcılar"
        icon="people-outline"
        subtitle={getSubtitle()}
        showBackButton
        onBackPress={handleBackPress}
        rightActions={[
          {
            icon: 'mail-outline',
            onPress: handleInvitationsPress
          },
          {
            icon: 'add',
            onPress: handleNewPress,
            disabled: userLimits ? !userLimits.can_add_more : false
          }
        ]}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={DashboardColors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Kullanıcı ara... (ad, e-posta)"
              placeholderTextColor={DashboardColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color={DashboardColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.listContent}>
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <UserCard
                item={item}
                onPress={() => handleCardPress(item)}
                onEdit={() => handleEditPress(item)}
                onDelete={() => handleDeletePress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState onCreatePress={handleNewPress} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={DashboardColors.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        ref={confirmDialogRef}
        visible={deleteDialogVisible}
        title="Kullanıcıyı Sil"
        message={userToDelete ? `${userToDelete.name} adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.` : ''}
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
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

  // Search
  searchSection: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    paddingBottom: DashboardSpacing.sm
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.lg,
    paddingHorizontal: DashboardSpacing.md,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  searchIcon: {
    marginRight: DashboardSpacing.sm
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textPrimary
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
    ...DashboardShadows.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DashboardSpacing.md
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700'
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: DashboardSpacing.md,
    marginRight: DashboardSpacing.sm
  },
  cardName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: DashboardColors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 4
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs
  },
  cardEmail: {
    flex: 1,
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textMuted
  },
  cardArrow: {
    padding: DashboardSpacing.xs
  },

  // Roles
  cardRoles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.md
  },
  roleBadge: {
    paddingHorizontal: DashboardSpacing.sm,
    paddingVertical: 4,
    borderRadius: DashboardBorderRadius.md
  },
  roleText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    gap: DashboardSpacing.sm,
    paddingTop: DashboardSpacing.md,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.warningBg,
    gap: DashboardSpacing.xs
  },
  editButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.warning
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.dangerBg,
    gap: DashboardSpacing.xs
  },
  deleteButtonText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.danger
  },
  cardFooterProtected: {
    paddingTop: DashboardSpacing.md,
    borderTopWidth: 1,
    borderTopColor: DashboardColors.borderLight
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.md,
    backgroundColor: DashboardColors.successBg,
    gap: DashboardSpacing.xs
  },
  protectedText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.success
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
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: DashboardFontSizes.md,
    color: DashboardColors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DashboardSpacing.xl
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DashboardColors.primary,
    paddingVertical: DashboardSpacing.md,
    paddingHorizontal: DashboardSpacing.xl,
    borderRadius: DashboardBorderRadius.lg,
    gap: DashboardSpacing.sm
  },
  emptyButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#FFFFFF'
  }
})
