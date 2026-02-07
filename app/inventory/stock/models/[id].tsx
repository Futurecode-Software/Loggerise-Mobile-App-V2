/**
 * Model Detail Screen
 *
 * View and edit product model details.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import {
  getProductModel,
  updateProductModel,
  deleteProductModel,
  ProductModel,
  ModelFormData,
} from '@/services/endpoints/products'
import { getErrorMessage, getValidationErrors } from '@/services/api'
import { formatDate } from '@/utils/date'
import { SectionHeader } from '@/components/detail/SectionHeader'
import { InfoRow } from '@/components/detail/InfoRow'

export default function ModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()

  const [model, setModel] = useState<ProductModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Refs
  const isMountedRef = useRef(true)
  const deleteDialogRef = useRef<BottomSheetModal>(null)

  // Animasyonlu orb'lar için shared values (edit modunda)
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  // Form state
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    description: '',
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Edit modunda animasyonlar, detay modunda statik
  useEffect(() => {
    if (isEditing) {
      orb1TranslateY.value = withRepeat(
        withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
      orb1Scale.value = withRepeat(
        withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
      orb2TranslateX.value = withRepeat(
        withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
      orb2Scale.value = withRepeat(
        withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const orb1AnimatedStyle = useAnimatedStyle(() => ({
    transform: isEditing ? [
      { translateY: orb1TranslateY.value },
      { scale: orb1Scale.value }
    ] : []
  }))

  const orb2AnimatedStyle = useAnimatedStyle(() => ({
    transform: isEditing ? [
      { translateX: orb2TranslateX.value },
      { scale: orb2Scale.value }
    ] : []
  }))

  // Veri çekme
  const fetchModel = useCallback(async (showLoading = true) => {
    if (!id) {
      setError('Geçersiz model ID')
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const data = await getProductModel(Number(id))

      if (isMountedRef.current) {
        setModel(data)
        setFormData({
          name: data.name,
          description: data.description || '',
          is_active: data.is_active,
        })
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Model yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setRefreshing(false)
      }
    }
  }, [id])

  useEffect(() => {
    isMountedRef.current = true
    fetchModel()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchModel])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchModel(false)
    }, [fetchModel])
  )

  // Yenileme
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchModel(false)
  }, [fetchModel])

  // Handle input change
  const handleInputChange = useCallback((field: keyof ModelFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (formErrors[field]) {
      setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [formErrors])

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Model adı zorunludur.'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !model) return

    setIsSubmitting(true)
    try {
      const updated = await updateProductModel(model.id, formData)
      setModel(updated)
      setIsEditing(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Model güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (error: any) {
      const validationErrors = getValidationErrors(error)
      if (validationErrors) {
        const flatErrors: Record<string, string> = {}
        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            flatErrors[field] = messages[0]
          }
        })
        setFormErrors(flatErrors)
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Toast.show({
          type: 'error',
          text1: getErrorMessage(error),
          position: 'top',
          visibilityTime: 1500
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, model])

  // Düzenleme
  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsEditing(true)
  }

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    if (model) {
      setFormData({
        name: model.name,
        description: model.description || '',
        is_active: model.is_active,
      })
    }
    setFormErrors({})
    setIsEditing(false)
  }, [model])

  // Silme dialogunu aç
  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    deleteDialogRef.current?.present()
  }

  // Silme işlemini gerçekleştir
  const confirmDelete = async () => {
    if (!model) return

    setIsDeleting(true)
    try {
      await deleteProductModel(model.id)
      deleteDialogRef.current?.dismiss()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Model başarıyla silindi',
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
        text1: err instanceof Error ? err.message : 'Model silinemedi',
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
    if (isEditing) {
      handleCancelEdit()
    } else {
      router.back()
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
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
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Skeleton width={140} height={22} />
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.content}>
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.card}>
                <View style={styles.sectionHeader}>
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
        </View>
      </View>
    )
  }

  if (error || !model) {
    return (
      <View style={styles.container}>
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
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerTitle}>Model Detayı</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.content}>
          <View style={styles.errorState}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={48} color={DashboardColors.danger} />
            </View>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error || 'Model bulunamadı'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchModel()}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
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
        <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
        <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleSection}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {isEditing ? 'Modeli Düzenle' : model.name}
              </Text>
            </View>

            {!isEditing ? (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteButton]}
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
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="checkmark" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Status Badge */}
          {!isEditing && (
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: model.is_active
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)'
                  }
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: model.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: model.is_active
                      ? DashboardColors.success
                      : DashboardColors.danger
                    }
                  ]}
                >
                  {model.is_active ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomCurve} />
      </View>

      {/* İçerik */}
      {isEditing ? (
        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          bottomOffset={20}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="layers-outline" size={18} color={DashboardColors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Model Bilgileri</Text>
            </View>

            <View style={styles.sectionContent}>
              <Input
                label="Model Adı *"
                placeholder="Örn: iPhone 15 Pro"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                error={formErrors.name}
              />

              <Input
                label="Açıklama"
                placeholder="Opsiyonel"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                error={formErrors.description}
                multiline
                numberOfLines={3}
              />

              <ToggleSwitch
                label="Aktif Model"
                description="Bu model kullanıma açık olacak"
                value={formData.is_active}
                onValueChange={(value) => handleInputChange('is_active', value)}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      ) : (
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
          {/* Model Bilgileri */}
          <View style={styles.card}>
            <SectionHeader title="Model Bilgileri" icon="layers-outline" />
            <View style={styles.cardContent}>
              <InfoRow
                label="Model Adı"
                value={model.name}
                icon="text-outline"
                highlight
              />
              {model.description && (
                <InfoRow
                  label="Açıklama"
                  value={model.description}
                  icon="document-text-outline"
                />
              )}
            </View>
          </View>

          {/* Sistem Bilgileri */}
          <View style={styles.card}>
            <SectionHeader title="Sistem Bilgileri" icon="time-outline" />
            <View style={styles.cardContent}>
              <InfoRow
                label="Oluşturulma"
                value={formatDate(model.created_at)}
                icon="add-circle-outline"
              />
              <InfoRow
                label="Son Güncelleme"
                value={formatDate(model.updated_at)}
                icon="refresh-outline"
              />
              <InfoRow
                label="Durum"
                value={model.is_active ? 'Aktif' : 'Pasif'}
                icon={model.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
              />
            </View>
          </View>

          <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
        </ScrollView>
      )}

      {/* Silme Onay Dialogu */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Modeli Sil"
        message={`"${model?.name}" modelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
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
    minHeight: 70
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
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center'
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.5
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: DashboardSpacing.md
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusBadgeText: {
    fontSize: DashboardFontSizes.sm,
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
    paddingTop: 0,
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

  // Edit Section
  section: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    marginBottom: DashboardSpacing.lg,
    overflow: 'hidden'
  },
  sectionContent: {
    padding: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },

  // Skeleton
  skeletonContainer: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    gap: DashboardSpacing.md
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
