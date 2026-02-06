import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Toast from 'react-native-toast-message'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { Input } from '@/components/ui'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius,
  DashboardShadows
} from '@/constants/dashboard-theme'
import {
  getCustomerInteraction,
  updateInteraction,
  deleteInteraction,
  completeInteraction,
  cancelInteraction,
  InteractionFormData,
  InteractionType,
  getInteractionTypeLabel,
  getInteractionStatusLabel
} from '@/services/endpoints/customer-interactions'

const INTERACTION_TYPES = [
  { value: 'meeting', label: 'Toplantı', icon: 'people-outline' },
  { value: 'call', label: 'Arama', icon: 'call-outline' },
  { value: 'email', label: 'E-posta', icon: 'mail-outline' },
  { value: 'follow_up', label: 'Takip', icon: 'time-outline' },
] as const

export default function InteractionDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id, interactionId } = useLocalSearchParams<{ id: string; interactionId: string }>()
  const customerId = parseInt(id, 10)
  const interactionIdNum = parseInt(interactionId, 10)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<InteractionFormData>({
    interaction_type: 'meeting',
    subject: '',
    description: '',
    interaction_date: '',
    next_followup_date: '',
    status: 'pending',
  })

  const [originalData, setOriginalData] = useState<InteractionFormData | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Refs
  const isMountedRef = useRef(true)
  const completeDialogRef = useRef<any>(null)
  const cancelDialogRef = useRef<any>(null)
  const deleteDialogRef = useRef<any>(null)

  // Veri çekme
  const fetchInteraction = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }

      const interaction = await getCustomerInteraction(customerId, interactionIdNum)

      if (isMountedRef.current) {
        const data: InteractionFormData = {
          interaction_type: interaction.interaction_type,
          subject: interaction.subject,
          description: interaction.description || '',
          interaction_date: interaction.interaction_date
            ? new Date(interaction.interaction_date).toISOString().split('T')[0]
            : '',
          next_followup_date: interaction.next_followup_date
            ? new Date(interaction.next_followup_date).toISOString().split('T')[0]
            : '',
          status: interaction.status,
        }

        setFormData(data)
        setOriginalData(data)
        setError(null)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Görüşme bilgileri yüklenemedi')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [customerId, interactionIdNum])

  useEffect(() => {
    isMountedRef.current = true
    fetchInteraction()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchInteraction])

  // Edit sayfasından dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      fetchInteraction(false)
    }, [fetchInteraction])
  )

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.subject?.trim()) {
      newErrors.subject = 'Konu zorunludur'
    }

    if (!formData.interaction_date) {
      newErrors.interaction_date = 'Görüşme tarihi zorunludur'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdate = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen formu eksiksiz doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    setIsSubmitting(true)
    try {
      await updateInteraction(customerId, interactionIdNum, formData)
      Toast.show({
        type: 'success',
        text1: 'Görüşme başarıyla güncellendi',
        position: 'top',
        visibilityTime: 1500
      })
      setIsEditing(false)
      setOriginalData(formData)
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Görüşme güncellenemedi',
        position: 'top',
        visibilityTime: 1500
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show complete dialog
  const handleComplete = () => {
    completeDialogRef.current?.present()
  }

  // Confirm complete
  const confirmComplete = async () => {
    try {
      const updated = await completeInteraction(customerId, interactionIdNum)
      setFormData((prev) => ({ ...prev, status: updated.status }))
      setOriginalData((prev) => (prev ? { ...prev, status: updated.status } : null))
      completeDialogRef.current?.dismiss()
      Toast.show({
        type: 'success',
        text1: 'Görüşme tamamlandı olarak işaretlendi',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'İşlem başarısız',
        position: 'top',
        visibilityTime: 1500
      })
    }
  }

  // Show cancel dialog
  const handleCancelInteraction = () => {
    cancelDialogRef.current?.present()
  }

  // Confirm cancel interaction
  const confirmCancelInteraction = async () => {
    try {
      const updated = await cancelInteraction(customerId, interactionIdNum)
      setFormData((prev) => ({ ...prev, status: updated.status }))
      setOriginalData((prev) => (prev ? { ...prev, status: updated.status } : null))
      cancelDialogRef.current?.dismiss()
      Toast.show({
        type: 'success',
        text1: 'Görüşme iptal edildi',
        position: 'top',
        visibilityTime: 1500
      })
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'İşlem başarısız',
        position: 'top',
        visibilityTime: 1500
      })
    }
  }

  // Show delete dialog
  const handleDelete = () => {
    deleteDialogRef.current?.present()
  }

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await deleteInteraction(customerId, interactionIdNum)
      deleteDialogRef.current?.dismiss()
      Toast.show({
        type: 'success',
        text1: 'Görüşme silindi',
        position: 'top',
        visibilityTime: 1500
      })

      setTimeout(() => {
        router.back()
      }, 300)
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err instanceof Error ? err.message : 'Görüşme silinemedi',
        position: 'top',
        visibilityTime: 1500
      })
    }
  }

  const cancelEdit = () => {
    if (originalData) {
      setFormData(originalData)
    }
    setIsEditing(false)
    setErrors({})
  }

  // Loading state
  if (isLoading) {
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
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>Görüşme Detayı</Text>
              </View>
              <View style={styles.headerActionsPlaceholder} />
            </View>
          </View>

          <View style={styles.bottomCurve} />
        </View>

        <View style={styles.content}>
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={DashboardColors.primary} />
            <Text style={styles.loadingText}>Görüşme yükleniyor...</Text>
          </View>
        </View>
      </View>
    )
  }

  // Error state
  if (error) {
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
            <View style={styles.headerBar}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitleSection}>
                <Text style={styles.headerName} numberOfLines={1}>Görüşme Detayı</Text>
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
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchInteraction()}>
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
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerTitleSection}>
              <Text style={styles.headerName} numberOfLines={1}>
                {formData.subject || 'Görüşme Detayı'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.headerButton} onPress={() => setIsEditing(true)}>
                    <Ionicons name="create-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.headerButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomCurve} />
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        {/* Status Actions (only if not editing) */}
        {!isEditing && formData.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButtonSuccess}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={DashboardColors.success} />
              <Text style={styles.actionButtonTextSuccess}>Tamamla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonDanger}
              onPress={handleCancelInteraction}
            >
              <Ionicons name="close-circle-outline" size={20} color={DashboardColors.danger} />
              <Text style={styles.actionButtonTextDanger}>İptal Et</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Görüşme Tipi */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="apps-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Görüşme Tipi</Text>
          </View>

          <View style={styles.cardContent}>
            {isEditing ? (
              <View style={styles.typeGrid}>
                {INTERACTION_TYPES.map((type) => {
                  const isActive = formData.interaction_type === type.value

                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeCard,
                        isActive && styles.typeCardActive
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          interaction_type: type.value as InteractionType,
                        })
                      }
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={24}
                        color={isActive ? DashboardColors.primary : DashboardColors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeLabel,
                          isActive && styles.typeLabelActive
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ) : (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{getInteractionTypeLabel(formData.interaction_type)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Görüşme Detayları */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="document-text-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Görüşme Detayları</Text>
          </View>

          <View style={styles.cardContent}>
            <Input
              label="Konu *"
              placeholder="Görüşme konusu"
              value={formData.subject}
              onChangeText={(value) => setFormData({ ...formData, subject: value })}
              error={errors.subject}
              editable={isEditing}
            />

            <Input
              label="Açıklama"
              placeholder="Görüşme notları..."
              value={formData.description}
              onChangeText={(value) => setFormData({ ...formData, description: value })}
              multiline
              numberOfLines={4}
              editable={isEditing}
            />
          </View>
        </View>

        {/* Tarihler */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="calendar-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Tarihler</Text>
          </View>

          <View style={styles.cardContent}>
            <Input
              label="Görüşme Tarihi *"
              placeholder="YYYY-MM-DD"
              value={formData.interaction_date}
              onChangeText={(value) => setFormData({ ...formData, interaction_date: value })}
              error={errors.interaction_date}
              editable={isEditing}
            />

            <Input
              label="Sonraki Takip Tarihi"
              placeholder="YYYY-MM-DD"
              value={formData.next_followup_date}
              onChangeText={(value) => setFormData({ ...formData, next_followup_date: value })}
              editable={isEditing}
            />
          </View>
        </View>

        {/* Durum */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="flag-outline" size={18} color={DashboardColors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Durum</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {getInteractionStatusLabel(formData.status || 'pending')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelEdit}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleUpdate}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Alt boşluk */}
        <View style={{ height: insets.bottom + DashboardSpacing['3xl'] }} />
      </KeyboardAwareScrollView>

      {/* Complete Dialog */}
      <ConfirmDialog
        ref={completeDialogRef}
        title="Görüşmeyi Tamamla"
        message="Bu görüşmeyi tamamlandı olarak işaretlemek istiyor musunuz?"
        type="success"
        confirmText="Tamamla"
        cancelText="İptal"
        onConfirm={confirmComplete}
      />

      {/* Cancel Interaction Dialog */}
      <ConfirmDialog
        ref={cancelDialogRef}
        title="Görüşmeyi İptal Et"
        message="Bu görüşmeyi iptal etmek istiyor musunuz?"
        type="danger"
        confirmText="İptal Et"
        cancelText="Hayır"
        onConfirm={confirmCancelInteraction}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        ref={deleteDialogRef}
        title="Görüşmeyi Sil"
        message="Bu görüşmeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        type="danger"
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={confirmDelete}
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
    paddingBottom: 24
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
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)'
  },
  headerName: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flex: 1
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
    gap: DashboardSpacing.md
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  actionButtonSuccess: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.1)'
  },
  actionButtonTextSuccess: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.success
  },
  actionButtonDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DashboardSpacing.sm,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  actionButtonTextDanger: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.danger
  },

  // Kartlar
  card: {
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.xl,
    ...DashboardShadows.sm
  },
  cardContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingBottom: DashboardSpacing.lg,
    gap: DashboardSpacing.md
  },

  // Bölüm Başlığı
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DashboardSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: DashboardColors.borderLight,
    gap: DashboardSpacing.sm
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: {
    fontSize: DashboardFontSizes.lg,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },

  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DashboardSpacing.md
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: DashboardSpacing.lg,
    paddingHorizontal: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    borderWidth: 2,
    borderColor: DashboardColors.borderLight,
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    backgroundColor: DashboardColors.background
  },
  typeCardActive: {
    borderColor: DashboardColors.primary,
    backgroundColor: DashboardColors.primaryGlow
  },
  typeLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  typeLabelActive: {
    color: DashboardColors.primary
  },

  // Badge
  badgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: DashboardSpacing.md,
    paddingVertical: DashboardSpacing.sm,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: DashboardColors.primaryGlow
  },
  badgeText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '600',
    color: DashboardColors.primary
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: DashboardSpacing.md
  },
  cancelButton: {
    flex: 1,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textSecondary
  },
  submitButton: {
    flex: 1,
    paddingVertical: DashboardSpacing.md,
    borderRadius: DashboardBorderRadius.lg,
    backgroundColor: DashboardColors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.5
  },
  submitButtonText: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: '#fff'
  },

  // Loading
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DashboardSpacing['2xl'],
    paddingVertical: DashboardSpacing['3xl']
  },
  loadingText: {
    fontSize: DashboardFontSizes.base,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.md
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
