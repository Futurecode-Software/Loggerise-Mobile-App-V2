/**
 * Kullanıcı Detay Sayfası
 *
 * Bank detay sayfası pattern'ine uygun
 * SectionHeader ve InfoRow component'leri kullanır
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader, InfoRow } from '@/components/detail'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { userManagementService } from '@/src/services/api/userManagementService'
import { User } from '@/src/types/user'

// Rol renkleri (index.tsx ile aynı)
const ROLE_COLORS: Record<string, { primary: string; bg: string }> = {
  'Süper Yönetici': { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  'İK Müdürü': { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  'Lojistik Müdürü': { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  'Lojistik Operatörü': { primary: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  'Muhasebeci': { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' }
}

const DEFAULT_ROLE_COLOR = { primary: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' }

// Tarih formatlama
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const userId = id ? parseInt(id, 10) : null

  // State
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  const isProtected = user?.id === 1

  // Veri çekme
  const fetchUser = useCallback(async (showLoading = true) => {
    if (!userId) {
      setError('Geçersiz kullanıcı ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await userManagementService.getUser(userId)

      if (isMountedRef.current) {
        setUser(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Kullanıcı bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [userId])

  useEffect(() => {
    isMountedRef.current = true
    fetchUser()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchUser])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchUser(false)
    }, [fetchUser])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchUser(false)
  }, [fetchUser])

  // Düzenleme
  const handleEdit = () => {
    if (!userId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/settings/users/${userId}/edit`)
  }

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!userId) return

    setIsDeleting(true)
    try {
      await userManagementService.deleteUser(userId)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Kullanıcı başarıyla silindi',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => {
        router.back()
      }, 300)
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Kullanıcı silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Geri
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.back()
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          {/* Üst Bar: Geri + Başlık + Aksiyonlar */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Başlık - Orta */}
            {isLoading ? (
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
            ) : user ? (
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {user.name}
                </Text>
              </View>
            ) : (
              <View style={styles.headerTitleSection} />
            )}

            {/* Aksiyonlar - Sağ (id=1 ise gizle) */}
            {!isLoading && user && !isProtected ? (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteButtonStyle]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            ) : !isLoading && user && isProtected ? (
              <View style={styles.headerActionsPlaceholder}>
                <View style={styles.protectedBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={DashboardColors.success} />
                </View>
              </View>
            ) : (
              <View style={styles.headerActionsPlaceholder} />
            )}
          </View>

          {/* E-posta + Roller Özeti */}
          {isLoading ? (
            <View style={styles.summarySection}>
              <Skeleton width={200} height={14} style={{ marginBottom: DashboardSpacing.sm }} />
              <View style={styles.roleBadgeRow}>
                <Skeleton width={100} height={28} borderRadius={14} />
                <Skeleton width={80} height={28} borderRadius={14} />
              </View>
            </View>
          ) : user ? (
            <View style={styles.summarySection}>
              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.emailText} numberOfLines={1}>{user.email}</Text>
              </View>
              {user.roles.length > 0 && (
                <View style={styles.roleBadgeRow}>
                  {user.roles.map((role, index) => {
                    const colors = ROLE_COLORS[role.name] || DEFAULT_ROLE_COLOR
                    return (
                      <View
                        key={index}
                        style={[styles.headerRoleBadge, { backgroundColor: `${colors.primary}30` }]}
                      >
                        <Text style={[styles.headerRoleText, { color: colors.primary }]}>
                          {role.name}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* İçerik */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DashboardColors.primary}
          />
        }
      >
        {/* Loading */}
        {isLoading && (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.card}>
                <View style={styles.skeletonHeader}>
                  <Skeleton width={140} height={20} />
                </View>
                <View style={styles.cardContent}>
                  <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="60%" height={16} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Hata */}
        {!isLoading && (error || !user) && (
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Kullanıcı bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchUser()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal içerik */}
        {!isLoading && user && (
          <>
            {/* Kullanıcı Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Kullanıcı Bilgileri" icon="person-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Ad Soyad"
                  value={user.name}
                  icon="text-outline"
                  highlight
                />
                <InfoRow
                  label="E-posta"
                  value={user.email}
                  icon="mail-outline"
                />
              </View>
            </View>

            {/* Roller */}
            {user.roles.length > 0 && (
              <View style={styles.card}>
                <SectionHeader
                  title="Roller"
                  icon="shield-outline"
                  count={user.roles.length}
                />
                <View style={styles.cardContent}>
                  <View style={styles.rolesContainer}>
                    {user.roles.map((role, index) => {
                      const colors = ROLE_COLORS[role.name] || DEFAULT_ROLE_COLOR
                      return (
                        <View
                          key={index}
                          style={[styles.roleBadge, { backgroundColor: colors.bg }]}
                        >
                          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
                          <Text style={[styles.roleText, { color: colors.primary }]}>
                            {role.name}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Sistem Bilgileri */}
            <View style={styles.card}>
              <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
              <View style={styles.cardContent}>
                <InfoRow
                  label="Oluşturulma"
                  value={formatDate(user.created_at)}
                  icon="add-circle-outline"
                />
                <InfoRow
                  label="Son Güncelleme"
                  value={formatDate(user.updated_at)}
                  icon="refresh-outline"
                />
              </View>
            </View>

            {/* Alt boşluk */}
            <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
          </>
        )}
      </ScrollView>

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Kullanıcıyı Sil"
        message={user ? `${user.name} adlı kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.` : ''}
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

  // Header
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 32
  },
  glowOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 30,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    marginBottom: DashboardSpacing.md
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    marginHorizontal: DashboardSpacing.md
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm
  },
  headerActionsPlaceholder: {
    width: 96
  },
  deleteButtonStyle: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1
  },
  protectedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end'
  },

  // Header summary
  summarySection: {
    marginTop: DashboardSpacing.sm
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.xs,
    marginBottom: DashboardSpacing.sm
  },
  emailText: {
    fontSize: DashboardFontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1
  },
  roleBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.xs
  },
  headerRoleBadge: {
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: 6,
    borderRadius: DashboardBorderRadius.full
  },
  headerRoleText: {
    fontSize: DashboardFontSizes.xs,
    fontWeight: '600'
  },

  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: DashboardColors.background,
    borderTopLeftRadius: DashboardBorderRadius['2xl'],
    borderTopRightRadius: DashboardBorderRadius['2xl']
  },

  // İçerik
  content: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  contentContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: 0
  },

  // Kartlar
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.md,
    ...DashboardShadows.sm
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg
  },

  // Roller
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.lg,
    gap: DashboardSpacing.xs
  },
  roleText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600'
  },

  // Skeleton
  skeletonContainer: {
    gap: DashboardSpacing.md
  },
  skeletonHeader: {
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight
  },

  // Hata durumu
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
