/**
 * Yeni Mobil Bildirim Oluşturma Sayfası
 *
 * Backend'e notification broadcast kaydı oluşturur
 * Target selection, scheduling, deep link özellikleri
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Switch
} from 'react-native'
import { router } from 'expo-router'
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
import Toast from 'react-native-toast-message'
import * as Haptics from 'expo-haptics'
import {
  DashboardColors,
  DashboardSpacing,
  DashboardFontSizes,
  DashboardBorderRadius
} from '@/constants/dashboard-theme'
import { Input } from '@/components/ui'
import { SelectInput } from '@/components/ui/select-input'
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select'
import {
  createBroadcast,
  BroadcastCreateData,
  TargetType,
  getUsers,
  getRoles,
  getRoutes,
  User,
  Role,
  Route
} from '@/services/endpoints/notification-broadcasts'
import { getErrorMessage } from '@/services/api'

// Target type seçenekleri
const TARGET_TYPE_OPTIONS = [
  { label: 'Tüm Kullanıcılar', value: 'all' },
  { label: 'Belirli Kullanıcılar', value: 'specific_users' },
  { label: 'Rol Bazlı', value: 'role' }
]

export default function NewNotificationBroadcastScreen() {
  const insets = useSafeAreaInsets()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Animasyonlu orb'lar için shared values
  const orb1TranslateY = useSharedValue(0)
  const orb2TranslateX = useSharedValue(0)
  const orb1Scale = useSharedValue(1)
  const orb2Scale = useSharedValue(1)

  useEffect(() => {
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
  }, [])

  const orb1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: orb1TranslateY.value },
      { scale: orb1Scale.value }
    ]
  }))

  const orb2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2TranslateX.value },
      { scale: orb2Scale.value }
    ]
  }))

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_type: 'all' as TargetType,
    target_user_ids: [] as number[],
    target_role: null as string | null,
    deep_link_route: null as string | null,
    is_scheduled: false,
    scheduled_at: null as string | null
  })

  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Input değişiklik handler'ı
  const handleInputChange = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Bu alan için hatayı temizle
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Target type değiştiğinde ilgili alanları temizle
  useEffect(() => {
    if (formData.target_type === 'all') {
      setFormData(prev => ({
        ...prev,
        target_user_ids: [],
        target_role: null
      }))
      setSelectedUsers([])
      setSelectedRole(null)
    } else if (formData.target_type === 'specific_users') {
      setFormData(prev => ({ ...prev, target_role: null }))
      setSelectedRole(null)
    } else if (formData.target_type === 'role') {
      setFormData(prev => ({ ...prev, target_user_ids: [] }))
      setSelectedUsers([])
    }
  }, [formData.target_type])

  // Kullanıcı yükleme (async search)
  const loadUsers = useCallback(async (searchQuery: string): Promise<SearchableSelectOption[]> => {
    try {
      const users = await getUsers(searchQuery)
      return users.map(user => ({
        label: user.name,
        value: user.id,
        subtitle: user.email
      }))
    } catch (err: any) {
      console.error('Kullanıcılar yüklenirken hata:', err)
      return []
    }
  }, [])

  // Rol yükleme
  const loadRoles = useCallback(async (): Promise<SearchableSelectOption[]> => {
    try {
      const roles = await getRoles()
      return roles.map(role => ({
        label: role.name,
        value: role.id
      }))
    } catch (err: any) {
      console.error('Roller yüklenirken hata:', err)
      return []
    }
  }, [])

  // Route yükleme
  const loadRoutes = useCallback(async (): Promise<SearchableSelectOption[]> => {
    try {
      const routes = await getRoutes()
      return routes.map(route => ({
        label: route.label,
        value: route.route
      }))
    } catch (err: any) {
      console.error('Route\'lar yüklenirken hata:', err)
      return []
    }
  }, [])

  // Kullanıcı ekleme
  const handleUserAdd = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    try {
      const users = await getUsers(searchQuery)
      if (users.length > 0) {
        const newUser = users[0]
        if (!selectedUsers.find(u => u.id === newUser.id)) {
          const updatedUsers = [...selectedUsers, newUser]
          setSelectedUsers(updatedUsers)
          setFormData(prev => ({
            ...prev,
            target_user_ids: updatedUsers.map(u => u.id)
          }))
        }
      }
    } catch (err: any) {
      console.error('Kullanıcı eklenirken hata:', err)
    }
  }, [selectedUsers])

  // Kullanıcı kaldırma
  const handleUserRemove = useCallback((userId: number) => {
    const updatedUsers = selectedUsers.filter(u => u.id !== userId)
    setSelectedUsers(updatedUsers)
    setFormData(prev => ({
      ...prev,
      target_user_ids: updatedUsers.map(u => u.id)
    }))
  }, [selectedUsers])

  // Rol seçimi
  const handleRoleChange = useCallback((roleId: string | number | null) => {
    setFormData(prev => ({ ...prev, target_role: roleId as string | null }))
  }, [])

  // Route seçimi
  const handleRouteChange = useCallback((routePath: string | number | null) => {
    setFormData(prev => ({ ...prev, deep_link_route: routePath as string | null }))
  }, [])

  // Form doğrulama
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'Başlık zorunludur'
    }
    if (!formData.message?.trim()) {
      newErrors.message = 'Mesaj zorunludur'
    }
    if (formData.target_type === 'specific_users' && formData.target_user_ids.length === 0) {
      newErrors.target_user_ids = 'En az bir kullanıcı seçmelisiniz'
    }
    if (formData.target_type === 'role' && !formData.target_role) {
      newErrors.target_role = 'Rol seçmelisiniz'
    }
    if (formData.is_scheduled && !formData.scheduled_at) {
      newErrors.scheduled_at = 'Zamanlı gönderim için tarih seçmelisiniz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Geri butonu
  const handleBack = useCallback(() => {
    router.back()
  }, [])

  // Form gönderimi
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Lütfen zorunlu alanları doldurunuz',
        position: 'top',
        visibilityTime: 1500
      })
      return
    }

    try {
      setIsSubmitting(true)

      const createData: BroadcastCreateData = {
        title: formData.title,
        message: formData.message,
        target_type: formData.target_type,
        is_scheduled: formData.is_scheduled
      }

      if (formData.target_type === 'specific_users') {
        createData.target_user_ids = formData.target_user_ids
      }

      if (formData.target_type === 'role') {
        createData.target_role = formData.target_role!
      }

      if (formData.deep_link_route) {
        createData.deep_link_route = formData.deep_link_route
      }

      if (formData.is_scheduled && formData.scheduled_at) {
        createData.scheduled_at = formData.scheduled_at
      }

      await createBroadcast(createData)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: formData.is_scheduled ? 'Bildirim zamanlandı' : 'Bildirim oluşturuldu',
        position: 'top',
        visibilityTime: 1500
      })

      router.back()
    } catch (err: any) {
      console.error('Bildirim oluşturulurken hata:', err)
      const errorMessage = getErrorMessage(err)
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 2000
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#022920', '#044134', '#065f4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Animasyonlu orb'lar */}
        <Animated.View style={[styles.glowOrb1, orb1AnimatedStyle]} />
        <Animated.View style={[styles.glowOrb2, orb2AnimatedStyle]} />

        {/* Header içeriği */}
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={isSubmitting}
            >
              <Ionicons name="chevron-back" size={24} color={DashboardColors.textOnPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Yeni Bildirim</Text>
              <Text style={styles.headerSubtitle}>Toplu bildirim gönder</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={DashboardColors.textOnPrimary} />
              ) : (
                <Ionicons name="checkmark" size={24} color={DashboardColors.textOnPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Form */}
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Başlık */}
        <View style={styles.section}>
          <Input
            label="Başlık"
            placeholder="Bildirim başlığı"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            error={errors.title}
            required
            editable={!isSubmitting}
          />
        </View>

        {/* Mesaj */}
        <View style={styles.section}>
          <Input
            label="Mesaj"
            placeholder="Bildirim mesajı"
            value={formData.message}
            onChangeText={(text) => handleInputChange('message', text)}
            error={errors.message}
            required
            multiline
            numberOfLines={4}
            style={{ minHeight: 100 }}
            editable={!isSubmitting}
          />
        </View>

        {/* Hedef Tip */}
        <View style={styles.section}>
          <SelectInput
            label="Hedef Kitle"
            options={TARGET_TYPE_OPTIONS}
            value={formData.target_type}
            onValueChange={(value) => handleInputChange('target_type', value)}
            disabled={isSubmitting}
          />
        </View>

        {/* Kullanıcı Seçimi (specific_users için) */}
        {formData.target_type === 'specific_users' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Kullanıcılar</Text>
            <SearchableSelect
              placeholder="Kullanıcı ara ve ekle"
              loadOptions={loadUsers}
              value={null}
              onValueChange={(userId) => {
                // Kullanıcı seçildiğinde listede mevcut değilse ekle
                if (userId && !selectedUsers.find(u => u.id === userId)) {
                  getUsers().then(users => {
                    const user = users.find(u => u.id === userId)
                    if (user) {
                      const updatedUsers = [...selectedUsers, user]
                      setSelectedUsers(updatedUsers)
                      setFormData(prev => ({
                        ...prev,
                        target_user_ids: updatedUsers.map(u => u.id)
                      }))
                    }
                  })
                }
              }}
              searchPlaceholder="Kullanıcı ara..."
            />

            {/* Seçili Kullanıcılar */}
            {selectedUsers.length > 0 && (
              <View style={styles.selectedItemsContainer}>
                {selectedUsers.map(user => (
                  <View key={user.id} style={styles.selectedItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedItemText}>{user.name}</Text>
                      <Text style={styles.selectedItemSubtext}>{user.email}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUserRemove(user.id)}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={DashboardColors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {errors.target_user_ids && (
              <Text style={styles.errorText}>{errors.target_user_ids}</Text>
            )}
          </View>
        )}

        {/* Rol Seçimi (role için) */}
        {formData.target_type === 'role' && (
          <View style={styles.section}>
            <SearchableSelect
              label="Rol"
              placeholder="Rol seçiniz"
              loadOptions={loadRoles}
              value={formData.target_role}
              onValueChange={handleRoleChange}
              error={errors.target_role}
              searchPlaceholder="Rol ara..."
            />
          </View>
        )}

        {/* Deep Link Route (opsiyonel) */}
        <View style={styles.section}>
          <SearchableSelect
            label="Deep Link (Opsiyonel)"
            placeholder="Sayfa seçiniz"
            loadOptions={loadRoutes}
            value={formData.deep_link_route}
            onValueChange={handleRouteChange}
            searchPlaceholder="Sayfa ara..."
          />
          <Text style={styles.helperText}>
            Kullanıcı bildirime tıkladığında açılacak sayfa
          </Text>
        </View>

        {/* Zamanlı Gönderim */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Zamanlı Gönderim</Text>
              <Text style={styles.helperText}>Bildirimi belirli bir tarihte gönder</Text>
            </View>
            <Switch
              value={formData.is_scheduled}
              onValueChange={(value) => handleInputChange('is_scheduled', value)}
              trackColor={{ false: DashboardColors.border, true: DashboardColors.primary }}
              thumbColor={DashboardColors.surface}
              disabled={isSubmitting}
            />
          </View>

          {formData.is_scheduled && (
            <View style={{ marginTop: DashboardSpacing.md }}>
              <Input
                label="Gönderim Tarihi"
                placeholder="YYYY-MM-DD HH:mm"
                value={formData.scheduled_at || ''}
                onChangeText={(text) => handleInputChange('scheduled_at', text)}
                error={errors.scheduled_at}
                editable={!isSubmitting}
              />
              <Text style={styles.helperText}>
                Format: 2025-02-10 14:30
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </KeyboardAwareScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DashboardColors.background
  },
  headerContainer: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: DashboardSpacing.xl
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
    bottom: -20,
    left: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  headerContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.md,
    zIndex: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: DashboardFontSizes.xl,
    fontWeight: '700',
    color: DashboardColors.textOnPrimary
  },
  headerSubtitle: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.textOnPrimaryMuted,
    marginTop: 2
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: DashboardBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.5
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: DashboardSpacing.lg,
    paddingTop: DashboardSpacing.xl
  },
  section: {
    marginBottom: DashboardSpacing.xl
  },
  sectionLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary,
    marginBottom: DashboardSpacing.sm
  },
  selectedItemsContainer: {
    marginTop: DashboardSpacing.md,
    gap: DashboardSpacing.sm
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.sm,
    padding: DashboardSpacing.md,
    backgroundColor: DashboardColors.surface,
    borderRadius: DashboardBorderRadius.md,
    borderWidth: 1,
    borderColor: DashboardColors.borderLight
  },
  selectedItemText: {
    fontSize: DashboardFontSizes.sm,
    fontWeight: '500',
    color: DashboardColors.textPrimary
  },
  selectedItemSubtext: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: 2
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DashboardSpacing.md
  },
  switchLabel: {
    fontSize: DashboardFontSizes.base,
    fontWeight: '600',
    color: DashboardColors.textPrimary
  },
  helperText: {
    fontSize: DashboardFontSizes.xs,
    color: DashboardColors.textSecondary,
    marginTop: DashboardSpacing.xs
  },
  errorText: {
    fontSize: DashboardFontSizes.sm,
    color: DashboardColors.danger,
    marginTop: DashboardSpacing.xs
  }
})
